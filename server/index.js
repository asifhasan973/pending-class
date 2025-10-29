import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import videoRoutes from './routes/videos.js';
import dataRoutes from './routes/data.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// API Routes
app.use('/api/videos', videoRoutes);
app.use('/api', dataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// Serve frontend for all non-API routes
// Serve frontend for all non-API routes
app.get('/*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../index.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});
