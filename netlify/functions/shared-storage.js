// Shared storage utility for Netlify functions
// This uses a combination of in-memory storage and file-based persistence
// Note: In production, you'd want to use a proper database like FaunaDB, MongoDB, or similar

const fs = require('fs');
const path = require('path');

class SharedStorage {
    constructor() {
        // Initialize global storage if it doesn't exist
        if (!global.sharedStorage) {
            global.sharedStorage = { videos: [], lastUpdated: null };
        }

        // Try to load from file if available
        this.loadFromFile();
    }

    loadFromFile() {
        try {
            // Try multiple possible storage locations
            const possiblePaths = [
                '/tmp/videos-storage.json',
                './videos-storage.json',
                path.join(__dirname, 'videos-storage.json')
            ];

            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const parsed = JSON.parse(data);
                    if (parsed.videos && Array.isArray(parsed.videos)) {
                        global.sharedStorage = parsed;
                        console.log(`Loaded storage from: ${filePath}`);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading from file:', error);
        }
    }

    saveToFile() {
        try {
            // Try to save to /tmp first, then fallback to local directory
            const possiblePaths = [
                '/tmp/videos-storage.json',
                './videos-storage.json',
                path.join(__dirname, 'videos-storage.json')
            ];

            for (const filePath of possiblePaths) {
                try {
                    fs.writeFileSync(filePath, JSON.stringify(global.sharedStorage, null, 2));
                    console.log(`Saved storage to: ${filePath}`);
                    return;
                } catch (error) {
                    console.log(`Failed to save to ${filePath}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Error saving to file:', error);
        }
    }

    getVideos() {
        return global.sharedStorage.videos || [];
    }

    setVideos(videos) {
        global.sharedStorage.videos = videos || [];
        global.sharedStorage.lastUpdated = new Date().toISOString();
        this.saveToFile();
    }

    addVideo(video) {
        const videos = this.getVideos();
        // Remove existing video with same ID
        const filteredVideos = videos.filter(v => v.id !== video.id);
        filteredVideos.push(video);
        this.setVideos(filteredVideos);
        console.log(`Added video: ${video.id} - ${video.title}`);
        return video;
    }

    removeVideo(id) {
        const videos = this.getVideos();
        const initialLength = videos.length;
        const filteredVideos = videos.filter(v => v.id !== id);
        this.setVideos(filteredVideos);
        const removed = initialLength > filteredVideos.length;
        console.log(`Remove video ${id}: ${removed ? 'SUCCESS' : 'NOT FOUND'}`);
        return {
            removed: removed,
            id: id
        };
    }

    clearVideos() {
        this.setVideos([]);
        return true;
    }

    getVideoById(id) {
        const videos = this.getVideos();
        return videos.find(v => v.id === id);
    }

    // Debug method
    getDebugInfo() {
        return {
            videoCount: this.getVideos().length,
            lastUpdated: global.sharedStorage.lastUpdated,
            videos: this.getVideos().map(v => ({ id: v.id, title: v.title })),
            storageType: 'in-memory with file persistence'
        };
    }
}

module.exports = SharedStorage;
