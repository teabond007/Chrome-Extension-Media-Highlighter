<template>
    <div class="stats-card">
        <div class="card-header">
            <span class="icon-svg icon-globe card-header-icon" style="color: var(--accent-primary);"></span>
            <h3>{{ activeStatsType === 'anime' ? 'Watching Sources' : 'Reading Sources' }}</h3>
        </div>
        <div class="card-body">
            <div class="source-list">
                <div v-for="source in sourcesList" :key="source.name" class="source-item">
                    <span class="source-name">{{ source.name }}</span>
                    <div class="source-bar-wrapper">
                        <div class="progress-bar-container">
                            <div 
                                class="progress-bar-fill" 
                                :style="{ 
                                    width: (totalManga > 0 ? (source.count / totalManga * 100) : 0) + '%',
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
</template>

<script setup>
/**
 * Renders the custom site platform sources statistics card.
 */
defineProps({
    sourcesList: {
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
