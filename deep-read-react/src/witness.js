// Witness list client. Posts a seat straight to Supabase PostgREST with the
// publishable anon key; RLS allows INSERT only (no read-back), so this is safe
// to ship in the browser bundle. When the env isn't configured we fall back to
// a local-only success so the experience never breaks pre-launch.

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY; // publishable / anon client key

export const witnessConfigured = () => Boolean(URL && KEY);

export async function joinWitnessList({ email, name }) {
  if (!witnessConfigured()) return { ok: true, mode: 'local' };
  try {
    const res = await fetch(`${URL}/rest/v1/witnesses`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email: email.trim(),
        name: name?.trim() || null,
        source: 'deep-read-site',
        user_agent: navigator.userAgent,
      }),
    });
    if (res.status === 201 || res.status === 204) return { ok: true };
    if (res.status === 409) return { ok: true, duplicate: true }; // already on the list
    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
