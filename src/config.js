/**
 * @fileoverview Centralized configuration for all platforms and features.
 * User-configurable settings merged with defaults.
 * 
 * @module core/config
 */

/**
 * Default status colors shared across all platforms.
 * Dual-case keys are intentional: Title Case keys represent display names (used by UI elements like
 * StatusPicker or overlay tooltips) while lowercase keys represent internal status identifiers
 * (used by library card enhancers and CSS classes).
 * @type {Object<string, string>}
 */
export const STATUS_COLORS = Object.freeze({
    // Display names (used by StatusPicker, overlay tooltips)
    'Reading': '#10b981',
    'Watching': '#10b981',
    'Completed': '#3b82f6',
    'Plan to Read': '#fbbf24',
    'Plan to Watch': '#fbbf24',
    'On-Hold': '#f97316',
    'On Hold': '#f97316',
    'Dropped': '#ef4444',
    'Re-reading': '#a855f7',
    'Re-watching': '#a855f7',
    'HasHistory': '#9ca3af',

    // Internal lowercase keys (used by library card factory, SCSS-driven status classes)
    'reading': '#10b981',
    'watching': '#10b981',
    'read': '#9ca3af',
    'completed': '#3b82f6',
    'dropped': '#ef4444',
    'onhold': '#f97316',
    'planning': '#fbbf24',
    'plan to watch': '#fbbf24',
    're-reading': '#a855f7',
    're-watching': '#a855f7',
    'default': '#9ca3af'
});

/**
 * Default border styling configuration.
 * @type {{size: number, style: string, radius: string}}
 */
export const BORDER_DEFAULTS = Object.freeze({
    size: 4,
    style: 'solid',
    radius: '8px'
});


/**
 * Feature flags with defaults.
 * Users can toggle these in settings.
 * @type {Object<string, boolean>}
 */
// Status colors and defaults are preserved as constants below for direct import.

/**
 * Toggles: Boolean feature flags and operational switches (true/false)
 * @type {Object<string, string>}
 */
export const TOGGLES = Object.freeze({
    // Core Features
    FAMILY_FRIENDLY: 'FamilyFriendlyfeatureEnabled',
    HISTORY_TRACKING: 'SyncandMarkReadfeatureEnabled',
    PROGRESS_TRACKING: 'progressTrackingEnabled',

    // Custom Sites
    CUSTOM_STATUS_ENABLED: 'CustomBookmarksfeatureEnabled',

    // UI Enhancements
    LIBRARY_BORDERS: 'LibraryCardBordersEnabled',
  
    LIBRARY_HIDE_NO_HISTORY: 'libraryHideNoHistory',
    QUICK_ACTIONS: 'quickActions',
    LIBRARY_SHOW_RIBBONS: 'libraryShowStatusRibbon',
    
    // Reader Page
    READER_STATUS_PICKER: 'readerStatusPicker',
    
    IS_CUSTOM_THEME: 'isCustomTheme'
});

/**
 * Settings: Configurable values, preferences and metadata strings
 * @type {Object<string, string>}
 */
export const SETTINGS = Object.freeze({
    THEME: 'theme',
    CUSTOM_THEME_DATA: 'customThemeData',
    HIGHLIGHT_THICKNESS: 'CustomBorderSize',
    LIBRARY_THICKNESS: 'LibraryBorderSize',
    BORDER_STYLE: 'GlobalBorderStyle',
    VIEW_MODE: 'cardViewSize' // Unified from cardViewSize/libraryViewMode
});

/**
 * Data: Complex objects, collections, caches and timestamps
 * @type {Object<string, string>}
 */
export const DATA = Object.freeze({
    LIBRARY_ENTRIES: 'savedEntriesMerged',
    READING_HISTORY: 'savedReadChapters',
    PERSONAL_DATA: 'libraryPersonalData',
    FILTER_PRESETS: 'libraryFilterPresets',
    CUSTOM_SITES: 'customSites',
    CUSTOM_STATUSES: 'customBookmarks',
    ANILIST_CACHE: 'anilistCache',
    MANGADEX_CACHE: 'mangadexCache',
    
    // Timestamps
    LAST_BACKUP: 'LastBackupDate',
    LAST_SYNC_TIME: 'lastSyncTime'
});

/**
 * Library Entry Keys: Standardized property names for manga objects
 * @type {Object<string, string>}
 */
export const LIBRARY_ENTRY_KEYS = Object.freeze({
    TITLE: 'title',
    STATUS: 'status',
    CHAPTERS: 'chapters',
    READ_CHAPTERS: 'readChapters',
    LAST_READ_CHAPTER: 'lastReadChapter',
    LAST_READER_URL: 'lastReaderUrl',
    SOURCE: 'source',
    SOURCE_ID: 'sourceId',
    SOURCE_URL: 'sourceUrl',
    MANGA_SLUG: 'mangaSlug',
    ANILIST_DATA: 'anilistData',
    PERSONAL_DATA: 'personalData',
    CUSTOM_STATUS: 'customStatus',
    LAST_READ: 'lastRead',
    LAST_UPDATED: 'lastUpdated'
});


/**
 * Configuration for remote API integrations.
 */
export const API_CONFIG = Object.freeze({
    MANGADEX: Object.freeze({
        BASE_URL: 'https://api.mangadex.org',
        CACHE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
        MIN_REQUEST_INTERVAL: 500
    }),
    ANILIST: Object.freeze({
        BASE_URL: 'https://graphql.anilist.co',
        MIN_REQUEST_INTERVAL: 750
    })
});

/**
 * Progress Tracking constants
 */
export const PROGRESS_CONFIG = Object.freeze({
    SAVE_DELAY: 5000,                  // 5 seconds
    SCROLL_THRESHOLD: 0.1              // 10% scroll
});

/**
 * Library configuration
 */
export const LIBRARY_CONFIG = Object.freeze({
    INITIAL_LOAD: 100,
    LOAD_MORE_INCREMENT: 100
});

/**
 * Library Defaults
 */
export const DEFAULT_STATUS = 'Reading';
