import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8082;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama-gpu.default.svc.cluster.local:11434';
const DEMO_MODE = String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Minimal LLM generate endpoint.
// Request: { prompt: string, context?: object }
// Response: { text: string }
app.post('/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (DEMO_MODE) {
      // Lightweight demo output so client can render something while LLM is offline
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Generated Document (Demo)</title>
      <style>body{font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding:16px; line-height:1.5} h1{margin:0 0 8px} .muted{color:#6b7280}</style>
      </head><body>
        <h1>Generated Document (Demo)</h1>
        <p class="muted">This is demo output from the gateway while the AI backend is offline.</p>
        <h3>Prompt</h3>
        <pre style="white-space:pre-wrap; background:#f9fafb; border:1px solid #eee; padding:12px; border-radius:8px;">${prompt.replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s] || s))}</pre>
        <h3>Content</h3>
        <p>Use Settings → Gateway URL when you switch to the real backend. Once Ollama is reachable, disable DEMO_MODE to get real AI output.</p>
      </body></html>`;
      return res.json({ text: html });
    }

    // Try Ollama first
    try {
      const rsp = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'llama3.1:8b-instruct-q4_K_M',
          prompt,
          stream: false,
          options: { temperature: 0.4 },
        }),
      });
      if (!rsp.ok) throw new Error(`ollama error ${rsp.status}`);
      const data = await rsp.json();
      // Ollama returns { response: string, ... }
      const text = data?.response ?? JSON.stringify(data);
      return res.json({ text });
    } catch (e) {
      console.error('[gateway] ollama unreachable or failed:', e);
      return res.status(502).json({ error: 'ollama_unreachable', detail: (e && e.message) || 'unreachable' });
    }
  } catch (e) {
    console.error('generate error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[gateway] listening on ${PORT}`);
});
