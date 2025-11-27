const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND = process.env.BACKEND_URL || null; // e.g. https://your-api.example.com

app.use(express.json());

// proxy /api/* to BACKEND if configured
if (BACKEND) {
  app.use('/api', async (req, res) => {
    const url = BACKEND.replace(/\/$/, '') + req.originalUrl; // includes /api/...
    const opts = {
      method: req.method,
      headers: Object.assign({}, req.headers, { host: new URL(BACKEND).host }),
    };
    if (['POST','PUT','PATCH'].includes(req.method)) opts.body = JSON.stringify(req.body);
    try {
      const r = await fetch(url, opts);
      const text = await r.text();
      res.status(r.status).set(Object.fromEntries(r.headers.entries())).send(text);
    } catch (e) {
      res.status(502).json({ error: 'Bad gateway', details: String(e) });
    }
  });
}

// serve static files (index.html, afif.html, etc.)
app.use(express.static(path.resolve(__dirname)));

app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Server running on :${PORT}, proxy BACKEND=${BACKEND || 'none'}`));
