import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import videoRoutes from './routes/videos.js';
import dataRoutes from './routes/data.js';

// Load environment variables
dotenv.config();

const app = express();

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
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB reconnected');
});

// Connect to database
connectDB();

// API Routes
app.use('/api/videos', videoRoutes);
app.use('/api', dataRoutes);

// Health check endpoint
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

// Root endpoint
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

// 404 handler
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

// For local development only
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Export for Vercel serverless
export default app;