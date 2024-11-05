const express = require('express');
const connectDB = require('./config/database');
const app = express();

// Connect to MongoDB
connectDB()
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Simple health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Test route for MongoDB
app.get('/api/test', async (req, res) => {
    try {
        res.json({ message: 'API is working' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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