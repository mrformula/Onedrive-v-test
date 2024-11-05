const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/database');
const QBittorrent = require('./services/qbittorrent');
const DriveManager = require('./services/drive-manager');
const Queue = require('./services/queue');
const path = require('path');

const app = express();

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Connect to MongoDB
connectDB().catch(console.error);

// Initialize services
const qbt = new QBittorrent();
const driveManager = new DriveManager();
const downloadQueue = new Queue(5);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    }
}));

// Routes
app.use('/api/torrent', require('./routes/torrent'));

// OAuth2 routes
app.get('/auth/google', (req, res) => {
    const authUrl = driveManager.getAuthUrl();
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const userInfo = await driveManager.handleAuthCallback(code, req.session);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Auth callback error:', error);
        res.status(500).send('Authentication failed');
    }
});

// API Routes
app.post('/api/download', async (req, res) => {
    try {
        const { magnetLink, torrentFile } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).send('Please login first');
        }

        const freeSpace = await driveManager.getFreeSpace(userId);
        if (freeSpace < 12 * 1024 * 1024 * 1024) {
            return res.status(400).send('Not enough space in Google Drive');
        }

        const queuePosition = await downloadQueue.add({
            userId,
            magnetLink,
            torrentFile
        });

        res.json({ queuePosition });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/queue-status', (req, res) => {
    try {
        const userId = req.session.userId;
        const status = downloadQueue.getStatus(userId);
        res.json(status);
    } catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/drive-info', async (req, res) => {
    try {
        const userId = req.session.userId;
        const info = await driveManager.getDriveInfo(userId);
        res.json(info);
    } catch (error) {
        console.error('Drive info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1); // Force exit on server error
});

// Add graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
}); 