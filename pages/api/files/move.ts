import { NextApiRequest, NextApiResponse } from 'next'
import { getOneDriveService } from '@/lib/onedrive'
import { getSession } from 'next-auth/react'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        const session = await getSession({ req })
        if (!session) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { itemId, newParentId } = req.body
        const service = await getOneDriveService()
        const result = await service.moveItem(itemId, newParentId)

        res.status(200).json(result)
    } catch (error) {
        console.error('Error moving file:', error)
        res.status(500).json({ message: 'Error moving file' })
    }
} 