// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { sb } = require('../lib/supabase');

// POST /auth/password  -> mock Tradeovate password login
router.post('/password', async (req, res) => {
  try {
    // require FEATURE_USE_MOCK=1 to use this route
    if (process.env.FEATURE_USE_MOCK !== '1') {
      return res.status(403).json({ error: 'Mock auth disabled. Set FEATURE_USE_MOCK=1' });
    }

    const {
      user_id,            // required: your Supabase auth user UUID
      username,           // mock credential
      password,           // mock credential
      accountIds = ['12345'], // optional list of account ids
      expiresInSec = 3600     // 1 hour default
    } = req.body || {};

    if (!user_id || !username || !password) {
      return res.status(400).json({ error: 'user_id, username, password are required' });
    }

    // Build a fake token object
    const now = new Date();
    const expires_at = new Date(now.getTime() + expiresInSec * 1000).toISOString();
    const mockAccessToken = `MOCK_${Math.random().toString(36).slice(2)}_${Date.now()}`;

    const tokenRow = {
      user_id,
      provider: 'password',      // so dashboard can show provider
      broker: 'tradeovate',      // for display
      account_ids: accountIds,   // text[] column
      access_token: mockAccessToken,
      expires_at
    };

    // upsert into public.user_tokens (adjust columns to match your schema)
    const { data, error } = await sb
      .from('user_tokens')
      .upsert(tokenRow, { onConflict: 'user_id' })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      ok: true,
      connection: {
        provider: 'password',
        broker: 'tradeovate',
        account_ids: accountIds,
        expires_at,
        created_at: now.toISOString()
      },
      token: mockAccessToken
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
