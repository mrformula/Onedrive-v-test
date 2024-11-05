const express = require('express');
const connectDB = require('./config/database');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { google } = require('googleapis');
const DriveManager = require('./services/drive-manager');
const path = require('path');
const TorrentManager = require('./services/qbittorrent');
const Queue = require('./services/queue');

const app = express();

// Add at the top
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    console.error('Stack:', error.stack);
});

// Connect to MongoDB
connectDB()
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60 // 1 day
    })
}));

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize services with error handling
let qbt, driveManager, downloadQueue;
try {
    console.log('Initializing services...');
    driveManager = new DriveManager();
    console.log('DriveManager initialized');

    qbt = new TorrentManager();
    console.log('TorrentManager initialized');

    downloadQueue = new Queue(5, qbt, driveManager);
    console.log('Queue initialized');
} catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
}

// Add more detailed logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Auth routes
app.get('/auth/google', (req, res) => {
    const authUrl = driveManager.getAuthUrl();
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        console.log('Received auth code:', code);

        const userInfo = await driveManager.handleAuthCallback(code, req.session);
        console.log('Auth successful, user:', userInfo);

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Auth callback error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        res.status(500).send(`Authentication failed: ${error.message}`);
    }
});

// Auth check middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Protected route example
app.get('/api/drive/info', requireAuth, async (req, res) => {
    try {
        console.log('Drive info request received');
        console.log('User ID:', req.session.userId);
        console.log('Session:', req.session);

        if (!req.session.tokens) {
            console.log('No tokens found in session');
            return res.status(401).json({ error: 'No auth tokens found. Please login again.' });
        }

        console.log('Setting credentials...');
        driveManager.oauth2Client.setCredentials(req.session.tokens);

        console.log('Fetching drive info...');
        const info = await driveManager.getDriveInfo(req.session.userId);
        console.log('Drive info fetched:', info);

        res.json(info);
    } catch (error) {
        console.error('Drive info error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        // Check if token expired
        if (error.message.includes('invalid_grant') || error.message.includes('Invalid Credentials')) {
            console.log('Token expired, redirecting to login');
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }

        res.status(500).json({
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Auth check route
app.get('/api/auth/check', (req, res) => {
    res.json({
        authenticated: !!req.session.userId,
        user: req.session.userId ? {
            id: req.session.userId,
            email: req.session.userEmail
        } : null
    });
});

// Simple health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Add this after all other routes but before error handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Update error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Add torrent route
app.post('/api/torrent/add', requireAuth, async (req, res) => {
    try {
        const { magnetLink } = req.body;
        const userId = req.session.userId;

        if (!magnetLink) {
            return res.status(400).json({ error: 'Magnet link is required' });
        }

        // Add to queue
        await downloadQueue.add({
            userId,
            magnetLink,
            addedAt: new Date()
        });

        res.json({ message: 'Torrent added to queue' });
    } catch (error) {
        console.error('Add torrent error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get queue status
app.get('/api/queue/status', requireAuth, (req, res) => {
    const status = downloadQueue.getStatus(req.session.userId);
    res.json(status);
});

// Update server start
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Server start error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
});