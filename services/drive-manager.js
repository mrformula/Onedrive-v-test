const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class DriveManager {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        this.drive = google.drive({ version: 'v3' });
        this.mountPath = process.env.MOUNT_PATH || '/mnt/gdrive';
    }

    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata'
            ],
            prompt: 'consent'
        });
    }

    async handleAuthCallback(code, session) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            session.tokens = tokens;

            // Get user info
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            session.userId = userInfo.data.id;
            session.userEmail = userInfo.data.email;

            // Mount drive after authentication
            await this.mountDrive(session.userId, tokens);

            return userInfo.data;
        } catch (error) {
            console.error('Auth callback error:', error);
            throw error;
        }
    }

    async mountDrive(userId, tokens) {
        try {
            const userMountPath = path.join(this.mountPath, userId);

            // Create mount directory if it doesn't exist
            if (!fs.existsSync(userMountPath)) {
                fs.mkdirSync(userMountPath, { recursive: true });
            }

            // Use rclone to mount Google Drive
            const rclone = require('child_process').spawn('rclone', [
                'mount',
                `gdrive-${userId}:`,
                userMountPath,
                '--daemon',
                '--vfs-cache-mode', 'full',
                '--allow-other',
                '--buffer-size', '256M'
            ]);

            rclone.stdout.on('data', (data) => {
                console.log(`rclone stdout: ${data}`);
            });

            rclone.stderr.on('data', (data) => {
                console.error(`rclone stderr: ${data}`);
            });

            // Save mount info to database
            await this.saveMountInfo(userId, userMountPath);

            return userMountPath;
        } catch (error) {
            console.error('Mount error:', error);
            throw error;
        }
    }

    async unmountDrive(userId) {
        const userMountPath = path.join(this.mountPath, userId);
        try {
            // Unmount using fusermount
            require('child_process').execSync(`fusermount -u ${userMountPath}`);

            // Remove mount point
            if (fs.existsSync(userMountPath)) {
                fs.rmdirSync(userMountPath);
            }

            // Update database
            await this.removeMountInfo(userId);
        } catch (error) {
            console.error('Unmount error:', error);
            throw error;
        }
    }

    async getDriveInfo(userId) {
        try {
            const about = await this.drive.about.get({
                auth: this.oauth2Client,
                fields: 'storageQuota,user'
            });

            const { storageQuota, user } = about.data;

            // Get recent activity
            const recentFiles = await this.drive.files.list({
                auth: this.oauth2Client,
                pageSize: 10,
                fields: 'files(id,name,mimeType,size,modifiedTime)',
                orderBy: 'modifiedTime desc'
            });

            return {
                total: parseInt(storageQuota.limit),
                used: parseInt(storageQuota.usage),
                free: parseInt(storageQuota.limit) - parseInt(storageQuota.usage),
                email: user.emailAddress,
                recentFiles: recentFiles.data.files
            };
        } catch (error) {
            throw new Error('Failed to get Drive info: ' + error.message);
        }
    }

    async uploadFile(filePath, fileName, mimeType, folderId = null) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: folderId ? [folderId] : undefined
            };

            const media = {
                mimeType: mimeType,
                body: fs.createReadStream(filePath)
            };

            const file = await this.drive.files.create({
                auth: this.oauth2Client,
                resource: fileMetadata,
                media: media,
                fields: 'id, name, size, webViewLink',
                supportsAllDrives: true
            });

            // Generate shareable link
            await this.drive.permissions.create({
                auth: this.oauth2Client,
                fileId: file.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            return {
                ...file.data,
                directLink: await this.generateDirectLink(file.data.id)
            };
        } catch (error) {
            throw new Error('Upload failed: ' + error.message);
        }
    }

    async generateDirectLink(fileId) {
        // Use your existing direct link generation logic here
        // This should integrate with your Cloudflare worker
        const response = await fetch(`${process.env.CLOUDFLARE_WORKER_URL}/generate`, {
            method: 'POST',
            body: JSON.stringify({ fileId })
        });

        const data = await response.json();
        return data.directLink;
    }

    async createFolder(folderName, parentId = null) {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : undefined
            };

            const folder = await this.drive.files.create({
                auth: this.oauth2Client,
                resource: fileMetadata,
                fields: 'id, name'
            });

            return folder.data;
        } catch (error) {
            throw new Error('Failed to create folder: ' + error.message);
        }
    }

    async searchFiles(query, userId) {
        try {
            const response = await this.drive.files.list({
                auth: this.oauth2Client,
                q: query,
                pageSize: 20,
                fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            return response.data.files;
        } catch (error) {
            throw new Error('Search failed: ' + error.message);
        }
    }
}

module.exports = DriveManager; 