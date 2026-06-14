// Admin content store. GET returns content.json; POST overwrites it. Gated by
// ADMIN_TOKEN; writes go through the service-role key (never in the browser).
const crypto = require('crypto');
const json = (s, o) => ({ statusCode: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(o) });
function authorized(event) {
  const A = process.env.ADMIN_TOKEN || '';
  const h = event.headers['x-admin-token'] || event.headers['authorization'] || '';
  const p = h.replace(/^Bearer\s+/i, '').trim();
  if (!A || !p || p.length !== A.length) return false;
  return crypto.timingSafeEqual(Buffer.from(p), Buffer.from(A));
}
const PATH = 'storage/v1/object/site/content.json';

exports.handler = async (event) => {
  const URL = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SR || !process.env.ADMIN_TOKEN) return json(500, { error: 'server not configured' });
  if (!authorized(event)) return json(401, { error: 'unauthorized' });
  const auth = { apikey: SR, Authorization: `Bearer ${SR}` };

  if (event.httpMethod === 'GET') {
    const r = await fetch(`${URL}/${PATH}`, { headers: auth });
    if (r.status === 404) return json(200, {});
    if (!r.ok) return json(502, { error: 'read failed', status: r.status });
    return json(200, await r.json());
  }
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'bad json' }); }
    const r = await fetch(`${URL}/${PATH}`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', 'x-upsert': 'true' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return json(502, { error: 'write failed', status: r.status, detail: await r.text() });
    return json(200, { ok: true });
  }
  return json(405, { error: 'method not allowed' });
};
