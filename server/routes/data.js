import express from 'express';
import Video from '../models/Video.js';

const router = express.Router();

// Export videos
router.get('/export', async (req, res) => {
    try {
        const videos = await Video.find().sort({ addedAt: -1 });
        console.log(`GET /api/export - Exporting ${videos.length} videos`);
        res.json(videos);
    } catch (error) {
        console.error('Error exporting videos:', error);
        res.status(500).json({ error: 'Failed to export videos' });
    }
});

// Import videos (replace all)
router.post('/import', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: "items must be an array" });
        }

        const validItems = items.filter(item =>
            item && typeof item.id === "string" && typeof item.url === "string"
        );

        // Clear existing videos and insert new ones
        await Video.deleteMany({});
        await Video.insertMany(validItems);

        console.log(`POST /api/import - Imported ${validItems.length} videos`);
        res.json({ ok: true, count: validItems.length });
    } catch (error) {
        console.error('Error importing videos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Merge videos (upsert)
router.post('/merge', async (req, res) => {
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

        console.log(`POST /api/merge - Merged ${upserted} videos`);
        res.json({ ok: true, upserted });
    } catch (error) {
        console.error('Error merging videos:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
