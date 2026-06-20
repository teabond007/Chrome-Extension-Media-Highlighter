/**
 * @fileoverview Reading progress tracker for manga reader pages.
 * Automatically saves chapter progress after user engagement threshold.
 */

import { PROGRESS_CONFIG, LIBRARY_ENTRY_KEYS, TOGGLES } from '../../../config.js';
import * as LibraryService from '../library-service.js';

/**
 * ProgressTracker monitors reading activity and saves progress.
 * Uses a time-based threshold to confirm user is actually reading.
 */
class ProgressTracker {
    /**
     * Creates a new ProgressTracker instance.
     * @param {Object} adapter - Platform adapter with URL parsing
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.currentQuery = null;
        this.saveTimeout = null;
        this.isSaved = false;
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
        
        this.scrollListener = () => {
            if (scrollSaved || this.isSaved) return;
            
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            if (scrollPercent > PROGRESS_CONFIG.SCROLL_THRESHOLD) {
                scrollSaved = true;
                this.saveProgress();
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
                this.showFloatingNotification(entry.title);
            }

            if (entry && !entry.anilistData) {
                console.log("[ProgressTracker] Metadata is missing, asking background script to fetch it!");
                this.fetchMetadataForEntry(entry.title, LibraryService.getMangaId(entry));
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
    async fetchMetadataForEntry(title, mangaId) {
        try {
            chrome.runtime.sendMessage({
                type: 'fetchMetadata',
                title: title,
                storageKey: mangaId 
            });
        } catch (e) {
             console.warn('[ProgressTracker] Metadata request failed:', e);
        }
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
        style.textContent = `
            .bmh-notification {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #ffffff;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.08);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 2147483647;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .bmh-notification.bmh-show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            .bmh-notification-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(16, 185, 129, 0.15);
                border-radius: 50%;
                width: 28px;
                height: 28px;
                color: #10b981;
                flex-shrink: 0;
            }
            .bmh-notification-content {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .bmh-notification-title {
                font-weight: 600;
                color: #f1f5f9;
            }
            .bmh-notification-message {
                color: #94a3b8;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Shows a premium floating notification on the reader page.
     * @param {string} mangaTitle - Title of the added manga
     */
    showFloatingNotification(mangaTitle) {
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
            titleEl.textContent = 'Manga Added';

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
    }
}

export default ProgressTracker;
