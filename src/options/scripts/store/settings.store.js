/**
 * @fileoverview Pinia store for all user settings and custom status management.
 * This file keeps track of things like theme, border thickness, and your custom status markers.
 */
import { defineStore } from 'pinia';
import { TOGGLES, SETTINGS, DATA, BORDER_DEFAULTS } from '../../../config.js';

const STATE_TO_STORAGE_MAP = {
    theme: SETTINGS.THEME,
    isCustomTheme: TOGGLES.IS_CUSTOM_THEME,
    customTheme: SETTINGS.CUSTOM_THEME_DATA,
    highlightThickness: SETTINGS.HIGHLIGHT_THICKNESS,
    libraryThickness: SETTINGS.LIBRARY_THICKNESS,
    borderStyle: SETTINGS.BORDER_STYLE,
    quickActions: TOGGLES.QUICK_ACTIONS,
    syncAndMarkRead: TOGGLES.HISTORY_TRACKING,
    progressTracking: TOGGLES.PROGRESS_TRACKING,
    cardViewSize: SETTINGS.VIEW_MODE,
    libraryHideNoHistory: TOGGLES.LIBRARY_HIDE_NO_HISTORY,
    customStatusEnabled: TOGGLES.CUSTOM_STATUS_ENABLED,
    highlightEnabled: TOGGLES.LIBRARY_BORDERS,
    familyFriendlyEnabled: TOGGLES.FAMILY_FRIENDLY,
    libraryShowRibbons: TOGGLES.LIBRARY_SHOW_RIBBONS,
    readerStatusPicker: TOGGLES.READER_STATUS_PICKER
};

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        activeTab: 'settings', // Current visible tab in options page
        theme: 'dark',
        isCustomTheme: false,
        customTheme: {
            bg: '#0b1437',
            sidebar: '#111c44',
            accent: '#7551FF',
            text: '#ffffff'
        },
        highlightThickness: 4,     // External websites
        libraryThickness: 4,       // Internal library entries
        borderStyle: 'solid',
        highlightEnabled: true,
        libraryBordersEnabled: true,
        libraryHideNoHistory: false,
        cardViewSize: 'large',     // 'compact', 'large', 'list'
        quickActions: true,
        libraryShowRibbons: true,
        readerStatusPicker: true,
        syncAndMarkRead: true,
        progressTracking: true,
        familyFriendlyEnabled: false,
        customStatuses: [],
        customStatusEnabled: false,
        isLoaded: false
    }),

    actions: {
        /**
         * Loads all settings from the browser's storage.
         */
        async loadSettings() {
            console.log("[SettingsStore] loading settings");
            try {
                const storageKeys = [
                    ...Object.values(STATE_TO_STORAGE_MAP),
                    DATA.CUSTOM_STATUSES
                ].filter(Boolean);

                const data = await chrome.storage.local.get(storageKeys);

                this.theme = data[SETTINGS.THEME] || 'dark';
                this.isCustomTheme = !!data[TOGGLES.IS_CUSTOM_THEME];
                if (data[SETTINGS.CUSTOM_THEME_DATA]) {
                    this.customTheme = data[SETTINGS.CUSTOM_THEME_DATA];
                }
                this.highlightThickness = parseInt(data[SETTINGS.HIGHLIGHT_THICKNESS]) || 4;
                this.libraryThickness = parseInt(data[SETTINGS.LIBRARY_THICKNESS]) || 4;
                this.borderStyle = data[SETTINGS.BORDER_STYLE] || BORDER_DEFAULTS.style;
                this.quickActions = data[TOGGLES.QUICK_ACTIONS] !== false;
                this.syncAndMarkRead = data[TOGGLES.HISTORY_TRACKING] !== false;
                this.progressTracking = data[TOGGLES.PROGRESS_TRACKING] !== false;
                this.cardViewSize = data[SETTINGS.VIEW_MODE] || 'large';
                this.libraryHideNoHistory = !!data[TOGGLES.LIBRARY_HIDE_NO_HISTORY];
                this.customStatuses = Array.isArray(data[DATA.CUSTOM_STATUSES]) ? data[DATA.CUSTOM_STATUSES] : [];
                this.customStatusEnabled = !!data[TOGGLES.CUSTOM_STATUS_ENABLED];
                this.highlightEnabled = data[TOGGLES.LIBRARY_BORDERS] !== false;
                this.familyFriendlyEnabled = !!data[TOGGLES.FAMILY_FRIENDLY];
                this.libraryShowRibbons = data[TOGGLES.LIBRARY_SHOW_RIBBONS] !== false;
                this.readerStatusPicker = data[TOGGLES.READER_STATUS_PICKER] !== false;

                this.isLoaded = true;
                console.log("[SettingsStore] settings loaded successfully");
            } catch (err) {
                console.error("[SettingsStore] load settings error:", err);
            }
        },

        async updateSetting(key, value) {
            console.log(`[SettingsStore] updating setting: ${key}`);
            try {
                this[key] = value;
                const sKey = STATE_TO_STORAGE_MAP[key];
                if (sKey) {
                    const saveValue = (typeof value === 'object' && value !== null) ? JSON.parse(JSON.stringify(value)) : value;
                    await chrome.storage.local.set({ [sKey]: saveValue });
                    console.log(`[SettingsStore] saved ${sKey} successfully`);
                }
            } catch (err) {
                console.error("[SettingsStore] error saving setting:", err);
            }
        },

        async addCustomStatus(name, color, style) {
            console.log("[SettingsStore] adding custom status:", name);
            try {
                if (!name || !color) return;
                const newStatus = {
                    name: name,
                    color: color,
                    style: style || BORDER_DEFAULTS.style
                };
                this.customStatuses = [...this.customStatuses, newStatus];
                await chrome.storage.local.set({ [DATA.CUSTOM_STATUSES]: JSON.parse(JSON.stringify(this.customStatuses)) });
                console.log("[SettingsStore] added successfully");
            } catch (err) {
                console.error("[SettingsStore] error adding status:", err);
            }
        },

        async removeCustomStatus(index) {
            console.log("[SettingsStore] removing custom status at index:", index);
            try {
                this.customStatuses = this.customStatuses.filter((_, i) => i !== index);
                await chrome.storage.local.set({ [DATA.CUSTOM_STATUSES]: JSON.parse(JSON.stringify(this.customStatuses)) });
                console.log("[SettingsStore] removed successfully");
            } catch (err) {
                console.error("[SettingsStore] error removing status:", err);
            }
        },

        async resetCustomStatuses() {
            console.log("[SettingsStore] resetting custom statuses");
            try {
                this.customStatuses = [];
                await chrome.storage.local.remove(DATA.CUSTOM_STATUSES);
                console.log("[SettingsStore] reset successful");
            } catch (err) {
                console.error("[SettingsStore] error resetting custom statuses:", err);
            }
        },

        /**
         * Keeps the store in sync if settings change in another window.
         */
        syncFromStorage(changes) {
            Object.entries(STATE_TO_STORAGE_MAP).forEach(([stateKey, storageKey]) => {
                if (changes[storageKey] !== undefined) {
                    let val = changes[storageKey].newValue;
                    if (stateKey === 'highlightThickness' || stateKey === 'libraryThickness') {
                        val = parseInt(val) || 4;
                    }
                    this[stateKey] = val;
                }
            });
            if (changes[DATA.CUSTOM_STATUSES] !== undefined) {
                const val = changes[DATA.CUSTOM_STATUSES].newValue;
                this.customStatuses = Array.isArray(val) ? val : [];
            }
        }
    }
});
