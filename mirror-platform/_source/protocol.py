#!/usr/bin/env python3
"""
THE MIRROR PLATFORM — KNOWLEDGE GEOMETRY PROTOCOL
The Mirror Platform LLC · architect: Ilya Belous

A FLUID dependency-graph engine. The graph (graph.json) is editable data;
this file is the engine that runs on it. Edit the graph, re-run, done.

INVARIANTS (enforced, not decorative):
  1. NOTHING COMPLETES. Highest stage is 'on_graph' = permanent-and-still-open.
     verdict is a LABEL, never a gate. The open column must never be empty;
     an empty open column is the seal (Book One §47), and the engine warns.
  2. depends_on is ACYCLIC. A cycle is a node grounding itself = an economy
     minting its own creditor (§25). The validator reports any cycle.
  3. DEPTH IS COMPUTED, never assigned. depth is derived from structural load
     every run, so importance can never be hand-fed from the thesis (the
     circularity that broke the first attribution). Edit edges -> depth moves.
  4. TWO GEOMETRIES. rests_on = depends_on (rigid, acyclic, construction order).
     pulls_to = encounter flow (soft, may cycle, the grounding/significance
     geometry). They are computed separately and never conflated.
  5. EDGE WEIGHT = LOAD, not frequency (§16). Structural load = transitive
     dependents in depends_on. Frequency is never used.

USAGE:
  python protocol.py --seed     # (re)build graph.json from the register .md files
  python protocol.py            # load graph.json, run the full report
  # mutation API (import or edit graph.json by hand): add_node, add_edge,
  # set_verdict, set_stage, merge_nodes, save_graph
"""
import re, json, os, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
GRAPH = os.path.join(HERE, "graph.json")
REGISTERS = {  # path : default register if cell is silent
  "/mnt/user-data/outputs/mirror-platform-register-EFT-region.md":   "confirms",
  "/mnt/user-data/outputs/mirror-platform-register-EFT-region-2.md": "confirms",
  "/mnt/user-data/outputs/mirror-platform-register-BookOne.md":      "live",
}

# documented EFT-internal duplicate identities (dedup; fluid — extend freely)
ALIAS = {"Proof 21":"M-GF","Proof21":"M-GF","L-1":"M-GF","PP-8":"M-GF",
         "Proof 14":"Proof14","Proof 10":"Proof10","Proof 2":"Proof2","C6":"C6-R*"}

# basin classifier: first matching rule wins. (regex, content_home, reaches, substrate)
# fluid: reorder / add rules and re-seed.
BASIN_RULES = [
 (r"^Qìveld",                "language",   ["philosophy"],            ["emotion","language"]),
 (r"^(Veld|VL-|VLE|Gnoveld|Chuveld|.*veld$)", "language", [],         ["language"]),
 (r"^(Soc-|TV-|Essay|Loom)", "language",   ["philosophy"],            ["experience","emotion"]),
 (r"^MP-3",                  "meta-philosophy",["mind"],              ["emotion","belief"]),
 (r"^MP-",                   "meta-philosophy",["philosophy"],        ["belief"]),
 (r"^(L-|UT-)",              "meta-philosophy",[],                    ["belief","thought"]),
 (r"^IT-6",                  "ethics",     ["mind"],                  ["emotion","belief"]),
 (r"^IT-(1|10|7)\b",         "mind",       ["philosophy"],            ["thought","emotion"]),
 (r"^IT-",                   "meta-philosophy",["philosophy"],        ["thought","belief"]),
 (r"^T7\b",                  "mind",       ["philosophy"],            ["thought","emotion"]),
 (r"^T8\b",                  "geometry",   ["mind","physics"],        ["emotion","thought"]),
 (r"^T(1[0-7]|[1-9])\b",     "philosophy", ["meta-philosophy"],       ["thought","belief"]),
 (r"^(MC-|AA\d|Witness)",    "architecture",["meta-philosophy"],      ["belief","thought"]),
 (r"^(eft_|RECON|D-1|§17)",  "architecture",["physics"],              ["thought"]),
 (r"^M30",                   "geometry",   ["mind","physics"],        ["emotion","thought"]),
 (r"^MP-1",                  "meta-philosophy",["philosophy"],        ["belief"]),
 (r"^(M3\b|M31|M-|σ|C[0-9]|R\*|C6)", "geometry",["physics"],          ["thought"]),
 (r"^(Ph|RT|PP|Rep|Robert)", "physics",    ["geometry"],              ["thought"]),
 (r"^(E[0-9]|EA|O[0-9]|C-F|System)", "philosophy",["meta-philosophy","geometry"],["thought","belief"]),
 (r"^Proof\d+",              "mathematics/logic","geometry,physics".split(","), ["thought"]),
 (r"^SFT",                   "geometry",   ["meta-philosophy"],       ["thought"]),
 (r"^B1-§(5[0-4])\b",        "mind",       ["philosophy"],            ["thought","emotion"]),
 (r"^B1-§(5[5-9]|60)\b",     "philosophy", ["ethics"],                ["thought","emotion","experience"]),
 (r"^B1-§(4[0-9])\b",        "philosophy", ["meta-philosophy","language"],["belief","thought"]),
 (r"^B1-§(3[3-9])\b",        "philosophy", ["physics","geometry"],    ["thought"]),
 (r"^B1-§(2[4-9]|3[0-2])\b", "philosophy", ["meta-philosophy"],       ["belief","thought"]),
 (r"^B1-§(19|2[0-3])\b",     "philosophy", [],                        ["experience","thought"]),
 (r"^B1-§(1[2-8])\b",        "philosophy", ["meta-philosophy"],       ["belief","emotion"]),
 (r"^B1-§([6-9]|1[01])\b",   "philosophy", [],                        ["thought","experience"]),
 (r"^B1-§[1-5]\b",           "philosophy", ["meta-philosophy"],       ["belief","experience"]),
 (r"^B1-",                   "philosophy", [],                        ["thought"]),
]
PROSE_LEAVES = {"the surplus","the reader's case","Landauer","governing-PDE","the surplus?"}

