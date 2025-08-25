// /src/index.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

// ---- create app
const app  = express();
const PORT = Number(process.env.PORT) || 8080;

// ---- middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ---- routes (require AFTER app exists)
let signalsRoutes, ordersRoutes, ledgerRoutes, dashboardRoutes;

try {
  signalsRoutes   = require('./routes/signals');
  console.log('Loaded router: /routes/signals');
} catch (e) {
  console.warn('Failed to load /routes/signals:', e.message);
}

try {
  ordersRoutes    = require('./routes/orders');
  console.log('Loaded router: /routes/orders');
} catch (e) {
  console.warn('Failed to load /routes/orders:', e.message);
}

try {
  ledgerRoutes    = require('./routes/ledger');
  console.log('Loaded router: /routes/ledger');
} catch (e) {
  console.warn('Failed to load /routes/ledger:', e.message);
}

try {
  dashboardRoutes = require('./routes/dashboard');
  console.log('Loaded router: /routes/dashboard');
} catch (e) {
  console.warn('Failed to load /routes/dashboard:', e.message);
}

// ---- mount explicitly (no helper)
if (signalsRoutes)   { app.use('/signals',   signalsRoutes);   console.log('Mounted: /signals'); }
if (ordersRoutes)    { app.use('/orders',    ordersRoutes);    console.log('Mounted: /orders'); }
if (ledgerRoutes)    { app.use('/ledger',    ledgerRoutes);    console.log('Mounted: /ledger'); }
if (dashboardRoutes) { app.use('/dashboard', dashboardRoutes); console.log('Mounted: /dashboard'); }

// ---- health
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

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