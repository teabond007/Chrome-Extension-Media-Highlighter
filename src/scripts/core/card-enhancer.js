/**
 * @fileoverview Universal Card Enhancer
 * Applies visual enhancements (borders, badges, overlays) to manga cards
 * across all supported platforms using their respective adapters.
 *
 * @module core/card-enhancer
 */

import { STATUS_COLORS, TOGGLES, SETTINGS, DATA, LIBRARY_ENTRY_KEYS } from '../../config.js';
import { OverlayFactory } from './overlay-factory.js';
import { getMergedMetadata } from './api/metadata-service';

/**
 * Universal card enhancement for any platform.
 * Applies borders, badges, overlays using a platform adapter.
 */
export class CardEnhancer {
    /**
     * @param {Object} adapter - Platform-specific adapter
     * @param {Object} settings - User settings from Chrome storage
     */
    constructor(adapter, settings = {}) {
        console.log("[CardEnhancer] constructor called!");
        this.adapter = adapter;

        const borderSize = settings[SETTINGS.HIGHLIGHT_THICKNESS] ?? 4;
        this.settings = {
            border: {
                size: borderSize,
                style: settings[SETTINGS.BORDER_STYLE] || 'solid',
                radius: '8px'
            },
            highlighting: settings[TOGGLES.LIBRARY_BORDERS] !== false,
            quickActions: settings[TOGGLES.QUICK_ACTIONS] !== false,
            showRibbons: settings[TOGGLES.LIBRARY_SHOW_RIBBONS] !== false,
            customStatuses: Array.isArray(settings[DATA.CUSTOM_STATUSES]) ? settings[DATA.CUSTOM_STATUSES] : [],
            customStatusesEnabled: settings[TOGGLES.CUSTOM_STATUS_ENABLED] !== false
        };
        console.log("[CardEnhancer] constructor finished setup!");
    }

    /**
     * Enhance all cards found on the current page.
     * @returns {Promise<number>} Number of cards enhanced
     */
    async enhanceAll() {
        console.log("[CardEnhancer] Starting enhanceAll");
        if (!chrome.runtime?.id) return 0;

        try {
            const cards = this.findCards();
            console.log(`[CardEnhancer] Found ${cards.length} cards on this page.`);
            
            const storageData = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES, DATA.READING_HISTORY]);
            const library = Array.isArray(storageData[DATA.LIBRARY_ENTRIES]) ? storageData[DATA.LIBRARY_ENTRIES] : [];
            const readChapters = storageData[DATA.READING_HISTORY] || {};

            // Pre-build index Map of reading history keys for O(1) matching
            const historyKeysMap = new Map();
            Object.keys(readChapters).forEach(key => {
                historyKeysMap.set(this.normalizeTitle(key), key);
            });

            // Attach read chapter data to each library entry
            library.forEach(entry => {
                if (entry?.title) {
                    const historyKey = this.findHistoryKey(entry.title, entry.slug, readChapters, historyKeysMap);
                    const chaptersForEntry = historyKey ? (readChapters[historyKey] || []) : [];
                    entry.readChapters = chaptersForEntry;
                    entry.lastReadChapter = this.getHighestChapter(chaptersForEntry);
                }
            });

            // Pre-build index Map of library entries for O(1) matching
            const libraryMap = new Map();
            library.forEach(entry => {
                if (entry?.title) {
                    libraryMap.set(this.normalizeTitle(entry.title), entry);
                }
            });

            let enhancedCount = 0;

            cards.forEach(card => {
                try {
                    if (card.element.dataset.bmhEnhanced) return;

                    const match = this.findMatch(card, libraryMap);
                    if (match) {
                        this.applyEnhancements(card, match);
                    } else if (this.settings.quickActions) {
                        const skeletonEntry = {
                            title: card.data.title,
                            slug: card.data.id,
                            status: 'Add to Library',
                            source: this.adapter.id,
                            sourceId: card.data.id,
                            sourceUrl: card.data.url,
                            type: this.adapter.type || 'manga'
                        };
                        this.applyQuickActions(card, skeletonEntry);
                    }

                    card.element.dataset.bmhEnhanced = 'true';
                    enhancedCount++;
                } catch (cardError) {
                    console.error('[CardEnhancer] Card enhancement error:', cardError);
                }
            });

