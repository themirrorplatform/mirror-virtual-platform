import { Routes, Route } from "react-router-dom";
import { useSite } from "./app/SiteContext";
import { Chrome } from "./app/Chrome";
import { Thread } from "./templates/Thread";
import { Construction } from "./templates/Construction";
import { Home } from "./templates/Home";
import { Map, Events, About, Forum, Account, ColdGate } from "./templates/Pages";
import { SignIn } from "./templates/SignIn";
import { Terms, Privacy, Refund } from "./templates/Legal";
import { ArchitectConsole } from "./templates/ArchitectConsole";
import { BuilderSlot } from "./templates/BuilderSlot";
import { RequireRole, RequireArchitect } from "./app/guards";

/* The route table (§A4). Dynamic /t/[slug] and /c/[slug]; the rest derived.
   No front door (§2): / is the exit-reached home, not a landing. Every template
   calls the gate pipeline; the router only maps paths to templates. */
export function App() {
  const { error } = useSite();
  return (
    <Chrome>
      {error && (
        <div className="mono" style={{ fontSize: 12, color: "var(--c-seal)", marginBottom: 16 }}>
          data error: {error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:slug" element={<Thread />} />
        <Route path="/c/:slug" element={<Construction />} />
        <Route path="/map" element={<Map />} />
        <Route path="/events" element={<Events />} />
        <Route path="/about" element={<About />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/account" element={<Account />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/builder" element={<RequireRole min="build"><BuilderSlot /></RequireRole>} />
        <Route path="/architect" element={<RequireArchitect><ArchitectConsole /></RequireArchitect>} />
        <Route path="*" element={<ColdGate />} />
      </Routes>
    </Chrome>
  );
}
