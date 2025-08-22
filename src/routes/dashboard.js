// src/routes/dashboard.js
const express = require('express');
const { sb } = require('../lib/supabase');

const router = express.Router();

/**
 * GET /dashboard/:userId
 * Returns:
 * {
 *   connected: boolean,
 *   connection: { provider, broker, account_ids, expires_at, created_at } | null,
 *   totals: { total_pl_usd, today_pl_usd },
 *   recent_trades: [ { id, account_id, trade_ref, realized_pl_cents, pl_date, created_at }, ... ]
 * }
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 1) Latest token row for connection status
    const { data: tokenRow, error: tokenErr } = await sb
      .from('user_tokens')
      .select('provider, broker, account_ids, expires_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenErr) throw tokenErr;

    let connected = false;
    if (tokenRow && tokenRow.expires_at) {
      const expires = new Date(tokenRow.expires_at);
      connected = expires.getTime() > Date.now();
    }

    // 2) Totals (in cents) -> USD
    const { data: totalsRow, error: totalsErr } = await sb
      .from('user_pl_totals')
      .select('total_pl_cents, today_pl_cents')
      .eq('user_id', userId)
      .maybeSingle();

    if (totalsErr) throw totalsErr;

    const totals = {
      total_pl_usd: totalsRow ? (totalsRow.total_pl_cents || 0) / 100.0 : 0,
      today_pl_usd: totalsRow ? (totalsRow.today_pl_cents || 0) / 100.0 : 0,
    };

    // 3) Recent trades (ledger)
    const { data: recentTrades, error: ledgerErr } = await sb
      .from('pl_ledger')
      .select('id, account_id, trade_ref, realized_pl_cents, pl_date, created_at')
      .eq('user_id', userId)
      .order('pl_date', { ascending: false })
      .limit(10);

    if (ledgerErr) throw ledgerErr;

    return res.json({
      connected,
      connection: tokenRow || null,
      totals,
      recent_trades: recentTrades || [],
    });
  } catch (err) {
    console.error('DASHBOARD_ERROR', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// optional helper so /dashboard still shows something
router.get('/', (_req, res) => {
  res.type('text').send('Dashboard route. Use /dashboard/:userId');
});

module.exports = router;

