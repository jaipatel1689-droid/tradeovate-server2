// src/index.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const signalsRoutes   = require('./routes/signals');
const ordersRoutes    = require('./routes/orders');
const ledgerRoutes    = require('./routes/ledger');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.get('/healthz', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/signals',   signalsRoutes);
app.use('/orders',    ordersRoutes);
app.use('/ledger',    ledgerRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('server error:', err);
  res.status(500).json({ error: 'server_error', detail: err.message });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));