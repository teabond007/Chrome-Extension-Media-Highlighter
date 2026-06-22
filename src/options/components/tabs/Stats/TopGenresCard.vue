<template>
    <div class="stats-card">
        <div class="card-header">
            <span class="icon-svg icon-tag card-header-icon" style="color: var(--accent-primary);"></span>
            <h3>Top Genres</h3>
        </div>
        <div class="card-body">
            <div v-if="genresList.length > 0" class="genres-container">
                <div v-for="(genre, idx) in genresList.slice(0, 10)" :key="genre.name" class="genre-row">
                    <div class="genre-header">
                        <span class="genre-rank">#{{ idx + 1 }}</span>
                        <span class="genre-name">{{ genre.name }}</span>
                        <span class="genre-count">{{ genre.count }} {{ activeStatsType === 'anime' ? 'anime' : (activeStatsType === 'manga' ? 'manga' : 'entries') }}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div 
                            class="progress-bar-fill" 
                            :style="{ 
                                width: (totalManga > 0 ? (genre.count / totalManga * 100) : 0) + '%',
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
</template>

<script setup>
/**
 * Renders the top genres statistics card.
 */
defineProps({
    genresList: {
        type: Array,
        required: true
    },
    totalManga: {
        type: Number,
        required: true
    },
    activeStatsType: {
        type: String,
        required: true
    }
});
</script>
