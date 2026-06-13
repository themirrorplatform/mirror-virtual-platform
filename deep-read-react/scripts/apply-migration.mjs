// Apply SQL migrations to Supabase via the Management API.
// The *.supabase.co project host isn't reachable from CI/sandbox egress, but
// api.supabase.com is — so we run DDL through POST /v1/projects/{ref}/database/query.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=xxxx node scripts/apply-migration.mjs
//
// Reads .env for the ref if present; applies every file in supabase/migrations in order.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// minimal .env loader (no dependency)
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!TOKEN || !REF) {
  console.error('Need SUPABASE_ACCESS_TOKEN (sbp_...) and SUPABASE_PROJECT_REF.');
  process.exit(2);
}

const dir = join(root, 'supabase', 'migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

for (const f of files) {
  const query = readFileSync(join(dir, f), 'utf8');
  process.stdout.write(`applying ${f} ... `);
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    console.error(`FAILED (HTTP ${res.status})\n${await res.text()}`);
    process.exit(1);
  }
  console.log('ok');
}
console.log(`\nApplied ${files.length} migration(s) to ${REF}.`);
