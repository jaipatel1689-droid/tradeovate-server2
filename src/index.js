// src/index.js
require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');
const cors    = require('cors');
const signalsRoutes = require('./routes/signals');
app.use('/signals', signalsRoutes);


const app  = express();
const PORT = Number(process.env.PORT || 8080);

// ---------- middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ---------- health check
app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---------- helper to mount optional routes without crashing
function mountOptional(path, mountFn) {
  try {
    const router = require(mountFn);
    app.use(path, router);
    console.log(`Mounted ${path} from ${mountFn}`);
  } catch (err) {
    console.warn(`Skipping ${path}: ${mountFn} ${err.code || ''}`);
  }
}

// ---------- routes
mountOptional('/dev',         './routes/dev');
mountOptional('/dashboard',   './routes/dashboard');
mountOptional('/orders',      './routes/orders');
mountOptional('/executions',  './routes/executions');
// tokens is optional; your project may not have it:
mountOptional('/tokens',      './routes/tokens');
// ✅ required for this task:
mountOptional('/signals',     './routes/signals');

// ---------- start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Mock features enabled (FEATURE_USE_MOCK=${process.env.FEATURE_USE_MOCK || 0})`);
});

module.exports = app;


