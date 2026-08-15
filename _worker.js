let schemaReady;
let accessKeysCache;

const SCOPES = new Set(['favorites', 'trackOverrides', 'userTracks', 'customCollections']);
const MAX_OPERATIONS = 2000;
const MAX_KEY_LENGTH = 500;
const MAX_PAYLOAD_BYTES = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(normalized);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function accessTeamDomain(value) {
  const raw = String(value || '').trim().replace(/\/$/, '');
  if (!raw) return '';
  return raw.startsWith('https://') ? raw : `https://${raw}`;
}

async function accessKeys(teamDomain) {
  if (!accessKeysCache || accessKeysCache.teamDomain !== teamDomain || Date.now() - accessKeysCache.loadedAt > 60 * 60 * 1000) {
    const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 3600, cacheEverything: true } });
    if (!response.ok) throw new Error('Unable to load Access signing keys.');
    const body = await response.json();
    accessKeysCache = { teamDomain, loadedAt: Date.now(), keys: body.keys || [] };
  }
  return accessKeysCache.keys;
}

async function verifyAccess(request, env) {
  const teamDomain = accessTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const audience = String(env.ACCESS_AUD || '').trim();
  if (!teamDomain || !audience) return { error: json({ error: 'Access verification variables are not configured.', code: 'AUTH_NOT_CONFIGURED' }, 503) };
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { error: json({ error: 'Cloudflare Access authentication is required.', code: 'AUTH_REQUIRED' }, 401) };
  const parts = token.split('.');
  if (parts.length !== 3) return { error: json({ error: 'The Access token is malformed.', code: 'AUTH_INVALID' }, 401) };
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported token.');
    const jwk = (await accessKeys(teamDomain)).find(key => key.kid === header.kid);
    if (!jwk) throw new Error('Signing key not found.');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    const now = Math.floor(Date.now() / 1000), audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!valid || payload.iss !== teamDomain || !audiences.includes(audience) || Number(payload.exp || 0) <= now || Number(payload.nbf || 0) > now) throw new Error('Token checks failed.');
    return { payload };
  } catch {
    return { error: json({ error: 'Cloudflare Access authentication could not be verified.', code: 'AUTH_INVALID' }, 401) };
  }
}

async function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.prepare(`
      CREATE TABLE IF NOT EXISTS shared_state (
        scope TEXT NOT NULL,
        item_key TEXT NOT NULL,
        payload TEXT,
        deleted INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        updated_by TEXT,
        PRIMARY KEY (scope, item_key)
      )
    `).run().catch(error => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

function normalizedOperation(item) {
  if (!item || typeof item !== 'object' || !SCOPES.has(item.scope)) return null;
  const key = String(item.key || '').trim();
  if (!key || key.length > MAX_KEY_LENGTH) return null;
  const date = new Date(item.updatedAt || '');
  if (!Number.isFinite(date.getTime())) return null;
  const deleted = Boolean(item.deleted);
  const payload = deleted ? null : JSON.stringify(item.value);
  if (!deleted && (item.value === null || typeof item.value !== 'object' || Array.isArray(item.value))) return null;
  if (payload && new TextEncoder().encode(payload).byteLength > MAX_PAYLOAD_BYTES) return null;
  return { scope: item.scope, key, payload, deleted, updatedAt: date.toISOString() };
}

async function readState(db) {
  const result = await db.prepare('SELECT scope, item_key, payload, deleted, updated_at FROM shared_state ORDER BY scope, item_key').all();
  const items = [];
  for (const row of result.results || []) {
    let value = null;
    if (!row.deleted && row.payload) {
      try { value = JSON.parse(row.payload); } catch { continue; }
    }
    items.push({
      scope: row.scope,
      key: row.item_key,
      value,
      deleted: Boolean(row.deleted),
      updatedAt: row.updated_at,
    });
  }
  return items;
}

async function writeState(db, operations, updatedBy) {
  const statement = `
    INSERT INTO shared_state (scope, item_key, payload, deleted, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(scope, item_key) DO UPDATE SET
      payload = excluded.payload,
      deleted = excluded.deleted,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
    WHERE excluded.updated_at > shared_state.updated_at
  `;
  for (let index = 0; index < operations.length; index += 50) {
    const statements = operations.slice(index, index + 50).map(item =>
      db.prepare(statement).bind(item.scope, item.key, item.payload, item.deleted ? 1 : 0, item.updatedAt, updatedBy)
    );
    if (statements.length) await db.batch(statements);
  }
}

async function handleSharedState(request, env, identity) {
  if (!env.DB) return json({ error: 'Cloudflare D1 binding "DB" is not configured.', code: 'DB_NOT_CONFIGURED' }, 503);
  await ensureSchema(env.DB);
  if (request.method === 'GET') return json({ version: 1, items: await readState(env.DB) });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);

  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return json({ error: 'Cross-origin writes are not allowed.', code: 'ORIGIN_MISMATCH' }, 403);

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.operations) || body.operations.length > MAX_OPERATIONS) {
    return json({ error: `operations must be an array of at most ${MAX_OPERATIONS} items.`, code: 'INVALID_OPERATIONS' }, 400);
  }
  const operations = body.operations.map(normalizedOperation);
  if (operations.some(item => !item)) return json({ error: 'An operation is invalid.', code: 'INVALID_OPERATION' }, 400);

  const email = String(identity?.email || identity?.sub || '');
  await writeState(env.DB, operations, email.slice(0, 320));
  return json({ ok: true, applied: operations.length });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/shared-state') {
      try {
        const access = await verifyAccess(request, env);
        if (access.error) return access.error;
        return await handleSharedState(request, env, access.payload);
      } catch (error) {
        return json({ error: 'Shared state request failed.', code: 'DB_ERROR' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
