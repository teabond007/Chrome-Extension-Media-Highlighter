/**
 * @fileoverview Shared utility for gathering and restoring extension data.
 * This file helps with importing and exporting data to/from local .json files.

 */

import { TOGGLES, SETTINGS, DATA } from '../../../config.js';

/**
 * Gets all the data we have saved in the extension's local storage.
 * @returns {Promise<Object>} All the data object
 */
export async function gatherStorageData() {
    var data = await chrome.storage.local.get(null);
    
    // We add some info about when this was exported so we know later
    data._exportMeta = {
        version: '4.0.0',
        exportDate: new Date().toISOString()
    };

    return data;
}

/**
 * Detects and assigns the correct media type ('anime' or 'manga') to an entry if missing.
 * @param {Object} entry - Library entry object
 */
function normalizeEntryType(entry) {
    if (!entry || !entry.title) return;
    if (entry.type) return;

    var isAnime = false;
    var status = entry.status;
    var format = entry.anilistData ? entry.anilistData.format : null;

    if (status === 'Watching' || status === 'Plan to Watch' || status === 'Re-watching') {
        isAnime = true;
    } else if (format === 'TV' || format === 'TV_SHORT' || format === 'MOVIE' || format === 'SPECIAL' || format === 'OVA' || format === 'ONA' || format === 'MUSIC') {
        isAnime = true;
    }

    entry.type = isAnime ? 'anime' : 'manga';
}

/**
 * This function mixes two sets of data together (local data and remote data).
 * It makes sure we don't have duplicates and keeps the newest stuff.
 * @param {Object} currentData - The local data from storage.get(null)
 * @param {Object} remoteData - The data to merge in
 * @returns {Object} The merged data object
 */
export function mergeStorageData(currentData, remoteData) {
    // We start with a clean object for the merged results
    var mergedData = {};
    
    // First, copy everything from currentData to mergedData
    for (var currentKey in currentData) {
        mergedData[currentKey] = currentData[currentKey];
    }
    
    // Second, copy everything from remoteData to mergedData
    // This will overwrite values from currentData if the keys are the same
    for (var remoteKey in remoteData) {
        mergedData[remoteKey] = remoteData[remoteKey];
    }

    // We don't want the metadata in the final saved data
    if (mergedData._exportMeta) {
        delete mergedData._exportMeta;
    }

    // --- Merge Library Entries ---
    var remoteLibrary = remoteData[DATA.LIBRARY_ENTRIES];
    var currentLibrary = currentData[DATA.LIBRARY_ENTRIES];
    
    if (Array.isArray(remoteLibrary) || Array.isArray(currentLibrary)) {
        const libraryMap = new Map();
        
        // Load current library entries into Map
        if (Array.isArray(currentLibrary)) {
            for (var i = 0; i < currentLibrary.length; i++) {
                var entry = currentLibrary[i];
                if (entry && entry.title) {
                    normalizeEntryType(entry);
                    libraryMap.set(entry.title.toLowerCase(), entry);
                }
            }
        }
        
        // Merge remote library entries (remote overwrites current on key collision)
        if (Array.isArray(remoteLibrary)) {
            for (var j = 0; j < remoteLibrary.length; j++) {
                var entry = remoteLibrary[j];
                if (entry && entry.title) {
                    normalizeEntryType(entry);
                    libraryMap.set(entry.title.toLowerCase(), entry);
                }
            }
        }
        
        mergedData[DATA.LIBRARY_ENTRIES] = Array.from(libraryMap.values());
    }

    // --- Merge Custom Statuses ---
    var remoteStatuses = remoteData[DATA.CUSTOM_STATUSES];
    var currentStatuses = currentData[DATA.CUSTOM_STATUSES];
    
    if (Array.isArray(remoteStatuses) || Array.isArray(currentStatuses)) {
        const statusMap = new Map();
        
        if (Array.isArray(currentStatuses)) {
            currentStatuses.forEach(s => {
                if (s && s.name) {
                    statusMap.set(s.name.toLowerCase(), s);
                }
            });
        }
        
        if (Array.isArray(remoteStatuses)) {
            remoteStatuses.forEach(s => {
                if (s && s.name) {
                    statusMap.set(s.name.toLowerCase(), s);
                }
            });
        }
        
        mergedData[DATA.CUSTOM_STATUSES] = Array.from(statusMap.values());
    }

    // --- Merge Reading History ---
    var remoteHistory = remoteData[DATA.READING_HISTORY];
    var currentHistory = currentData[DATA.READING_HISTORY];
    
    if (remoteHistory && currentHistory) {
        var finalHistory = {};
        
        // Copy current history first
        for (var hKey in currentHistory) {
            finalHistory[hKey] = currentHistory[hKey];
        }
        
        // Mix in the remote history
        for (var hKey in remoteHistory) {
            var remoteChapters = remoteHistory[hKey];
            var currentChapters = finalHistory[hKey];
            
            if (Array.isArray(remoteChapters) && Array.isArray(currentChapters)) {
                // Mix chapters together using a Set to prevent duplicates
                finalHistory[hKey] = [...new Set([...currentChapters, ...remoteChapters])];
            } else {
                finalHistory[hKey] = remoteChapters;
            }
        }
        mergedData[DATA.READING_HISTORY] = finalHistory;
    }

    // --- Merge Anilist/Personal Cache ---
    if (remoteData[DATA.ANILIST_CACHE] && currentData[DATA.ANILIST_CACHE]) {
        var mergedCache = {};
        for (var cKey in currentData[DATA.ANILIST_CACHE]) {
            mergedCache[cKey] = currentData[DATA.ANILIST_CACHE][cKey];
        }
        for (var cKey in remoteData[DATA.ANILIST_CACHE]) {
            mergedCache[cKey] = remoteData[DATA.ANILIST_CACHE][cKey];
        }
        mergedData[DATA.ANILIST_CACHE] = mergedCache;
    }

    // --- Merge Custom Sites ---
    var remoteSites = remoteData[DATA.CUSTOM_SITES];
    var currentSites = currentData[DATA.CUSTOM_SITES];
    
    if (Array.isArray(remoteSites) || Array.isArray(currentSites)) {
        const siteMap = new Map();
        
        if (Array.isArray(currentSites)) {
            currentSites.forEach(site => {
                if (site && site.hostname) {
                    siteMap.set(site.hostname.toLowerCase(), site);
                }
            });
        }
        
        if (Array.isArray(remoteSites)) {
            remoteSites.forEach(site => {
                if (site && site.hostname) {
                    siteMap.set(site.hostname.toLowerCase(), site);
                }
            });
        }
        
        mergedData[DATA.CUSTOM_SITES] = Array.from(siteMap.values());
    }

    return mergedData;
}

/**
 * Applies data to local storage.
 * @param {Object} data - Data to save
 * @param {boolean} isMerge - Whether to merge with existing data or overwrite everything
 */
export async function applyStorageData(data, isMerge) {
    if (isMerge == true) {
        var currentData = await chrome.storage.local.get(null);
        var merged = mergeStorageData(currentData, data);
        await chrome.storage.local.set(merged);
    } else {
        // If we are replacing everything, we clear the storage first
        if (data._exportMeta) {
            delete data._exportMeta;
        }
        
        var library = data[DATA.LIBRARY_ENTRIES];
        if (Array.isArray(library)) {
            for (var k = 0; k < library.length; k++) {
                var entry = library[k];
                if (entry) {
                    normalizeEntryType(entry);
                }
            }
        }
        
        await chrome.storage.local.clear();
        await chrome.storage.local.set(data);
    }
}
