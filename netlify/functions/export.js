const SharedStorage = require('./shared-storage.js');

exports.handler = async function (event) {
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    // Use shared storage
    const storage = new SharedStorage();
    const videos = storage.getVideos();

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(videos)
    };
}