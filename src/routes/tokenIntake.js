// src/routes/tokenIntake.js
const express = require('express');
const router = express.Router();
const { sb } = require('../lib/supabase');

/**
 * Helper: turn seconds from now into ISO timestamp
 */
function isoInSeconds(seconds = 3600) {
  const ms = (Number(seconds) || 0) * 1000;
  return new Date(Date.now() + ms).toISOString();
}

/**
 * POST /auth/token-intake
 * Used when you eventually wire real Tradeovate OAuth.
 * Body:
 * {
 *   userId: "<uuid>",
 *   accessToken: "<token>",
 *   expiresInSec: 3600,
 *   accountIds: ["12345", ...]
 * }
 */
router.post('/token-intake', async (req, res) => {
  try {
    const {
      userId,
      accessToken,
      expiresInSec = 3600,
      accountIds = []
    } = req.body || {};

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

    const { data, error } = await sb
      .from('user_tokens')
      .upsert(
        {
          user_id: userId,
          provider: 'oauth',
          broker: 'tradeovate',
          access_token: accessToken,
          account_ids: accountIds,
          expires_at: isoInSeconds(expiresInSec)
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, message: 'OAuth token stored', row: data });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

/**
 * POST /auth/password
 * Mock login flow (for prop-firm testing without Tradeovate OAuth).
 * Body:
 * {
 *   user_id: "<uuid>",
 *   username: "prop-firm-user@example.com",
 *   password: "dummy-secret",
 *   accountIds: ["12345"],
 *   expiresInSec: 3600
 * }
 *
 * NOTE: We ALWAYS write a dummy access_token to satisfy NOT NULL constraint.
 */
router.post('/password', async (req, res) => {
  try {
    const {
      user_id,
      username,          // unused, just to mimic a real payload
      password,          // unused, just to mimic a real payload
      accountIds = [],
      expiresInSec = 3600
    } = req.body || {};

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const dummyToken = `MOCK_TOKEN_${Date.now()}`;

    const { data, error } = await sb
      .from('user_tokens')
      .upsert(
        {
          user_id,
          provider: 'password',
          broker: 'tradeovate',
          account_ids: accountIds,
          access_token: dummyToken,           // <-- important for NOT NULL column
          expires_at: isoInSeconds(expiresInSec)
        },
        { onConflict: 'user_id' }             // relies on unique index on user_id
      )
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      ok: true,
      message: 'mock password session created',
      session: {
        user_id,
        provider: 'password',
        broker: 'tradeovate',
        account_ids: accountIds,
        expires_at: isoInSeconds(expiresInSec)
      },
      row: data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;
