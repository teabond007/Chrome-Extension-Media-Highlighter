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
            <div class="stats-overview-grid">
                <div class="stat-widget">
                    <div class="stat-widget-icon icon-bg-blue">
                        <span class="icon-svg" :class="activeStatsType === 'anime' ? 'icon-video' : 'icon-library'"></span>
                    </div>
                    <div class="stat-widget-data">
                        <span class="stat-number">{{ stats.totalManga }}</span>
                        <span class="stat-label">{{ activeStatsType === 'anime' ? 'Total Anime' : (activeStatsType === 'manga' ? 'Total Manga' : 'Total Entries') }}</span>
                    </div>
                </div>
                <div class="stat-widget">
                    <div class="stat-widget-icon icon-bg-emerald">
                        <span class="icon-svg icon-book-open"></span>
                    </div>
                    <div class="stat-widget-data">
                        <span class="stat-number">{{ stats.totalChapters }}</span>
                        <span class="stat-label">{{ activeStatsType === 'anime' ? 'Episodes Watched' : 'Chapters Read' }}</span>
                    </div>
                </div>
                <div class="stat-widget">
                    <div class="stat-widget-icon icon-bg-gold">
                        <span class="icon-svg icon-sparkles"></span>
                    </div>
                    <div class="stat-widget-data">
                        <span class="stat-number">{{ stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—' }} / 10</span>
                        <span class="stat-label">Average Rating</span>
                    </div>
                </div>
                <div class="stat-widget">
                    <div class="stat-widget-icon icon-bg-purple">
                        <span class="icon-svg icon-list"></span>
                    </div>
                    <div class="stat-widget-data">
                        <span class="stat-number">{{ stats.totalNotes }}</span>
                        <span class="stat-label">Notes Written</span>
                    </div>
                </div>
            </div>

            <!-- Row 2: Detailed Charts & Splits -->
            <div class="stats-detail-grid">
                <!-- Left Column -->
                <div class="stats-column">
                    <!-- Status Distribution -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-check card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>Status Distribution</h3>
                        </div>
                        <div class="card-body">
                            <div class="status-list">
                                <div v-for="status in sortedStatuses" :key="status.name" class="status-item">
                                    <div class="status-info">
                                        <span class="status-name">{{ status.name }}</span>
                                        <span class="status-count">{{ status.count }} ({{ status.percent.toFixed(0) }}%)</span>
                                    </div>
                                    <div class="progress-bar-container">
                                        <div 
                                            class="progress-bar-fill" 
                                            :style="{ 
                                                width: status.percent + '%',
                                                backgroundColor: getStatusColor(status.name)
                                            }"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Genres -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-tag card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>Top Genres</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="stats.genresList.length > 0" class="genres-container">
                                <div v-for="(genre, idx) in stats.genresList.slice(0, 10)" :key="genre.name" class="genre-row">
                                    <div class="genre-header">
                                        <span class="genre-rank">#{{ idx + 1 }}</span>
                                        <span class="genre-name">{{ genre.name }}</span>
                                        <span class="genre-count">{{ genre.count }} {{ activeStatsType === 'anime' ? 'anime' : (activeStatsType === 'manga' ? 'manga' : 'entries') }}</span>
                                    </div>
                                    <div class="progress-bar-container">
                                        <div 
                                            class="progress-bar-fill" 
                                            :style="{ 
                                                width: (genre.count / stats.totalManga * 100) + '%',
                                                backgroundColor: 'var(--accent-primary)'
                                            }"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state-sub">
                                <p>No genre data available. Sync AniList metadata in your library to see genre insights.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Platform Sources -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-globe card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>{{ activeStatsType === 'anime' ? 'Watching Sources' : 'Reading Sources' }}</h3>
                        </div>
                        <div class="card-body">
                            <div class="source-list">
                                <div v-for="source in stats.sourcesList" :key="source.name" class="source-item">
                                    <span class="source-name">{{ source.name }}</span>
                                    <div class="source-bar-wrapper">
                                        <div class="progress-bar-container">
                                            <div 
                                                class="progress-bar-fill" 
                                                :style="{ 
                                                    width: (source.count / stats.totalManga * 100) + '%',
                                                    backgroundColor: 'var(--accent-secondary)'
                                                }"
                                            ></div>
                                        </div>
                                        <span class="source-count">{{ source.count }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="stats-column">
                    <!-- Ratings Profile -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-sparkles card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>Rating Profile</h3>
                        </div>
                        <div class="card-body">
                            <div class="ratings-chart-container">
                                <div class="ratings-y-axis">
                                    <span>Max</span>
                                    <span>0</span>
                                </div>
                                <div class="ratings-chart">
                                    <div v-for="score in [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]" :key="score" class="rating-column">
                                        <div class="rating-column-bar-wrapper">
                                            <div 
                                                class="rating-column-bar"
                                                :style="{ 
                                                    height: getRatingBarHeight(stats.ratingDist[score]) + '%',
                                                    opacity: stats.ratingDist[score] > 0 ? '1' : '0.15'
                                                }"
                                                :title="stats.ratingDist[score] + (activeStatsType === 'anime' ? ' anime' : (activeStatsType === 'manga' ? ' manga' : ' entries')) + ' rated ' + score"
                                            >
                                                <span class="rating-bar-tooltip" v-if="stats.ratingDist[score] > 0">
                                                    {{ stats.ratingDist[score] }}
                                                </span>
                                            </div>
                                        </div>
                                        <span class="rating-column-label">{{ score }}★</span>
                                    </div>
                                </div>
                            </div>
                            <div class="ratings-summary" v-if="stats.ratedMangaCount > 0">
                                <p>You have rated <strong>{{ stats.ratedMangaCount }}</strong> out of <strong>{{ stats.totalManga }}</strong> {{ activeStatsType === 'anime' ? 'anime' : (activeStatsType === 'manga' ? 'manga' : 'media') }} entries in your library.</p>
                            </div>
                            <div class="ratings-summary-empty" v-else>
                                <p>Give ratings to your saved {{ activeStatsType === 'anime' ? 'anime' : 'manga' }} to populate your rating histogram profile.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Most Read Manga -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-target card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>{{ activeStatsType === 'anime' ? 'Most Watched Anime' : 'Most Read Manga' }}</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="stats.topReadManga.length > 0" class="top-read-list">
                                <div v-for="(manga, idx) in stats.topReadManga" :key="manga.title" class="top-read-item">
                                    <div class="top-read-info">
                                        <span class="top-read-rank">{{ idx + 1 }}</span>
                                        <span class="top-read-title">{{ manga.title }}</span>
                                    </div>
                                    <div class="top-read-badge">
                                        {{ manga.count }} {{ activeStatsType === 'anime' ? 'episodes' : 'chapters' }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state-sub">
                                <p>No {{ activeStatsType === 'anime' ? 'episode' : 'chapter' }} history found. Start {{ activeStatsType === 'anime' ? 'watching episodes' : 'reading chapters' }} on custom sites to track counts.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="stats-card">
                        <div class="card-header">
                            <span class="icon-svg icon-book-open card-header-icon" style="color: var(--accent-primary);"></span>
                            <h3>{{ activeStatsType === 'anime' ? 'Recent Watching Activity' : 'Recent Reading Activity' }}</h3>
                        </div>
                        <div class="card-body">
                            <div v-if="stats.topRecentReads.length > 0" class="recent-reads-list">
                                <div v-for="manga in stats.topRecentReads" :key="manga.title" class="recent-read-item">
                                    <div class="recent-read-info">
                                        <span class="recent-read-title">{{ manga.title }}</span>
                                        <span class="recent-read-chapter" v-if="manga.lastReadChapter">{{ manga.type === 'anime' ? 'Watched Ep. ' : 'Read Ch. ' }}{{ manga.lastReadChapter }}</span>
                                    </div>
                                    <span class="recent-read-time">{{ formatRelativeTime(manga.lastRead) }}</span>
                                </div>
                            </div>
                            <div v-else class="empty-state-sub">
                                <p>No {{ activeStatsType === 'anime' ? 'watching' : 'reading' }} activity tracked yet.</p>
                            </div>
                        </div>
                    </div>
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

const settingsStore = useSettingsStore();
const libraryStore = useLibraryStore();

const activeStatsType = ref('all');

/**
 * Normalizes title strings for matching/slugification.
 * @param {string} title
 * @returns {string}
 */
const slugify = (title) => {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Formats a timestamp into a relative human-readable string.
 * @param {number} timestamp - The milliseconds timestamp
 * @returns {string}
 */
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Calculates the height of a rating distribution bar as a percentage.
 * @param {number} count - The count for a rating score
 * @returns {number}
 */
const getRatingBarHeight = (count) => {
    if (!count) return 0;
    
    // Find the max count across all ratings for scaling
    var max = 1;
    var dist = stats.value.ratingDist;
    for (var score in dist) {
        if (dist[score] > max) {
            max = dist[score];
        }
    }
    
    return (count / max) * 100;
};

/**
 * Map status titles to premium theme-synchronized colors.
 * @param {string} status - Manga status
 * @returns {string}
 */
const getStatusColor = (status) => {
    switch (status) {
        case 'Reading':
        case 'Watching': return '#4318FF'; // Theme primary accent
        case 'Completed': return '#10b981'; // Success emerald
        case 'Plan to Read':
        case 'Plan to Watch': return '#a855f7'; // Purple
        case 'On Hold':
        case 'On-Hold': return '#FFB547'; // Warning gold
        case 'Dropped': return '#EE5D50'; // Danger red
        default: return 'var(--accent-secondary)';
    }
};

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
    
    for (var i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e) continue;
        
        let status = e.status;
        if (!status) {
            status = e.type === 'anime' ? 'Plan to Watch' : 'Plan to Read';
        }
        
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
    
    const historyKeys = Object.keys(hist);
    for (var j = 0; j < historyKeys.length; j++) {
        const key = historyKeys[j];
        const chapters = hist[key] || [];
        if (Array.isArray(chapters)) {
            // Find corresponding title in library
            let title = key;
            const entry = list.find(e => {
                if (!e) return false;
                const matchSlug = e.slug === key || (e.slug && key.includes(e.slug));
                const matchTitle = e.title === key;
                return matchSlug || matchTitle;
            });
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
        const entry = list.find(e => {
            if (!e) return false;
            // Get ID or slug matching to match personal keys
            const keyLower = key.toLowerCase();
            const eTitleLower = e.title.toLowerCase();
            const eSlugLower = (e.slug || '').toLowerCase();
            const eMangaSlugLower = (e.mangaSlug || '').toLowerCase();
            return keyLower === eTitleLower || keyLower === eSlugLower || keyLower === eMangaSlugLower || (e.anilistData && String(e.anilistData.id) === key);
        });

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

<style scoped lang="scss">
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
            box-shadow: inset 0 0 0 1px rgba(67, 24, 255, 0.15);
        }
    }
}
</style>
