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
        
        const checkScroll = () => {
            if (scrollSaved || this.isSaved) return;
            
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            if (scrollPercent > PROGRESS_CONFIG.SCROLL_THRESHOLD) {
                scrollSaved = true;
                this.saveProgress();
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
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
           
            const history = await LibraryService.trackReadChapter(this.currentQuery, this.currentProgress.chapter);

        
            const entry = await LibraryService.updateProgress(this.currentQuery, this.currentProgress);

           
            if (entry) {
                entry.readChapters = history.length;
            }

            console.log(`[ProgressTracker] Saved progress successfully for: ${this.currentQuery.title || this.currentQuery.slug} ch.${this.currentProgress.chapter}`);
            
        
            this.notifyProgress(entry);

   
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
     * Cleans up the tracker.
     */
    destroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}

export default ProgressTracker;
