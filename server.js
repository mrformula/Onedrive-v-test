const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

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