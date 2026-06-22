<template>
    <div id="tab-stats" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'stats' }">
        <header class="header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div class="header-text">
                <h1>Library Statistics</h1>
                <p class="subtitle">Overview of your reading journey, progress milestones, and library insights.</p>
            </div>
            <div class="stats-segmented-control">
                <button 
                    @click="activeStatsType = 'all'" 
                    class="control-btn" 
                    :class="{ active: activeStatsType === 'all' }"
                >
                    <span class="icon-svg icon-globe" style="font-size: 14px;"></span> All Media
                </button>
                <button 
                    @click="activeStatsType = 'manga'" 
                    class="control-btn" 
                    :class="{ active: activeStatsType === 'manga' }"
                >
                    <span class="icon-svg icon-library" style="font-size: 14px;"></span> Manga
                </button>
                <button 
                    @click="activeStatsType = 'anime'" 
                    class="control-btn" 
                    :class="{ active: activeStatsType === 'anime' }"
                >
                    <span class="icon-svg icon-video" style="font-size: 14px;"></span> Anime
                </button>
            </div>
        </header>

        <div class="content-grid" v-if="stats.totalManga > 0">
            <!-- Row 1: Key Metrics Overview -->
            <StatOverviewWidgets 
                :total-manga="stats.totalManga"
                :total-chapters="stats.totalChapters"
                :avg-rating="stats.avgRating"
                :total-notes="stats.totalNotes"
                :active-stats-type="activeStatsType"
            />

            <!-- Row 2: Detailed Charts & Splits -->
            <div class="stats-detail-grid">
                <!-- Left Column -->
                <div class="stats-column">
                    <StatusDistributionCard :sorted-statuses="sortedStatuses" />
                    <TopGenresCard :genres-list="stats.genresList" :total-manga="stats.totalManga" :active-stats-type="activeStatsType" />
                    <PlatformSourcesCard :sources-list="stats.sourcesList" :total-manga="stats.totalManga" :active-stats-type="activeStatsType" />
                </div>

                <!-- Right Column -->
                <div class="stats-column">
                    <RatingProfileCard :rating-dist="stats.ratingDist" :rated-manga-count="stats.ratedMangaCount" :total-manga="stats.totalManga" :active-stats-type="activeStatsType" />
                    <MostReadCard :top-read-manga="stats.topReadManga" :active-stats-type="activeStatsType" />
                    <RecentActivityCard :top-recent-reads="stats.topRecentReads" :active-stats-type="activeStatsType" />
                </div>
            </div>
        </div>

        <div class="empty-state-main" v-else>
            <span class="icon-svg empty-icon" :class="activeStatsType === 'anime' ? 'icon-video' : 'icon-library'"></span>
            <h2>No Statistics Available Yet</h2>
            <p>Add {{ activeStatsType === 'anime' ? 'anime' : 'manga' }} entries to your library or start {{ activeStatsType === 'anime' ? 'watching episodes' : 'reading chapters' }} to begin generating statistics insights.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';
import { useLibraryStore } from '../../../scripts/store/library.store.js';

// Subcomponents
import StatOverviewWidgets from './StatOverviewWidgets.vue';
import StatusDistributionCard from './StatusDistributionCard.vue';
import TopGenresCard from './TopGenresCard.vue';
import PlatformSourcesCard from './PlatformSourcesCard.vue';
import RatingProfileCard from './RatingProfileCard.vue';
import MostReadCard from './MostReadCard.vue';
import RecentActivityCard from './RecentActivityCard.vue';

const settingsStore = useSettingsStore();
const libraryStore = useLibraryStore();

const activeStatsType = ref('all');

/**
 * Main computed statistics object gathering raw metrics from the store state.
 */
