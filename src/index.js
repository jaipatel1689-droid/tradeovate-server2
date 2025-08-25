// src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// ---- create app first
const app = express();
const PORT = Number(process.env.PORT || 8080);

// ---- middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ---- import routes AFTER app exists
const signalsRoutes   = require('./routes/signals');
const ordersRoutes    = require('./routes/orders');
const ledgerRoutes    = require('./routes/ledger');
const dashboardRoutes = require('./routes/dashboard');

// ---- tiny helper so missing files don’t crash
function mount(path, router, label) {
  try {
    app.use(path, router);
    console.log(`Mounted ${label} from ${path}`);
  } catch (err) {
    console.warn(`Skipping ${label}: ${err.message}`);
  }
}

// ---- health
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---- routes
mount('/signals',   signalsRoutes,   '/routes/signals');
mount('/orders',    ordersRoutes,    '/routes/orders');
mount('/ledger',    ledgerRoutes,    '/routes/ledger');
mount('/dashboard', dashboardRoutes, '/routes/dashboard');

// ---- 404
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// ---- error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'server_error', detail: err.message });
});

// ---- start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});