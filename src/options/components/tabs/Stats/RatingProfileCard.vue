<template>
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
                                    height: getRatingBarHeight(ratingDist[score]) + '%',
                                    opacity: ratingDist[score] > 0 ? '1' : '0.15'
                                }"
                                :title="ratingDist[score] + (activeStatsType === 'anime' ? ' anime' : (activeStatsType === 'manga' ? ' manga' : ' entries')) + ' rated ' + score"
                            >
                                <span class="rating-bar-tooltip" v-if="ratingDist[score] > 0">
                                    {{ ratingDist[score] }}
                                </span>
                            </div>
                        </div>
                        <span class="rating-column-label">{{ score }}★</span>
                    </div>
                </div>
            </div>
            <div class="ratings-summary" v-if="ratedMangaCount > 0">
                <p>You have rated <strong>{{ ratedMangaCount }}</strong> out of <strong>{{ totalManga }}</strong> {{ activeStatsType === 'anime' ? 'anime' : (activeStatsType === 'manga' ? 'manga' : 'media') }} entries in your library.</p>
            </div>
            <div class="ratings-summary-empty" v-else>
                <p>Give ratings to your saved {{ activeStatsType === 'anime' ? 'anime' : 'manga' }} to populate your rating histogram profile.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
/**
 * Renders the rating histogram chart card.
 */
const props = defineProps({
    ratingDist: {
        type: Object,
        required: true
    },
    ratedMangaCount: {
        type: Number,
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

/**
 * Calculates the height of a rating bar relative to the maximum score count.
 * @param {number} count
 * @returns {number} Percentage height (0-100)
 */
const getRatingBarHeight = (count) => {
    if (!count) return 0;
    
    // Find the max count across all ratings for scaling
    let max = 1;
    const dist = props.ratingDist;
    for (const score in dist) {
        if (dist[score] > max) {
            max = dist[score];
        }
    }
    
    return (count / max) * 100;
};
</script>
