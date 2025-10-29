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
    origin: '*',
    credentials: true
}));
app.use(express.json());

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error(`❌ MongoDB connection error (${retries} retries left):`, error.message);
        
        if (retries > 0) {
            console.log('⏳ Retrying in 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB(retries - 1);
        }
        
        console.error('❌ Failed to connect to MongoDB after multiple attempts');
        // Don't exit, let the server run without DB (return errors for DB operations)
    }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB reconnected');
});

// Connect to database
connectDB();

// API Routes
app.use('/api/videos', videoRoutes);
app.use('/api', dataRoutes);

// Health check endpoint (works even if DB is down)
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.status(dbStatus === 1 ? 200 : 503).json({
        ok: dbStatus === 1,
        timestamp: new Date().toISOString(),
        database: dbStatusText[dbStatus] || 'unknown',
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

// Start server (even if DB connection fails)
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    
    // Stop accepting new connections
    server.close(async () => {
        console.log('✅ Server closed');
        
        // Close database connection
        try {
            await mongoose.connection.close();
            console.log('✅ Database connection closed');
        } catch (err) {
            console.error('Error closing database:', err);
        }
        
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});