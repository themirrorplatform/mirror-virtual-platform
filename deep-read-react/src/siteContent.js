import { useEffect, useState } from 'react';

// Reads the admin-managed content.json from Supabase Storage (public). Cached
// per page load. The site renders defaults first and overlays any edited values,
// so a missing/blank field always falls back to the built-in copy.
const URL = import.meta.env.VITE_SUPABASE_URL;
let cache = null;

export function useSiteContent() {
  const [content, setContent] = useState(cache);
  useEffect(() => {
    if (cache || !URL) return;
    let cancelled = false;
    fetch(`${URL}/storage/v1/object/public/site/content.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => { if (c && !cancelled) { cache = c; setContent(c); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return content || {};
}
