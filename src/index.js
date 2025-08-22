// src/index.js
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// --- middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- mount optional routes if present (so missing files won't crash)
function mountOptional(path, mount) {
  try {
    const r = require(path);
    app.use(mount, r);
    console.log(`Mounted ${mount} from ${path}`);
  } catch (e) {
    console.warn(`Skipping ${path}: ${e.code || e.message}`);
  }
}

mountOptional('./routes/dev', '/dev');
mountOptional('./routes/dashboard', '/dashboard');
mountOptional('./routes/ledger', '/ledger');
mountOptional('./routes/orders', '/orders');
mountOptional('./routes/executions', '/executions');
mountOptional('./routes/tokens', '/tokens');
mountOptional('./routes/settings', '/settings');

// --- signals (required in this task)
app.use('/signals', require('./routes/signals'));

// --- health
app.get('/healthz', (_req, res) =>
  res.json({ ok: true, t: new Date().toISOString() })
);

// --- start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.FEATURE_USE_MOCK) {
    console.log('Mock features enabled (FEATURE_USE_MOCK=1)');
  }
});

module.exports = app;

