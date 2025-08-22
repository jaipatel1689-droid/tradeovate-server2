// src/routes/ledger.js
const express = require('express');
const { sb } = require('../lib/supabase');
const { validateBody, ledgerInsertSchema } = require('../lib/validate');

const router = express.Router();

// GET /ledger  -> uses fallback user for convenience while developing
router.get('/', async (_req, res) => {
  try {
    const userId = "c61df5bb-d504-4460-9c29-33e26860eee5"; // dev fallback
    const { data, error } = await sb
      .from('pl_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// GET /ledger/:userId  -> explicit user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await sb
      .from('pl_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST /ledger  -> validate then insert
router.post('/', validateBody(ledgerInsertSchema), async (req, res) => {
  try {
    const {
      trade_ref,
      realized_pl_cents,
      pl_date,
      user_id,
      account_id,
    } = req.valid;

    // dev defaults so you can keep testing quickly
    const finalUserId = user_id || "c61df5bb-d504-4460-9c29-33e26860eee5";
    const finalAccountId = account_id || "12345";

    const payload = {
      user_id: finalUserId,
      account_id: finalAccountId,
      trade_ref,
      realized_pl_cents,  // cents as integer
      pl_date,            // YYYY-MM-DD string
    };

    const { data, error } = await sb
      .from('pl_ledger')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Bubble up FK / unique constraint messages cleanly
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.status(201).json({ ok: true, row: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

module.exports = router;


