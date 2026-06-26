/**
 * @fileoverview Pinia store for managing the manga library, including entries, reading history, and personal data.
 * This store handles loading and saving the library to browser storage, syncing metadata, and providing getters for different entry statuses.
 * It also includes functions for removing entries and showing entry details in a modal.
 */

import { defineStore } from 'pinia';
import { wipeMangadexCache } from '../../../scripts/core/api/mangadex-api.js';
import { getMergedMetadata } from '../../../scripts/core/api/metadata-service';
import { DATA } from '../../../config.js';
import * as LibraryService from '../../../scripts/core/library-service.js';

export const useLibraryStore = defineStore('library', {
    state: () => ({
        entries: [], // Array of saved manga/anime objects
        history: {}, // Map of reading history
        personalData: {}, // Map of notes and ratings
        isLoading: true,
        lastSync: null,
        isSyncing: false,
        syncProgress: { current: 0, total: 0, title: '' },
        selectedEntry: null // For reactive modal navigation
    }),

    getters: {
        totalEntries: (state) => state.entries.length,
        readingEntries: (state) => state.entries.filter(e => e && (e.status === 'Reading' || e.status === 'Watching')),
        completedEntries: (state) => state.entries.filter(e => e && e.status === 'Completed'),
        planToReadEntries: (state) => state.entries.filter(e => e && (e.status === 'Plan to Read' || e.status === 'Plan to Watch')),
        mangaEntries: (state) => state.entries.filter(e => e && e.type !== 'anime'),
        animeEntries: (state) => state.entries.filter(e => e && e.type === 'anime')
    },

    actions: {
        async loadLibrary() {
            console.log("[LibraryStore] loadLibrary started");
            this.isLoading = true;
            try {
                const data = await chrome.storage.local.get([
                    DATA.LIBRARY_ENTRIES, 
                    DATA.READING_HISTORY, 
                    DATA.PERSONAL_DATA, 
                    DATA.LAST_SYNC_TIME
                ]);
                
                this.entries = Array.isArray(data[DATA.LIBRARY_ENTRIES]) ? data[DATA.LIBRARY_ENTRIES] : [];
                this.history = data[DATA.READING_HISTORY] || {};
                this.personalData = data[DATA.PERSONAL_DATA] || {};
                this.lastSync = data[DATA.LAST_SYNC_TIME] || null;
                console.log("[LibraryStore] Library loaded successfully. Entries count: " + this.entries.length);
            } catch (err) {
                console.error('[LibraryStore] Error inside loadLibrary:', err);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Efficiently update a single entry or list from background sync
         * @param {Object} changes - The changes object from chrome.storage.onChanged
         */
        syncFromStorage(changes) {
            console.log('[LibraryStore] syncFromStorage triggered. Keys changed:', Object.keys(changes));
            
            if (changes[DATA.LIBRARY_ENTRIES]) {
                const newValue = changes[DATA.LIBRARY_ENTRIES].newValue;
                this.entries = Array.isArray(newValue) ? newValue : [];
            }
            if (changes[DATA.READING_HISTORY]) {
                this.history = changes[DATA.READING_HISTORY].newValue || {};
            }
            if (changes[DATA.PERSONAL_DATA]) {
                this.personalData = changes[DATA.PERSONAL_DATA].newValue || {};
            }
            if (changes[DATA.LAST_SYNC_TIME]) {
                this.lastSync = changes[DATA.LAST_SYNC_TIME].newValue;
            }
        },

        /**
         * Removes a manga entry matching by title.
         * @param {Object} entry - The entry object to remove
         */
        /**
         * Removes a manga entry matching by title.
         * @param {Object} entry - The entry object to remove
         */
        async removeEntry(entry) {
            console.log('[LibraryStore] removeEntry started');
            try {
                if (!entry || !entry.title) {
                    console.log('[LibraryStore] Invalid entry passed to removeEntry');
                    return;
                }
                
                var titleToMatch = entry.title.toLowerCase().trim();
                console.log('[LibraryStore] Removing entry with title:', titleToMatch);
                
                // Get latest data from chrome local storage directly to avoid proxy and stale data issues
                var data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
                var rawEntries = data[DATA.LIBRARY_ENTRIES];
                var currentEntries = Array.isArray(rawEntries) ? rawEntries : [];
                
                var updatedEntries = [];
                for (var i = 0; i < currentEntries.length; i++) {
                    var currentItem = currentEntries[i];
                    if (currentItem && currentItem.title) {
                        var currentTitle = currentItem.title.toLowerCase().trim();
                        // Only keep items that do NOT match the title we want to delete
                        if (currentTitle !== titleToMatch) {
                            updatedEntries.push(currentItem);
                        }
                    }
                }
                
                // Convert to plain JS objects to strip any hidden Vue proxies before saving to chrome storage
                var plainEntries = JSON.parse(JSON.stringify(updatedEntries));
                
                // Save updated list back to storage
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries });
                
                // Update local store state for immediate visual UI update
                this.entries = plainEntries;
                console.log('[LibraryStore] Removed successfully, new count:', plainEntries.length);
            } catch (err) {
                console.error('[LibraryStore] Error in removeEntry:', err);
            }
        },

        /**
         * Helper to save the current entries array to storage.
         * @param {Array} entriesList - The array of entries to save.
         */
        async saveEntries(entriesList) {
            var plainEntries = JSON.parse(JSON.stringify(entriesList));
            this.entries = plainEntries;
            return await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries });
        },

        /**
         * Finds an entry by title or slug and opens the details modal.
         * Used for deep linking and background message handling.
         * @param {string} titleOrSlug - The title or slug to match.
         */
        showEntryDetails(titleOrSlug) {
            console.log("[LibraryStore] showEntryDetails called for: " + titleOrSlug);
            try {
                if (!titleOrSlug) return;
                const target = titleOrSlug.toLowerCase().trim();

                // Loop 1: search for an exact title match first
                let entryFound = this.entries.find(e => e?.title && e.title.toLowerCase().trim() === target);

                // Loop 2: fuzzy or slug-based match if we found nothing in Loop 1
                if (!entryFound) {
                    const targetSlug = target.replace(/[^a-z0-9]/g, '');
                    entryFound = this.entries.find(e => {
                        if (!e?.title) return false;
                        const eSlug = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const eMangaSlug = (e.mangaSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        return eSlug === targetSlug || eMangaSlug === targetSlug || eSlug.includes(targetSlug) || targetSlug.includes(eSlug);
                    });
                }

                if (entryFound) {
                    console.log("[LibraryStore] Setting selectedEntry to: " + entryFound.title);
                    this.selectedEntry = entryFound;
                } else {
                    console.warn("[LibraryStore] Could not find any entry in library matching: " + titleOrSlug);
                }
            } catch (err) {
                console.error("[LibraryStore] Error in showEntryDetails:", err);
            }
        },

        /**
         * Adds or updates an entry in the library.
         * @param {Object} entryData - The data to upsert
         */
        async upsertEntry(entryData) {
            const updated = await LibraryService.upsertEntry(entryData);
            
            const idx = this.entries.findIndex(e => 
                LibraryService.getMangaId(e) === LibraryService.getMangaId(updated)
            );
            
            if (idx !== -1) {
                this.entries[idx] = updated;
            } else {
                this.entries.push(updated);
            }
            return updated;
        },

        /**
         * Sync metadata for entries in the library.
         * @param {boolean} wipeAll - If true, clears existing metadata to force a fresh lookup.
         * @returns {Promise<boolean>} True if sync succeeded
         */
        async forceSync(wipeAll = false) {
            this.isSyncing = true;
            console.log(wipeAll ? "Starting full forced library sync..." : "Starting missing info sync...");

            try {
                if (wipeAll) {
                    this.entries.forEach(entry => {
                        if (entry) {
                            entry.anilistData = undefined;
                            entry.lastChecked = undefined;
                        }
                    });
                    await wipeMangadexCache();
                    console.log("Cleared MangaDex cache.");
                }

                await this.fetchMissingMetadata(this.entries);
                return true;
            } catch (e) {
                console.error("Sync failed:", e);
                return false;
            } finally {
                this.isSyncing = false;
                this.syncProgress = { current: 0, total: 0, title: '' };
            }
        },

        /**
         * Sync metadata for entries in the library that are missing AniList data.
         * @param {Array} entriesList - The current list of entries to scan
         */
        async fetchMissingMetadata(entriesList) {
            console.log('[LibraryStore] fetchMissingMetadata started');
            try {
                var missing = [];
                for (var i = 0; i < entriesList.length; i++) {
                    var e = entriesList[i];
                    if (e) {
                        var needsAnilist = !e.anilistData || (e.anilistData.id && !e.anilistData.chapters);
                        var isStale = !e.lastChecked || (Date.now() - e.lastChecked > 3600000);
                        if (needsAnilist && isStale) {
                            missing.push(e);
                        }
                    }
                }

                if (missing.length === 0) {
                    return;
                }

                this.syncProgress = { current: 0, total: missing.length, title: 'Starting...' };
                window.dispatchEvent(new CustomEvent('library-sync-start', { detail: { total: missing.length } }));

                for (var j = 0; j < missing.length; j++) {
                    var liveEntry = missing[j];
                    if (!liveEntry) {
                        continue;
                    }

                    this.syncProgress = { current: j + 1, total: missing.length, title: liveEntry.title };
                    window.dispatchEvent(new CustomEvent('library-sync-progress', {
                        detail: { current: j + 1, total: missing.length, title: liveEntry.title }
                    }));

                    try {
                        var metadata = await getMergedMetadata(liveEntry.title, liveEntry.type);
                        if (metadata !== null && metadata !== undefined) {
                            liveEntry.anilistData = metadata;
                        }
                        liveEntry.lastChecked = Date.now();
                        await new Promise(r => setTimeout(r, 600)); // Throttle rate limit
                    } catch (err) {
                        console.error('Error fetching metadata for', liveEntry.title, err);
                    }
                }

                // Strip proxies to avoid chrome.storage.local serialization bugs
                var plainEntries = JSON.parse(JSON.stringify(entriesList));
                await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: plainEntries });
                this.entries = plainEntries;
                window.dispatchEvent(new CustomEvent('library-sync-complete'));
            } catch (err) {
                console.error('[LibraryStore] Error in fetchMissingMetadata:', err);
            }
        }
    }
});