const stats = computed(() => {
    const allList = libraryStore.entries || [];
    const hist = libraryStore.history || {};
    const personal = libraryStore.personalData || {};
    
    // Filter list based on toggle
    const list = allList.filter(e => {
        if (!e) return false;
        if (activeStatsType.value === 'manga') return e.type !== 'anime';
        if (activeStatsType.value === 'anime') return e.type === 'anime';
        return true;
    });
    
    // 1. Basic Counts
    const totalManga = list.length;
    let completedCount = 0;
    let readingCount = 0;
    let planCount = 0;
    let onHoldCount = 0;
    let droppedCount = 0;
    
    // Status distribution map
    const statusCounts = {};
    if (activeStatsType.value === 'anime') {
        statusCounts['Watching'] = 0;
        statusCounts['Completed'] = 0;
        statusCounts['Plan to Watch'] = 0;
        statusCounts['On Hold'] = 0;
        statusCounts['Dropped'] = 0;
    } else if (activeStatsType.value === 'manga') {
        statusCounts['Reading'] = 0;
        statusCounts['Completed'] = 0;
        statusCounts['Plan to Read'] = 0;
        statusCounts['On Hold'] = 0;
        statusCounts['Dropped'] = 0;
    } else {
        statusCounts['Reading'] = 0;
        statusCounts['Watching'] = 0;
        statusCounts['Completed'] = 0;
        statusCounts['Plan to Read'] = 0;
        statusCounts['Plan to Watch'] = 0;
        statusCounts['On Hold'] = 0;
        statusCounts['Dropped'] = 0;
    }

    // Initialize custom statuses in distribution map so they show up
    if (Array.isArray(settingsStore.customStatuses)) {
        settingsStore.customStatuses.forEach(c => {
            statusCounts[c.name] = 0;
        });
    }
    
    for (var i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e) continue;
        
        let status = e.customStatus || e.status;
        if (!status) {
            status = e.type === 'anime' ? 'Plan to Watch' : 'Plan to Read';
        }
        
        // Only normalize if it is not a custom status
        const isCustom = Array.isArray(settingsStore.customStatuses) && 
            settingsStore.customStatuses.some(c => c.name.toLowerCase() === status.toLowerCase());

        if (!isCustom) {
            // Normalize status names for anime vs manga just in case they were saved weirdly
            if (e.type === 'anime') {
                if (status === 'Reading') status = 'Watching';
                if (status === 'Plan to Read') status = 'Plan to Watch';
                if (status === 'Re-reading') status = 'Re-watching';
            } else {
                if (status === 'Watching') status = 'Reading';
                if (status === 'Plan to Watch') status = 'Plan to Read';
                if (status === 'Re-watching') status = 'Re-reading';
            }
        }

        if (statusCounts[status] === undefined) {
            statusCounts[status] = 0;
        }
        statusCounts[status]++;
        
        if (status === 'Reading' || status === 'Watching') readingCount++;
        else if (status === 'Completed') completedCount++;
        else if (status === 'Plan to Read' || status === 'Plan to Watch') planCount++;
        else if (status === 'On Hold' || status === 'On-Hold') onHoldCount++;
        else if (status === 'Dropped') droppedCount++;
    }
    
    // 2. Chapters Read / Episodes Watched
    let totalChapters = 0;
    const mangaReadCounts = [];
    
    // Pre-build Maps for O(1) matching in history and ratings processing
    const entryByTitle = new Map();
    const entryBySlug = new Map();
    const entryByPersonalKey = new Map();

    list.forEach(e => {
        if (!e) return;
        if (e.title) entryByTitle.set(e.title.toLowerCase(), e);
        if (e.slug) entryBySlug.set(e.slug.toLowerCase(), e);
        
        const keys = [
            e.title?.toLowerCase(),
            e.slug?.toLowerCase(),
            e.mangaSlug?.toLowerCase(),
            e.anilistData?.id ? String(e.anilistData.id).toLowerCase() : null
        ].filter(Boolean);
        keys.forEach(k => entryByPersonalKey.set(k, e));
    });

    const historyKeys = Object.keys(hist);
    for (var j = 0; j < historyKeys.length; j++) {
        const key = historyKeys[j];
        const chapters = hist[key] || [];
        if (Array.isArray(chapters)) {
            // Find corresponding title in library
            let title = key;
            const keyLower = key.toLowerCase();
            let entry = entryByTitle.get(keyLower) || entryBySlug.get(keyLower);
            
            // Substring fallback
            if (!entry) {
                if (keyLower.includes(':')) {
                    const lastPart = keyLower.substring(keyLower.lastIndexOf(':') + 1);
                    entry = entryBySlug.get(lastPart);
                }
                if (!entry) {
                    entry = list.find(e => e && e.slug && keyLower.includes(e.slug.toLowerCase()));
                }
            }

            if (entry) {
                title = entry.title;
                totalChapters += chapters.length;
                mangaReadCounts.push({
                    title: title,
                    count: chapters.length
                });
            } else if (activeStatsType.value === 'all') {
                // If it's not in the library at all, it's a historical dangling entry, count it in 'all'
                totalChapters += chapters.length;
                if (title.includes(':')) {
                    title = title.substring(title.lastIndexOf(':') + 1);
                }
                mangaReadCounts.push({
                    title: title,
                    count: chapters.length
                });
            }
        }
    }
    
    mangaReadCounts.sort((a, b) => b.count - a.count);
    const topReadManga = mangaReadCounts.slice(0, 5);
    
    // 3. Ratings & Notes Stats
    let ratingsSum = 0;
    let ratedMangaCount = 0;
    const ratingDist = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalNotes = 0;
    
    const personalKeys = Object.keys(personal);
    for (var k = 0; k < personalKeys.length; k++) {
        const key = personalKeys[k];
        // We only want to count ratings/notes for entries in our filtered list
        const entry = entryByPersonalKey.get(key.toLowerCase());

        if (entry) {
            const pData = personal[key] || {};
            if (pData.rating && pData.rating > 0) {
                ratingsSum += pData.rating;
                ratedMangaCount++;
                const roundedRating = Math.round(pData.rating);
                if (ratingDist[roundedRating] !== undefined) {
                    ratingDist[roundedRating]++;
                }
            }
            if (pData.notes && pData.notes.trim() !== '') {
                totalNotes++;
            }
        }
    }
    
    const avgRating = ratedMangaCount > 0 ? (ratingsSum / ratedMangaCount) : 0;
    
    // 4. Source Platform Stats
    const sourceCounts = {};
    for (var m = 0; m < list.length; m++) {
        const entryObj = list[m];
        if (!entryObj) continue;
        let source = entryObj.source || 'Unknown';
        if (entryObj.sourceUrl) {
            try {
                const url = new URL(entryObj.sourceUrl);
                source = url.hostname.replace('www.', '');
            } catch (err) {
                // Keep source as is
            }
        }
        if (!sourceCounts[source]) {
            sourceCounts[source] = 0;
        }
        sourceCounts[source]++;
    }
    
    const sourcesList = Object.keys(sourceCounts).map(src => ({
        name: src,
        count: sourceCounts[src]
    })).sort((a, b) => b.count - a.count);
    
    // 5. Genre Stats from AniList
    const genreCounts = {};
    for (var n = 0; n < list.length; n++) {
        const entryObj = list[n];
        if (entryObj && entryObj.anilistData && Array.isArray(entryObj.anilistData.genres)) {
            entryObj.anilistData.genres.forEach(genre => {
                if (!genreCounts[genre]) {
                    genreCounts[genre] = 0;
                }
                genreCounts[genre]++;
            });
        }
    }
    
    const genresList = Object.keys(genreCounts).map(g => ({
        name: g,
        count: genreCounts[g]
    })).sort((a, b) => b.count - a.count);
    
    // 6. Recent Reading / Watching
    const recentReads = [];
    for (var p = 0; p < list.length; p++) {
        const entryObj = list[p];
        if (entryObj && entryObj.lastRead) {
            recentReads.push(entryObj);
        }
    }
    recentReads.sort((a, b) => b.lastRead - a.lastRead);
    const topRecentReads = recentReads.slice(0, 5);

    return {
        totalManga,
        completedCount,
        readingCount,
        planCount,
        onHoldCount,
        droppedCount,
        totalChapters,
        avgRating,
        ratedMangaCount,
        totalNotes,
        statusCounts,
        topReadManga,
        ratingDist,
        sourcesList,
        genresList,
        topRecentReads
    };
});

