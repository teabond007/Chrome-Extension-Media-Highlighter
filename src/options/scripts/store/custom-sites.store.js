/**
 * @fileoverview Pinia store for managing user-defined custom site configurations.
 * Enables the extension to support any manga reading site via user-created selectors.
 * @module store/custom-sites.store
 */
import { defineStore } from 'pinia';
import { DATA } from '../../../config.js';

export const useCustomSitesStore = defineStore('customSites', {
    state: () => ({
        sites: [],
        isLoading: true,
        editingSite: null
    }),

    getters: {
        enabledSites: (state) => state.sites.filter(s => s && s.enabled === true),
        getSiteByHostname: (state) => (hostname) => state.sites.find(s => s && s.hostname === hostname) || null,
        getSiteById: (state) => (id) => state.sites.find(s => s && s.id === id) || null
    },

    actions: {
        async loadSites() {
            console.log("[CustomSitesStore] loading custom sites from storage");
            this.isLoading = true;
            try {
                const data = await chrome.storage.local.get([DATA.CUSTOM_SITES]);
                this.sites = data[DATA.CUSTOM_SITES] || [];
                console.log("[CustomSitesStore] loaded sites count: " + this.sites.length);
            } catch (err) {
                console.error("[CustomSitesStore] load sites error:", err);
            } finally {
                this.isLoading = false;
            }
        },

        async saveSites() {
            console.log("[CustomSitesStore] saving custom sites to storage");
            try {
                const serialized = JSON.parse(JSON.stringify(this.sites));
                await chrome.storage.local.set({ [DATA.CUSTOM_SITES]: serialized });
                console.log("[CustomSitesStore] sites saved successfully");
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });
            } catch (err) {
                console.error("[CustomSitesStore] save sites error:", err);
            }
        },

        async addSite(siteData) {
            console.log("[CustomSitesStore] adding new custom site");
            try {
                const newSite = {
                    id: crypto.randomUUID(),
                    hostname: siteData.hostname || '',
                    url: siteData.url || (`https://${siteData.hostname || ''}`),
                    name: siteData.name || 'Untitled Site',
                    type: siteData.type || 'manga',
                    selectors: Array.isArray(siteData.selectors) ? siteData.selectors.map(function(s, idx) {
                        return {
                            name: s.name || ('Card Variant ' + (idx + 1)),
                            card: s.card || '',
                            title: s.title || ''
                        };
                    }) : [{
                        name: siteData.selectors?.name || 'Default Card',
                        card: siteData.selectors?.card || '',
                        title: siteData.selectors?.title || ''
                    }],
                    readerSelectors: siteData.readerSelectors || {
                        readerDetect: '',
                        readerTitle: '',
                        readerChapter: ''
                    },
                    enabled: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                this.sites.push(newSite);
                await this.saveSites();
                console.log("[CustomSitesStore] added site: " + newSite.name);
                return newSite;
            } catch (err) {
                console.error("[CustomSitesStore] add site error:", err);
                return null;
            }
        },

        async updateSite(id, updates) {
            console.log("[CustomSitesStore] updating site:", id);
            try {
                const site = this.sites.find(s => s && s.id === id);
                if (!site) {
                    console.log("[CustomSitesStore] site not found for update");
                    return;
                }

                // Copy updates
                Object.keys(updates).forEach(key => {
                    if (key === 'selectors' && updates.selectors) {
                        if (Array.isArray(updates.selectors)) {
                            site.selectors = updates.selectors.map(function(s, idx) {
                                return {
                                    name: s.name || ('Card Variant ' + (idx + 1)),
                                    card: s.card || '',
                                    title: s.title || ''
                                };
                            });
                        } else {
                            site.selectors = [{
                                name: updates.selectors.name || 'Default Card',
                                card: updates.selectors.card || '',
                                title: updates.selectors.title || ''
                            }];
                        }
                    } else if (key === 'readerSelectors' && updates.readerSelectors) {
                        site.readerSelectors = {
                            readerDetect: updates.readerSelectors.readerDetect || '',
                            readerTitle: updates.readerSelectors.readerTitle || '',
                            readerChapter: updates.readerSelectors.readerChapter || ''
                        };
                    } else {
                        site[key] = updates[key];
                    }
                });

                site.updatedAt = Date.now();
                await this.saveSites();
                console.log("[CustomSitesStore] updated site successfully");
            } catch (err) {
                console.error("[CustomSitesStore] update site error:", err);
            }
        },

        async removeSite(id) {
            console.log("[CustomSitesStore] removing site:", id);
            try {
                this.sites = this.sites.filter(s => s && s.id !== id);
                await this.saveSites();
                console.log("[CustomSitesStore] site removed");
            } catch (err) {
                console.error("[CustomSitesStore] remove site error:", err);
            }
        },

        async toggleSite(id) {
            console.log("[CustomSitesStore] toggling site:", id);
            try {
                const site = this.sites.find(s => s && s.id === id);
                if (site) {
                    site.enabled = !site.enabled;
                    site.updatedAt = Date.now();
                    await this.saveSites();
                    console.log("[CustomSitesStore] site toggled to:", site.enabled);
                }
            } catch (err) {
                console.error("[CustomSitesStore] toggle site error:", err);
            }
        },

        setEditingSite(site) {
            console.log("[CustomSitesStore] setting editing site");
            this.editingSite = site ? JSON.parse(JSON.stringify(site)) : null;
        },

        exportSites() {
            console.log("[CustomSitesStore] exporting custom sites");
            return JSON.stringify(this.sites, null, 2);
        },

        async importSites(jsonString) {
            console.log("[CustomSitesStore] importing custom sites from json");
            try {
                const imported = JSON.parse(jsonString);
                if (!Array.isArray(imported)) {
                    console.log("[CustomSitesStore] invalid import format");
                    return 0;
                }

                let count = 0;
                imported.forEach(site => {
                    if (site && !this.sites.some(s => s && s.hostname === site.hostname)) {
                        site.id = crypto.randomUUID();
                        site.createdAt = Date.now();
                        site.updatedAt = Date.now();
                        this.sites.push(site);
                        count++;
                    } else {
                        console.log("[CustomSitesStore] site hostname already exists or invalid:", site?.hostname);
                    }
                });

                await this.saveSites();
                console.log("[CustomSitesStore] imported count:", count);
                return count;
            } catch (err) {
                console.error("[CustomSitesStore] import sites error:", err);
                throw err;
            }
        }
    }
});
