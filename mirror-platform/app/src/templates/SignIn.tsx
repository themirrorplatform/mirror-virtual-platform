import { useState } from "react";
import { useAuth, type OAuthProvider } from "../app/AuthContext";
import { Disclaimer } from "./Legal";

/* ----------------------------------------------------------------------------
   Sign in — three methods, one session (the architect's routing requirement):
   magic link (lowest-friction entry), email+password (the forum), OAuth (for
   subscribers). The architect account is the allowlisted email; no method here
   elevates to architect by itself — that is the email-gated handle (0008).
   -------------------------------------------------------------------------- */

export function SignIn() {
  const { user, accountRole, signInMagicLink, signInPassword, signUpPassword, signInOAuth, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ error: string | null }>, ok: string) => {
    setBusy(true); setMsg(null);
    const { error } = await fn();
    setMsg(error ?? ok); setBusy(false);
  };

  if (user) {
    return (
      <div className="fadein">
        <div className="eyebrow">account</div>
        <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 10px" }}>Signed in</h1>
        <p className="mono" style={{ fontSize: 13, color: "var(--c-bone2)" }}>
          {user.email} · register: <span className="hl">{accountRole}</span>
        </p>
        <button className="btn" style={{ marginTop: 16 }} onClick={signOut}>sign out</button>
      </div>
    );
  }

  return (
    <div className="fadein" style={{ maxWidth: 420 }}>
      <div className="eyebrow">enter</div>
      <h1 className="threshold" style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 16px" }}>Sign in</h1>

      <label className="eyebrow" htmlFor="email">email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="system" style={inp} placeholder="you@example.com" />

      <button className="btn btn-solid" style={{ width: "100%", marginTop: 10 }} disabled={busy || !email}
        onClick={() => run(() => signInMagicLink(email), "Check your email for the sign-in link.")}>
        send a magic link
      </button>

      <div className="eyebrow" style={{ margin: "20px 0 6px" }}>or with a password (the forum)</div>
      <label className="eyebrow" htmlFor="pw">password</label>
      <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="system" style={inp} placeholder="••••••••" />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn" style={{ flex: 1 }} disabled={busy || !email || !password}
          onClick={() => run(() => signInPassword(email, password), "Signed in.")}>sign in</button>
        <button className="btn" style={{ flex: 1 }} disabled={busy || !email || !password}
          onClick={() => run(() => signUpPassword(email, password), "Account created — check your email to confirm.")}>create account</button>
      </div>

      <div className="eyebrow" style={{ margin: "20px 0 6px" }}>or continue with</div>
      <div style={{ display: "flex", gap: 8 }}>
        {(["google", "github"] as OAuthProvider[]).map((p) => (
          <button key={p} className="btn" style={{ flex: 1, textTransform: "capitalize" }} disabled={busy}
            onClick={() => run(() => signInOAuth(p), `Redirecting to ${p}…`)}>{p}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--c-bone3)", marginTop: 8 }}>
        OAuth activates once the provider is configured in the Supabase dashboard.
      </div>

      {msg && <div className="mono" style={{ fontSize: 12, color: "var(--c-steel)", marginTop: 14 }}>{msg}</div>}

      <div style={{ marginTop: 20 }}><Disclaimer compact /></div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", marginTop: 4, fontSize: 14,
  background: "var(--c-stage2)", border: "1px solid var(--c-line)",
  borderRadius: 2, color: "var(--c-bone)",
};
