const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const DriveManager = require('./services/drive-manager');
const TorrentManager = require('./services/qbittorrent');
const Queue = require('./services/queue');
const connectDB = require('./config/database');
const Download = require('./models/Download');
const app = express();

// Basic error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    console.error('Stack:', error.stack);
});

// Initialize DriveManager
const driveManager = new DriveManager();
const qbt = new TorrentManager();
const downloadQueue = new Queue(5, qbt, driveManager);

// Connect to MongoDB
connectDB();

// Session middleware with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Auth check endpoint
app.get('/api/auth/check', (req, res) => {
    console.log('Auth check session:', req.session);
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

// Google OAuth routes
app.get('/auth/google', (req, res) => {
    console.log('Starting Google OAuth flow');
    const authUrl = driveManager.getAuthUrl();
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        console.log('Google OAuth callback received');
        const code = req.query.code;
        const user = await driveManager.handleAuthCallback(code, req.session);
        req.session.user = user;
        console.log('User authenticated:', user);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/login?error=auth_failed');
    }
});

// Logout route
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Drive info endpoint
app.get('/api/drive/info', async (req, res) => {
    try {
        if (!req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        driveManager.oauth2Client.setCredentials(req.session.tokens);
        const driveInfo = await driveManager.getDriveInfo(req.session.userId);
        res.json(driveInfo);
    } catch (error) {
        console.error('Drive info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Downloads queue endpoint
app.get('/api/downloads/queue', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const status = downloadQueue.getStatus(req.session.userId);
        res.json(status);
    } catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download history endpoint
app.get('/api/downloads/history', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const downloads = await Download.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(downloads);
    } catch (error) {
        console.error('Download history error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add torrent routes
app.use('/api/torrent', require('./routes/torrent'));

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Basic error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Server start error:', error);
});