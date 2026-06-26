<template>
    <div :id="mediaType === 'anime' ? 'tab-saved-anime' : 'tab-saved-entries'" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === (mediaType === 'anime' ? 'saved-anime' : 'saved-entries') }">
        <header class="header">
            <div class="header-text">
                <h1>{{ mediaType === 'anime' ? 'Anime Library' : 'Library' }}</h1>
                <p class="subtitle">Browse and manage your {{ mediaType === 'anime' ? 'anime' : 'manga' }} library</p>
            </div>
            <div class="header-actions" style="display: flex; gap: 10px; align-items: center;">
                <button @click="addNewEntry" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
                    <span class="icon-svg icon-plus"></span> Add {{ mediaType === 'anime' ? 'Anime' : 'Manga' }}
                </button>
                <button @click="syncMissing" class="btn btn-warning-large" style="display: inline-flex; align-items: center; gap: 6px;" title="Fetch info for entries stuck on 'Loading info...'">
                    <span class="icon-svg icon-zap"></span> Sync Missing Info
                </button>
                <button @click="syncAll" class="btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 600; display: inline-flex; align-items: center; gap: 6px;" title="WARNING: Erase all info cache and refetch from scratch">
                    <span class="icon-svg icon-trash"></span> Erase & Sync All
                </button>
            </div>
        </header>

        <div class="content-grid" style="max-width: 100%;">




            <!-- Library Header with Filters -->
            <LibraryFilterBar 
                :filters="filters"
                :custom-statuses="customStatuses"
                :available-genres="availableGenres"
                :show-stats="showStats"
                :card-view-size="cardViewSize"
                :sorted-entries-count="sortedEntries.length"
                :media-type="mediaType"
                @toggle-stats="toggleStats"
                @set-view-size="setViewSize"
                @clear-filters="clearFilters"
                @update:filter="handleFilterUpdate"
            />

            <!-- Sync Progress Bar -->
            <LibrarySyncProgress :sync-state="syncState" />

            <!-- Manga Grid / List View -->
            <LibraryGrid 
                :card-view-size="cardViewSize"
                :sorted-entries="sortedEntries"
                :visible-entries="visibleEntries"
                :has-more-entries="hasMoreEntries"
                :custom-statuses="customStatuses"
                :personal-data="personalData"
                :library-settings="librarySettings"
                @show-details="showDetails"
                @show-status-picker="showStatusPicker"
                @load-more="loadMoreEntries"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { getMergedMetadata } from '../../../../scripts/core/api/metadata-service';

import LibraryFilterBar from './LibraryFilterBar.vue';
import LibrarySyncProgress from './LibrarySyncProgress.vue';
import LibraryGrid from './LibraryGrid.vue';

import { getFormatName } from '../../../scripts/ui/manga-card-utils.js';
import * as LibraryService from '../../../../scripts/core/library-service.js';
import { useLibraryStore } from '../../../scripts/store/library.store.js';
import { 
    TOGGLES,
    SETTINGS,
    DATA,
    LIBRARY_CONFIG
} from '../../../../config.js';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const props = defineProps({
    mediaType: {
        type: String,
        default: 'manga'
    }
});

// Access Pinia Stores
const libraryStore = useLibraryStore();
const settingsStore = useSettingsStore();

// Destructure reactive state from stores
const { 
    personalData, 
    isSyncing, 
    syncProgress 
} = storeToRefs(libraryStore);

// Compute savedEntries from partitioned store lists
const savedEntries = computed(() => {
    return props.mediaType === 'anime' ? libraryStore.animeEntries : libraryStore.mangaEntries;
});

const { 
    libraryBordersEnabled, 

    familyFriendlyEnabled,
    customStatuses,
    highlightThickness,
    libraryHideNoHistory,
    libraryShowRibbons,
    cardViewSize
} = storeToRefs(settingsStore);

// Computed setting object for MangaCard compatibility
const librarySettings = computed(() => ({
    bordersEnabled: libraryBordersEnabled.value,
    borderThickness: highlightThickness.value,
    hideNoHistory: libraryHideNoHistory.value,
    showRibbons: libraryShowRibbons.value
}));


const visibleCount = ref(LIBRARY_CONFIG.INITIAL_LOAD);

const syncState = computed(() => ({
    isSyncing: isSyncing.value,
    current: syncProgress.value.current,
    total: syncProgress.value.total,
    currentTitle: syncProgress.value.title,
    percentage: syncProgress.value.total > 0 
        ? Math.round((syncProgress.value.current / syncProgress.value.total) * 100) 
        : 0
}));

