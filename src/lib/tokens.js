// src/lib/tokens.js
const fetch = require('node-fetch');
const { sb } = require('./supabase');

const TOKEN_TABLE = 'user_tokens';

async function upsertToken({ userId, provider, accessToken, refreshToken = null, expiresInSec = 3600, scopes = null, accountIds = null }) {
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  const row = {
    user_id: userId,
    provider,
    broker: 'tradeovate',
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    scopes,
    account_ids: accountIds,
  };
  const { error } = await sb.from(TOKEN_TABLE).upsert(row, { onConflict: 'user_id,broker,provider' });
  if (error) throw error;
}

async function savePasswordFlowToken(userId, accessToken, expiresInSec = 3600, accountIds = null) {
  await upsertToken({ userId, provider: 'password', accessToken, expiresInSec, accountIds });
}

// (used later when OAuth is live)
async function saveOAuthTokens(userId, tokenResponse) {
  const expiresIn = tokenResponse.expires_in ?? 3600;
  await upsertToken({
    userId,
    provider: 'oauth',
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? null,
    expiresInSec: expiresIn,
    scopes: tokenResponse.scope ?? null,
    accountIds: tokenResponse.accountIds ?? null,
  });
}

async function getTokenRow(userId, provider = 'oauth') {
  const { data, error } = await sb
    .from(TOKEN_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('broker', 'tradeovate')
    .eq('provider', provider)
    .single();
  if (error) return null;
  return data;
}

async function refreshOAuth(refreshToken) {
  if (!refreshToken) throw new Error('No refresh token available');
  const url = process.env.TRADEOVATE_OAUTH_TOKEN_URL;
  if (!url || url.startsWith('TODO')) throw new Error('OAuth not configured');

  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('refresh_token', refreshToken);
  params.set('client_id', process.env.TRADEOVATE_CLIENT_ID);
  params.set('client_secret', process.env.TRADEOVATE_CLIENT_SECRET);
  params.set('redirect_uri', process.env.TRADEOVATE_REDIRECT_URI);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getValidToken(userId) {
  // prefer oauth, fallback to password
  let row = await getTokenRow(userId, 'oauth');
  if (!row) row = await getTokenRow(userId, 'password');
  if (!row) throw new Error('No token on file');

  const expiresAt = new Date(row.expires_at).getTime();
  const nearExpiry = Date.now() > (expiresAt - 120000);

  if (row.provider === 'oauth' && nearExpiry) {
    const refreshed = await refreshOAuth(row.refresh_token);
    await saveOAuthTokens(userId, refreshed);
    return refreshed.access_token;
  }
  return row.access_token;
}

module.exports = { savePasswordFlowToken, saveOAuthTokens, getValidToken };