/**
 * Computes sorted list of statuses for status distribution display.
 */
const sortedStatuses = computed(() => {
    const counts = stats.value.statusCounts;
    const total = stats.value.totalManga || 1;
    const list = Object.keys(counts).map(key => ({
        name: key,
        count: counts[key],
        percent: (counts[key] / total) * 100
    }));
    
    // Sort so that statuses with manga appear first
    return list.sort((a, b) => b.count - a.count);
});
</script>

<style lang="scss">
#tab-stats {
    .stats-overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;
        margin-bottom: 28px;
        width: 100%;
    }

    .stat-widget {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
        }
    }

    .stat-widget-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .icon-svg {
            width: 24px;
            height: 24px;
            background-color: currentColor;
        }
    }

    .icon-bg-blue {
        background-color: rgba(67, 24, 255, 0.1);
        color: #4318FF;
    }

    .icon-bg-emerald {
        background-color: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .icon-bg-gold {
        background-color: rgba(255, 181, 71, 0.1);
        color: #FFB547;
    }

    .icon-bg-purple {
        background-color: rgba(168, 85, 247, 0.1);
        color: #a855f7;
    }

    .stat-widget-data {
        display: flex;
        flex-direction: column;
    }

    .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
    }

    .stat-label {
        font-size: 13px;
        color: var(--text-secondary);
        font-weight: 500;
        margin-top: 2px;
    }

    .stats-detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        width: 100%;

        @media (max-width: 1024px) {
            grid-template-columns: 1fr;
        }
    }

    .stats-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .stats-card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 12px;
        margin: 0;

        .card-header-icon {
            width: 20px;
            height: 20px;
            background-color: currentColor;
        }

        h3 {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }
    }

    .card-body {
        width: 100%;
    }

    /* Common Progress Bar */
    .progress-bar-container {
        background-color: rgba(0, 0, 0, 0.05);
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        width: 100%;

        .dark-mode &, .black-mode &, .neon-mode & {
            background-color: rgba(255, 255, 255, 0.08);
        }
    }

    .progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease;
    }

    /* Status List styling */
    .status-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .status-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
    }

    .status-count {
        font-size: 13px;
        color: var(--text-secondary);
    }

    /* Genre styling */
    .genres-container {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .genre-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .genre-header {
        display: flex;
        align-items: center;
        font-size: 14px;
    }

    .genre-rank {
        font-weight: 600;
        color: var(--accent-primary);
        width: 28px;
    }

    .genre-name {
        font-weight: 500;
        color: var(--text-primary);
        flex: 1;
    }

    .genre-count {
        color: var(--text-secondary);
        font-size: 13px;
    }

    /* Source styling */
    .source-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .source-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .source-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        width: 140px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .source-bar-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .source-count {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        min-width: 20px;
        text-align: right;
    }

    /* Ratings Histogram styling */
    .ratings-chart-container {
        display: flex;
        height: 180px;
        gap: 12px;
        margin-top: 10px;
    }

    .ratings-y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: var(--text-secondary);
        font-size: 11px;
        padding-bottom: 24px;
        font-weight: 500;
    }

    .ratings-chart {
        flex: 1;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 100%;
    }

    .rating-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: flex-end;
        gap: 6px;
    }

    .rating-column-bar-wrapper {
        width: 100%;
        height: calc(100% - 24px);
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    .rating-column-bar {
        width: min(80%, 28px);
        background: linear-gradient(180deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
        border-radius: 4px 4px 0 0;
        position: relative;
        cursor: pointer;
        min-height: 2px;
        transition: transform 0.2s ease, filter 0.2s ease;

        &:hover {
            transform: scaleY(1.05);
            filter: brightness(1.15);

            .rating-bar-tooltip {
                opacity: 1;
                transform: translate(-50%, -8px);
            }
        }
    }

    .rating-bar-tooltip {
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translate(-50%, 0);
        background: #0f172a;
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        z-index: 10;
    }

    .rating-column-label {
        font-size: 11px;
        color: var(--text-secondary);
        font-weight: 600;
        height: 18px;
    }

    .ratings-summary, .ratings-summary-empty {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-top: 16px;
        border-top: 1px solid var(--border-color);
        padding-top: 12px;
    }

    /* Most Read list */
    .top-read-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .top-read-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background-color: rgba(0, 0, 0, 0.02);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);

        .dark-mode &, .black-mode &, .neon-mode & {
            background-color: rgba(255, 255, 255, 0.02);
        }
    }

    .top-read-info {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
    }

    .top-read-rank {
        font-size: 14px;
        font-weight: 700;
        color: var(--accent-primary);
    }

    .top-read-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .top-read-badge {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        background-color: rgba(0, 0, 0, 0.05);
        padding: 4px 8px;
        border-radius: 20px;
        flex-shrink: 0;

        .dark-mode &, .black-mode &, .neon-mode & {
            background-color: rgba(255, 255, 255, 0.08);
            color: var(--text-secondary);
        }
    }

    /* Recent Activity List */
    .recent-reads-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .recent-read-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background-color: rgba(0, 0, 0, 0.02);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        gap: 16px;

        .dark-mode &, .black-mode &, .neon-mode & {
            background-color: rgba(255, 255, 255, 0.02);
        }
    }

    .recent-read-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
        flex: 1;
    }

    .recent-read-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .recent-read-chapter {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .recent-read-time {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
        white-space: nowrap;
        flex-shrink: 0;
    }

    /* Empty States */
    .empty-state-sub {
        color: var(--text-secondary);
        font-size: 13px;
        text-align: center;
        padding: 12px 0;
        line-height: 1.5;
    }

    .empty-state-main {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 60px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 16px;
        max-width: 600px;
        margin: 40px auto;

        .empty-icon {
            width: 64px;
            height: 64px;
            background-color: var(--accent-primary);
            opacity: 0.5;
        }

        h2 {
            font-size: 22px;
            font-weight: 700;
            color: var(--text-primary);
        }

        p {
            color: var(--text-secondary);
            font-size: 14px;
            max-width: 400px;
            line-height: 1.5;
        }
    }

    /* Segmented Toggle Control for Media Type Stats */
    .stats-segmented-control {
        display: flex;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 4px;
        gap: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

        .control-btn {
            background: transparent;
            border: none;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 6px;

            &:hover {
                color: var(--text-primary);
                background: rgba(0, 0, 0, 0.02);
            }

            &.active {
                color: var(--accent-primary);
                background: rgba(67, 24, 255, 0.08);
            }
        }
    }
}
</style>