const setViewSize = (size) => {
    settingsStore.updateSetting(SETTINGS.VIEW_MODE, size);
};

const showDetails = (entry) => {
    libraryStore.selectedEntry = entry;
};

const filters = reactive({
    sort: 'last-read-desc',
    status: 'All',
    genre: 'All',
    format: 'All',
    search: '',
    chapterMin: null,
    chapterMax: null,
    lastUpdated: 'all'
});

const availableGenres = computed(() => {
    const genres = new Set();
    if (Array.isArray(savedEntries.value)) {
        savedEntries.value.forEach(e => {
            if (e.anilistData?.genres && Array.isArray(e.anilistData.genres)) {
                e.anilistData.genres.forEach(g => genres.add(g));
            }
        });
    }
    return Array.from(genres).sort();
});

const filteredEntries = computed(() => {
    const searchLower = filters.search ? filters.search.toLowerCase().trim() : '';
    const hasSearch = searchLower !== '';
    const familyFriendly = familyFriendlyEnabled.value;
    const filterStatus = filters.status !== 'All' ? filters.status.toLowerCase().trim().replace(/[-\s]/g, '') : '';
    const hasStatus = filters.status !== 'All';
    const hasFormat = filters.format !== 'All';
    const hasGenre = filters.genre !== 'All';
    const hasLastUpdated = filters.lastUpdated !== 'all';
    
    return savedEntries.value.filter(entry => {
        if (!entry) return false;
        const ani = entry.anilistData;
        
        // Family Friendly
        if (familyFriendly && ani?.genres && Array.isArray(ani.genres)) {
            if (ani.isAdult) return false;
            if (ani.genres.some(g => g === 'Ecchi' || g === 'Hentai')) return false;
        }
        
        // Status
        if (hasStatus) {
            const entryStatus = (entry.status || '').toLowerCase().trim().replace(/[-\s]/g, '');
            if (filters.status.startsWith("marker:")) {
                const statusName = filters.status.substring(7);
                if (entry.customStatus !== statusName && entry.status !== statusName) return false;
            } else if (filters.status === "HasHistory") {
                if (!entry.lastRead && !entry.lastChapterRead && (!entry.readChapters || entry.readChapters <= 0)) return false;
            } else {
                if (entryStatus !== filterStatus) return false;
            }
        }
        
        // Format
        if (hasFormat) {
            if (!ani || getFormatName(ani.format, ani.countryOfOrigin) !== filters.format) return false;
        }
        
        // Genre
        if (hasGenre) {
            if (!ani?.genres || !Array.isArray(ani.genres) || !ani.genres.includes(filters.genre)) return false;
        }
        
        // Search
        if (hasSearch) {
            const titleMatch = (entry.title && entry.title.toLowerCase().includes(searchLower)) ||
                (ani?.title?.english && ani.title.english.toLowerCase().includes(searchLower)) ||
                (ani?.title?.romaji && ani.title.romaji.toLowerCase().includes(searchLower));
            
            const authorMatch = ani?.staff?.edges && ani.staff.edges.some(e => 
                e?.node?.name?.full && e.node.name.full.toLowerCase().includes(searchLower)
            );
            
            if (!titleMatch && !authorMatch) return false;
        }
        
        // Chapter Range
        const chapterMin = filters.chapterMin || 0;
        const chapterMax = filters.chapterMax || 999999;
        if (chapterMin > 0 || chapterMax < 999999) {
            const totalChapters = ani?.chapters || entry.readChapters || 0;
            if (totalChapters < chapterMin || totalChapters > chapterMax) return false;
        }
        
        // Last Updated
        if (hasLastUpdated) {
            const now = Date.now();
            const lastRead = entry.lastRead || entry.lastUpdated || 0;
            let cutoff = 0;
            if (filters.lastUpdated === "7d") cutoff = now - (7 * 24 * 60 * 60 * 1000);
            else if (filters.lastUpdated === "30d") cutoff = now - (30 * 24 * 60 * 60 * 1000);
            else if (filters.lastUpdated === "90d") cutoff = now - (90 * 24 * 60 * 60 * 1000);
            else if (filters.lastUpdated === "year") cutoff = now - (365 * 24 * 60 * 60 * 1000);
            
            if (lastRead < cutoff) return false;
        }
        
        return true;
    });
});

