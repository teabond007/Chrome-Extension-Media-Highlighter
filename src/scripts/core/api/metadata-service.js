/**
 * It gets metadata for manga for our library from 2 APIs.
 * It tries Anilist first and then Mangadex if things are missing.
 * Has only 1 function
 */

import { fetchMangaFromAnilist } from './anilist-api.js';
import { fetchMangaFromMangadex } from './mangadex-api.js';

/**
 *  Gets all relevant data about a manga.
 * @param {string} title 
 * @returns {Object|null} Manga data object or null if error
 */
export async function getMergedMetadata(title, mediaType) {
    // We check if the title is actually there
    if (title == "" || title == null || title == undefined) {
        return null;
    }

    var type = mediaType || 'manga';
    console.log("Starting to look for metadata for: " + title + " (type: " + type + ")");

    try {

        var data = await fetchMangaFromAnilist(title, 0, type);
        
        if (data != null) {
            console.log("We found the entry on Anilist! ID is " + data.id);
        } else {
            console.log("We could not find anything on Anilist for " + title);
        }

        // Now we see if Anilist gave us everything we need
        // its usually missing a banner.
        var isMissingStuff = false;
        
        if (data == null) {
            isMissingStuff = true;
        } else {
 
            if (data.bannerImage == null || data.bannerImage == "") {
                isMissingStuff = true;
            }
            

            if (data.description == null || data.description == "") {
                isMissingStuff = true;
            }
            
  
            if (data.coverImage == null) {
                isMissingStuff = true;
            } else if (data.coverImage.large == null || data.coverImage.large == "") {
                    isMissingStuff = true;
            }
            
            
   
            if (data.genres == null) {
                isMissingStuff = true;
            }else if (data.genres.length == 0) {
                    isMissingStuff = true;
            }
            
        }

        // This calls other API only for manga entries
        if (isMissingStuff == true && type === 'manga') {

            
            var mdData = await fetchMangaFromMangadex(title);
            
            if (mdData != null) {
                console.log("Mangadex found a match for " + title);
                
                if (data == null) {
                    // We had nothing so we just use everything from Mangadex
                  
                    data = mdData;
                } else {
                    // We have some data but we add the missing bits from Mangadex
                
                    
                    if (data.bannerImage == null || data.bannerImage == "") {
                        data.bannerImage = mdData.bannerImage;
                    }
                    
                    if (data.description == null || data.description == "") {
                        data.description = mdData.description;
                    }
                    
                    // Check if the cover is the default one or missing
                    var coverIsBad = false;
                    if (data.coverImage == null) {
                        coverIsBad = true;
                    } else {
                        if (data.coverImage.large == null || data.coverImage.large == "") {
                            coverIsBad = true;
                        } else {
                            // If it says "default" in the name it is probably not a real cover
                            if (data.coverImage.large.indexOf("default") != -1) {
                                coverIsBad = true;
                            }
                        }
                    }
                    
                    if (coverIsBad == true) {
                        if (mdData.coverImage != null) {
                            data.coverImage = mdData.coverImage;
                        }
                    }
                    
                    // Add genres if we have none
                    if (data.genres == null || data.genres.length == 0) {
                        if (mdData.genres != null) {
                            if (mdData.genres.length > 0) {
                                data.genres = mdData.genres;
                            }
                        }
                    }
                }
            }
                
            
        }

        // We check one last time if we have anything
        if (data == null) {
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
