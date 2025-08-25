// /src/index.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const app  = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

let signalsRoutes, ordersRoutes, ledgerRoutes, dashboardRoutes;

try { signalsRoutes = require('./routes/signals');   console.log('Loaded: routes/signals'); }   catch (e) { console.warn('Failed signals:', e.message); }
try { ordersRoutes  = require('./routes/orders');    console.log('Loaded: routes/orders'); }    catch (e) { console.warn('Failed orders:', e.message); }
try { ledgerRoutes  = require('./routes/ledger');    console.log('Loaded: routes/ledger'); }    catch (e) { console.warn('Failed ledger:', e.message); }
try { dashboardRoutes = require('./routes/dashboard'); console.log('Loaded: routes/dashboard'); } catch (e) { console.warn('Failed dashboard:', e.message); }

if (signalsRoutes)   { app.use('/signals',   signalsRoutes);   console.log('Mounted: /signals'); }
if (ordersRoutes)    { app.use('/orders',    ordersRoutes);    console.log('Mounted: /orders'); }
if (ledgerRoutes)    { app.use('/ledger',    ledgerRoutes);    console.log('Mounted: /ledger'); }
if (dashboardRoutes) { app.use('/dashboard', dashboardRoutes); console.log('Mounted: /dashboard'); }

// TEMP: list mounted paths (for debugging)
app.get('/__debug/routes', (_req, res) => {
  const list = [];
  app._router.stack.forEach(layer => {
    if (layer?.handle?.stack) {
      const base = layer.regexp?.toString();
      layer.handle.stack.forEach(r => {
        if (r.route) list.push({ base: base || '', path: Object.keys(r.route.methods), route: r.route.path });
      });
    }
  });
  res.json({ mounted: list });
});

app.get('/healthz', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: 'server_error', detail: err.message });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));