/**
 * /api/tts.js — Vercel Serverless Proxy for Google Translate TTS
 *
 * Called by the frontend as: /api/tts?q=TEXT&tl=LANG
 * Proxies to Google Translate TTS and streams the MP3 back.
 * No API key needed. Runs on your own Vercel domain → no CORS issues.
 */

export default async function handler(req, res) {
    const { q, tl = 'en' } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Missing query param: q' });
    }

    // Google Translate TTS endpoint (unofficial, no key required)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=${encodeURIComponent(tl)}&client=tw-ob`;

    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a real browser request
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
                'Accept': 'audio/mpeg, audio/*, */*',
            },
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Google TTS returned ${response.status}` });
        }

        const buffer = await response.arrayBuffer();

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(Buffer.from(buffer));

    } catch (err) {
        console.error('TTS proxy error:', err);
        res.status(500).json({ error: 'Proxy request failed', detail: err.message });
    }
}
