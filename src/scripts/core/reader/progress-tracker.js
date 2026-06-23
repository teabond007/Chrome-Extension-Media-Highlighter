/**
 * @fileoverview Reading progress tracker for manga reader pages.
 * Automatically saves chapter progress after user engagement threshold.
 */

import { PROGRESS_CONFIG, LIBRARY_ENTRY_KEYS, TOGGLES, DATA, STATUS_COLORS } from '../../../config.js';
import * as LibraryService from '../library-service.js';
import { OverlayFactory } from '../overlay-factory.js';
import { STATUS_BUTTON_CSS, NOTIFICATION_CSS } from './reader-styles.js';

/**
 * ProgressTracker monitors reading activity and saves progress.
 * Uses a time-based threshold to confirm user is actually reading.
 */
class ProgressTracker {
    /**
     * Creates a new ProgressTracker instance.
     * @param {Object} adapter - Platform adapter with URL parsing
     * @param {Object} settings - Extension settings from Chrome storage
     */
    constructor(adapter, settings) {
        this.adapter = adapter;
        this.settings = settings || {};
        this.currentQuery = null;
        this.saveTimeout = null;
        this.isSaved = false;
        this.statusButton = null;
    }

    /**
     * Initializes tracking on a reader page.
     * Parses the current URL and schedules a progress save.
     */
    async init() {
        console.log("[ProgressTracker] init function started!");
        try {
            // Check if progress tracking is enabled in settings
            
            const settings = await chrome.storage.local.get([TOGGLES.PROGRESS_TRACKING]);
            if (settings[TOGGLES.PROGRESS_TRACKING] === false) {
              
                return;
            }

            
            const urlData = this.parseCurrentUrl();
            
            console.log('[ProgressTracker] parseCurrentUrl result is: ', urlData);

            if (!urlData || (!urlData.chapterNo && !urlData.title && !urlData.slug)) {
                console.log('[ProgressTracker] We are not on a chapter reader page, skipping tracking.');
                return;
            }

            
            this.currentQuery = {};
            this.currentQuery.source = this.adapter.id || this.adapter.PREFIX;
            this.currentQuery.slug = urlData.slug;
            this.currentQuery.title = urlData.title || '';
            this.currentQuery.sourceId = urlData.id;
            this.currentQuery.mangaSlug = urlData.slug;
            this.currentQuery.type = this.adapter.type || 'manga';

            this.currentProgress = {
                chapter: String(urlData.chapterNo),
                url: window.location.href
            };

            console.log('[ProgressTracker] Now tracking: ', this.currentQuery);

            // Schedule save after engagement threshold
            
            this.saveTimeout = setTimeout(() => {
              
                this.saveProgress();
            }, PROGRESS_CONFIG.SAVE_DELAY);

            // Also save when user scrolls significantly (engagement signal)
            console.log("[ProgressTracker] Setting up scroll tracking event listener...");
            this.setupScrollTracking();
        } catch (e) {
            console.log("[ProgressTracker] Error in init: " + e);
        }
    }

    /**
     * Parses the current URL using the adapter.
     * @returns {Object|null} Parsed URL data or null if not a reader page
     */
    parseCurrentUrl() {
        if (this.adapter.parseUrl) {
            return this.adapter.parseUrl(window.location.href);
        }
        return null;
    }

