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
app.use(cors({
    origin: process.env.FRONTEND_URL || [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://your-frontend-domain.netlify.app',
        'https://your-frontend-domain.vercel.app'
    ],
    credentials: true
}));
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
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint - API info
app.get('/', (req, res) => {
    res.json({
        message: 'Pending Classes API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            videos: '/api/videos',
            data: '/api'
        }
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: ['/api/health', '/api/videos', '/api']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
});
