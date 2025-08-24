// src/routes/signals.js
const express = require('express');
const router = express.Router();
const sb = require('../lib/supabase');

const isUUID = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const sanitizeUUID = v => String(v || '').trim().toLowerCase();

// -------- GET /signals  (list latest)
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

// -------- POST /signals  (create)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      follower_id = null,
      symbol,
      side,
      qty,
      price,
      strategy = null,
      confidence = null,
      notes = null,
    } = req.body || {};

    // basic validation
    if (!user_id || !symbol || !side || !qty || !price) {
      return res.status(400).json({ error: 'bad_request', detail: 'Missing required fields.' });
    }

    const SIDE = String(side).toUpperCase();
    if (!['BUY', 'SELL'].includes(SIDE)) {
      return res.status(400).json({ error: 'bad_side', detail: "side must be 'BUY' or 'SELL' (uppercase)" });
    }

    const payload = {
      user_id: sanitizeUUID(user_id),
      follower_id: follower_id ? sanitizeUUID(follower_id) : null,
      symbol: String(symbol).toUpperCase(),
      side: SIDE,
      qty: Number(qty),
      price: Number(price),
      strategy,
      confidence: confidence == null ? null : Number(confidence),
      notes,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      closed_at: null,
      close_price: null,
    };

    if (!isUUID(payload.user_id) || (payload.follower_id && !isUUID(payload.follower_id))) {
      return res.status(400).json({ error: 'bad_uuid', detail: 'user_id/follower_id must be UUID.' });
    }

    const { data, error } = await sb.from('signals').insert(payload).select().single();
    if (error) return res.status(500).json({ error: 'insert_error', detail: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// -------- PATCH /signals/:id/close  (close a signal)
router.patch('/:id/close', async (req, res) => {
  try {
    const idRaw = sanitizeUUID(req.params.id);
    // accept user_id from JSON body or from query string (PowerShell convenience)
    const userIdRaw = sanitizeUUID((req.body && req.body.user_id) || req.query.user_id);

    // extra debug (kept minimal)
    console.log('[signals.close] raw id=%s user_id=%s', req.params.id, req.body?.user_id || req.query?.user_id);
    console.log('[signals.close] sanitized id=%s user_id=%s', idRaw, userIdRaw);

    if (!isUUID(idRaw) || !isUUID(userIdRaw)) {
      return res.status(400).json({ error: 'bad_uuid', detail: 'id and user_id must be UUID' });
    }

    const updates = { status: 'CLOSED', closed_at: new Date().toISOString() };

    // maybeSingle() avoids the PostgREST “result contains 0 rows” error.
    const { data, error } = await sb
      .from('signals')
      .update(updates)
      .eq('id', idRaw)
      .eq('user_id', userIdRaw)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: 'server_update_error', detail: error.message });
    if (!data) return res.status(404).json({ error: 'not_found_or_not_owner', detail: 'No matching OPEN row for that id + user_id.' });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;