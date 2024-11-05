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

// Detailed logging
const logRequest = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

app.use(logRequest);

// Health check route with detailed logging
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            web: 'running',
            qbittorrent: 'running'
        }
    });
});

// Error handling for uncaught exceptions with more details
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    console.error('Stack:', error.stack);
});

// Connect to MongoDB with error handling
connectDB().catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// Initialize services with error handling
let qbt, driveManager, downloadQueue;
try {
    qbt = new QBittorrent();
    driveManager = new DriveManager();
    downloadQueue = new Queue(5, qbt, driveManager);
    console.log('Services initialized successfully');
} catch (error) {
    console.error('Service initialization error:', error);
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Session configuration with error handling
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 14 * 24 * 60 * 60 * 1000
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Start server with retry logic
const startServer = async (retries = 5) => {
    const PORT = process.env.PORT || 3000;

    try {
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });

        server.on('error', (error) => {
            console.error('Server error:', error);
            if (retries > 0 && error.code === 'EADDRINUSE') {
                console.log(`Port ${PORT} in use, retrying... (${retries} attempts left)`);
                setTimeout(() => startServer(retries - 1), 5000);
            } else {
                console.error('Server failed to start');
                process.exit(1);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('Received SIGTERM. Performing graceful shutdown...');
            server.close(() => {
                console.log('Server closed. Exiting process.');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Server start error:', error);
        if (retries > 0) {
            console.log(`Retrying server start... (${retries} attempts left)`);
            setTimeout(() => startServer(retries - 1), 5000);
        } else {
            console.error('Server failed to start after retries');
            process.exit(1);
        }
    }
};

// Start the server
startServer();