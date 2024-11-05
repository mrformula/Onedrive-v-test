const QBittorrent = require('qbittorrent-api');
const fs = require('fs');
const path = require('path');
const Download = require('../models/Download');

class TorrentManager {
    constructor() {
        this.client = new QBittorrent({
            host: 'localhost',
            port: 8080,
            username: process.env.QB_USERNAME || 'admin',
            password: process.env.QB_PASSWORD || 'adminadmin'
        });

        this.downloadPath = process.env.DOWNLOAD_PATH || '/downloads';
        this.noSeedTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.initQBittorrent();
    }

    async initQBittorrent() {
        try {
            await this.client.login();
            await this.client.setPreferences({
                max_concurrent_downloads: 1,
                max_ratio: 0,
                max_ratio_enabled: true,
                download_path: this.downloadPath
            });
        } catch (error) {
            console.error('qBittorrent initialization failed:', error);
        }
    }

    async addTorrent(magnetLink, userId) {
        try {
            const options = {
                savepath: path.join(this.downloadPath, userId),
                category: userId
            };

            const hash = await this.client.addMagnet(magnetLink, options);

            // Start monitoring seeders
            this.monitorSeeders(hash, userId);

            return hash;
        } catch (error) {
            throw new Error('Failed to add torrent: ' + error.message);
        }
    }

    async monitorSeeders(hash, userId) {
        let noSeedStartTime = null;

        const checkInterval = setInterval(async () => {
            try {
                const torrent = await this.client.getTorrent(hash);

                if (!torrent) {
                    clearInterval(checkInterval);
                    return;
                }

                // টরেন্ট স্ট্যাটাস আপডেট
                await Download.findOneAndUpdate(
                    { torrentHash: hash },
                    {
                        progress: torrent.progress * 100,
                        status: this.getStatus(torrent)
                    }
                );

                const numSeeders = torrent.num_seeds;

                if (numSeeders === 0 && torrent.progress < 1) {
                    if (!noSeedStartTime) {
                        noSeedStartTime = Date.now();
                    } else if (Date.now() - noSeedStartTime >= this.noSeedTimeout) {
                        console.log(`No seeders for ${this.noSeedTimeout / 1000} seconds. Stopping torrent: ${hash}`);

                        // টরেন্ট স্টপ করা
                        await this.client.pauseTorrent(hash);

                        // ডাটাবেস আপডেট
                        await Download.findOneAndUpdate(
                            { torrentHash: hash },
                            {
                                status: 'failed',
                                error: 'No seeders available for 5 minutes'
                            }
                        );

                        clearInterval(checkInterval);
                    }
                } else {
                    noSeedStartTime = null;
                }

                // টরেন্ট কমপ্লিট হলে
                if (torrent.progress === 1) {
                    clearInterval(checkInterval);
                }

            } catch (error) {
                console.error('Error monitoring seeders:', error);
            }
        }, 10000); // প্রতি 10 সেকেন্ডে চেক করবে

        // ক্লিনআপ
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 24 * 60 * 60 * 1000); // 24 ঘন্টা পর অটো ক্লিয়ার
    }

    getStatus(torrent) {
        if (torrent.progress === 1) return 'completed';
        if (torrent.state === 'pausedDL') return 'paused';
        if (torrent.state === 'downloading') return 'downloading';
        return 'queued';
    }

    async getTorrentProgress(hash) {
        try {
            const torrent = await this.client.getTorrent(hash);
            return {
                progress: torrent.progress * 100,
                downloadSpeed: torrent.dlspeed,
                state: torrent.state,
                size: torrent.size,
                numSeeders: torrent.num_seeds,
                numPeers: torrent.num_peers
            };
        } catch (error) {
            throw new Error('Failed to get torrent progress: ' + error.message);
        }
    }

    async removeTorrent(hash, removeFiles = true) {
        try {
            await this.client.deleteTorrent(hash, removeFiles);
            return true;
        } catch (error) {
            throw new Error('Failed to remove torrent: ' + error.message);
        }
    }
}

module.exports = TorrentManager; 