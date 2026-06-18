/* ----------------------------------------------------------------------------
   Permanence surfaces (P16, Data-Permanence Spec). The contributor disclaimer
   (shown at signup + first contribution — informed consent is what makes
   permanence fair and lawful, §4), and the ToS / Privacy / Refund pages. Plain,
   honest, System-register copy (§17) — never philosophical prose.
   -------------------------------------------------------------------------- */

/** The frozen §4 disclaimer — surfaced at signup and at first contribution. */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="card" style={{ padding: compact ? "10px 12px" : "14px 16px", borderColor: "var(--c-line)" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>residue — read this before you contribute</div>
      <p style={{ fontSize: compact ? 12 : 13.5, color: "var(--c-bone2)", lineHeight: 1.6, margin: 0 }}>
        Anything you contribute to the corpus — continuations, grounded nodes, forum posts — becomes
        part of the permanent record and stays, attributed to your handle, even if you leave or close
        your account. This is residue: the constitution, surfaced (§36). Your personal account data
        (email, billing, your activity log) is separate and can be erased on request; your contributed
        work persists under your handle, decoupled from your identity.
      </p>
    </div>
  );
}

const Page = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="fadein" style={{ maxWidth: 640 }}>
    <div className="eyebrow">the constitution, in plain terms</div>
    <h1 className="threshold" style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 16px" }}>{title}</h1>
    <div style={{ fontSize: 14.5, color: "var(--c-bone2)", lineHeight: 1.7 }}>{children}</div>
  </div>
);

export function Terms() {
  return (
    <Page title="Terms of Service">
      <p><b>Corpus is permanent; the person is erasable.</b> Contributions you make to the corpus are
      irrevocable as corpus — they persist under your chosen handle as residue, even after you leave or
      close your account. Attribution runs to a handle you choose, never to your legal identity.</p>
      <p><b>Conduct, not content.</b> The only thing that removes a contribution from the public surface
      is conduct (spam, abuse, illegality) — suppressed and logged with its reason, never deleted, and
      never for disagreement. Disagreement is what the open graph and the verdict labels are for.</p>
      <p><b>Leaving.</b> A subscription lapse loses reading access only. A builder's departure leaves
      their nodes as residue. Account erasure deletes your personal data; your contributions stay under
      the handle, decoupled. The corpus exports as rows — it is never trapped.</p>
      <p className="mono" style={{ fontSize: 11, color: "var(--c-bone3)" }}>Provisional — pending counsel review.</p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy">
      <p><b>What we measure, and why.</b> The site records a first-party behavioral log to learn where
      meaning fails to transmit — sequencing and gloss-verification. That is the only purpose. It is
      <b> never</b> used for ad-targeting and is <b>never</b> sold. There are no ads and no third-party
      trackers.</p>
      <p><b>Two data classes.</b> CORPUS (your contributions, attributed to your handle) is permanent and
      PII-free. PERSON (email, billing, your raw activity log) is yours, owner-readable, and erasable on
      request via the single erasure path.</p>
      <p><b>Never a score.</b> Your reading is never surfaced to you or anyone as a number, streak, or
      progress meter.</p>
      <p className="mono" style={{ fontSize: 11, color: "var(--c-bone3)" }}>Provisional — pending counsel review (GDPR/CCPA).</p>
    </Page>
  );
}

export function Refund() {
  return (
    <Page title="Cancellation & Refunds">
      <p><b>Cancel anytime, one click.</b> No retention dark patterns. You manage or cancel through the
      Stripe customer portal from your account.</p>
      <p><b>Your materials persist.</b> Cancelling loses reading access to the spine; it does not erase
      anything you contributed, and it does not touch your personal data. Lapse ≠ erasure.</p>
    </Page>
  );
}