# ---------- parsing the register markdown into nodes ----------
H = re.compile(r"\*\*(.+?)\*\*"); BR = re.compile(r"^\[(.+)\]$")
def _clean_dep(d):
    d = re.sub(r"\s*(via|·|—|--).*$","",d.strip()).strip(" ?*")
    return d
def _verdict_bits(cell):
    reg = "live" if "live" in cell else ("confirms" if "confirms" in cell else None)
    vm = re.search(r"\b(HOLDS|QUALIFIED|GAP|UNTESTED|NAMED|OPEN|HELD|FORMULATED|"
                   r"DOCUMENTED|SPECIFIED|PROVED|STANDS|ENCOUNTERED|PARTIAL|VIOLATED|"
                   r"RESPECTED|OPERATIONAL|DIAGNOSED|LOCKED|APPROX|PROVISIONAL)", cell)
    verdict = vm.group(1) if vm else None
    stage = ("verdict_in" if "verdict_in" in cell else
             "has_result" if ("has_result" in cell or verdict) else "captured")
    return verdict, stage, reg

def parse_registers():
    raw = {}  # id -> dict
    for path, default_reg in REGISTERS.items():
        if not os.path.exists(path): continue
        for line in open(path):
            if not line.startswith("|"): continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 2: continue
            m = H.search(cells[0])
            if not m: continue
            hid = m.group(1).strip()
            label = re.sub(r"\*\*|\*|\(=.*?\)","",cells[0]).strip()
            label = re.sub(r"\s+"," ",label)[:80]
            vcell = cells[-1]
            verdict, stage, reg = _verdict_bits(vcell)
            reg = reg or default_reg
            deps_cell = next((BR.match(c).group(1) for c in cells[1:] if BR.match(c)), None)
            deps = []
            if deps_cell and not re.match(r"^[\d.,\s]+$", deps_cell):
                for r in deps_cell.split(","):
                    d=_clean_dep(r)
                    if d and not re.match(r"^[\d.\s]+$",d): deps.append(d)
            node = raw.setdefault(hid, {"id":hid,"label":label,"rests_on":[]})
            node["rests_on"] = sorted(set(node["rests_on"]) | set(deps))
            node["verdict"]=verdict; node["stage"]=stage; node["register"]=reg
    return raw

def classify(hid):
    for rx,home,reaches,sub in BASIN_RULES:
        if re.match(rx,hid): return home,list(reaches),list(sub)
    return ("philosophy",[],["thought"])

def alias(x): return ALIAS.get(x,x)

