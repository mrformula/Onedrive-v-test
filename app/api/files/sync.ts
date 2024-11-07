import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { FileInfo } from '@/models/FileInfo'
import { getOneDriveService } from '@/lib/onedrive'

export async function POST() {
    try {
        await dbConnect()
        const service = await getOneDriveService()
        const files = await service.listFiles('/')

        // Sync files with database
        for (const file of files) {
            await FileInfo.findOneAndUpdate(
                { fileId: file.id },
                {
                    fileId: file.id,
                    name: file.name,
                    path: file.path,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    parentId: file.parentId,
                    downloadUrl: file.downloadUrl,
                },
                { upsert: true, new: true }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error syncing files:', error)
        return NextResponse.json({ error: 'Failed to sync files' }, { status: 500 })
    }
} 