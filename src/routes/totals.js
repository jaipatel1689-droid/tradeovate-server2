// src/routes/totals.js
const express = require('express');
const { sb } = require('../lib/supabase');

const router = express.Router();

/**
 * GET /totals/:userId
 * Returns { total_pl_usd, today_pl_usd }
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await sb
      .from('pl_ledger')
      .select('realized_pl_cents, pl_date')
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });

    const today = new Date().toISOString().slice(0, 10);
    let totalCents = 0;
    let todayCents = 0;

    for (const row of data || []) {
      const cents = Number(row.realized_pl_cents) || 0;
      totalCents += cents;
      if (row.pl_date === today) todayCents += cents;
    }

    res.json({
      total_pl_usd: +(totalCents / 100).toFixed(2),
      today_pl_usd: +(todayCents / 100).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
