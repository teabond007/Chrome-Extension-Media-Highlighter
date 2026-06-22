<template>
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
</template>

<script setup>
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();

defineProps({
    sortedStatuses: {
        type: Array,
        required: true
    }
});

/**
 * Returns the color associated with a given status.
 * @param {string} status
 * @returns {string} Color hex or variable
 */
const getStatusColor = (status) => {
    if (!status) return 'var(--accent-secondary)';
    
    // Check custom statuses first
    const custom = (settingsStore.customStatuses || []).find(c => c.name.toLowerCase() === status.toLowerCase());
    if (custom) return custom.color;

    switch (status) {
        case 'Reading':
        case 'Watching': return '#10b981'; // Emerald Green
        case 'Completed': return '#3b82f6'; // Success Blue
        case 'Plan to Read':
        case 'Plan to Watch': return '#fbbf24'; // Amber Yellow
        case 'On Hold':
        case 'On-Hold': return '#f97316'; // Warning Orange
        case 'Dropped': return '#ef4444'; // Danger Red
        case 'Re-reading':
        case 'Re-watching': return '#a855f7'; // Purple
        default: return 'var(--accent-secondary)';
    }
};
</script>
