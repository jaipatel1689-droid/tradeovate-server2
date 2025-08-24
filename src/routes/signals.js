// src/routes/signals.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = v =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(String(v || '').trim());

// List latest signals (newest first)
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: 'server_error', detail: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// Create a signal
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      symbol,
      side,           // BUY | SELL (case-insensitive)
      qty,
      price,
      strategy   = null,
      confidence = null,
      notes      = null,
    } = req.body || {};

    if (!isUUID(user_id) || !symbol || !side || !qty || !price) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    const SIDE = String(side).toUpperCase();
    if (!['BUY', 'SELL'].includes(SIDE)) {
      return res.status(400).json({ error: 'bad_side', detail: 'must be BUY or SELL' });
    }

    const payload = {
      user_id, symbol,
      side: SIDE,
      qty, price,
      strategy, confidence, notes,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    };

    const { data, error } = await sb.from('signals').insert(payload).select().maybeSingle();
    if (error) return res.status(500).json({ error: 'insert_error', detail: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/**
 * Close a signal
 * PATCH /signals/:id/close
 * Accepts user_id in JSON *or* query string (?user_id=...)
 * Responds with the updated row (single JSON object)
 */
router.patch('/:id/close', async (req, res) => {
  try {
    const idParam  = String(req.params.id || '').trim();
    const fromBody = req.body?.user_id ? String(req.body.user_id).trim() : '';
    const fromQry  = req.query?.user_id ? String(req.query.user_id).trim() : '';
    const user_id  = fromBody || fromQry;

    if (!isUUID(idParam))  return res.status(400).json({ error: 'bad_uuid', detail: 'id' });
    if (!isUUID(user_id))  return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });

    // Only allow closing your own OPEN signal
    const updates = {
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
    };

    const { data, error } = await sb
      .from('signals')
      .update(updates)
      .eq('id', idParam)
      .eq('user_id', user_id)
      .eq('status', 'OPEN')
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: 'server_update_error', detail: error.message });
    if (!data)  return res.status(404).json({ error: 'not_found_or_not_owner', detail: 'No matching OPEN row for that id + user_id.' });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;