const sortedEntries = computed(() => {
    const list = [...filteredEntries.value];
    if (list.length === 0) return list;

    const sortType = filters.sort;

    // Schwartzian transform to avoid key calculations in comparison loops
    let mapped;
    if (sortType === 'title-asc' || sortType === 'title-desc') {
        mapped = list.map((entry, idx) => ({
            idx,
            val: (entry.anilistData?.title?.english || entry.title).toLowerCase()
        }));
        mapped.sort((a, b) => {
            return sortType === 'title-asc' ? a.val.localeCompare(b.val) : b.val.localeCompare(a.val);
        });
        return mapped.map(item => list[item.idx]);
    } else if (sortType === 'rating-desc' || sortType === 'rating-asc') {
        mapped = list.map((entry, idx) => {
            const id = LibraryService.getMangaId(entry);
            const val = personalData.value[id]?.rating || 0;
            return { idx, val };
        });
        mapped.sort((a, b) => {
            return sortType === 'rating-desc' ? b.val - a.val : a.val - b.val;
        });
        return mapped.map(item => list[item.idx]);
    }

    list.sort((a, b) => {
        switch (sortType) {
            case 'pop-desc': return (b.anilistData?.popularity || 0) - (a.anilistData?.popularity || 0);
            case 'pop-asc': return (a.anilistData?.popularity || 0) - (b.anilistData?.popularity || 0);
            case 'score-desc': return (b.anilistData?.averageScore || 0) - (a.anilistData?.averageScore || 0);
            case 'added-desc': return (b.lastUpdated || 0) - (a.lastUpdated || 0);
            case 'last-read-desc': return (b.lastRead || 0) - (a.lastRead || 0);
            default: return 0;
        }
    });
    return list;
});

const visibleEntries = computed(() => {
    return sortedEntries.value.slice(0, visibleCount.value);
});

const hasMoreEntries = computed(() => {
    return visibleCount.value < sortedEntries.value.length;
});

const loadMoreEntries = () => visibleCount.value += LIBRARY_CONFIG.LOAD_MORE_INCREMENT;

// Reset pagination when filters change
watch([filters, cardViewSize], () => {
    visibleCount.value = LIBRARY_CONFIG.INITIAL_LOAD;
}, { deep: true });


const clearFilters = () => {
    filters.chapterMin = null;
    filters.chapterMax = null;
    filters.lastUpdated = 'all';
    filters.status = 'All';
    filters.genre = 'All';
    filters.format = 'All';
};

/**
 * Handles the filter update event emitted from LibraryFilterBar.
 * @param {Object} payload - Event payload
 * @param {string} payload.key - Filter property name
 * @param {any} payload.value - Filter property value
 */
const handleFilterUpdate = ({ key, value }) => {
    filters[key] = value;
};


const showStatusPicker = (entry) => {
    if (window.showStatusPicker) window.showStatusPicker(entry);
};

const addNewEntry = async () => {
    const isAnime = props.mediaType === 'anime';
    const title = prompt(isAnime ? "Enter the exact anime title to add:" : "Enter the exact manga title to add:");
    if (!title?.trim()) return;

    try {
        const metadata = await getMergedMetadata(title.trim(), props.mediaType);
        const displayTitle = metadata?.title?.english || metadata?.title?.romaji || title.trim();
        
        const newEntry = {
            title: displayTitle,
            status: props.mediaType === 'anime' ? 'Plan to Watch' : 'Plan to Read',
            lastUpdated: Date.now(),
            anilistData: metadata || undefined,
            type: props.mediaType
        };
        
        const exists = libraryStore.entries.some(e => 
            e.title.toLowerCase() === newEntry.title.toLowerCase()
        );
        
        if (exists) {
            alert(`${isAnime ? 'Anime' : 'Manga'} is already in your library!`);
            return;
        }

        await libraryStore.upsertEntry(newEntry);
        alert(`Successfully added "${displayTitle}" to your library.`);
    } catch(e) {
        console.error(e);
        alert(`Error adding ${isAnime ? 'anime' : 'manga'}.`);
    }
};

const syncMissing = async () => {
    if (libraryStore.isSyncing) {
        if (!confirm("A sync is already in progress. Do you want to restart it?")) return;
    }
    const success = await libraryStore.forceSync(false);
    if (success) {
        alert("Missing info sync completed!");
    }
};

const syncAll = async () => {
    if (libraryStore.isSyncing) {
        if (!confirm("A sync is already in progress. Do you want to restart it?")) return;
    }
    if (!confirm("WARNING: This will wipe all cached metadata and re-fetch from scratch. This can take a long time and hits rate limits. Are you sure?")) return;
    const success = await libraryStore.forceSync(true);
    if (success) {
        alert("Full library sync completed!");
    }
};



onMounted(() => {
    libraryStore.loadLibrary();
});
</script>