# ---------- build / load / save ----------
def build_graph():
    raw = parse_registers()
    # ensure dependency targets exist as (leaf) nodes
    ids = set(raw)
    for n in list(raw.values()):
        for d in n["rests_on"]:
            ids.add(alias(d))
    nodes={}
    for hid in ids:
        base = raw.get(hid, {"id":hid,"label":hid,"rests_on":[],
                             "verdict":None,"stage":"captured","register":None})
        home,reaches,sub = classify(hid)
        leaf = hid in PROSE_LEAVES or (hid not in raw)
        nodes[hid] = {
          "id":hid, "label":base.get("label",hid),
          "kind":"leaf/borrow" if leaf else "attempt",
          "content_home":home, "content_reaches":reaches, "substrate":sub,
          "register":base.get("register"),
          "rests_on":[alias(d) for d in base.get("rests_on",[]) if alias(d)!=hid],
          "pulls_to":[],                       # second geometry, seeded empty
          "stage":base.get("stage","captured"),
          "verdict":base.get("verdict"),
          "verdict_source":"carried" if base.get("verdict") else None,
          "refuter":None,                      # to be posted; null = seal-risk if HOLDS
          "depth":None,                        # COMPUTED each run, never stored as truth
          "supersession":base.get("register"),
          "flags":(["placeholder"] if hid in {"the surplus","the surplus?"} else []),
        }
    g = {"meta":{"invariants":"nothing completes; depends_on acyclic; depth computed; "
                 "verdict is a label; two geometries; load not frequency",
                 "note":"FLUID. Edit nodes/edges and re-run. 'the surplus' is a flagged "
                        "placeholder ground used across EFT rows; discount its load."},
         "nodes":nodes}
    seed_refuters(g)   # the few Book One posts explicitly
    return g

def seed_refuters(g):
    R = {"B1-§1":"the fetched case is incoherent, or a §16 counterfeit suffices",
         "B1-§25":"exhibit an economy minting its own creditor",
         "B1-§30":"exhibit the forms of holding bootstrapped from within",
         "B1-§53":"exhibit stakes without valence (truth-apt, wrong-able, nothing matters)",
         "B1-§16":"a §16 counterfeit constitutes internal bearing with nothing left over",
         "B1-§34":"engagement without commensurability (settlement between incommensurables)",
         "B1-§36":"a re-founding with no residue (books that start fresh, owe nothing)",
         "B1-§48":"the two-axis frame fails its own revenge form"}
    for k,v in R.items():
        if k in g["nodes"]: g["nodes"][k]["refuter"]=v

def load_graph(path=GRAPH):
    return json.load(open(path))
def save_graph(g,path=GRAPH):
    json.dump(g,open(path,"w"),ensure_ascii=False,indent=1)

# ---------- analytics ----------
def _children(g):
    ch=defaultdict(set)
    for n in g["nodes"].values():
        for p in n["rests_on"]:
            if p in g["nodes"] and p!=n["id"]: ch[p].add(n["id"])
    return ch
def structural_load(g):
    ch=_children(g); out={}
    for nid in g["nodes"]:
        seen=set(); st=list(ch.get(nid,()))
        while st:
            x=st.pop()
            if x in seen: continue
            seen.add(x); st.extend(ch.get(x,()))
        out[nid]=(len(ch.get(nid,())),len(seen))
    return out
def assign_depth(g,load):
    ranked=sorted(g["nodes"],key=lambda n:-load[n][1])
    N=len(ranked)
    for i,nid in enumerate(ranked):
        f=i/max(1,N)
        g["nodes"][nid]["depth"]=("metric" if f<0.05 else "load-bearing" if f<0.20
                                  else "province" if f<0.50 else "shallow")
def find_cycles(g):
    color={}; cyc=[]
    def dfs(u,stack):
        color[u]=1; stack.append(u)
        for p in g["nodes"].get(u,{}).get("rests_on",[]):
            if p not in g["nodes"]: continue
            if color.get(p)==1: cyc.append(stack[stack.index(p):]+[p])
            elif color.get(p,0)==0: dfs(p,stack)
        stack.pop(); color[u]=2
    for n in g["nodes"]:
        if color.get(n,0)==0: dfs(n,[])
    return cyc
def components(g):
    adj=defaultdict(set)
    for n in g["nodes"].values():
        for p in n["rests_on"]:
            if p in g["nodes"]:
                adj[n["id"]].add(p); adj[p].add(n["id"])
    seen=set(); comps=[]
    for n in g["nodes"]:
        if n in seen: continue
        stack=[n]; comp=set()
        while stack:
            x=stack.pop()
            if x in seen: continue
            seen.add(x); comp.add(x); stack.extend(adj.get(x,()))
        comps.append(comp)
    return sorted(comps,key=len,reverse=True)
