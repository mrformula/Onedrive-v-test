const qbt = require('qbittorrent-api');
const fs = require('fs');
const path = require('path');
const Download = require('../models/Download');

class TorrentManager {
    constructor() {
        this.client = new qbt({
            host: 'localhost',
            port: 8080,
            username: process.env.QB_USERNAME || 'admin',
            password: process.env.QB_PASSWORD || 'adminadmin'
        });

        this.downloadPath = '/downloads';
        this.initQBittorrent();
    }

    async initQBittorrent() {
        try {
            console.log('Initializing qBittorrent...');
            await this.client.login();
            console.log('qBittorrent login successful');

            await this.client.setPreferences({
                max_concurrent_downloads: 1,
                max_ratio: 0,
                max_ratio_enabled: true,
                download_path: this.downloadPath
            });
            console.log('qBittorrent preferences set');
        } catch (error) {
            console.error('qBittorrent initialization failed:', error);
            throw error;
        }
    }

    async addTorrent(magnetLink, userId) {
        try {
            console.log(`Adding torrent for user ${userId}`);
            const userPath = path.join(this.downloadPath, userId);

            // Create user directory if it doesn't exist
            if (!fs.existsSync(userPath)) {
                fs.mkdirSync(userPath, { recursive: true });
            }

            const options = {
                savepath: userPath,
                category: userId
            };

            const hash = await this.client.addMagnet(magnetLink, options);
            console.log(`Torrent added with hash: ${hash}`);

            // Create download record
            await Download.create({
                userId,
                magnetLink,
                torrentHash: hash,
                status: 'downloading'
            });

            return hash;
        } catch (error) {
            console.error('Add torrent error:', error);
            throw new Error('Failed to add torrent: ' + error.message);
        }
    }

    async getTorrentProgress(hash) {
        try {
            const torrent = await this.client.getTorrent(hash);
            return {
                progress: torrent.progress * 100,
                downloadSpeed: torrent.dlspeed,
                fileName: torrent.name,
                fileSize: torrent.size,
                state: torrent.state,
                numSeeders: torrent.num_seeds,
                numPeers: torrent.num_peers
            };
        } catch (error) {
            console.error('Get progress error:', error);
            throw new Error('Failed to get torrent progress');
        }
    }

    async removeTorrent(hash, removeFiles = true) {
        try {
            console.log(`Removing torrent: ${hash}`);
            await this.client.deleteTorrent(hash, removeFiles);
            return true;
        } catch (error) {
            console.error('Remove torrent error:', error);
            throw new Error('Failed to remove torrent');
        }
    }

    onTorrentComplete(hash, callback) {
        const checkInterval = setInterval(async () => {
            try {
                const torrent = await this.getTorrentProgress(hash);
                if (torrent.progress === 100) {
                    clearInterval(checkInterval);
                    callback(torrent);
                }
            } catch (error) {
                console.error('Torrent complete check error:', error);
                clearInterval(checkInterval);
            }
        }, 5000);
    }
}

module.exports = TorrentManager; 