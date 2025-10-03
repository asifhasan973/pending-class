const SharedStorage = require('./shared-storage.js');

exports.handler = async function (event) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        const { items } = JSON.parse(event.body || "{}");

        if (!Array.isArray(items)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "items must be an array" })
            };
        }

        // Use shared storage
        const storage = new SharedStorage();

        // Merge items (upsert)
        let upserted = 0;
        for (const item of items) {
            if (item && typeof item.id === "string" && typeof item.url === "string") {
                storage.addVideo(item);
                upserted++;
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ ok: true, upserted })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
}