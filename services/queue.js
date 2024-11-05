class Queue {
    constructor(maxSize = 5) {
        this.maxSize = maxSize;
        this.queue = [];
        this.activeDownloads = new Map();
    }

    async add(downloadItem) {
        const userActiveDownloads = Array.from(this.activeDownloads.values())
            .filter(item => item.userId === downloadItem.userId).length;

        const userQueueItems = this.queue
            .filter(item => item.userId === downloadItem.userId).length;

        if (userActiveDownloads + userQueueItems >= 5) {
            throw new Error('Maximum queue limit reached for user');
        }

        this.queue.push({
            ...downloadItem,
            status: 'queued',
            progress: 0,
            addedAt: new Date()
        });

        this.processQueue();
        return this.queue.length;
    }

    async processQueue() {
        if (this.queue.length === 0 || this.activeDownloads.size >= this.maxSize) {
            return;
        }

        const nextItem = this.queue.shift();
        this.activeDownloads.set(nextItem.userId, nextItem);

        try {
            // Start download process
            await this.startDownload(nextItem);
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            this.activeDownloads.delete(nextItem.userId);
            this.processQueue();
        }
    }

    getStatus(userId) {
        const activeDownload = this.activeDownloads.get(userId);
        const queuedItems = this.queue.filter(item => item.userId === userId);

        return {
            activeDownload,
            queuedItems,
            position: queuedItems.length > 0 ?
                this.queue.indexOf(queuedItems[0]) + 1 : 0
        };
    }

    async startDownload(item) {
        try {
            // Start download process
            const hash = await this.qbt.addTorrent(item.magnetLink, item.userId);

            // Monitor progress
            this.qbt.onTorrentComplete(hash, async (torrent) => {
                // Upload file to Google Drive
                const uploadedFile = await this.driveManager.uploadFile(
                    torrent.savePath,
                    torrent.name,
                    'application/octet-stream'
                );

                // Remove torrent file
                await this.qbt.removeTorrent(hash, true);

                // Generate direct link
                const directLink = await this.generateDirectLink(uploadedFile.id);

                // Update status
                item.status = 'completed';
                item.directLink = directLink;
            });

        } catch (error) {
            item.status = 'failed';
            item.error = error.message;
            throw error;
        }
    }

    // Additional methods will be implemented
}

module.exports = Queue; 