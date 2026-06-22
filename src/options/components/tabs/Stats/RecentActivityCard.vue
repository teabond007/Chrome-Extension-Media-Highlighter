<template>
    <div class="stats-card">
        <div class="card-header">
            <span class="icon-svg icon-book-open card-header-icon" style="color: var(--accent-primary);"></span>
            <h3>{{ activeStatsType === 'anime' ? 'Recent Watching Activity' : 'Recent Reading Activity' }}</h3>
        </div>
        <div class="card-body">
            <div v-if="topRecentReads.length > 0" class="recent-reads-list">
                <div v-for="manga in topRecentReads" :key="manga.title" class="recent-read-item">
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
</template>

<script setup>
/**
 * Renders the recent reading/watching activity statistics card.
 */
defineProps({
    topRecentReads: {
        type: Array,
        required: true
    },
    activeStatsType: {
        type: String,
        required: true
    }
});

/**
 * Formats a timestamp into a relative human-readable string.
 * @param {number} timestamp - The milliseconds timestamp
 * @returns {string} Relative time string (e.g. "5m ago", "Yesterday")
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
</script>
