<template>
    <div class="stats-card">
        <div class="card-header">
            <span class="icon-svg icon-target card-header-icon" style="color: var(--accent-primary);"></span>
            <h3>{{ activeStatsType === 'anime' ? 'Most Watched Anime' : 'Most Read Manga' }}</h3>
        </div>
        <div class="card-body">
            <div v-if="topReadManga.length > 0" class="top-read-list">
                <div v-for="(manga, idx) in topReadManga" :key="manga.title" class="top-read-item">
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
</template>

<script setup>
/**
 * Renders the top read/watched list statistics card.
 */
defineProps({
    topReadManga: {
        type: Array,
        required: true
    },
    activeStatsType: {
        type: String,
        required: true
    }
});
</script>
