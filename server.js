const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const QBittorrent = require('./services/qbittorrent');
const DriveManager = require('./services/drive-manager');
const Queue = require('./services/queue');

const app = express();

// Initialize services
const qbt = new QBittorrent();
const driveManager = new DriveManager();
const downloadQueue = new Queue(5); // Max 5 items in queue

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// Serve static files
app.use(express.static('public'));

// OAuth2 routes
app.get('/auth/google', (req, res) => {
    const authUrl = driveManager.getAuthUrl();
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        await driveManager.handleAuthCallback(code, req.session);
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).send('Authentication failed');
    }
});

// API Routes
app.post('/api/download', async (req, res) => {
    const { magnetLink, torrentFile } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Please login first');
    }

    try {
        // Check drive space
        const freeSpace = await driveManager.getFreeSpace(userId);
        if (freeSpace < 12 * 1024 * 1024 * 1024) { // 12GB
            return res.status(400).send('Not enough space in Google Drive');
        }

        // Add to queue
        const queuePosition = await downloadQueue.add({
            userId,
            magnetLink,
            torrentFile
        });

        res.json({ queuePosition });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/api/queue-status', (req, res) => {
    const userId = req.session.userId;
    const status = downloadQueue.getStatus(userId);
    res.json(status);
});

app.get('/api/drive-info', async (req, res) => {
    const userId = req.session.userId;
    try {
        const info = await driveManager.getDriveInfo(userId);
        res.json(info);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 