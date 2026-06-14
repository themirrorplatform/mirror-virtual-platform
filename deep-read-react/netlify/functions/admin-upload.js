// Admin image upload. POST { filename, contentType, dataBase64 } -> stores in
// Supabase Storage (site/assets/...) and returns a public URL. Gated by ADMIN_TOKEN.
const crypto = require('crypto');
const json = (s, o) => ({ statusCode: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(o) });
function authorized(event) {
  const A = process.env.ADMIN_TOKEN || '';
  const h = event.headers['x-admin-token'] || event.headers['authorization'] || '';
  const p = h.replace(/^Bearer\s+/i, '').trim();
  if (!A || !p || p.length !== A.length) return false;
  return crypto.timingSafeEqual(Buffer.from(p), Buffer.from(A));
}

exports.handler = async (event) => {
  const URL = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SR || !process.env.ADMIN_TOKEN) return json(500, { error: 'server not configured' });
  if (!authorized(event)) return json(401, { error: 'unauthorized' });
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'bad json' }); }
  const { filename, contentType, dataBase64 } = body;
  if (!filename || !dataBase64) return json(400, { error: 'filename + dataBase64 required' });
  if (!/^image\//.test(contentType || '')) return json(415, { error: 'images only' });

  const buf = Buffer.from(dataBase64, 'base64');
  if (buf.length > 5 * 1024 * 1024) return json(413, { error: 'max 5MB' });

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
  const key = `assets/${Date.now()}-${safe}`;
  const r = await fetch(`${URL}/storage/v1/object/site/${key}`, {
    method: 'POST',
    headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buf,
  });
  if (!r.ok) return json(502, { error: 'upload failed', status: r.status, detail: await r.text() });
  return json(200, { url: `${URL}/storage/v1/object/public/site/${key}` });
};
