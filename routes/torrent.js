const express = require('express');
const router = express.Router();
const parseTorrent = require('parse-torrent');
const fetch = require('node-fetch');

router.post('/info', async (req, res) => {
    try {
        const { magnetLink } = req.body;

        // ম্যাগনেট লিংক পার্স করা
        const parsed = await parseTorrent(magnetLink);

        // ফাইল সাইজ চেক
        if (parsed.length > 12 * 1024 * 1024 * 1024) { // 12GB
            return res.status(400).json({
                error: 'File size exceeds 12GB limit'
            });
        }

        res.json({
            name: parsed.name,
            size: parsed.length,
            files: parsed.files.map(file => ({
                name: file.name,
                size: file.length,
                type: getFileType(file.name)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        mp4: 'Video',
        mkv: 'Video',
        avi: 'Video',
        mp3: 'Audio',
        zip: 'Archive',
        rar: 'Archive',
        pdf: 'Document',
        // অন্যান্য টাইপ যোগ করুন
    };
    return types[ext] || 'Other';
}

module.exports = router; 