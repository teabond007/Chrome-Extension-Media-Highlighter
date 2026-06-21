/**
 * @fileoverview Pinia store for local backup (export and import) with custom site permissions handling.
 * This handles saving your library to a file and loading it back safely.
 */

import { defineStore } from 'pinia';
import { gatherStorageData, applyStorageData } from '../modules/storage-io.js';
import { DATA } from '../../../config.js';

export const useBackupStore = defineStore('backup', {
    state: () => ({
        // Tracks if we are currently doing something (used to show spinner)
        syncStatus: 'idle', // 'idle', 'syncing', 'success', or 'error'

        // Shows a message to the user after an action
        lastSyncResult: null,

        // When was the last time we saved a file backup
        lastLocalBackup: null,

        // Flow management for imported custom sites requiring permissions
        needsPermissions: false,
        pendingImportData: null,
        pendingOrigins: [],
        pendingCustomSites: []
    }),

    actions: {
        /**
         * Loads saved info from browser storage when the page first opens.
         */
        async initialize() {
            console.log("[BackupStore] initializing backup store");
            try {
                const saved = await chrome.storage.local.get([DATA.LAST_BACKUP]);
                this.lastLocalBackup = saved[DATA.LAST_BACKUP] || null;
                console.log("[BackupStore] backup store loaded");
            } catch (err) {
                console.error("[BackupStore] load backup info error:", err);
            }
        },

        async exportLocalData() {
            console.log("[BackupStore] exporting local backup");
            this.syncStatus = 'syncing';

            try {
                console.log("[BackupStore] gathering all storage data");
                const data = await gatherStorageData();
                const jsonString = JSON.stringify(data, null, 2);

                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `mangabook_backup_${new Date().toISOString().slice(0, 10)}.json`;
                anchor.click();

                this.lastLocalBackup = Date.now();
                await chrome.storage.local.set({ [DATA.LAST_BACKUP]: this.lastLocalBackup });

                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Backup file saved successfully!' };
                console.log("[BackupStore] export successful");
            } catch (err) {
                this.syncStatus = 'error';
                console.error("[BackupStore] export error:", err);
                this.lastSyncResult = { type: 'error', message: 'Export failed: ' + err.message };
            }
        },

        async importLocalData(file) {
            console.log("[BackupStore] importing local backup file");
            this.syncStatus = 'syncing';
            this.lastSyncResult = null;
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        console.log("[BackupStore] parsing import file json");
                        const importedData = JSON.parse(event.target.result);
                        const customSites = importedData[DATA.CUSTOM_SITES];
                        const origins = [];

                        if (Array.isArray(customSites)) {
                            console.log("[BackupStore] checking custom site origins");
                            customSites.forEach(site => {
                                if (site?.hostname) {
                                    origins.push(`http://${site.hostname}/*`, `https://${site.hostname}/*`);
                                }
                            });
                        }

                        let needsAuth = false;
                        if (origins.length > 0) {
                            console.log("[BackupStore] checking origins permissions");
                            const alreadyHas = await chrome.permissions.contains({ origins });
                            if (!alreadyHas) {
                                needsAuth = true;
                            }
                        }
                        
                        if (needsAuth) {
                            console.log("[BackupStore] new permissions needed, showing dialog");
                            this.pendingImportData = importedData;
                            this.pendingOrigins = origins;
                            this.pendingCustomSites = customSites || [];
                            this.needsPermissions = true;
                            this.syncStatus = 'idle';
                        } else {
                            console.log("[BackupStore] no new permissions needed, doing complete import");
                            await this.completeImport(importedData);
                        }
                    } catch (err) {
                        this.syncStatus = 'error';
                        console.error("[BackupStore] parse error:", err);
                        this.lastSyncResult = { type: 'error', message: 'Import failed: ' + err.message };
                    }
                };

                console.log("[BackupStore] reading backup file text");
                reader.readAsText(file);
            } catch (err) {
                this.syncStatus = 'error';
                console.error("[BackupStore] read error:", err);
            }
        },

        async grantPermissionsAndImport() {
            console.log("[BackupStore] requesting origins permissions from user");
            if (!this.pendingImportData) {
                console.warn("[BackupStore] pending import data not found");
                return;
            }

            this.syncStatus = 'syncing';

            try {
                console.log("[BackupStore] prompting user for permissions");
                const granted = await chrome.permissions.request({
                    origins: [...this.pendingOrigins]
                });

                if (!granted) {
                    console.log('[BackupStore] permissions denied, doing import anyway');
                } else {
                    console.log('[BackupStore] permissions granted');
                }

                await this.completeImport(this.pendingImportData);
            } catch (err) {
                this.syncStatus = 'error';
                console.error("[BackupStore] permissions request error:", err);
                this.lastSyncResult = { type: 'error', message: 'Permission request failed: ' + err.message };
            }
        },

        async completeImport(data) {
            console.log("[BackupStore] completing backup import");
            try {
                await applyStorageData(data, true);
                chrome.runtime.sendMessage({ type: 'custom-sites-updated' });

                this.syncStatus = 'success';
                this.lastSyncResult = { type: 'success', message: 'Import successful! Reloading page...' };
                console.log("[BackupStore] import complete, reloading");

                this.needsPermissions = false;
                this.pendingImportData = null;
                this.pendingOrigins = [];
                this.pendingCustomSites = [];

                setTimeout(() => {
                    location.reload();
                }, 1500);
            } catch (err) {
                this.syncStatus = 'error';
                console.error("[BackupStore] import save error:", err);
                this.lastSyncResult = { type: 'error', message: 'Save failed: ' + err.message };
            }
        },

        cancelImport() {
            console.log("[BackupStore] cancelled import");
            this.needsPermissions = false;
            this.pendingImportData = null;
            this.pendingOrigins = [];
            this.pendingCustomSites = [];
            this.syncStatus = 'idle';
            this.lastSyncResult = null;
        }
    }
});
