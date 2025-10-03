const SharedStorage = require('./shared-storage.js');

exports.handler = async function (event) {
    // Handle CORS preflight requests
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        const storage = new SharedStorage();
        const debugInfo = storage.getDebugInfo();
        const videos = storage.getVideos();

        // Look for the specific video ID that's failing
        const targetId = 'nO-__jXlf0I';
        const foundVideo = videos.find(v => v.id === targetId);

        console.log('Debug endpoint called');
        console.log('Storage debug info:', debugInfo);
        console.log('Looking for video ID:', targetId);
        console.log('Found video:', foundVideo);
        console.log('All video IDs:', videos.map(v => v.id));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                debug: debugInfo,
                videos: videos,
                targetVideo: foundVideo,
                targetId: targetId,
                allIds: videos.map(v => v.id)
            })
        };
    } catch (error) {
        console.error('Debug endpoint error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
