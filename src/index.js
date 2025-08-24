// src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// import routes BEFORE using them, but AFTER we create the app instance
const signalsRoutes = require('./routes/signals');

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// ---------- middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ---------- health check
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---------- routes
app.use('/signals', signalsRoutes);

// ---------- 404
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// ---------- error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('server error:', err);
  res.status(500).json({ error: 'server_error', detail: err.message });
});

// ---------- start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
