const SharedStorage = require('./shared-storage.js');

exports.handler = async function (event) {
    // Handle CORS preflight requests
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: ''
        };
    }

    if (event.httpMethod !== "DELETE") {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    // Debug logging
    console.log('DELETE request received:', {
        method: event.httpMethod,
        path: event.path,
        rawPath: event.rawPath,
        queryString: event.queryStringParameters,
        pathParameters: event.pathParameters
    });

    // Extract ID from the path - Netlify passes the full path
    const path = event.path || event.rawPath || '';

    // Simple and robust ID extraction
    let id = null;

    // Method 1: Extract from /api/videos/ID pattern (most reliable)
    if (path.includes('/api/videos/')) {
        const match = path.match(/\/api\/videos\/([^/?]+)/);
        if (match) {
            id = match[1];
        }
    }

    // Method 2: Extract from path parameters if available
    if (!id && event.pathParameters && event.pathParameters.id) {
        id = event.pathParameters.id;
    }

    // Method 3: Extract from splat parameter (Netlify redirects)
    if (!id && event.pathParameters && event.pathParameters.splat) {
        id = event.pathParameters.splat;
    }

    // Method 4: Extract from query parameters
    if (!id && event.queryStringParameters && event.queryStringParameters.id) {
        id = event.queryStringParameters.id;
    }

    // Method 5: Fallback - get last part of path
    if (!id) {
        const pathParts = path.split('/').filter(part => part && part !== 'videos-id' && part !== 'api');
        id = pathParts[pathParts.length - 1];
    }

    // Method 6: Direct path extraction as last resort
    if (!id) {
        const segments = path.split('/');
        const videosIndex = segments.indexOf('videos');
        if (videosIndex !== -1 && segments[videosIndex + 1]) {
            id = segments[videosIndex + 1];
        }
    }

    console.log('Extracted ID:', id);

    if (!id || id === 'videos-id' || id === '') {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: "Missing video ID",
                path: path,
                extractedId: id,
                debug: {
                    pathParts: path.split('/'),
                    pathParameters: event.pathParameters,
                    queryString: event.queryStringParameters
                }
            })
        };
    }

    // Use shared storage
    const storage = new SharedStorage();

    // Debug: Check what videos are available
    const debugInfo = storage.getDebugInfo();
    console.log('Available videos before deletion:', debugInfo);

    // Check if video exists before deletion
    const videoExists = storage.getVideoById(id);
    console.log('Video to delete exists:', !!videoExists, videoExists ? { id: videoExists.id, title: videoExists.title } : null);

    // Additional debug: Check if the specific ID exists in the videos array
    const allVideos = storage.getVideos();
    const matchingVideos = allVideos.filter(v => v.id === id);
    console.log('Matching videos found:', matchingVideos.length, matchingVideos);

    // Remove video with matching ID
    const result = storage.removeVideo(id);

    console.log('Delete operation result:', {
        id: id,
        removed: result.removed,
        videoExisted: !!videoExists,
        debugInfo: storage.getDebugInfo()
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
            ok: true,
            removed: result.removed,
            id: id,
            message: result.removed ? 'Video removed successfully' : 'Video not found'
        })
    };
}