def open_column(g):
    return [n["id"] for n in g["nodes"].values()
            if n["stage"]!="verdict_in" or (n["verdict"] in
            {"OPEN","HELD","GAP","UNTESTED","NAMED","QUALIFIED","PARTIAL"})]
def seal_check(g):
    return [n["id"] for n in g["nodes"].values()
            if n["verdict"] in {"HOLDS","HELD","STANDS","RESPECTED"} and not n["refuter"]]

# ---------- the protocol: verify-and-label loop ----------
def next_action(n):
    if n["kind"]=="leaf/borrow": return "leaf — no action (a ground, not an attempt)"
    if n["stage"]=="captured":   return "→ produce/locate a result"
    if n["verdict_source"]=="carried": return "→ VERIFY: re-derive verdict against a wall (currently carried)"
    if not n["refuter"] and n["verdict"] in {"HOLDS","HELD"}: return "→ POST a refuter (seal-risk)"
    if n["stage"]!="verdict_in": return "→ run protocol pass"
    return "on_graph (held, still open)"
def run_protocol(g):
    work=defaultdict(list)
    for n in g["nodes"].values():
        work[next_action(n)].append(n["id"])
    return work

def grounding_load(g):
    """Transitive pulls-toward count over the pulls_to (encounter/grounding)
    geometry. The grounding analogue of structural_load. May include cycles;
    handled by the visited-set. This is where §53's grounding claim is testable."""
    pc=defaultdict(set)  # parent -> set of nodes that pull toward it
    for n in g["nodes"].values():
        for p in n.get("pulls_to",[]):
            if p in g["nodes"] and p!=n["id"]: pc[p].add(n["id"])
    out={}
    for nid in g["nodes"]:
        seen=set(); st=list(pc.get(nid,()))
        while st:
            x=st.pop()
            if x in seen: continue
            seen.add(x); st.extend(pc.get(x,()))
        out[nid]=(len(pc.get(nid,())),len(seen))
    return out

# ---------- mutation API (the fluidity contract) ----------
def add_node(g, nid, **fields):
    home,reaches,sub = classify(nid)
    n={"id":nid,"label":fields.get("label",nid),"kind":fields.get("kind","attempt"),
       "content_home":fields.get("content_home",home),
       "content_reaches":fields.get("content_reaches",reaches),
       "substrate":fields.get("substrate",sub),
       "register":fields.get("register"),"rests_on":fields.get("rests_on",[]),
       "pulls_to":fields.get("pulls_to",[]),"stage":fields.get("stage","captured"),
       "verdict":fields.get("verdict"),"verdict_source":fields.get("verdict_source"),
       "refuter":fields.get("refuter"),"depth":None,
       "supersession":fields.get("supersession",fields.get("register")),"flags":fields.get("flags",[])}
    g["nodes"][nid]=n; return n
def add_edge(g, child, parent, geometry="rests_on"):
    if child not in g["nodes"]: add_node(g,child)
    if parent not in g["nodes"]: add_node(g,parent,kind="leaf/borrow")
    lst=g["nodes"][child].setdefault(geometry,[])
    if parent not in lst and parent!=child: lst.append(parent)
def remove_edge(g, child, parent, geometry="rests_on"):
    if child in g["nodes"] and parent in g["nodes"][child].get(geometry,[]):
        g["nodes"][child][geometry].remove(parent)
def move_edge(g, child, parent, frm="rests_on", to="pulls_to"):
    """A cycle in depends_on means this edge was an encounter relation, not a
    construction dependency. Move it to the soft geometry. Returns True if moved."""
    if parent in g["nodes"].get(child,{}).get(frm,[]):
        remove_edge(g,child,parent,frm); add_edge(g,child,parent,to); return True
    return False
def set_verdict(g, nid, verdict, source="derived", refuter=None):
    n=g["nodes"][nid]; n["verdict"]=verdict; n["verdict_source"]=source
    if refuter is not None: n["refuter"]=refuter
    if source=="derived": n["stage"]="verdict_in"
