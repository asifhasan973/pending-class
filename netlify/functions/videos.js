const SharedStorage = require('./shared-storage.js');

// Helper function to process a single video URL
async function processVideoUrl(url) {
    function youtubeIdFromUrl(u) {
        try {
            const url = new URL(u);
            if (url.hostname === "youtu.be") return url.pathname.slice(1);
            if (url.hostname.includes("youtube.com")) {
                if (url.searchParams.get("v")) return url.searchParams.get("v");
                const p = url.pathname.split("/").filter(Boolean);
                const i = p.findIndex(x => x === "shorts" || x === "embed");
                if (i !== -1 && p[i + 1]) return p[i + 1];
            }
        } catch { }
        return null;
    }

    function subjectFromTitle(t) {
        const s = String(t);
        const m = s.match(/\b([A-Za-z]{2,6}-?\d{2,4})\b/);
        return m ? m[1].toUpperCase() : "GENERAL";
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

exports.handler = async function (event) {
    // Debug logging
    console.log('Videos function called:', {
        method: event.httpMethod,
        path: event.path,
        body: event.body
    });

    // Use shared storage
    const storage = new SharedStorage();

    if (event.httpMethod === "GET") {
        // List videos
        const videos = storage.getVideos();
        const debugInfo = storage.getDebugInfo();
        console.log('GET /api/videos - Retrieved videos:', debugInfo);
        console.log('Video IDs in storage:', videos.map(v => v.id));
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            body: JSON.stringify(videos)
        };
    } else if (event.httpMethod === "POST") {
        // Add video or bulk upload
        try {
            const { url, urls } = JSON.parse(event.body || "{}");

            // Handle bulk upload
            if (urls && Array.isArray(urls)) {
                const results = [];
                const errors = [];

                for (const videoUrl of urls) {
                    try {
                        const videoData = await processVideoUrl(videoUrl);
                        // Add video using shared storage
                        console.log('Adding bulk video to storage:', { id: videoData.id, title: videoData.title });
                        storage.addVideo(videoData);
                        results.push(videoData);
                    } catch (error) {
                        console.error('Error adding bulk video:', error);
                        errors.push({ url: videoUrl, error: error.message });
                    }
                }

                console.log('Bulk upload completed. Storage debug info:', storage.getDebugInfo());

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: true,
                        added: results.length,
                        errors: errors.length,
                        results: results,
                        errorDetails: errors
                    })
                };
            }

            // Handle single video
            if (!url) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: "url or urls required" })
                };
            }

            const videoData = await processVideoUrl(url);

            // Add video using shared storage
            console.log('Adding video to storage:', { id: videoData.id, title: videoData.title });
            storage.addVideo(videoData);
            console.log('Video added successfully. Storage debug info:', storage.getDebugInfo());

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(videoData)
            };
        } catch (error) {
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: error.message || "Internal server error" })
            };
        }
    } else if (event.httpMethod === "DELETE") {
        // Clear all videos
        storage.clearVideos();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ ok: true })
        };
    }

    return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Method Not Allowed" })
    };
}