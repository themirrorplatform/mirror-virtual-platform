// Post-migration DB verification for the witness list. Runs against the live
// project's PostgREST (reachable) using the anon + service_role keys from .env.
// Proves the table exists and that RLS behaves: anon can INSERT but never READ,
// the unique-email and format constraints hold, and the service role can read.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_KEY;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SR) { console.error('Need VITE_SUPABASE_URL, VITE_SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(2); }

const results = [];
const ok = (n, p, d = '') => { results.push(p); console.log(`${p ? '  ✓' : '  ✗'} ${n}${d ? ' — ' + d : ''}`); };
const rest = (path, { key, method = 'GET', body, prefer } = {}) =>
  fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const probe = `probe_${Date.now()}@example.com`;

// table exists / service role can read
let r = await rest('witnesses?select=count', { key: SR, prefer: 'count=exact' });
ok('witnesses table exists & service role can read', r.status === 200, `HTTP ${r.status}`);

// anon INSERT works
r = await rest('witnesses', { key: ANON, method: 'POST', body: { email: probe, name: 'Probe', source: 'verify-db' }, prefer: 'return=minimal' });
ok('anon can INSERT a seat', r.status === 201 || r.status === 204, `HTTP ${r.status}`);

// anon cannot READ (RLS) — returns 200 with zero visible rows
r = await rest(`witnesses?email=eq.${encodeURIComponent(probe)}`, { key: ANON });
const anonRows = r.ok ? await r.json() : null;
ok('anon CANNOT read rows (RLS hides them)', Array.isArray(anonRows) && anonRows.length === 0, `rows=${anonRows && anonRows.length}`);

// duplicate email rejected
r = await rest('witnesses', { key: ANON, method: 'POST', body: { email: probe }, prefer: 'return=minimal' });
ok('duplicate email is rejected (409)', r.status === 409, `HTTP ${r.status}`);

// bad email format rejected by CHECK (use service role to isolate the constraint, not RLS)
r = await rest('witnesses', { key: SR, method: 'POST', body: { email: 'not-an-email' }, prefer: 'return=minimal' });
ok('malformed email is rejected by the CHECK constraint', r.status >= 400, `HTTP ${r.status}`);

// service role sees the probe row
r = await rest(`witnesses?email=eq.${encodeURIComponent(probe)}&select=email,source`, { key: SR });
const srRows = r.ok ? await r.json() : [];
ok('service role can read the inserted seat', srRows.length === 1 && srRows[0].email === probe);

// cleanup the probe row
await rest(`witnesses?email=eq.${encodeURIComponent(probe)}`, { key: SR, method: 'DELETE' });

const failed = results.filter((p) => !p).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
