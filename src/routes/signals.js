// src/routes/signals.js
const express = require('express');
const router  = express.Router();
const sb      = require('../lib/supabase');

const isUUID = (v) =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// LIST newest first
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await sb
      .from('signals')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: 'list_failed', detail: error.message });
    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!isUUID(id)) return res.status(400).json({ error: 'bad_uuid', detail: 'id must be UUID' });
  try {
    const { data, error } = await sb.from('signals').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: 'select_failed', detail: error.message });
    if (!data)  return res.status(404).json({ error: 'not_found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      symbol,
      side,
      qty,
      price,
      strategy = null,
      confidence = null,
      notes = null,
      follower_id, // optional
    } = req.body || {};

    if (!user_id || !symbol || !side || qty == null || price == null) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }
    if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });

    const SIDE = String(side).toUpperCase();
    if (!['BUY', 'SELL'].includes(SIDE)) {
      return res.status(400).json({ error: 'bad_side', detail: 'Must be BUY or SELL' });
    }

    const payload = {
      user_id,
      follower_id: (typeof follower_id === 'string' && isUUID(follower_id)) ? follower_id : null,
      symbol,
      side: SIDE,
      qty: Number(qty),
      price: Number(price),
      strategy,
      confidence,
      notes,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      closed_at: null,
      close_price: null,
    };

    const { data, error } = await sb.from('signals').insert(payload).select().single();
    if (error) return res.status(500).json({ error: 'insert_failed', detail: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// CLOSE (accepts JSON body {user_id, close_price?} or query: ?user_id=...&close_price=...)
router.patch('/:id/close', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const user_id =
      (req.body && req.body.user_id) ??
      (typeof req.query.user_id === 'string' ? req.query.user_id : '');

    const close_price_raw =
      (req.body && req.body.close_price) ??
      (typeof req.query.close_price !== 'undefined' ? req.query.close_price : undefined);

    if (!isUUID(id))      return res.status(400).json({ error: 'bad_uuid', detail: 'id' });
    if (!isUUID(user_id)) return res.status(400).json({ error: 'bad_uuid', detail: 'user_id' });

    const updates = { status: 'CLOSED', closed_at: new Date().toISOString() };
    if (close_price_raw != null && close_price_raw !== '') {
      const cp = Number(close_price_raw);
      if (Number.isFinite(cp)) updates.close_price = cp;
    }

    // Update & fetch updated row
    const { data, error } = await sb
      .from('signals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('0 rows')) {
        return res.status(404).json({ error: 'not_found_or_not_owner' });
      }
      return res.status(500).json({ error: 'update_failed', detail: error.message });
    }
    if (!data) return res.status(404).json({ error: 'not_found_or_not_owner' });

    // If we have both entry & close price we can write a ledger P/L line
    if (data.close_price != null && Number.isFinite(Number(data.close_price))) {
      const cp = Number(data.close_price);
      const px = Number(data.price);
      const qty = Number(data.qty);
      const pnl = data.side === 'BUY' ? (cp - px) * qty : (px - cp) * qty;

      // Best-effort ledger insert (don’t fail close if ledger write errors)
      await sb.from('ledger').insert({
        user_id: data.user_id,
        signal_id: data.id,
        order_id: null,
        type: 'REALIZED_PNL',
        amount: pnl,
        currency: 'USD',
        note: 'Auto P/L from signal close',
        ts: new Date().toISOString(),
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;