    /**
     * Sets up scroll-based engagement tracking.
     */
    setupScrollTracking() {
        let scrollSaved = false;
        let ticking = false;
        
        this.scrollListener = () => {
            if (scrollSaved || this.isSaved) return;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollHeight = document.body.scrollHeight - window.innerHeight;
                    if (scrollHeight > 0) {
                        const scrollPercent = window.scrollY / scrollHeight;
                        if (scrollPercent > PROGRESS_CONFIG.SCROLL_THRESHOLD) {
                            scrollSaved = true;
                            this.saveProgress();
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', this.scrollListener, { passive: true });
    }

    /**
     * Saves the current reading progress using LibraryService.
     */
    async saveProgress() {
        console.log("[ProgressTracker] saveProgress called!");
        if (this.isSaved || !this.currentQuery) {
           
            return;
        }
        this.isSaved = true;

        try {
            // Check if the entry already exists in the library before saving
            var library = await LibraryService.loadLibrary();
            var existingEntry = LibraryService.findEntry(library, this.currentQuery);
            var isNewEntry = !existingEntry; // It's a new entry if it doesn't exist yet

            const history = await LibraryService.trackReadChapter(this.currentQuery, this.currentProgress.chapter);

            const entry = await LibraryService.updateProgress(this.currentQuery, this.currentProgress);

            if (entry) {
                entry.readChapters = history.length;
            }

            console.log(`[ProgressTracker] Saved progress successfully for: ${this.currentQuery.title || this.currentQuery.slug} ch.${this.currentProgress.chapter}`);
            
            this.notifyProgress(entry);

            // Display a floating notification on the reader page only when a new entry is added
            if (isNewEntry && entry) {
                this.showFloatingNotification(entry.title, entry.type);
            }

            // Inject the floating status picker button if enabled in settings
            if (this.settings[TOGGLES.READER_STATUS_PICKER] !== false && entry) {
                this.injectStatusButton(entry);
            }

            if (entry && !entry.anilistData) {
                console.log("[ProgressTracker] Metadata is missing, asking background script to fetch it!");
                this.fetchMetadataForEntry(entry.title, LibraryService.getMangaId(entry), entry.type || 'manga');
            }

        } catch (error) {
            console.log('[ProgressTracker] failed to save progress: ' + error);
            this.isSaved = false; // Allow retry
        }
    }

    /**
     * Notifies the background script about saved progress.
     */
    notifyProgress(entry) {
        try {
            var messageData = {
                source: this.currentQuery.source,
                slug: this.currentQuery.slug,
                chapter: this.currentProgress.chapter,
                entry: entry
            };
            
            chrome.runtime.sendMessage({
                action: 'progressSaved',
                data: messageData
            });
        } catch (e) {
            // Background script might not be listening
        }
    }

    /**
     * Requests metadata fetch from the background script.
     */
    async fetchMetadataForEntry(title, mangaId, entryType) {
        try {
            chrome.runtime.sendMessage({
                type: 'fetchMetadata',
                title: title,
                storageKey: mangaId,
                entryType: entryType || 'manga' 
            });
        } catch (e) {
             console.warn('[ProgressTracker] Metadata request failed:', e);
        }
    }

    getStatusColor(status) {
        if (!status) return 'rgba(255,255,255,0.3)';
        const normalized = status.toLowerCase().trim();
        
        // 1. Check custom statuses first
        const customStatuses = this.settings[DATA.CUSTOM_STATUSES];
        if (Array.isArray(customStatuses)) {
            const matched = customStatuses.find(c => c.name.toLowerCase() === normalized);
            if (matched) return matched.color;
        }

        // 2. Default statuses fallback
        const defaultColor = OverlayFactory.getStatusColor(status);
        return defaultColor === 'transparent' ? 'rgba(255,255,255,0.3)' : defaultColor;
    }

    /**
     * Injects the floating bottom-left status picker button onto the reader page.
     * Reuses OverlayFactory.mountStatusPicker for the picker popup.
     * @param {Object} entry - Current library entry
     */
    injectStatusButton(entry) {
        // Remove any pre-existing button from a previous init
        var existing = document.getElementById('bmh-reader-status-btn');
        if (existing) existing.remove();

        this.injectStatusButtonStyles();

        var self = this;
        var currentEntry = entry;
        var customStatuses = Array.isArray(this.settings[DATA.CUSTOM_STATUSES])
            ? this.settings[DATA.CUSTOM_STATUSES]
            : [];

        var btn = document.createElement('button');
        btn.id = 'bmh-reader-status-btn';
        btn.className = 'bmh-reader-status-btn';
        btn.title = 'Change reading status';

        var dot = document.createElement('span');
        dot.className = 'bmh-reader-status-dot';
        dot.style.background = this.getStatusColor(currentEntry.status);

        var label = document.createElement('span');
        label.className = 'bmh-reader-status-label';
        label.textContent = currentEntry.status || 'Reading';

        btn.appendChild(dot);
        btn.appendChild(label);
        document.body.appendChild(btn);
        this.statusButton = btn;

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            OverlayFactory.mountStatusPicker(
                btn,
                currentEntry,
                customStatuses,
                function(newStatus) {
                    self.saveStatusFromReader(currentEntry, newStatus);
                    // Update dot + label reactively
                    dot.style.background = self.getStatusColor(newStatus);
                    label.textContent = newStatus;
                    currentEntry.status = newStatus;
                }
            );
        });
    }

    async saveStatusFromReader(entry, newStatus) {
        try {
            await LibraryService.upsertEntry({
                ...entry,
                status: newStatus
            });
            console.log('[ProgressTracker] Reader status updated: ' + newStatus);
        } catch (err) {
            console.warn('[ProgressTracker] Failed to save reader status:', err);
        }
    }

    /**
     * Injects CSS styles for the floating reader status button.
     */
    injectStatusButtonStyles() {
        if (document.getElementById('bmh-reader-status-styles')) return;

        var style = document.createElement('style');
        style.id = 'bmh-reader-status-styles';
        style.textContent = STATUS_BUTTON_CSS;
        document.head.appendChild(style);
    }

    /**
     * Injects custom notification styles into the reader page.
     */
    injectNotificationStyles() {
        if (document.getElementById('bmh-notification-styles')) {
            return;
        }
        var style = document.createElement('style');
        style.id = 'bmh-notification-styles';
        style.textContent = NOTIFICATION_CSS;
        document.head.appendChild(style);
    }

    /**
     * Shows a premium floating notification on the reader page.
     * @param {string} mangaTitle - Title of the added manga
     */
    showFloatingNotification(mangaTitle, type) {
        try {
            this.injectNotificationStyles();

            var notification = document.createElement('div');
            notification.className = 'bmh-notification';

            var iconContainer = document.createElement('div');
            iconContainer.className = 'bmh-notification-icon';
            iconContainer.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

            var contentContainer = document.createElement('div');
            contentContainer.className = 'bmh-notification-content';

            var titleEl = document.createElement('div');
            titleEl.className = 'bmh-notification-title';
            titleEl.textContent = (type === 'anime' ? 'Anime' : 'Manga') + ' Added';

            var messageEl = document.createElement('div');
            messageEl.className = 'bmh-notification-message';
            messageEl.textContent = 'Saved "' + mangaTitle + '" to library';

            contentContainer.appendChild(titleEl);
            contentContainer.appendChild(messageEl);

            notification.appendChild(iconContainer);
            notification.appendChild(contentContainer);

            document.body.appendChild(notification);

            // Force browser layout reflow to enable transition start state
            notification.offsetHeight; 
            notification.classList.add('bmh-show');

            // Slide out and destroy the element after 4 seconds
            setTimeout(function() {
                notification.classList.remove('bmh-show');
                setTimeout(function() {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }, 4000);

        } catch (e) {
            console.error('[ProgressTracker] Failed to show notification:', e);
        }
    }

    /**
     * Cleans up the tracker.
     */
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        if (this.scrollListener) {
            window.removeEventListener('scroll', this.scrollListener);
            this.scrollListener = null;
        }
        if (this.statusButton) {
            this.statusButton.remove();
            this.statusButton = null;
        }
    }
}

export default ProgressTracker;
