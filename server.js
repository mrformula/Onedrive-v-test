const express = require('express');
const connectDB = require('./config/database');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { google } = require('googleapis');
const DriveManager = require('./services/drive-manager');

const app = express();

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

// Initialize Drive Manager
const driveManager = new DriveManager();

// Auth routes
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
        console.error('Auth error:', error);
        res.status(500).send('Authentication failed');
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
        const info = await driveManager.getDriveInfo(req.session.userId);
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Simple start
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});