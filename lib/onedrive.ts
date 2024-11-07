import { Client } from '@microsoft/microsoft-graph-client'
import { getSession } from 'next-auth/react'
import 'isomorphic-fetch'

export class OneDriveService {
    private client: Client
    private totalSiteStats: { size: number; itemCount: number } = { size: 0, itemCount: 0 }
    private folderDetailsCache = new Map<string, { size: number; itemCount: number; timestamp: number }>();
    private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    constructor(accessToken: string) {
        this.client = Client.init({
            authProvider: (done) => {
                done(null, accessToken)
            },
        })
    }

    async listFiles(path: string = '/'): Promise<FileItem[]> {
        try {
            const publicPath = '/Public'
            const fullPath = path === '/' ? publicPath : `${publicPath}${path}`

            // Get files with minimal fields for faster response
            const filesResponse = await this.client
                .api(`/me/drive/root:${fullPath}:/children`)
                .select('id,name,size,folder,lastModifiedDateTime,@microsoft.graph.downloadUrl')
                .top(1000)
                .get();

            // Process items in parallel
            const items = await Promise.all(
                filesResponse.value.map(async (item: any): Promise<FileItem> => {
                    let size = item.size || 0;
                    let itemCount = 0;

                    if (item.folder) {
                        // Check cache first
                        const cached = this.folderDetailsCache.get(item.id);
                        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                            size = cached.size;
                            itemCount = cached.itemCount;
                        } else {
                            // Get folder details in background and cache
                            const details = await this.getFolderDetails(item.id);
                            size = details.size;
                            itemCount = details.itemCount;
                        }
                    }

                    return {
                        id: item.id,
                        name: item.name,
                        type: item.folder ? 'folder' : 'file',
                        size: size,
                        lastModified: item.lastModifiedDateTime,
                        downloadUrl: item['@microsoft.graph.downloadUrl'],
                        path: path,
                        parentId: item.parentReference?.id,
                        itemCount: itemCount
                    };
                })
            );

            return items;
        } catch (error) {
            console.error('Error in listFiles:', error)
            return [];
        }
    }

    async getFolderDetails(folderId: string): Promise<{ size: number; itemCount: number }> {
        // Check cache first
        const cached = this.folderDetailsCache.get(folderId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return { size: cached.size, itemCount: cached.itemCount };
        }

        try {
            // Get folder items with minimal fields
            const response = await this.client
                .api(`/me/drive/items/${folderId}/children`)
                .select('id,size,folder')
                .get();

            let totalSize = 0;
            let totalItems = 0;

            // Process all items in parallel
            await Promise.all(
                response.value.map(async (item: any) => {
                    if (item.folder) {
                        const subFolderDetails = await this.getFolderDetails(item.id);
                        totalSize += subFolderDetails.size;
                        totalItems += subFolderDetails.itemCount + 1;
                    } else {
                        totalSize += item.size || 0;
                        totalItems += 1;
                    }
                })
            );

            // Cache the result
            this.folderDetailsCache.set(folderId, {
                size: totalSize,
                itemCount: totalItems,
                timestamp: Date.now()
            });

            return { size: totalSize, itemCount: totalItems };
        } catch (error) {
            console.error('Error calculating folder details:', error);
            return { size: 0, itemCount: 0 };
        }
    }

    async createFolder(name: string, parentPath: string = '/'): Promise<any> {
        try {
            const publicPath = '/Public'
            const fullPath = parentPath === '/' ? publicPath : `${publicPath}${parentPath}`

            console.log('Creating folder at path:', fullPath)

            const folderConfig = {
                name,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename',
            }

            const response = await this.client
                .api(`/me/drive/root:${fullPath}:/children`)
                .post(folderConfig)

            console.log('Create folder response:', response)
            return response
        } catch (error) {
            console.error('Error creating folder:', error)
            throw error
        }
    }

    async deleteItem(itemId: string): Promise<void> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        try {
            console.log('Starting delete operation for item:', itemId)

            // Delete directly without checking
            await this.client
                .api(`/me/drive/items/${itemId}`)
                .delete()

            console.log('Item deleted successfully')
        } catch (error: any) {
            console.error('Delete operation failed:', error)

            if (error.statusCode === 404) {
                throw new Error('Item not found')
            } else if (error.statusCode === 403) {
                throw new Error('Permission denied')
            } else {
                throw new Error('Failed to delete item')
            }
        }
    }

    async moveItem(itemId: string, newPath: string): Promise<any> {
        try {
            const publicPath = '/Public'
            const fullPath = newPath === '/' ? publicPath : `${publicPath}${newPath}`

            console.log('Moving item to path:', fullPath)

            // First get the destination folder
            const destFolder = await this.client
                .api(`/me/drive/root:${fullPath}`)
                .get();

            console.log('Destination folder:', destFolder)

            if (!destFolder || !destFolder.id) {
                throw new Error('Destination folder not found')
            }

            // Then move the item
            const response = await this.client
                .api(`/me/drive/items/${itemId}`)
                .patch({
                    parentReference: {
                        id: destFolder.id,
                        driveId: destFolder.parentReference?.driveId || destFolder.id
                    }
                });

            console.log('Move response:', response)
            return response;
        } catch (error: any) {
            console.error('Move operation failed:', error)
            throw new Error('Failed to move item: ' + (error.message || 'Unknown error'))
        }
    }

    async renameItem(itemId: string, newName: string): Promise<any> {
        try {
            console.log('Starting rename operation for item:', itemId)

            const response = await this.client
                .api(`/me/drive/items/${itemId}`)
                .patch({
                    name: newName,
                });

            console.log('Rename operation successful:', response)
            return response;
        } catch (error: any) {
            console.error('Rename operation failed:', error)
            throw new Error('Failed to rename item')
        }
    }

    async uploadFile(
        file: File,
        path: string,
        onProgress?: (progress: number, speed: number) => void
    ): Promise<any> {
        try {
            const publicPath = '/Public'
            const fullPath = path === '/' ? publicPath : `${publicPath}${path}`

            console.log('Starting upload to path:', fullPath)

            const uploadSession = await this.client
                .api(`/me/drive/root:${fullPath}/${file.name}:/createUploadSession`)
                .post({
                    item: {
                        "@microsoft.graph.conflictBehavior": "rename",
                        name: file.name
                    }
                });

            console.log('Upload session created:', uploadSession)

            const maxSliceSize = 327680; // 320 KB chunks for more frequent updates
            const fileSize = file.size;
            let start = 0;
            let lastUpdate = Date.now();
            let uploadedBytes = 0;

            while (start < fileSize) {
                const end = Math.min(start + maxSliceSize, fileSize);
                const slice = file.slice(start, end);

                try {
                    const response = await fetch(uploadSession.uploadUrl, {
                        method: 'PUT',
                        headers: {
                            'Content-Length': `${end - start}`,
                            'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
                        },
                        body: slice,
                    });

                    if (!response.ok) {
                        throw new Error(`Upload chunk failed: ${response.statusText}`);
                    }

                    // Update progress and speed
                    uploadedBytes = end;
                    const currentTime = Date.now();
                    const elapsedSeconds = (currentTime - lastUpdate) / 1000;
                    const bytesPerSecond = (end - start) / elapsedSeconds;
                    const mbps = bytesPerSecond / (1024 * 1024);
                    const progress = Math.round((end / fileSize) * 100);

                    onProgress?.(progress, mbps);
                    lastUpdate = currentTime;

                    start = end;
                } catch (error) {
                    console.error('Chunk upload error:', error);
                    throw new Error('Upload failed');
                }
            }

            console.log('File upload completed successfully');
            return true;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    async getDownloadUrl(itemId: string): Promise<string> {
        try {
            // Get file details including download URL
            const response = await this.client
                .api(`/me/drive/items/${itemId}`)
                .get();

            console.log('File details response:', response);

            if (!response || !response['@microsoft.graph.downloadUrl']) {
                throw new Error('Download URL not found in response');
            }

            const directUrl = response['@microsoft.graph.downloadUrl'];
            const fileName = response.name;
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

            // Log the values
            console.log('Direct URL:', directUrl);
            console.log('File name:', fileName);

            // Create Cloudflare Worker URL with filename
            const workerUrl = `https://tgdown.k-drama.workers.dev/download/${encodeURIComponent(fileName)}?url=${encodeURIComponent(directUrl)}&type=${fileExtension}`;

            // Log the final URL
            console.log('Worker URL:', workerUrl);

            // Verify URL is valid
            try {
                new URL(workerUrl);
            } catch (e) {
                throw new Error('Generated URL is invalid');
            }

            return workerUrl;
        } catch (error) {
            console.error('Error in getDownloadUrl:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to get download URL: ${error.message}`);
            } else {
                throw new Error('Failed to get download URL: Unknown error');
            }
        }
    }

    getTotalStats(): { size: number; itemCount: number } {
        return this.totalSiteStats;
    }

    async getPublicFolderStats(): Promise<{ size: number; itemCount: number }> {
        try {
            // Get Public folder
            const publicFolder = await this.client
                .api('/me/drive/root:/Public')
                .get();

            let totalSize = 0;
            let totalItems = 0;

            // Get all items recursively
            const processFolder = async (folderId: string) => {
                const items = await this.client
                    .api(`/me/drive/items/${folderId}/children`)
                    .get();

                for (const item of items.value) {
                    if (item.folder) {
                        await processFolder(item.id);
                    } else {
                        totalSize += item.size || 0;
                        totalItems += 1;
                    }
                }
            };

            await processFolder(publicFolder.id);
            return { size: totalSize, itemCount: totalItems };
        } catch (error) {
            console.error('Error getting Public folder stats:', error)
            return { size: 0, itemCount: 0 };
        }
    }
}

export async function getOneDriveService(): Promise<OneDriveService> {
    const session = await getSession()
    if (!session?.accessToken) {
        throw new Error('No access token found')
    }
    return new OneDriveService(session.accessToken)
} 