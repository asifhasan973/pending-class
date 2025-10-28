import express from 'express';
import Video from '../models/Video.js';
import { processVideoUrl } from '../utils/youtubeUtils.js';

const router = express.Router();

// Get all videos
router.get('/', async (req, res) => {
    try {
        const videos = await Video.find().sort({ addedAt: -1 });
        console.log(`GET /api/videos - Returning ${videos.length} videos`);
        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// Add single video
router.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "url required" });
        }

        console.log(`POST /api/videos - Adding video from URL: ${url}`);
        const videoData = await processVideoUrl(url);

        // Remove existing video with same ID and add new one
        await Video.findOneAndDelete({ id: videoData.id });
        const video = new Video(videoData);
        await video.save();

        console.log(`Added video: ${videoData.id} - ${videoData.title}`);
        res.json(video);
    } catch (error) {
        console.error('Error adding video:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add multiple videos (bulk)
router.post('/bulk', async (req, res) => {
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
                // Remove existing video with same ID and add new one
                await Video.findOneAndDelete({ id: videoData.id });
                const video = new Video(videoData);
                await video.save();
                results.push(video);
                console.log(`Added bulk video: ${videoData.id} - ${videoData.title}`);
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

// Delete specific video
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`DELETE /api/videos/${id} - Attempting to delete video`);

        const result = await Video.findOneAndDelete({ id });
        const removed = !!result;

        if (removed) {
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
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Failed to delete video' });
    }
});

// Delete all videos
router.delete('/', async (req, res) => {
    try {
        console.log('DELETE /api/videos - Clearing all videos');
        await Video.deleteMany({});
        res.json({ ok: true });
    } catch (error) {
        console.error('Error clearing videos:', error);
        res.status(500).json({ error: 'Failed to clear videos' });
    }
});

export default router;
