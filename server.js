const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// In-memory storage (in production, use a database)
let videos = [];

// Load videos from file on startup
const STORAGE_FILE = './videos-storage.json';

function loadVideos() {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            const data = fs.readFileSync(STORAGE_FILE, 'utf8');
            const parsed = JSON.parse(data);
            videos = parsed.videos || [];
            console.log(`Loaded ${videos.length} videos from storage`);
        }
    } catch (error) {
        console.error('Error loading videos:', error);
        videos = [];
    }
}

function saveVideos() {
    try {
        const data = {
            videos: videos,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
        console.log(`Saved ${videos.length} videos to storage`);
    } catch (error) {
        console.error('Error saving videos:', error);
    }
}

// YouTube ID extraction function
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

// Subject extraction from title
function subjectFromTitle(title) {
    const match = String(title).match(/\b([A-Za-z]{2,6}-?\d{2,4})\b/);
    return match ? match[1].toUpperCase() : "GENERAL";
}

// Date extraction from title
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

// Process video URL to get video data
async function processVideoUrl(url) {
    const id = youtubeIdFromUrl(url);
    if (!id) {
        throw new Error("Invalid YouTube link");
    }

    // Use oEmbed to get video data
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Get all videos
app.get('/api/videos', (req, res) => {
    console.log(`GET /api/videos - Returning ${videos.length} videos`);
    res.json(videos);
});

// Add single video
app.post('/api/videos', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "url required" });
        }

        console.log(`POST /api/videos - Adding video from URL: ${url}`);
        const videoData = await processVideoUrl(url);

        // Remove existing video with same ID
        videos = videos.filter(v => v.id !== videoData.id);
        videos.push(videoData);
        saveVideos();

        console.log(`Added video: ${videoData.id} - ${videoData.title}`);
        res.json(videoData);
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add multiple videos (bulk)
app.post('/api/videos/bulk', async (req, res) => {
    try {
        const { urls } = req.body;
        if (!Array.isArray(urls)) {
            return res.status(400).json({ error: "urls must be an array" });
        }

        console.log(`POST /api/videos/bulk - Adding ${urls.length} videos`);
        const results = [];
        const errors = [];

        for (const videoUrl of urls) {
            try {
                const videoData = await processVideoUrl(videoUrl);
                // Remove existing video with same ID
                videos = videos.filter(v => v.id !== videoData.id);
                videos.push(videoData);
                results.push(videoData);
                console.log(`Added bulk video: ${videoData.id} - ${videoData.title}`);
            } catch (error) {
                console.error(`Error adding bulk video ${videoUrl}:`, error);
                errors.push({ url: videoUrl, error: error.message });
            }
        }

        saveVideos();

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

// Delete specific video
app.delete('/api/videos/:id', (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/videos/${id} - Attempting to delete video`);

    const initialLength = videos.length;
    videos = videos.filter(v => v.id !== id);
    const removed = initialLength > videos.length;

    if (removed) {
        saveVideos();
        console.log(`Successfully deleted video: ${id}`);
    } else {
        console.log(`Video not found: ${id}`);
    }

    res.json({
        ok: true,
        removed: removed,
        id: id,
        message: removed ? 'Video removed successfully' : 'Video not found'
    });
});

// Delete all videos
app.delete('/api/videos', (req, res) => {
    console.log('DELETE /api/videos - Clearing all videos');
    videos = [];
    saveVideos();
    res.json({ ok: true });
});

// Export videos
app.get('/api/export', (req, res) => {
    console.log(`GET /api/export - Exporting ${videos.length} videos`);
    res.json(videos);
});

// Import videos (replace all)
app.post('/api/import', (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        const validItems = items.filter(item =>
            item && typeof item.id === "string" && typeof item.url === "string"
        );

        videos = validItems;
        saveVideos();

        console.log(`POST /api/import - Imported ${validItems.length} videos`);
        res.json({ ok: true, count: videos.length });
    } catch (error) {
        console.error('Error importing videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Merge videos (upsert)
app.post('/api/merge', (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        let upserted = 0;
        for (const item of items) {
            if (item && typeof item.id === "string" && typeof item.url === "string") {
                // Remove existing item with same ID
                videos = videos.filter(v => v.id !== item.id);
                // Add new item
                videos.push(item);
                upserted++;
            }
        }

        saveVideos();

        console.log(`POST /api/merge - Merged ${upserted} videos`);
        res.json({ ok: true, upserted });
    } catch (error) {
        console.error('Error merging videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    console.log('GET /api/debug - Debug information requested');
    res.json({
        videoCount: videos.length,
        lastUpdated: videos.length > 0 ? videos[0].addedAt : null,
        videos: videos.map(v => ({ id: v.id, title: v.title })),
        storageFile: STORAGE_FILE,
        fileExists: fs.existsSync(STORAGE_FILE)
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
loadVideos();
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Storage file: ${STORAGE_FILE}`);
    console.log(`📊 Loaded ${videos.length} videos`);
});
