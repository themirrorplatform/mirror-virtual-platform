import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../app/AuthContext";

/* ----------------------------------------------------------------------------
   The builder slot (P11). The minimum admin: upload-only, append-only,
   own-slot-only. A contribution is an encounter, not an edit — it creates a NEW
   node resting on a frontier, attributed, engagement 'unread' (flag rides along:
   public immediately, rendered provisional). It can never target canon. Leave
   anytime — what you left stays as residue (§9, §36). No delete button anywhere.
   -------------------------------------------------------------------------- */

interface Mine { node_id: string; label: string; engagement: string | null; presence: string | null; conduct_status: string }

export function BuilderSlot() {
  const { user } = useAuth();
  const [f, setF] = useState({ node_id: "", label: "", content_home: "philosophy", rests_on: "" });
  const [mine, setMine] = useState<Mine[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase!.from("node").select("node_id,label,engagement,presence,conduct_status");
    setMine((data as Mine[]) ?? []); // RLS already scopes a builder to live nodes; own slot listing
  };
  useEffect(() => { load(); }, []);

  const upload = async () => {
    setBusy(true); setMsg(null);
    const payload = {
      node_id: f.node_id, label: f.label, content_home: f.content_home,
      rests_on: f.rests_on.split(",").map((x) => x.trim()).filter(Boolean),
    };
    const { data, error } = await supabase!.rpc("builder_upload", { payload });
    setMsg(error ? error.message : `published as an encounter — ${JSON.stringify(data)}`);
    setBusy(false); if (!error) { setF({ node_id: "", label: "", content_home: "philosophy", rests_on: "" }); load(); }
  };

  const depart = async () => {
    if (!confirm("Leave the project? Your nodes STAY as residue, attributed and flagged departed. Nothing is deleted.")) return;
    const { error } = await supabase!.rpc("builder_depart");
    setMsg(error ? error.message : "marked departed — your contributions persist as residue (§36)."); load();
  };

  if (!user) return <div className="card" style={{ padding: 24, textAlign: "center" }}><a className="link" href="/signin">sign in</a> to reach your slot.</div>;

  return (
    <div className="fadein">
      <div className="eyebrow">builder · your slot · upload-only, append-only, own-slot-only</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 8px" }}>Continue a thought</h1>
      <p style={{ color: "var(--c-bone2)", fontSize: 14, maxWidth: 620, marginBottom: 14 }}>
        Your contribution rests on a frontier, attributed, and never touches the canonical spine. It
        publishes at once, rendered as an unmet encounter; the architect meets it after.
      </p>

      <section className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
        <input style={inp} placeholder="new node_id (your own, e.g. W-12)" value={f.node_id} onChange={(e) => setF({ ...f, node_id: e.target.value })} />
        <input style={inp} placeholder="label — what your continuation tries to do" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} />
        <input style={inp} placeholder="rests on (the frontier you continue, e.g. B1-§53)" value={f.rests_on} onChange={(e) => setF({ ...f, rests_on: e.target.value })} />
        <button className="btn btn-solid" disabled={busy || !f.node_id || !f.rests_on} onClick={upload} style={{ justifySelf: "start" }}>{busy ? "publishing…" : "publish the encounter"}</button>
        {msg && <div className="mono" style={{ fontSize: 12, color: "var(--c-bone2)" }}>{msg}</div>}
      </section>

      <section className="card" style={{ padding: 16, marginTop: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>your encounters · how far each has been met</div>
        {mine.filter((m) => m.engagement).length === 0 && <span className="mono" style={{ fontSize: 12, color: "var(--c-bone3)" }}>— nothing yet.</span>}
        {mine.filter((m) => m.engagement).map((m) => (
          <div key={m.node_id} className="mono" style={{ fontSize: 12, display: "flex", gap: 8, padding: "2px 0" }}>
            <span className="hl" style={{ width: 120 }}>{m.engagement}{m.presence === "departed" ? " · departed" : ""}</span>
            <span style={{ color: "var(--c-bone2)" }}>{m.label}</span>
          </div>
        ))}
      </section>

      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={depart} style={{ borderColor: "var(--c-bone3)" }}>leave the project (your work stays)</button>
      </div>
    </div>
  );
}

const inp: CSSProperties = { padding: "8px 11px", fontSize: 13, background: "var(--c-stage2)", border: "1px solid var(--c-line)", borderRadius: 2, color: "var(--c-bone)", width: "100%", boxSizing: "border-box" };