            console.log(`[CardEnhancer] Finished enhancing cards. Total: ${enhancedCount}`);
            return enhancedCount;
        } catch (err) {
            console.error('[CardEnhancer] Error in enhanceAll:', err);
            return 0;
        }
    }

    /**
     * Find all manga card elements on page.
     * @returns {Array<{ element: HTMLElement, data: Object }>}
     */
    findCards() {
        const selector = this.adapter.selectors?.card;
        if (!selector) return [];

        const elements = document.querySelectorAll(selector);
        return Array.from(elements)
            .map(element => ({ element, data: this.adapter.extractCardData(element) }))
            .filter(card => card.data.title || card.data.id);
    }

    /**
     * Find the reading history key for an entry by trying slug, prefix, and title.
     * @param {string} title - Entry title
     * @param {string|undefined} slug - Entry slug
     * @param {Object} readChapters - Reading history map
     * @param {Map} [historyKeysMap] - Optional map of normalized history keys to raw keys
     * @returns {string|null}
     */
    findHistoryKey(title, slug, readChapters, historyKeysMap) {
        if (!readChapters) return null;

        if (slug) {
            const namespacedKey = (this.adapter.PREFIX || '') + slug;
            if (readChapters[namespacedKey]) return namespacedKey;
            if (readChapters[slug]) return slug;

            if (slug.includes('.')) {
                const baseSlug = slug.substring(0, slug.lastIndexOf('.'));
                if (readChapters[baseSlug]) return baseSlug;
            }
        }

        if (readChapters[title]) return title;

        const normalized = this.normalizeTitle(title);
        if (historyKeysMap) {
            return historyKeysMap.get(normalized) || null;
        }

        const matchKey = Object.keys(readChapters).find(key => this.normalizeTitle(key) === normalized);
        return matchKey || null;
    }

    /**
     * Finds a matching entry in the library for a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Map} libraryMap
     * @returns {Object|undefined}
     */
    findMatch(card, libraryMap) {
        try {
            const normalizedCardTitle = this.normalizeTitle(card.data.title);
            return libraryMap.get(normalizedCardTitle);
        } catch (e) {
            console.error("[CardEnhancer] error in findMatch:", e);
        }
        return undefined;
    }

    /**
     * Apply all enabled enhancements to a matched card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyEnhancements(card, entry) {
        try {
            if (this.settings.highlighting) {
                this.applyBorder(card, entry);
            }
            if (this.settings.quickActions) {
                this.applyQuickActions(card, entry);
            }
            if (this.settings.showRibbons) {
                this.applyRibbon(card, entry);
            }
        } catch (err) {
            console.error("[CardEnhancer] Error applying enhancements:", err);
        }
    }

    /**
     * Resolve the border color for a given status string.
     * Checks built-in STATUS_COLORS first, then custom statuses.
     * @param {string} status - Lowercased status string
     * @returns {{ color: string, style: string }}
     */
    resolveStatusColor(status) {
        let color = '';
        let style = this.settings.border.style;
        const normalized = status.toLowerCase();

        // Custom status overrides (highest priority)
        if (this.settings.customStatusesEnabled && this.settings.customStatuses) {
            const custom = this.settings.customStatuses.find(c => c.name && normalized.includes(c.name.toLowerCase()));
            if (custom) {
                return {
                    color: custom.color,
                    style: custom.style || 'solid'
                };
            }
        }

        // Check built-in status colors
        const matchKey = Object.keys(STATUS_COLORS).find(key => normalized === key.toLowerCase() || normalized.includes(key.toLowerCase()));
        if (matchKey) {
            color = STATUS_COLORS[matchKey];
        }

        return { color, style };
    }

    /**
     * Apply a colored border to a card based on its library status.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyBorder(card, entry) {
        const status = (entry.status || '').trim().toLowerCase();
        if (!status || status === 'add to library') return;

        const { color, style } = this.resolveStatusColor(status);
        if (!color) return;

        if (this.adapter.applyBorder) {
            this.adapter.applyBorder(card.element, color, this.settings.border.size, style);
            return;
        }

        const target = card.element.closest('li') || card.element;
        const display = window.getComputedStyle(target).display;
        if (display === 'inline') {
            target.style.setProperty('display', 'inline-block', 'important');
        }
       
        target.style.setProperty('border', `${this.settings.border.size}px ${style} ${color}`, 'important');
        target.style.setProperty('box-shadow', 'none', 'important');
        target.style.setProperty('border-radius', this.settings.border.radius, 'important');
        target.style.setProperty('box-sizing', 'border-box', 'important');
        target.style.setProperty('overflow', 'visible', 'important');
        
        if (target.offsetHeight === 0) {
            target.style.setProperty('min-height', '20px', 'important');
            target.style.setProperty('display', 'inline-block', 'important');
        }
    }

    /**
     * Apply a corner status ribbon to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyRibbon(card, entry) {
        if (!entry.status || entry.status === 'Add to Library') return;

        const status = (entry.status || '').trim().toLowerCase();
        const { color } = this.resolveStatusColor(status);
        const finalColor = color || '#6366f1';

        OverlayFactory.mountStatusRibbon(card.element, entry.status, finalColor);
    }

    /**
     * Apply the quick-actions tooltip overlay to a card.
     * @param {{ element: HTMLElement, data: Object }} card
     * @param {Object} entry - Library entry
     */
    applyQuickActions(card, entry) {
        const callbacks = {
            continue: (ent) => this.handleContinueReading(ent, card),
            status: (ent, target) => this.handleStatusChange(ent, target || null, card),
            details: (ent) => this.handleViewDetails(ent, card)
        };

        OverlayFactory.mountQuickActions(card.element, entry, this.adapter, callbacks);
        
        const display = window.getComputedStyle(card.element).display;
        if (display === 'inline') {
            card.element.style.setProperty('display', 'inline-block', 'important');
        }
        card.element.style.setProperty('position', 'relative', 'important');
        card.element.style.setProperty('overflow', 'visible', 'important');
    }

    /**
     * Handle "Continue Reading" — navigates to the next chapter URL.
     * @param {Object} entry - Library entry
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleContinueReading(entry, card) {
        const nextChapter = OverlayFactory.calculateNextChapter(entry);
        let url = null;

        if (this.adapter.buildChapterUrl) {
            url = this.adapter.buildChapterUrl(entry, nextChapter);
        }

        if (url == null && entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL]) {
            const lastUrl = entry[LIBRARY_ENTRY_KEYS.LAST_READER_URL];
            const lastChapter = parseFloat(entry[LIBRARY_ENTRY_KEYS.LAST_READ_CHAPTER]) || 0;

            const searchStr1 = `/${lastChapter}`;
            const searchStr2 = `-${lastChapter}`;

            if (lastUrl.includes(searchStr1)) {
                url = lastUrl.replace(searchStr1, `/${nextChapter}`);
            } else if (lastUrl.includes(searchStr2)) {
                url = lastUrl.replace(searchStr2, `-${nextChapter}`);
            } else {
                url = lastUrl;
                console.log('[CardEnhancer] Could not find chapter in URL, using last read URL');
            }
        }

        if (url) {
            window.location.href = url;
        } else if (entry.sourceUrl) {
            window.location.href = entry.sourceUrl;
        } else if (card.data.url) {
            window.location.href = card.data.url;
        } else {
            console.warn('[CardEnhancer] No URL available for continue reading:', entry);
        }
    }

    /**
     * Handle status change — opens the status picker popup.
     * @param {Object} entry - Library entry
     * @param {HTMLElement} btn - Button element clicked
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleStatusChange(entry, btn, card) {
        OverlayFactory.mountStatusPicker(
            btn,
            entry,
            this.settings.customStatuses,
            (newStatus, ent) => this.saveStatusChange(ent, newStatus, card)
        );
    }

    /**
     * Handle view details.
     * @param {Object} entry - Library entry
     * @param {{ element: HTMLElement, data: Object }} card
     */
    handleViewDetails(entry, card) {
        if (this.adapter.handleViewDetails) {
            this.adapter.handleViewDetails(entry, card);
            return;
        }

        chrome.runtime.sendMessage({ type: 'showMangaDetails', title: entry.title }, () => {
            if (chrome.runtime.lastError) {
                console.error('[CardEnhancer] Error opening details:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Save a new status for an entry to Chrome storage.
     * @param {Object} entry - Library entry
     * @param {string} newStatus - New status string
     * @param {{ element: HTMLElement, data: Object }} [card] - The card element being updated
     */
    async saveStatusChange(entry, newStatus, card) {
        try {
            const data = await chrome.storage.local.get([DATA.LIBRARY_ENTRIES]);
            const entries = data[DATA.LIBRARY_ENTRIES] || [];

            const normalizedTitle = this.normalizeTitle(entry.title);
            const foundIdx = entries.findIndex(e => e && this.normalizeTitle(e.title) === normalizedTitle);
            let updatedEntry;

            if (foundIdx !== -1) {
                entries[foundIdx].status = newStatus;
                entries[foundIdx].lastUpdated = Date.now();
                if (this.adapter.type) {
                    entries[foundIdx].type = this.adapter.type;
                }
                updatedEntry = entries[foundIdx];
            } else {
                const newEntry = {
                    title: entry.title,
                    slug: entry.slug,
                    status: newStatus,
                    source: entry.source,
                    sourceId: entry.sourceId,
                    sourceUrl: entry.sourceUrl,
                    type: entry.type || this.adapter.type || 'manga',
                    lastUpdated: Date.now()
                };

                try {
                    const metadata = await getMergedMetadata(entry.title, newEntry.type);
                    if (metadata) {
                        newEntry.anilistData = metadata;
                    }
                } catch (e) {
                    console.warn('[CardEnhancer] Metadata fetch error:', e);
                }

                entries.push(newEntry);
                updatedEntry = newEntry;
                console.log('[CardEnhancer] Added new entry to library: ' + entry.title);
            }

            await chrome.storage.local.set({ [DATA.LIBRARY_ENTRIES]: entries });
            console.log(`[CardEnhancer] Status saved: ${entry.title} -> ${newStatus}`);

            // Perform targeted card update instead of full sweep
            if (card) {
                // Remove existing overlays and badge containers from this card
                card.element.querySelectorAll('.bmh-vue-container, .bmh-vue-badge-container').forEach(child => child.remove());
                
                // Also remove highlight border if applied to parent
                const target = card.element.closest('li') || card.element;
                target.style.removeProperty('border');
                target.style.removeProperty('border-radius');
                target.style.removeProperty('box-shadow');
                target.style.removeProperty('box-sizing');
                target.style.removeProperty('overflow');
                target.style.removeProperty('min-height');
                target.style.removeProperty('display');

                // Re-apply enhancements to this card with the updated entry
                this.applyEnhancements(card, updatedEntry);
            }
        } catch (e) {
            console.error('[CardEnhancer] Failed to save status:', e);
        }
    }

    /**
     * Normalize a title to lowercase alphanumeric only for fuzzy matching.
     * @param {string} title
     * @returns {string}
     */
    normalizeTitle(title) {
        if (!title) return '';
        return title.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Get the highest chapter number from an array of chapter strings/numbers.
     * Uses a regex pattern `^(\\d+\\.?\\d*)` to extract the leading float/integer number.
     * @param {Array<string|number>} chapters
     * @returns {number}
     */
    getHighestChapter(chapters) {
        if (!chapters || chapters.length === 0) return 0;

        let highest = 0;
        chapters.forEach(ch => {
            const match = String(ch).match(/^(\d+\.?\d*)/);
            if (match) {
                const num = parseFloat(match[1]);
                if (num > highest) {
                    highest = num;
                }
            }
        });

        return highest;
    }
}

export default CardEnhancer;
