/**
 * @fileoverview Shared utility helpers for all API modules.
 * Centralizes common helpers so anilist-api and mangadex-api don't duplicate them.
 * @module core/api/api-utils
 */

/**
 * Pauses execution for the specified duration.
 * Optionally adds random jitter to prevent thundering herd on retries.
 * @param {number} ms - Milliseconds to sleep
 * @param {boolean} [useJitter=false] - When true, adds up to 300ms of random extra delay
 * @returns {Promise<void>}
 */
export function sleep(ms, useJitter = false) {
    var jitter = useJitter ? Math.floor(Math.random() * 300) : 0;
    return new Promise(function(resolve) {
        setTimeout(resolve, ms + jitter);
    });
}
