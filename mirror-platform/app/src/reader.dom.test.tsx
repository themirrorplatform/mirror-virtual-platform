// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { Graph, MirrorNode } from "./types";
import type { Role, Viewport } from "./gates";

/* Render/integration tests — the gap unit tests can't cover: that the three
   gates produce the correct SURFACE per role in the DOM, the reader walk renders
   without runtime errors, and no engine telemetry leaks to a reader. */

// ---- mocks (hoisted) ----
let siteValue: {
  role: Role; viewport: Viewport; arrival: string; graph: Graph;
  loading: boolean; error: null; setRole: () => void;
};
vi.mock("./app/SiteContext", () => ({
  useSite: () => siteValue,
  SiteProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./lib/data", () => ({
  fetchThreadBySlug: vi.fn(), fetchMembranes: vi.fn(), fetchConstructionBySlug: vi.fn(),
  fetchNowList: vi.fn(), routeForNode: vi.fn(), fetchGraph: vi.fn(),
}));
vi.mock("./app/AuthContext", () => ({
  useAuth: () => ({ user: null, accountRole: "free", signOut: () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./lib/billing", () => ({ startCheckout: vi.fn(), openPortal: vi.fn() }));

import * as data from "./lib/data";
import { Thread } from "./templates/Thread";
import { Construction } from "./templates/Construction";
import { Home } from "./templates/Home";
import { Chrome } from "./app/Chrome";

function node(id: string, p: Partial<MirrorNode> = {}): MirrorNode {
  return {
    id, label: id, kind: "attempt", content_home: "mind", substrate: ["thought"],
    register: "live", rests_on: [], pulls_to: [], stage: "in_protocol",
    verdict: null, refuter: null, ...p,
  };
}
const GRAPH: Graph = {
  "could-it-suffer": node("could-it-suffer", {
    label: "Could It Suffer", rests_on: ["B1-§53"], verdict: "HELD",
    refuter: "a welfare detector reading first-person valence from third-person data",
    depth: "shallow",
  }),
  "B1-§53": node("B1-§53", { label: "The Ground", depth: "province" }),
  "the-ground": node("the-ground", { kind: "leaf/borrow", depth: "metric" }),
};

function setSite(role: Role, arrival = "cold", viewport: Viewport = "desktop") {
  siteValue = { role, viewport, arrival, graph: GRAPH, loading: false, error: null, setRole: () => {} };
}
const WEDGE = {
  node_id: "could-it-suffer", slug: "could-it-suffer", title: "Could It Suffer, and Does It Matter",
  body: null, arrived_from: "lesswrong", basin: null, featured: true, published: true,
};

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  (data.fetchThreadBySlug as Mock).mockResolvedValue(WEDGE);
  (data.fetchMembranes as Mock).mockResolvedValue([
    { id: "m1", thread_id: "could-it-suffer", construction_id: "B1-§53",
      teaser: "the proof that valence is the floor", position: 1 },
  ]);
  (data.routeForNode as Mock).mockResolvedValue("/c/b1-53");
});

function renderThread() {
  return render(
    <MemoryRouter initialEntries={["/t/could-it-suffer"]}>
      <Routes><Route path="/t/:slug" element={<Thread />} /></Routes>
    </MemoryRouter>,
  );
}

describe("Thread — Free cold arrival (transmission-first, apparatus deferred)", () => {
  beforeEach(() => setSite("free", "cold"));

  it("renders the title and the honest placeholder prose (never fabricated)", async () => {
    renderThread();
    expect(await screen.findByText(/Could It Suffer, and Does It Matter/)).toBeInTheDocument();
    expect(screen.getByText(/authored by A Reflection/)).toBeInTheDocument();
  });

  it("shows plain rail labels, NOT the builder mono sub-labels", async () => {
    renderThread();
    expect(await screen.findByText("Where this comes from")).toBeInTheDocument();
    expect(screen.getByText("What builds on this")).toBeInTheDocument();
    expect(screen.queryByText(/rests_on · the construction beneath/)).not.toBeInTheDocument();
  });

  it("defers the ledger collapsed (the wall is not shown until expanded)", async () => {
    renderThread();
    const header = await screen.findByRole("button", { name: /the honest ledger/i });
    expect(screen.queryByText(/verdict carried, not derived/)).not.toBeInTheDocument();
    fireEvent.click(header);
    expect(await screen.findByText(/verdict carried, not derived/)).toBeInTheDocument();
  });

  it("membrane is tap-to-peek: teaser hidden until tapped (never hover-only)", async () => {
    renderThread();
    const m = await screen.findByRole("button", { name: /peek at the construction beneath/i });
    expect(screen.queryByText(/the proof that valence is the floor/)).not.toBeInTheDocument();
    fireEvent.click(m);
    expect(await screen.findByText(/the proof that valence is the floor/)).toBeInTheDocument();
  });
});

describe("Thread — rigor arrival vs Builder (the register changes, not the flow)", () => {
  it("rigor arrival lifts the ledger up top (full, wall shown immediately)", async () => {
    setSite("free", "lesswrong");
    renderThread();
    expect(await screen.findByText(/verdict carried, not derived/)).toBeInTheDocument();
  });

  it("Builder sees the mono rail sub-labels and the full ledger (stage)", async () => {
    setSite("build", "cold");
    renderThread();
    expect(await screen.findByText(/rests_on · the construction beneath/)).toBeInTheDocument();
    expect(screen.getByText(/stage in_protocol/)).toBeInTheDocument();
  });
});

describe("Construction — Free hits the read gate (B-page never free)", () => {
  it("renders the read gate, not the construction", async () => {
    setSite("free", "cold");
    (data.fetchConstructionBySlug as Mock).mockResolvedValue(null); // RLS hides it from free
    render(
      <MemoryRouter initialEntries={["/c/b1-53"]}>
        <Routes><Route path="/c/:slug" element={<Construction />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/open the spine — \$24\.99\/mo/)).toBeInTheDocument();
  });
});

describe("Home — reached by exit (recognition, not greeting)", () => {
  it("shows the recognition line and the derived Now list", async () => {
    setSite("free", "cold");
    (data.fetchNowList as Mock).mockResolvedValue([{ node_id: "could-it-suffer", slug: "could-it-suffer", title: "Could It Suffer" }]);
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByText(/This place is philosophy/)).toBeInTheDocument();
    expect(await screen.findByText("Could It Suffer")).toBeInTheDocument();
  });
});

describe("Chrome — the invariant strip never reaches a reader (§4 leak closed)", () => {
  const renderChrome = () => render(<MemoryRouter><Chrome><div /></Chrome></MemoryRouter>);

  it("hides the invariant strip from Free", () => {
    setSite("free", "cold");
    renderChrome();
    expect(screen.queryByText(/open column ·/)).not.toBeInTheDocument();
  });
  it("shows the invariant strip to Builder", () => {
    setSite("build", "cold");
    renderChrome();
    expect(screen.getByText(/open column ·/)).toBeInTheDocument();
  });
});
