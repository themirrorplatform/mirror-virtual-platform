// Admin reader for the witness list. Runs server-side on Netlify, so the
// service-role key (which bypasses RLS) is never exposed to the browser. Gated
// by ADMIN_TOKEN. Returns JSON, or CSV with ?format=csv.
const crypto = require('crypto');

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(obj),
});

function authorized(event) {
  const ADMIN = process.env.ADMIN_TOKEN || '';
  const header = event.headers['x-admin-token'] || event.headers['authorization'] || '';
  const provided = header.replace(/^Bearer\s+/i, '').trim();
  if (!ADMIN || !provided || provided.length !== ADMIN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(ADMIN));
}

exports.handler = async (event) => {
  const URL = process.env.SUPABASE_URL;
  const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !SR || !process.env.ADMIN_TOKEN) return json(500, { error: 'server not configured' });
  if (!authorized(event)) return json(401, { error: 'unauthorized' });

  const res = await fetch(
    `${URL}/rest/v1/witnesses?select=created_at,email,name,source&order=created_at.desc`,
    { headers: { apikey: SR, Authorization: `Bearer ${SR}` } },
  );
  if (!res.ok) return json(502, { error: 'upstream', status: res.status });
  const rows = await res.json();

  const format = (event.queryStringParameters && event.queryStringParameters.format) || 'json';
  if (format === 'csv') {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = ['created_at,email,name,source',
      ...rows.map((r) => [r.created_at, r.email, r.name, r.source].map(esc).join(','))].join('\n');
    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="witnesses.csv"',
        'cache-control': 'no-store',
      },
      body: csv,
    };
  }
  return json(200, { count: rows.length, rows });
};
