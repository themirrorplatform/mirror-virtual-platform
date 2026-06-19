import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

/* ----------------------------------------------------------------------------
   The architect console (P10 + P10-ext). One authoring surface:
   · Capture / Edit — the 8-field structure + prose (type or upload), now with
     share_line / featured / published / min_tier, and "load" so editing an
     existing node fills its real structure (a commit can't silently wipe edges).
   · Membranes — the descend-walk links (thread -> construction).
   · Atlas — the map_entry rows (built / coming).
   · Lexicon — the §A term records (author the gloss) + the §B requires-DAG.
   All writes go through the role-checked RPCs (architect_* ; is_architect()).
   -------------------------------------------------------------------------- */

type J = Record<string, unknown>;
const sb = () => supabase!;
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const join = (a: unknown) => (Array.isArray(a) ? a.join(", ") : "");

const toDoc = (text: string) => ({
  type: "doc",
  content: text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    .map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })),
});
// reverse of toDoc; a placeholder string body (no .content) yields "" (re-author)
const docToText = (body: unknown): string => {
  const d = body as { content?: { content?: { text?: string }[] }[] } | null;
  if (!d || typeof d !== "object" || !Array.isArray(d.content)) return "";
  return d.content.map((p) => (p.content ?? []).map((s) => s.text ?? "").join("")).join("\n\n");
};

type Tab = "capture" | "membranes" | "atlas" | "lexicon";

export function ArchitectConsole() {
  const [tab, setTab] = useState<Tab>("capture");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (m: string) => { setMsg(m); setErr(null); setTimeout(() => setMsg(null), 3000); };
  const fail = (e: string) => { setErr(e); setMsg(null); };

  return (
    <div className="fadein">
      <div className="eyebrow">architect · the console</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 14px" }}>Author the corpus</h1>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {(["capture", "membranes", "atlas", "lexicon"] as Tab[]).map((t) => (
          <button key={t} className="btn" onClick={() => { setTab(t); setErr(null); setMsg(null); }}
            style={{ ...tabBtn, ...(tab === t ? tabOn : {}) }}>{t}</button>
        ))}
      </div>
      {err && <div className="mono" style={{ fontSize: 12, color: "var(--c-seal)", marginBottom: 10 }}>✗ {err}</div>}
      {msg && <div className="mono" style={{ fontSize: 12, color: "var(--c-gold)", marginBottom: 10 }}>✓ {msg}</div>}

      {tab === "capture" && <Capture onOk={flash} onErr={fail} />}
      {tab === "membranes" && <Membranes onOk={flash} onErr={fail} />}
      {tab === "atlas" && <Atlas onOk={flash} onErr={fail} />}
      {tab === "lexicon" && <Lexicon onOk={flash} onErr={fail} />}
    </div>
  );
}

type Cb = { onOk: (m: string) => void; onErr: (e: string) => void };

/* ── Capture / Edit ──────────────────────────────────────────────────────── */
interface Row { node_id: string; label: string; cached_load_trans: number; cached_depth: string | null; engagement: string | null; author_handle: string; conduct_status: string }
const BLANK = {
  node_id: "", label: "", content_home: "philosophy", kind: "attempt",
  verdict: "", refuter: "", rests_on: "", pulls_to: "",
  presentation: "thread", slug: "", title: "", arrived_from: "", body: "",
  share_line: "", featured: false, published: true, min_tier: "continuations",
};

