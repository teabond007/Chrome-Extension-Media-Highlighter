/**
 * @fileoverview Utility functions for Manga Card formatting and metadata processing.
 * Extracted from the legacy manga-card-factory DOM manipulation script.
 */
import { STATUS_COLORS } from '../../../config.js';

/**
 * Resolves the visual styling (colors, borders) for a manga entry.
 * Prioritizes custom statuses over default status colors.
 * 
 * @param {string} status - The current reading status string.
 * @param {string|null} customStatusName - The name of any manually assigned custom status.
 * @param {Array<Object>} customStatuses - The list of all defined custom statuses.
 * @returns {Object} An object containing borderColor, borderStyle, badgeBg, and badgeText keys.
 */
export function getStatusInfo(status, customStatusName, customStatuses) {
    const statusLower = (status || '').toLowerCase().trim();
    
    // Check if an explicit custom status is assigned
    let matched = customStatusName ? customStatuses.find(m => m.name === customStatusName) : null;
    
    // Check if the overall status name matches a custom status (overdrive defaults)
    if (!matched) {
        matched = customStatuses.find(m => m.name.toLowerCase() === statusLower);
    }

    if (matched) {
        return {
            borderColor: matched.color,
            borderStyle: matched.style || "solid",
            badgeBg: `${matched.color}26`,
            badgeText: matched.color
        };
    }

    // Direct lookup in STATUS_COLORS config
    let color = null;
    for (const [key, val] of Object.entries(STATUS_COLORS)) {
        if (key.toLowerCase() === statusLower) {
            color = val;
            break;
        }
    }

    // Fallback: keyword matching for status categorization
    if (!color) {
        let type = "default";
        if (statusLower.includes("re-reading") || statusLower.includes("re-watching")) type = "re-watching";
        else if (statusLower.includes("reading") || statusLower.includes("watching")) type = "reading";
        else if (statusLower === "read") type = "read";
        else if (statusLower.includes("completed")) type = "completed";
        else if (statusLower.includes("dropped")) type = "dropped";
        else if (statusLower.includes("hold")) type = "onhold";
        else if (statusLower.includes("plan")) type = "planning";
        
        color = STATUS_COLORS[type] || STATUS_COLORS.default;
    }

    return {
        borderColor: color,
        borderStyle: "solid",
        badgeBg: `${color}26`,
        badgeText: color
    };
}

/**
 * Normalizes AniList format data into human-readable strings.
 * Specially identifies Manhwa (Korean) and Manhua (Chinese) as distinct formats.
 * 
 * @param {string} format - Raw AniList format code.
 * @param {string} country - Two-letter country code of origin.
 * @returns {string} Normalized format name (e.g., 'Manhwa', 'Light Novel').
 */
export function getFormatName(format, country) {
    if (country === 'KR' && format === 'MANGA') return 'Manhwa';
    if (country === 'CN' && format === 'MANGA') return 'Manhua';
    
    const formats = {
        'MANGA': 'Manga',
        'ONE_SHOT': 'One Shot',
        'NOVEL': 'Light Novel',
        'TV': 'TV Show',
        'TV_SHORT': 'TV Short',
        'MOVIE': 'Movie',
        'SPECIAL': 'Special',
        'OVA': 'OVA',
        'ONA': 'ONA',
        'MUSIC': 'Music'
    };
    return formats[format] || format || 'Unknown';
}



