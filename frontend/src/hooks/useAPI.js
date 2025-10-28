import { useState, useEffect, useCallback } from 'react';
import { parseYouTubeId, subjectFromTitle, dateFromTitle } from '../utils/youtubeUtils';

const API_BASE = '/api';

export function useAPI() {
    const [videos, setVideos] = useState([]);
    const [online, setOnline] = useState(false);
    const [loading, setLoading] = useState(false);

    // Health check
    const checkHealth = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/health`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error('Backend offline');
        }
    }, []);

    // Load videos from backend
    const loadVideos = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/videos`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setVideos(data);
            setOnline(true);
        } catch (error) {
            console.error('Failed to load videos:', error);
            setVideos([]);
            setOnline(false);
        }
    }, []);

    // Add single video
    const addVideo = useCallback(async (url) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/videos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error(error.message || 'Failed to add video');
        } finally {
            setLoading(false);
        }
    }, [loadVideos]);

    // Add multiple videos
    const addBulkVideos = useCallback(async (urls) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/videos/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error(error.message || 'Failed to add videos');
        } finally {
            setLoading(false);
        }
    }, [loadVideos]);

    // Remove video
    const removeVideo = useCallback(async (id) => {
        try {
            const response = await fetch(`${API_BASE}/videos/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error(`Failed to remove video: ${error.message}`);
        }
    }, [loadVideos]);

    // Clear all videos
    const clearVideos = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/videos`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error('Failed to clear videos');
        }
    }, [loadVideos]);

    // Import videos (replace all)
    const importVideos = useCallback(async (items) => {
        try {
            const response = await fetch(`${API_BASE}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error(error.message || 'Failed to import data');
        }
    }, [loadVideos]);

    // Merge videos
    const mergeVideos = useCallback(async (items) => {
        try {
            const response = await fetch(`${API_BASE}/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            await loadVideos(); // Refresh the list
            return result;
        } catch (error) {
            throw new Error(error.message || 'Failed to merge data');
        }
    }, [loadVideos]);

    // Export videos
    const exportVideos = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/export`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            throw new Error('Failed to export data');
        }
    }, []);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                await checkHealth();
                setOnline(true);
            } catch {
                setOnline(false);
            }
            await loadVideos();
        };

        init();
    }, [checkHealth, loadVideos]);

    return {
        videos,
        online,
        loading,
        addVideo,
        addBulkVideos,
        removeVideo,
        clearVideos,
        importVideos,
        mergeVideos,
        exportVideos,
        loadVideos
    };
}
