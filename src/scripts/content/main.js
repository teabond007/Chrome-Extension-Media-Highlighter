/**
 * @fileoverview Unified Content Script Entry Point
 * Detects the current platform and initializes the appropriate adapter.
 */

// Selector tool - auto-initializes when ?bmh-selector-mode=true is in URL
import './selector-tool';
import { initCustomSite, GenericAdapter } from '../core/generic-adapter.js';
import ProgressTracker from '../core/reader/progress-tracker.js';
import { TOGGLES, SETTINGS, DATA } from '../../config.js';

/**
 * Main bootstrap function to start the extension logic on the page.
 */
function bootstrap() {
    // If the extension context is gone, we must stop
    if (!chrome.runtime || !chrome.runtime.id) {
        return;
    }

    var currentHost = window.location.hostname;

    // Load ALL settings needed by various adapters
    var settingsKeys = [
        SETTINGS.HIGHLIGHT_THICKNESS,
        TOGGLES.CUSTOM_STATUS_ENABLED,
        DATA.CUSTOM_STATUSES,
        DATA.CUSTOM_SITES,
        TOGGLES.QUICK_ACTIONS,
        TOGGLES.LIBRARY_SHOW_RIBBONS,
        TOGGLES.READER_STATUS_PICKER
    ];

    // We use a callback here because it is simpler than Promises
    chrome.storage.local.get(settingsKeys, function(settings) {
        if (chrome.runtime.lastError) {
            console.error("[BMH] Storage error:", chrome.runtime.lastError);
            return;
        }

        // Try to find a matching custom site configuration
        console.log("[BMH] Checking custom sites for " + currentHost + "...");
        
        var rawSites = settings[DATA.CUSTOM_SITES];
        var customSites = [];
        if (Array.isArray(rawSites)) {
            customSites = rawSites;
        }

        // Look for a match in our custom sites using a simple loop
        var customConfig = null;
        for (var i = 0; i < customSites.length; i++) {
            var s = customSites[i];
            if (s && s.enabled && currentHost.indexOf(s.hostname) !== -1) {
                customConfig = s;
                break;
            }
        }

        if (customConfig) {
            console.log('[BMH] Matched custom config:', customConfig);
            var adapter = new GenericAdapter(customConfig);

            var currentMode = null; 
            var activeTracker = null;
            var activeObserver = null;
            var lastUrl = '';

            /**
             * Checks the current page type and initializes/switches modules if needed.
             * Runs periodically to support SPA navigation and dynamic element rendering.
             */
            var checkPageMode = function() {
                // Stop checking if the extension context was invalidated
                if (!chrome.runtime || !chrome.runtime.id) {
                    clearInterval(modeInterval);
                    return;
                }

                var currentUrl = window.location.href;
                var urlChanged = currentUrl !== lastUrl;
                
                var isReader = adapter.isReaderPage();
                var targetMode = isReader ? 'reader' : 'gallery';

                if (urlChanged || targetMode !== currentMode) {
                    console.log('[BMH] Page update detected. Mode: ' + targetMode + ', URL: ' + currentUrl);
                    lastUrl = currentUrl;

                    // Clean up resources from the previous mode
                    if (activeTracker) {
                        console.log('[BMH] Destroying previous progress tracker');
                        activeTracker.destroy();
                        activeTracker = null;
                    }
                    if (activeObserver) {
                        console.log('[BMH] Disconnecting previous card enhancer observer');
                        activeObserver.disconnect();
                        activeObserver = null;
                    }

                    currentMode = targetMode;

                    if (currentMode === 'reader') {
                        console.log('[BMH] Reader page active. Initializing progress tracker...');
                        activeTracker = new ProgressTracker(adapter, settings);
                        activeTracker.init();
                    } else {
                        console.log('[BMH] Gallery page active. Initializing card enhancer...');
                        initCustomSite(customConfig, settings).then(function(observer) {
                            if (currentMode !== 'gallery' && observer) {
                                observer.disconnect();
                            } else {
                                activeObserver = observer;
                            }
                        });
                    }
                }
            };

            // Run initial mode check immediately
            checkPageMode();

            // Set up a recurring interval to check for SPA transitions or dynamically loaded reader elements
            var modeInterval = setInterval(checkPageMode, 1000);
        } else {
            console.warn("[BMH] No adapter found for host: " + currentHost);
        }
    });
}

// Prevent multiple initializations in the same window
if (!window.__BMH_INITIALIZED__) {
    window.__BMH_INITIALIZED__ = true;

    // Initialize when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
}
