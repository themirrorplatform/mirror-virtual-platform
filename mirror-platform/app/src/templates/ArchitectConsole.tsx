import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";

/* ----------------------------------------------------------------------------
   The architect console (P10). The 8-field capture + dual prose input (type or
   upload a manuscript) — structure and prose are SEPARATE commits joined by
   node_id (§8). The why-ledger (the recomputation as proof-steps), the live
   structural-load ranking, the firewall block + one-click reroute, the review
   inbox (a query, not a gate), and conduct-withdrawal (suppress + log, never
   delete). All writes go through the role-checked RPCs.
   -------------------------------------------------------------------------- */

type Ledger = Record<string, unknown>;
const toDoc = (text: string) => ({
  type: "doc",
  content: text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    .map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })),
});

interface Row { node_id: string; label: string; cached_load_trans: number; cached_depth: string | null; engagement: string | null; author_handle: string; conduct_status: string }

export function ArchitectConsole() {
  const [f, setF] = useState({
    node_id: "", label: "", content_home: "philosophy", kind: "attempt",
    verdict: "", refuter: "", rests_on: "", pulls_to: "",
    presentation: "thread", slug: "", title: "", arrived_from: "", body: "",
  });
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reroute, setReroute] = useState<{ child: string; parent: string } | null>(null);
  const [ranking, setRanking] = useState<Row[]>([]);
  const [inbox, setInbox] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<Ledger | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await supabase!.from("node").select("node_id,label,cached_load_trans,cached_depth,engagement,author_handle,conduct_status").order("cached_load_trans", { ascending: false }).limit(12);
    setRanking((r.data as Row[]) ?? []);
    const i = await supabase!.from("node").select("node_id,label,cached_load_trans,cached_depth,engagement,author_handle,conduct_status").eq("engagement", "unread");
    setInbox((i.data as Row[]) ?? []);
    const m = await supabase!.rpc("event_metrics");
    if (!m.error) setMetrics(m.data as Ledger);
  };
  useEffect(() => { load(); }, []);

  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const commit = async () => {
    setBusy(true); setErr(null); setLedger(null); setReroute(null);
    const structure = {
      node_id: f.node_id, label: f.label, content_home: f.content_home, kind: f.kind,
      verdict: f.verdict || null, refuter: f.refuter || null,
      rests_on: csv(f.rests_on), pulls_to: csv(f.pulls_to),
    };
    const { data, error } = await supabase!.rpc("architect_commit", { payload: structure });
    if (error) {
      setErr(error.message);
      // firewall block -> offer to reroute the offending edge into pulls_to (§4.3)
      if (/FIREWALL/i.test(error.message) && csv(f.rests_on)[0]) {
        setReroute({ child: f.node_id, parent: csv(f.rests_on)[0] });
      }
      setBusy(false); return;
    }
    setLedger(data as Ledger);
    // prose commit — separate, joined by node_id (§8)
    if (f.title && f.slug) {
      await supabase!.rpc("architect_commit_body", {
        p_node_id: f.node_id, p_kind: f.presentation, p_slug: f.slug, p_title: f.title,
        p_body: toDoc(f.body), p_arrived_from: f.arrived_from || null, p_featured: false, p_published: true,
      });
    }
    setBusy(false); load();
  };

  const doReroute = async () => {
    if (!reroute) return;
    const structure = {
      node_id: f.node_id, label: f.label, content_home: f.content_home, kind: f.kind,
      verdict: f.verdict || null, refuter: f.refuter || null,
      rests_on: csv(f.rests_on).filter((x) => x !== reroute.parent),
      pulls_to: [...csv(f.pulls_to), reroute.parent],
    };
    const { data, error } = await supabase!.rpc("architect_commit", { payload: structure });
    if (error) setErr(error.message); else { setLedger(data as Ledger); setErr(null); setReroute(null); load(); }
  };

  const onFile = async (file: File) => { const text = await file.text(); setF((s) => ({ ...s, body: text })); };
  const setEng = async (id: string, eng: string) => { await supabase!.rpc("architect_set_engagement", { p_node_id: id, p_engagement: eng }); load(); };
  const withdraw = async (id: string) => {
    const reason = prompt("Conduct reason (never a content reason):");
    if (!reason) return;
    const { error } = await supabase!.rpc("architect_withdraw", { p_node_id: id, p_reason: reason });
    if (error) setErr(error.message); else load();
  };

  return (
    <div className="fadein">
      <div className="eyebrow">architect · the console</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 16px" }}>Capture an attempt</h1>

      <section className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
        <div className="eyebrow">structure · 8-field capture</div>
        <div style={grid2}>
          <input style={inp} placeholder="node_id (e.g. B1-§60)" value={f.node_id} onChange={(e) => setF({ ...f, node_id: e.target.value })} />
          <input style={inp} placeholder="content_home" value={f.content_home} onChange={(e) => setF({ ...f, content_home: e.target.value })} />
        </div>
        <input style={inp} placeholder="label — what it tried to do" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        <div style={grid2}>
          <input style={inp} placeholder="verdict (HOLDS, HELD, OPEN…)" value={f.verdict} onChange={(e) => setF({ ...f, verdict: e.target.value })} />
          <select style={inp} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option>attempt</option><option>definition</option><option>code</option><option>leaf/borrow</option>
          </select>
        </div>
        <input style={inp} placeholder="refuter — what an opponent must DO to break it" value={f.refuter} onChange={(e) => setF({ ...f, refuter: e.target.value })} />
        <div style={grid2}>
          <input style={inp} placeholder="rests_on (csv) — the firewall" value={f.rests_on} onChange={(e) => setF({ ...f, rests_on: e.target.value })} />
          <input style={inp} placeholder="pulls_to (csv)" value={f.pulls_to} onChange={(e) => setF({ ...f, pulls_to: e.target.value })} />
        </div>

        <div className="eyebrow" style={{ marginTop: 8 }}>prose · separate commit, joined by id</div>
        <div style={grid2}>
          <select style={inp} value={f.presentation} onChange={(e) => setF({ ...f, presentation: e.target.value })}>
            <option value="thread">thread (A-page)</option><option value="construction">construction (B-page)</option>
          </select>
          <input style={inp} placeholder="slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
        </div>
        <input style={inp} placeholder="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        {f.presentation === "thread" && <input style={inp} placeholder="arrived_from (wedge: lesswrong, ea…)" value={f.arrived_from} onChange={(e) => setF({ ...f, arrived_from: e.target.value })} />}
        <textarea style={{ ...inp, minHeight: 100, fontFamily: "var(--font-transmission)" }} placeholder="body — type here, or upload a manuscript (authored prose, §17)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <input type="file" accept=".txt,.md" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="mono" style={{ fontSize: 11 }} />

        <button className="btn btn-solid" disabled={busy || !f.node_id} onClick={commit} style={{ justifySelf: "start", marginTop: 6 }}>{busy ? "committing…" : "commit"}</button>
        {err && <div className="mono" style={{ fontSize: 12, color: "var(--c-seal)" }}>{err}</div>}
        {reroute && <button className="btn" onClick={doReroute}>↪ reroute {reroute.parent} into pulls_to and retry</button>}
      </section>

      {ledger && (
        <section className="card" style={{ padding: 16, marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>why-ledger · the recomputation, as proof-steps</div>
          <pre className="mono" style={{ fontSize: 11, color: "var(--c-bone2)", whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(ledger, null, 2)}</pre>
        </section>
      )}

      <section className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>structural-load ranking · computed</div>
        {ranking.map((r) => (
          <div key={r.node_id} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, padding: "2px 0" }}>
            <span className="hl" style={{ width: 90 }}>{r.cached_depth ?? "—"}</span>
            <span style={{ width: 40 }}>{r.cached_load_trans}</span>
            <span style={{ color: "var(--c-bone2)" }}>{r.node_id}</span>
          </div>
        ))}
      </section>

      <section className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>review inbox · builder encounters, unread (a query, not a gate)</div>
        {inbox.length === 0 && <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>— none unread.</span>}
        {inbox.map((r) => (
          <div key={r.node_id} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center", padding: "4px 0", flexWrap: "wrap" }}>
            <span style={{ color: "var(--c-bone2)", flex: 1 }}>{r.label} · {r.author_handle}</span>
            <button className="btn" style={mini} onClick={() => setEng(r.node_id, "read")}>read</button>
            <button className="btn" style={mini} onClick={() => setEng(r.node_id, "integrated")}>integrate</button>
            <button className="btn" style={{ ...mini, borderColor: "var(--c-seal)", color: "var(--c-seal)" }} onClick={() => withdraw(r.node_id)}>withdraw (conduct)</button>
          </div>
        ))}
      </section>

      <section className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>the instrument · where the climb stalls (§2) · never a reader score</div>
        {metrics
          ? <pre className="mono" style={{ fontSize: 11, color: "var(--c-bone2)", whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(metrics, null, 2)}</pre>
          : <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>telemetry loads for the architect account.</span>}
      </section>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--c-bone3)", marginTop: 10 }}>
        the razor: intelligibility carried, never time held · no streaks, no nudges, no reader-facing number
      </div>
    </div>
  );
}

const inp: CSSProperties = { padding: "8px 11px", fontSize: 13, background: "var(--c-stage2)", border: "1px solid var(--c-line)", borderRadius: 2, color: "var(--c-bone)", width: "100%", boxSizing: "border-box" };
const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
const mini: CSSProperties = { fontSize: 10.5, padding: "3px 8px", minHeight: 0 };
