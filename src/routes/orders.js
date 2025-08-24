// src/routes/orders.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// LIST (optionally by user_id)
router.get('/', async (req, res) => {
  try {
    const q = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (req.query.user_id && isUUID(req.query.user_id)) q.eq('user_id', req.query.user_id);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'list_failed', detail: error.message });
    res.json(data ?? []);
  } catch (err) { res.status(500).json({ error: 'server_error', detail: err.message }); }
});

// GET by id
router.get('/:id', async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!isUUID(id)) return res.status(400).json({ error: 'bad_uuid', detail: 'id' });
  try {
    const { data, error } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: 'select_failed', detail: error.message });
    if (!data)  return res.status(404).json({ error: 'not_found' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'server_error', detail: err.message }); }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { user_id, signal_id, symbol, side, qty, price = null, provider = 'mock' } = req.body || {};
    if (!user_id || !symbol || !side || qty == null) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }
    if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });
    if (signal_id && !isUUID(signal_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'signal_id' });
    const SIDE = String(side).toUpperCase();
    if (!['BUY','SELL'].includes(SIDE)) return res.status(400).json({ error: 'bad_side' });

    const payload = {
      user_id,
      signal_id: signal_id || null,
      symbol,
      side: SIDE,
      qty: Number(qty),
      price: price == null ? null : Number(price),
      status: 'NEW',
      provider,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await sb.from('orders').insert(payload).select().single();
    if (error) return res.status(500).json({ error: 'insert_failed', detail: error.message });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'server_error', detail: err.message }); }
});

// CANCEL
router.patch('/:id/cancel', async (req, res) => {
  const id = String(req.params.id || '').trim();
  const user_id = (req.body && req.body.user_id) || req.query.user_id;
  if (!isUUID(id) || !isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid' });

  try {
    const { data, error } = await sb
      .from('orders')
      .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'update_failed', detail: error.message });
    if (!data)  return res.status(404).json({ error: 'not_found_or_not_owner' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'server_error', detail: err.message }); }
});

module.exports = router;