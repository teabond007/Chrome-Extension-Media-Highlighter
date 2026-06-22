<template>
    <div class="stats-overview-grid">
        <div class="stat-widget">
            <div class="stat-widget-icon icon-bg-blue">
                <span class="icon-svg" :class="activeStatsType === 'anime' ? 'icon-video' : 'icon-library'"></span>
            </div>
            <div class="stat-widget-data">
                <span class="stat-number">{{ totalManga }}</span>
                <span class="stat-label">{{ activeStatsType === 'anime' ? 'Total Anime' : (activeStatsType === 'manga' ? 'Total Manga' : 'Total Entries') }}</span>
            </div>
        </div>
        <div class="stat-widget">
            <div class="stat-widget-icon icon-bg-emerald">
                <span class="icon-svg icon-book-open"></span>
            </div>
            <div class="stat-widget-data">
                <span class="stat-number">{{ totalChapters }}</span>
                <span class="stat-label">{{ activeStatsType === 'anime' ? 'Episodes Watched' : 'Chapters Read' }}</span>
            </div>
        </div>
        <div class="stat-widget">
            <div class="stat-widget-icon icon-bg-gold">
                <span class="icon-svg icon-sparkles"></span>
            </div>
            <div class="stat-widget-data">
                <span class="stat-number">{{ avgRating > 0 ? avgRating.toFixed(1) : '—' }} / 10</span>
                <span class="stat-label">Average Rating</span>
            </div>
        </div>
        <div class="stat-widget">
            <div class="stat-widget-icon icon-bg-purple">
                <span class="icon-svg icon-list"></span>
            </div>
            <div class="stat-widget-data">
                <span class="stat-number">{{ totalNotes }}</span>
                <span class="stat-label">Notes Written</span>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * Renders the row of overview statistic widgets.
 */
defineProps({
    totalManga: {
        type: Number,
        required: true
    },
    totalChapters: {
        type: Number,
        required: true
    },
    avgRating: {
        type: Number,
        required: true
    },
    totalNotes: {
        type: Number,
        required: true
    },
    activeStatsType: {
        type: String,
        required: true
    }
});
</script>
