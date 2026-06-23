/**
 * @fileoverview Metadata aggregator for manga/anime library entries.
 * Tries AniList first, then fills in missing fields from MangaDex.
 * Only one exported function: getMergedMetadata().
 */

import { fetchMangaFromAnilist } from './anilist-api.js';
import { fetchMangaFromMangadex } from './mangadex-api.js';

/**
 * Checks if an AniList data object is missing important display fields.
 * We still call MangaDex when any of these are absent so we can fill them in.
 * @param {Object|null} data - AniList result, or null if nothing was found
 * @returns {boolean} True if we should also try MangaDex
 */
function isDataIncomplete(data) {
    if (!data) return true;
    if (!data.bannerImage) return true;
    if (!data.description) return true;
    if (!data.coverImage || !data.coverImage.large) return true;
    if (!data.genres || data.genres.length === 0) return true;
    return false;
}

/**
 * Gets all relevant data about a manga or anime entry.
 * Tries AniList first and fills gaps with MangaDex (manga only).
 * @param {string} title - The title to search for
 * @param {string} [mediaType='manga'] - 'manga' or 'anime'
 * @returns {Promise<Object|null>} Merged data object or null if nothing found
 */
export async function getMergedMetadata(title, mediaType) {
    // Bail early if there is no title to search for
    if (!title) {
        return null;
    }

    var type = mediaType || 'manga';
    console.log("Starting to look for metadata for: " + title + " (type: " + type + ")");

    try {
        var data = await fetchMangaFromAnilist(title, 0, type);
        
        if (data !== null) {
            console.log("We found the entry on Anilist! ID is " + data.id);
        } else {
            console.log("We could not find anything on Anilist for " + title);
        }

        // Only call MangaDex for manga — it has no anime data
        if (isDataIncomplete(data) && type === 'manga') {
            var mdData = await fetchMangaFromMangadex(title);
            
            if (mdData !== null) {
                console.log("Mangadex found a match for " + title);
                
                if (data === null) {
                    // We had nothing so we just use everything from Mangadex
                    data = mdData;
                } else {
                    // We have some data but we add the missing bits from Mangadex
                    if (!data.bannerImage) {
                        data.bannerImage = mdData.bannerImage;
                    }
                    
                    if (!data.description) {
                        data.description = mdData.description;
                    }
                    
                    // If the cover is missing or clearly a default placeholder, use MangaDex's
                    var coverIsBad = !data.coverImage ||
                        !data.coverImage.large ||
                        data.coverImage.large.indexOf("default") !== -1;

                    if (coverIsBad && mdData.coverImage) {
                        data.coverImage = mdData.coverImage;
                    }
                    
                    // Add genres if we have none
                    if ((!data.genres || data.genres.length === 0) && mdData.genres && mdData.genres.length > 0) {
                        data.genres = mdData.genres;
                    }
                }
            }
        }

        // Final status report
        if (data === null) {
            console.log("We finished but we found no metadata for " + title + " anywhere.");
        } else {
            console.log("We finished! We have metadata for " + title);
        }

        return data;

    } catch (err) {
        // If it crashes we just log the error and return null so the app doesn't break
        console.log(err);
        return null;
    }
}