def set_stage(g, nid, stage): g["nodes"][nid]["stage"]=stage
def merge_nodes(g, keep, drop):
    """Collapse a duplicate (e.g. Proof21 into M-GF). Edges re-point to `keep`."""
    if drop not in g["nodes"] or keep not in g["nodes"]: return
    d=g["nodes"].pop(drop)
    for geo in ("rests_on","pulls_to"):
        for p in d.get(geo,[]):
            if p!=keep: add_edge(g,keep,p,geo)
    for n in g["nodes"].values():
        for geo in ("rests_on","pulls_to"):
            n[geo]=[keep if x==drop else x for x in n.get(geo,[]) if not (x==drop and keep in n.get(geo,[]))]
    g["nodes"][keep].setdefault("flags",[]).append(f"merged:{drop}")

# ---------- report ----------
def report(g):
    load=structural_load(g); assign_depth(g,load)
    nodes=g["nodes"]
    print(f"\n{'='*64}\nKNOWLEDGE GEOMETRY PROTOCOL — RUN REPORT")
    print(f"nodes={len(nodes)}  depends_on edges="
          f"{sum(len(n['rests_on']) for n in nodes.values())}\n{'='*64}")

    print("\nSTRUCTURAL LOAD (transitive dependents) — top 15  [load not frequency]")
    for nid in sorted(nodes,key=lambda n:-load[n][1])[:15]:
        n=nodes[nid]; d,t=load[nid]
        flag=" *placeholder*" if "placeholder" in n["flags"] else ""
        print(f"  {nid:<20} dir={d:>3} trans={t:>3}  [{n['depth']}] {n['register'] or '·'}{flag}")

    cyc=find_cycles(g)
    print(f"\nFIREWALL (depends_on acyclic?)  {'OK — no cycles' if not cyc else 'VIOLATION: '+str(cyc)}")

    comps=components(g)
    print(f"\nCOMPONENTS (disconnected sub-graphs): {len(comps)}  sizes={[len(c) for c in comps[:5]]}")
    # name the two big ones
    for c in comps[:2]:
        b1=sum(1 for x in c if x.startswith('B1-')); eft=len(c)-b1
        tag="Book One (live spine)" if b1>eft else "EFT region (confirms)"
        print(f"   • {len(c):>3} nodes — {tag}  (B1={b1}, EFT/other={eft})")

    print("\nREGISTER SPLIT")
    rs=defaultdict(int)
    for n in nodes.values(): rs[n["register"] or "unset"]+=1
    for k,v in sorted(rs.items(),key=lambda x:-x[1]): print(f"  {k:<10}{v}")

    print("\nCONTENT-BASIN DISTRIBUTION (home only)")
    cb=defaultdict(int)
    for n in nodes.values():
        if n["kind"]!="leaf/borrow": cb[n["content_home"]]+=1
    for k,v in sorted(cb.items(),key=lambda x:-x[1]): print(f"  {k:<20}{v}")

    print("\nSUBSTRATE LOAD vs COUNT  (the frequency-vs-load test, per axis)")
    cnt=defaultdict(int); lod=defaultdict(int)
    for n in nodes.values():
        if n["kind"]=="leaf/borrow": continue
        for s in n["substrate"]:
            cnt[s]+=1; lod[s]+=load[n["id"]][1]
    for s in ["thought","belief","experience","emotion","language"]:
        print(f"  {s:<12} count={cnt[s]:>3}  summed-load={lod[s]:>4}  "
              f"load/node={lod[s]/max(1,cnt[s]):.1f}")

    oc=open_column(g); sk=seal_check(g)
    print(f"\nOPEN COLUMN: {len(oc)} nodes open  "
          f"{'(invariant OK: never empty)' if oc else '*** EMPTY = SEAL — INVARIANT BREACH ***'}")
    print(f"SEAL-RISK (HOLDS/HELD with no posted refuter): {len(sk)} nodes "
          f"— need a refuter before any verdict hardens")

    print("\nPROTOCOL WORKLIST (verify-and-label loop)")
    for action,ids in sorted(run_protocol(g).items(),key=lambda x:-len(x[1])):
        print(f"  [{len(ids):>3}] {action}")

    print(f"\nNOTE: depth recomputed this run from load; verdicts are carried "
          f"(verdict_source='carried'), not yet derived against a wall.")
    print("="*64)

if __name__=="__main__":
    if "--seed" in sys.argv or not os.path.exists(GRAPH):
        g=build_graph(); save_graph(g); print(f"seeded -> {GRAPH}")
    g=load_graph(); report(g); save_graph(g)  # save back with computed depth
