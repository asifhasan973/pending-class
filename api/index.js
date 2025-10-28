import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

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
            console.log('❌ MONGODB_URI environment variable is not set');
            return;
        }

        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
    }
};

// Connect to database
connectDB();

// Simple Video Schema
const videoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    thumbnail: { type: String, default: '' },
    publishedAt: { type: String, default: null },
    url: { type: String, required: true },
    subject: { type: String, default: 'GENERAL' },
    addedAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);

// YouTube utilities
function youtubeIdFromUrl(url) {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "youtu.be") return urlObj.pathname.slice(1);
        if (urlObj.hostname.includes("youtube.com")) {
            if (urlObj.searchParams.get("v")) return urlObj.searchParams.get("v");
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            const shortsIndex = pathParts.findIndex(x => x === "shorts" || x === "embed");
            if (shortsIndex !== -1 && pathParts[shortsIndex + 1]) return pathParts[shortsIndex + 1];
        }
    } catch (error) {
        console.error('Error parsing YouTube URL:', error);
    }
    return null;
}

function subjectFromTitle(title) {
    const match = String(title).match(/\b([A-Za-z]{2,6}-?\d{2,4})\b/);
    return match ? match[1].toUpperCase() : "GENERAL";
}

function dateFromTitle(title) {
    const s = String(title).replace(/[._-]+/g, " ");
    const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
        january: 0, february: 1, march: 2, april: 3, maylong: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const monIdx = (m) => (m.toLowerCase() === "may" ? 4 : months[m.toLowerCase()]);
    const toISO = (y, m, d) => {
        const year = Number(y);
        const yr = y.length === 2 ? (year < 50 ? 2000 + year : 1900 + year) : year;
        const dt = new Date(Date.UTC(yr, m, Number(d), 12));
        return isNaN(dt) ? null : dt.toISOString();
    };

    let m = s.match(/\b(\d{1,2})\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?,?\s*(\d{2,4})\b/i);
    if (m) { const d = m[1], mon = monIdx(m[2]), y = m[3]; if (mon !== undefined) return toISO(y, mon, d); }

    m = s.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(\d{2,4})\b/i);
    if (m) { const mon = monIdx(m[1]), d = m[2], y = m[3]; if (mon !== undefined) return toISO(y, mon, d); }

    m = s.match(/\b(20\d{2}|19\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})\b/);
    if (m) { const y = m[1], mo = Math.max(0, Math.min(11, Number(m[2]) - 1)), d = m[3]; return toISO(y, mo, d); }

    m = s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
    if (m) {
        const a = Number(m[1]), b = Number(m[2]), y = m[3];
        let d, mo;
        if (a > 12) { d = a; mo = b - 1; }
        else if (b > 12) { d = b; mo = a - 1; }
        else { d = a; mo = b - 1; }
        if (mo >= 0 && mo <= 11) return toISO(String(y), mo, String(d));
    }
    return null;
}

async function processVideoUrl(url) {
    const id = youtubeIdFromUrl(url);
    if (!id) {
        throw new Error("Invalid YouTube link");
    }

    const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!oembedResponse.ok) {
        throw new Error("Failed to fetch video data");
    }

    const oembedData = await oembedResponse.json();
    return {
        id,
        title: oembedData.title || "Untitled",
        thumbnail: oembedData.thumbnail_url || "",
        publishedAt: dateFromTitle(oembedData.title),
        url: `https://www.youtube.com/watch?v=${id}`,
        subject: subjectFromTitle(oembedData.title),
        addedAt: new Date().toISOString()
    };
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find().sort({ addedAt: -1 });
        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

app.post('/api/videos', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "url required" });
        }

        const videoData = await processVideoUrl(url);
        await Video.findOneAndDelete({ id: videoData.id });
        const video = new Video(videoData);
        await video.save();

        res.json(video);
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/videos/bulk', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!Array.isArray(urls)) {
            return res.status(400).json({ error: "urls must be an array" });
        }

        const results = [];
        const errors = [];

        for (const videoUrl of urls) {
            try {
                const videoData = await processVideoUrl(videoUrl);
                await Video.findOneAndDelete({ id: videoData.id });
                const video = new Video(videoData);
                await video.save();
                results.push(video);
            } catch (error) {
                console.error(`Error adding bulk video ${videoUrl}:`, error);
                errors.push({ url: videoUrl, error: error.message });
            }
        }

        res.json({
            success: true,
            added: results.length,
            errors: errors.length,
            results: results,
            errorDetails: errors
        });
    } catch (error) {
        console.error('Error in bulk add:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Video.findOneAndDelete({ id });
        const removed = !!result;

        res.json({
            ok: true,
            removed: removed,
            id: id,
            message: removed ? 'Video removed successfully' : 'Video not found'
        });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

app.delete('/api/videos', async (req, res) => {
    try {
        await Video.deleteMany({});
        res.json({ ok: true });
    } catch (error) {
        console.error('Error clearing videos:', error);
        res.status(500).json({ error: 'Failed to clear videos' });
    }
});

app.get('/api/export', async (req, res) => {
    try {
        const videos = await Video.find().sort({ addedAt: -1 });
        res.json(videos);
    } catch (error) {
        console.error('Error exporting videos:', error);
        res.status(500).json({ error: 'Failed to export videos' });
    }
});

app.post('/api/import', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        const validItems = items.filter(item =>
            item && typeof item.id === "string" && typeof item.url === "string"
        );

        await Video.deleteMany({});
        await Video.insertMany(validItems);

        res.json({ ok: true, count: validItems.length });
    } catch (error) {
        console.error('Error importing videos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/merge', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        let upserted = 0;
        for (const item of items) {
            if (item && typeof item.id === "string" && typeof item.url === "string") {
                await Video.findOneAndUpdate(
                    { id: item.id },
                    item,
                    { upsert: true, new: true }
                );
                upserted++;
            }
        }

        res.json({ ok: true, upserted });
    } catch (error) {
        console.error('Error merging videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files
app.use(express.static(__dirname));

// Serve frontend for all non-API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
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

export default app;