function Capture({ onOk, onErr }: Cb) {
  const [f, setF] = useState({ ...BLANK });
  const [ledger, setLedger] = useState<J | null>(null);
  const [reroute, setReroute] = useState<{ parent: string } | null>(null);
  const [ranking, setRanking] = useState<Row[]>([]);
  const [inbox, setInbox] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));

  const load = async () => {
    const cols = "node_id,label,cached_load_trans,cached_depth,engagement,author_handle,conduct_status";
    const r = await sb().from("node").select(cols).order("cached_load_trans", { ascending: false }).limit(14);
    setRanking((r.data as Row[]) ?? []);
    const i = await sb().from("node").select(cols).eq("engagement", "unread");
    setInbox((i.data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  // load an existing node's real structure + presentation, so a commit preserves
  // its edges (no silent wipe) and you can edit prose/flags in place.
  const loadNode = async (id: string) => {
    const { data: n } = await sb().from("node_graph").select("*").eq("node_id", id).maybeSingle();
    if (!n) { onErr(`no node "${id}"`); return; }
    const { data: c } = await sb().from("construction").select("*").eq("node_id", id).maybeSingle();
    const { data: t } = await sb().from("thread").select("*").eq("node_id", id).maybeSingle();
    const nn = n as J; const row = (c ?? t) as J | null;
    set({
      node_id: nn.node_id as string, label: nn.label as string, content_home: nn.content_home as string,
      kind: nn.kind as string, verdict: (nn.verdict as string) ?? "", refuter: (nn.refuter as string) ?? "",
      rests_on: join(nn.rests_on), pulls_to: join(nn.pulls_to),
      presentation: c ? "construction" : "thread",
      slug: (row?.slug as string) ?? "", title: (row?.title as string) ?? "",
      arrived_from: (t?.arrived_from as string) ?? "", body: docToText(row?.body),
      share_line: (t?.share_line as string) ?? "", featured: !!t?.featured,
      published: row ? !!row.published : true, min_tier: (c?.min_tier as string) ?? "continuations",
    });
    onOk(`loaded ${id} — its structure is in the form; commit preserves it`);
  };

  const commit = async () => {
    setBusy(true); setLedger(null); setReroute(null);
    const structure = {
      node_id: f.node_id, label: f.label, content_home: f.content_home, kind: f.kind,
      verdict: f.verdict || null, refuter: f.refuter || null,
      rests_on: csv(f.rests_on), pulls_to: csv(f.pulls_to),
    };
    const { data, error } = await sb().rpc("architect_commit", { payload: structure });
    if (error) {
      onErr(error.message);
      if (/FIREWALL/i.test(error.message) && csv(f.rests_on)[0]) setReroute({ parent: csv(f.rests_on)[0] });
      setBusy(false); return;
    }
    setLedger(data as J);
    if (f.title && f.slug) {
      const { error: be } = await sb().rpc("architect_commit_body", {
        p_node_id: f.node_id, p_kind: f.presentation, p_slug: f.slug, p_title: f.title,
        p_body: toDoc(f.body), p_min_tier: f.min_tier, p_arrived_from: f.arrived_from || null,
        p_featured: f.featured, p_published: f.published, p_share_line: f.share_line || null,
      });
      if (be) { onErr(be.message); setBusy(false); return; }
    }
    onOk(`committed ${f.node_id}`); setBusy(false); load();
  };

  const doReroute = async () => {
    if (!reroute) return;
    const { error } = await sb().rpc("architect_commit", { payload: {
      node_id: f.node_id, label: f.label, content_home: f.content_home, kind: f.kind,
      verdict: f.verdict || null, refuter: f.refuter || null,
      rests_on: csv(f.rests_on).filter((x) => x !== reroute.parent),
      pulls_to: [...csv(f.pulls_to), reroute.parent],
    } });
    if (error) onErr(error.message);
    else { set({ rests_on: csv(f.rests_on).filter((x) => x !== reroute.parent).join(", "),
      pulls_to: [...csv(f.pulls_to), reroute.parent].join(", ") }); setReroute(null); onOk("rerouted"); load(); }
  };
  const setEng = async (id: string, eng: string) => { await sb().rpc("architect_set_engagement", { p_node_id: id, p_engagement: eng }); load(); };
  const withdraw = async (id: string) => {
    const reason = prompt("Conduct reason (never a content reason):"); if (!reason) return;
    const { error } = await sb().rpc("architect_withdraw", { p_node_id: id, p_reason: reason });
    if (error) onErr(error.message); else { onOk("withdrawn + logged"); load(); }
  };

  return (
    <>
      <section className="card" style={cardS}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="eyebrow">structure · 8-field capture</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn" style={mini} onClick={() => f.node_id && loadNode(f.node_id)}>load existing</button>
            <button className="btn" style={mini} onClick={() => { setF({ ...BLANK }); setLedger(null); }}>clear</button>
          </div>
        </div>
        <div style={grid2}>
          <input style={inp} placeholder="node_id (e.g. B1-§60)" value={f.node_id} onChange={(e) => set({ node_id: e.target.value })} />
          <input style={inp} placeholder="content_home" value={f.content_home} onChange={(e) => set({ content_home: e.target.value })} />
        </div>
        <input style={inp} placeholder="label — what it tried to do" value={f.label} onChange={(e) => set({ label: e.target.value })} />
        <div style={grid2}>
          <input style={inp} placeholder="verdict (HOLDS, HELD, OPEN…)" value={f.verdict} onChange={(e) => set({ verdict: e.target.value })} />
          <select style={inp} value={f.kind} onChange={(e) => set({ kind: e.target.value })}>
            <option>attempt</option><option>definition</option><option>code</option><option>leaf/borrow</option>
          </select>
        </div>
        <input style={inp} placeholder="refuter — what an opponent must DO to break it" value={f.refuter} onChange={(e) => set({ refuter: e.target.value })} />
        <div style={grid2}>
          <input style={inp} placeholder="rests_on (csv) — the firewall" value={f.rests_on} onChange={(e) => set({ rests_on: e.target.value })} />
          <input style={inp} placeholder="pulls_to (csv)" value={f.pulls_to} onChange={(e) => set({ pulls_to: e.target.value })} />
        </div>

        <div className="eyebrow" style={{ marginTop: 8 }}>prose · separate commit, joined by id</div>
        <div style={grid2}>
          <select style={inp} value={f.presentation} onChange={(e) => set({ presentation: e.target.value })}>
            <option value="thread">thread (A-page)</option><option value="construction">construction (B-page)</option>
          </select>
          <input style={inp} placeholder="slug" value={f.slug} onChange={(e) => set({ slug: e.target.value })} />
        </div>
        <input style={inp} placeholder="title" value={f.title} onChange={(e) => set({ title: e.target.value })} />
        {f.presentation === "thread" && (
          <>
            <input style={inp} placeholder="arrived_from (wedge: lesswrong, ea…)" value={f.arrived_from} onChange={(e) => set({ arrived_from: e.target.value })} />
            <input style={inp} placeholder="share_line — the authored social/SEO line (§3)" value={f.share_line} onChange={(e) => set({ share_line: e.target.value })} />
          </>
        )}
        {f.presentation === "construction" && (
          <select style={inp} value={f.min_tier} onChange={(e) => set({ min_tier: e.target.value })}>
            <option value="continuations">min_tier: continuations</option>
            <option value="builder">min_tier: builder</option>
            <option value="patron">min_tier: patron</option>
          </select>
        )}
        <div style={{ display: "flex", gap: 16, fontSize: 12 }} className="mono">
          <label style={ck}><input type="checkbox" checked={f.published} onChange={(e) => set({ published: e.target.checked })} /> published</label>
          {f.presentation === "thread" && <label style={ck}><input type="checkbox" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} /> featured (the "Now" list)</label>}
        </div>
        <textarea style={{ ...inp, minHeight: 110, fontFamily: "var(--font-transmission)" }} placeholder="body — type here, or upload a manuscript (authored prose, §17)" value={f.body} onChange={(e) => set({ body: e.target.value })} />
        <input type="file" accept=".txt,.md" onChange={async (e) => { const file = e.target.files?.[0]; if (file) set({ body: await file.text() }); }} className="mono" style={{ fontSize: 11 }} />
        <button className="btn btn-solid" disabled={busy || !f.node_id} onClick={commit} style={{ justifySelf: "start", marginTop: 6 }}>{busy ? "committing…" : "commit"}</button>
        {reroute && <button className="btn" onClick={doReroute}>↪ reroute {reroute.parent} into pulls_to and retry</button>}
      </section>

      {ledger && (
        <section className="card" style={{ ...cardS, marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>why-ledger · the recomputation, as proof-steps</div>
          <pre className="mono" style={pre}>{JSON.stringify(ledger, null, 2)}</pre>
        </section>
      )}

      <section className="card" style={{ ...cardS, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>structural-load ranking · click to load for editing</div>
        {ranking.map((r) => (
          <div key={r.node_id} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, padding: "2px 0", cursor: "pointer" }} onClick={() => loadNode(r.node_id)}>
            <span className="hl" style={{ width: 92 }}>{r.cached_depth ?? "—"}</span>
            <span style={{ width: 34 }}>{r.cached_load_trans}</span>
            <span style={{ color: "var(--c-bone2)" }}>{r.node_id}</span>
          </div>
        ))}
      </section>

      <section className="card" style={{ ...cardS, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>review inbox · builder encounters, unread (a query, not a gate)</div>
        {inbox.length === 0 && <span className="mono" style={dim}>— none unread.</span>}
        {inbox.map((r) => (
          <div key={r.node_id} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center", padding: "4px 0", flexWrap: "wrap" }}>
            <span style={{ color: "var(--c-bone2)", flex: 1 }}>{r.label} · {r.author_handle}</span>
            <button className="btn" style={mini} onClick={() => setEng(r.node_id, "read")}>read</button>
            <button className="btn" style={mini} onClick={() => setEng(r.node_id, "integrated")}>integrate</button>
            <button className="btn" style={{ ...mini, borderColor: "var(--c-seal)", color: "var(--c-seal)" }} onClick={() => withdraw(r.node_id)}>withdraw (conduct)</button>
          </div>
        ))}
      </section>
    </>
  );
}

/* ── Membranes ───────────────────────────────────────────────────────────── */
interface MRow { id: string; thread_id: string; construction_id: string; teaser: string; position: number }
function Membranes({ onOk, onErr }: Cb) {
  const [thread, setThread] = useState("");
  const [rows, setRows] = useState<MRow[]>([]);
  const [add, setAdd] = useState({ construction_id: "", teaser: "", position: "0" });

  const list = async (t: string) => {
    if (!t) { setRows([]); return; }
    const { data, error } = await sb().from("membrane").select("*").eq("thread_id", t).order("position");
    if (error) onErr(error.message); else setRows((data as MRow[]) ?? []);
  };
  const doAdd = async () => {
    if (!thread || !add.construction_id || !add.teaser) { onErr("thread, construction_id and teaser are required"); return; }
    const { error } = await sb().rpc("architect_add_membrane", {
      p_thread: thread, p_construction: add.construction_id, p_teaser: add.teaser, p_position: Number(add.position) || 0 });
    if (error) onErr(error.message); else { onOk("membrane added"); setAdd({ construction_id: "", teaser: "", position: "0" }); list(thread); }
  };
  const del = async (id: string) => {
    const { error } = await sb().rpc("architect_delete_membrane", { p_id: id });
    if (error) onErr(error.message); else { onOk("membrane removed"); list(thread); }
  };

  return (
    <section className="card" style={cardS}>
      <div className="eyebrow">membranes · the descend walk (thread → construction)</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={inp} placeholder="thread node_id (e.g. could-it-suffer)" value={thread} onChange={(e) => setThread(e.target.value)} />
        <button className="btn" style={mini} onClick={() => list(thread)}>list</button>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="mono" style={rowS}>
          <span style={{ width: 24 }}>{r.position}</span>
          <span style={{ color: "var(--c-gold)" }}>{r.construction_id}</span>
          <span style={{ flex: 1, color: "var(--c-bone2)" }}>{r.teaser}</span>
          <button className="btn" style={{ ...mini, borderColor: "var(--c-seal)", color: "var(--c-seal)" }} onClick={() => del(r.id)}>delete</button>
        </div>
      ))}
      <div className="eyebrow" style={{ marginTop: 8 }}>add a membrane</div>
      <div style={grid2}>
        <input style={inp} placeholder="construction_id (e.g. B1-§53)" value={add.construction_id} onChange={(e) => setAdd({ ...add, construction_id: e.target.value })} />
        <input style={inp} placeholder="position" value={add.position} onChange={(e) => setAdd({ ...add, position: e.target.value })} />
      </div>
      <input style={inp} placeholder="teaser — what shows through at the point it bears" value={add.teaser} onChange={(e) => setAdd({ ...add, teaser: e.target.value })} />
      <button className="btn btn-solid" onClick={doAdd} style={{ justifySelf: "start" }}>add membrane</button>
    </section>
  );
}

/* ── Atlas ───────────────────────────────────────────────────────────────── */
interface ARow { id: string; domain: string; verb: string; owes: string | null; status: string; node_id: string | null }
function Atlas({ onOk, onErr }: Cb) {
  const [rows, setRows] = useState<ARow[]>([]);
  const [add, setAdd] = useState({ domain: "", verb: "reframes", owes: "", status: "coming", node_id: "" });
  const list = async () => {
    const { data, error } = await sb().from("map_entry").select("*").order("status");
    if (error) onErr(error.message); else setRows((data as ARow[]) ?? []);
  };
  useEffect(() => { list(); }, []);
  const doAdd = async () => {
    if (!add.domain) { onErr("domain is required"); return; }
    const { error } = await sb().rpc("architect_add_map_entry", {
      p_domain: add.domain, p_verb: add.verb, p_owes: add.owes || null, p_status: add.status, p_node_id: add.node_id || null });
    if (error) onErr(error.message); else { onOk("atlas row added"); setAdd({ domain: "", verb: "reframes", owes: "", status: "coming", node_id: "" }); list(); }
  };
  const del = async (id: string) => {
    const { error } = await sb().rpc("architect_delete_map_entry", { p_id: id });
    if (error) onErr(error.message); else { onOk("atlas row removed"); list(); }
  };
  return (
    <section className="card" style={cardS}>
      <div className="eyebrow">atlas · where the work reaches (verb-tagged)</div>
      {rows.map((r) => (
        <div key={r.id} className="mono" style={rowS}>
          <span style={{ width: 52, color: r.status === "built" ? "var(--c-gold)" : "var(--c-bone3)" }}>{r.status}</span>
          <span style={{ width: 70 }}>{r.verb}</span>
          <span style={{ flex: 1, color: "var(--c-bone2)" }}>{r.domain}{r.node_id ? ` → ${r.node_id}` : ""}</span>
          <button className="btn" style={{ ...mini, borderColor: "var(--c-seal)", color: "var(--c-seal)" }} onClick={() => del(r.id)}>delete</button>
        </div>
      ))}
      <div className="eyebrow" style={{ marginTop: 8 }}>add a domain</div>
      <div style={grid2}>
        <input style={inp} placeholder="domain (e.g. AI welfare)" value={add.domain} onChange={(e) => setAdd({ ...add, domain: e.target.value })} />
        <select style={inp} value={add.verb} onChange={(e) => setAdd({ ...add, verb: e.target.value })}>
          <option>dissolves</option><option>diagnoses</option><option>reframes</option><option>applies</option>
        </select>
      </div>
      <input style={inp} placeholder="owes — the debt it carries" value={add.owes} onChange={(e) => setAdd({ ...add, owes: e.target.value })} />
      <div style={grid2}>
        <select style={inp} value={add.status} onChange={(e) => setAdd({ ...add, status: e.target.value })}>
          <option value="coming">coming</option><option value="built">built</option>
        </select>
        <input style={inp} placeholder="node_id (optional — required if built)" value={add.node_id} onChange={(e) => setAdd({ ...add, node_id: e.target.value })} />
      </div>
      <button className="btn btn-solid" onClick={doAdd} style={{ justifySelf: "start" }}>add domain</button>
    </section>
  );
}

/* ── Lexicon ─────────────────────────────────────────────────────────────── */
const TBLANK = {
  term: "", surface_forms: "", register: "transmission", our_meaning: "", defines_node: "",
  reader_assumptions: "", collision: "none", disposition: "teach", plain: "", first_gloss: "",
  tier0: false, arrival_early: "", gloss_verdict: "untested", gloss_refuter: "", notes: "",
};
function Lexicon({ onOk, onErr }: Cb) {
  const [t, setT] = useState({ ...TBLANK });
  const [terms, setTerms] = useState<{ term: string; disposition: string; first_gloss: string | null }[]>([]);
  const set = (p: Partial<typeof t>) => setT((s) => ({ ...s, ...p }));
  const list = async () => {
    const { data } = await sb().from("term").select("term,disposition,first_gloss").order("term");
    setTerms((data as typeof terms) ?? []);
  };
  useEffect(() => { list(); }, []);

  const loadTerm = async (lemma: string) => {
    const { data } = await sb().from("term").select("*").eq("term", lemma).maybeSingle();
    if (!data) { onErr(`no term "${lemma}"`); return; }
    const d = data as J;
    setT({
      term: d.term as string, surface_forms: join(d.surface_forms), register: (d.register as string) ?? "transmission",
      our_meaning: (d.our_meaning as string) ?? "", defines_node: (d.defines_node as string) ?? "",
      reader_assumptions: join(d.reader_assumptions), collision: (d.collision as string) ?? "none",
      disposition: (d.disposition as string) ?? "teach", plain: (d.plain as string) ?? "",
      first_gloss: (d.first_gloss as string) ?? "", tier0: !!d.tier0, arrival_early: join(d.arrival_early),
      gloss_verdict: (d.gloss_verdict as string) ?? "untested", gloss_refuter: (d.gloss_refuter as string) ?? "",
      notes: (d.notes as string) ?? "",
    });
    onOk(`loaded "${lemma}"`);
  };

  const commit = async () => {
    if (!t.term) { onErr("term (the lemma) is required"); return; }
    const { error } = await sb().rpc("architect_commit_term", { payload: {
      term: t.term, surface_forms: csv(t.surface_forms), register: t.register, our_meaning: t.our_meaning || null,
      defines_node: t.defines_node || null, reader_assumptions: csv(t.reader_assumptions), collision: t.collision,
      disposition: t.disposition, plain: t.plain || null, first_gloss: t.first_gloss || null, tier0: t.tier0,
      arrival_early: csv(t.arrival_early), gloss_verdict: t.gloss_verdict, gloss_refuter: t.gloss_refuter || null,
      notes: t.notes || null,
    } });
    if (error) onErr(error.message); else { onOk(`committed term "${t.term}"`); list(); }
  };

  return (
    <>
      <section className="card" style={cardS}>
        <div className="eyebrow">lexicon · the §A term record (author the gloss)</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={inp} placeholder="term / lemma (e.g. encounter)" value={t.term} onChange={(e) => set({ term: e.target.value })} />
          <button className="btn" style={mini} onClick={() => t.term && loadTerm(t.term)}>load</button>
          <button className="btn" style={mini} onClick={() => setT({ ...TBLANK })}>clear</button>
        </div>
        <input style={inp} placeholder="surface_forms (csv)" value={t.surface_forms} onChange={(e) => set({ surface_forms: e.target.value })} />
        <input style={inp} placeholder="our_meaning" value={t.our_meaning} onChange={(e) => set({ our_meaning: e.target.value })} />
        <div style={grid2}>
          <select style={inp} value={t.disposition} onChange={(e) => set({ disposition: e.target.value })}>
            <option>teach</option><option>demote</option><option>experience</option><option>banned</option>
          </select>
          <select style={inp} value={t.collision} onChange={(e) => set({ collision: e.target.value })}>
            <option>none</option><option>mild</option><option>inverts</option>
          </select>
        </div>
        {t.disposition === "teach" && (
          <textarea style={{ ...inp, minHeight: 70, fontFamily: "var(--font-transmission)" }} placeholder="first_gloss — taught in-breath, A Reflection's voice (§17)" value={t.first_gloss} onChange={(e) => set({ first_gloss: e.target.value })} />
        )}
        {t.disposition === "demote" && (
          <input style={inp} placeholder="plain — the demoted plain phrasing" value={t.plain} onChange={(e) => set({ plain: e.target.value })} />
        )}
        <div style={grid2}>
          <input style={inp} placeholder="defines_node (e.g. B1-§35)" value={t.defines_node} onChange={(e) => set({ defines_node: e.target.value })} />
          <input style={inp} placeholder="register (transmission / system)" value={t.register} onChange={(e) => set({ register: e.target.value })} />
        </div>
        <input style={inp} placeholder="reader_assumptions (csv)" value={t.reader_assumptions} onChange={(e) => set({ reader_assumptions: e.target.value })} />
        <input style={inp} placeholder="gloss_refuter — who the gloss must not lose" value={t.gloss_refuter} onChange={(e) => set({ gloss_refuter: e.target.value })} />
        <div style={grid2}>
          <input style={inp} placeholder="arrival_early (csv)" value={t.arrival_early} onChange={(e) => set({ arrival_early: e.target.value })} />
          <select style={inp} value={t.gloss_verdict} onChange={(e) => set({ gloss_verdict: e.target.value })}>
            <option>untested</option><option>carried</option><option>derived</option>
          </select>
        </div>
        <label style={{ ...ck, fontSize: 12 }} className="mono"><input type="checkbox" checked={t.tier0} onChange={(e) => set({ tier0: e.target.checked })} /> tier0 (entering vocabulary)</label>
        <input style={inp} placeholder="notes" value={t.notes} onChange={(e) => set({ notes: e.target.value })} />
        <button className="btn btn-solid" onClick={commit} style={{ justifySelf: "start", marginTop: 4 }}>commit term</button>
      </section>

      <section className="card" style={{ ...cardS, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>all terms · click to load · ◦ = gloss still a placeholder</div>
        {terms.map((x) => {
          const unfilled = x.disposition === "teach" && (!x.first_gloss || x.first_gloss.startsWith("[[PASTE"));
          return (
            <div key={x.term} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, padding: "2px 0", cursor: "pointer" }} onClick={() => loadTerm(x.term)}>
              <span style={{ width: 14, color: "var(--c-gold)" }}>{unfilled ? "◦" : ""}</span>
              <span style={{ width: 92, color: "var(--c-bone3)" }}>{x.disposition}</span>
              <span style={{ color: "var(--c-bone2)" }}>{x.term}</span>
            </div>
          );
        })}
      </section>
    </>
  );
}

/* ── styles ──────────────────────────────────────────────────────────────── */
const inp: CSSProperties = { padding: "8px 11px", fontSize: 13, background: "var(--c-stage2)", border: "1px solid var(--c-line)", borderRadius: 2, color: "var(--c-bone)", width: "100%", boxSizing: "border-box" };
const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const mini: CSSProperties = { fontSize: 10.5, padding: "3px 8px", minHeight: 0 };
const cardS: CSSProperties = { padding: 16, display: "grid", gap: 8 };
const rowS: CSSProperties = { fontSize: 12, display: "flex", gap: 8, alignItems: "center", padding: "3px 0", flexWrap: "wrap" };
const pre: CSSProperties = { fontSize: 11, color: "var(--c-bone2)", whiteSpace: "pre-wrap", margin: 0 };
const dim: CSSProperties = { fontSize: 12, color: "var(--c-bone3)" };
const ck: CSSProperties = { display: "flex", gap: 6, alignItems: "center" };
const tabBtn: CSSProperties = { fontSize: 12, padding: "5px 12px", textTransform: "capitalize" };
const tabOn: CSSProperties = { background: "var(--c-gold)", color: "var(--c-stage)", borderColor: "var(--c-gold)" };
