const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    fileName: String,
    fileSize: Number,
    magnetLink: String,
    torrentHash: String,
    status: {
        type: String,
        enum: ['queued', 'downloading', 'uploading', 'completed', 'failed'],
        default: 'queued'
    },
    progress: {
        type: Number,
        default: 0
    },
    directLink: String,
    error: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
});

module.exports = mongoose.model('Download', downloadSchema); 