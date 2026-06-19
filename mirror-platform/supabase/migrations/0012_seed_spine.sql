-- ============================================================================
-- The Mirror Platform — 0012 seed: the minimum viable paid spine (P17 structure)
-- GENERATED from supabase/seed/spine-seed.json by scripts/gen-seed-sql.mjs.
-- Do not edit by hand; re-run the generator. Idempotent (upsert / coalesce).
--
-- Ingests the spine exactly as wired: every node into the §4.1 `node` source of
-- truth, edges through the firewall triggers (0002), geometry via the engine's
-- recompute_geometry(), and the A/B presentations into thread/construction with
-- their membranes + atlas rows. Bodies / share_lines are PLACEHOLDERS copied
-- verbatim from the seed; existing authored values are preserved (coalesce).
-- ============================================================================
begin;

-- the architect handle is the corpus author-anchor (Permanence §0)
insert into handle (handle, display, is_architect) values ('a-reflection','A Reflection',true)
  on conflict (handle) do nothing;

-- ── Phase 1: every node exists (single source of truth, §4.1) ───────────────
insert into node (node_id,label,kind,content_home,register,stage,verdict,verdict_source,refuter,author_handle) values
  ('could-it-suffer','Could It Suffer, and Does It Matter','attempt'::kind,'ethics','live'::register,'in_protocol'::stage,'HELD','carried'::verdict_source,'a welfare detector that reads first-person valence from third-person data without a self-report or a behavioral proxy','a-reflection'),
  ('essay-grief','There Is a Song I Cannot Listen to Anymore','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'ENCOUNTERED','derived'::verdict_source,'a grief that deforms nothing and leaves no permanent trace','a-reflection'),
  ('essay-betrayal','Nobody Teaches You How to Read a Room','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'ENCOUNTERED','derived'::verdict_source,'a betrayal that recalibrates nothing in how the person reads the next encounter','a-reflection'),
  ('essay-intelligence','Change Only Happens at the Depth It Is Allowed to Reach','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'ENCOUNTERED','derived'::verdict_source,'a change that takes hold at a depth the encounter was never allowed to reach','a-reflection'),
  ('B1-§1','The Sentence','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'the fetched case is incoherent, or a §16 counterfeit suffices','a-reflection'),
  ('B1-§3','The Method','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'derive a forced conclusion the method blocks, or pass a smuggling it should cut (Descartes'' substance / Kant''s forms / Husserl''s ego)','a-reflection'),
  ('B1-§6','Appearing-As','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§7','The Cessation Boundary','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§8','The Far End','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§9','The Someone','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§10','The Bend','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§12','The Knife','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'exhibit a smuggling the knife passes, or a forced step it severs','a-reflection'),
  ('B1-§13','The Minimum Structure of Wrongness','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'exhibit a wrongness with no coming-apart between the as-side and the of-side','a-reflection'),
  ('B1-§14','Wrongness Before Recognition','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'exhibit wrongness that requires prior recognition to obtain — error that cannot precede being caught','a-reflection'),
  ('B1-§15','The Measure in the House','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'exhibit holding-with-measure that carries no valence — calibration with zero love/hate','a-reflection'),
  ('B1-§16','The Hook Is Real','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'a §16 counterfeit constitutes internal bearing with nothing left over','a-reflection'),
  ('B1-§19','The Participant','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§25','Closure','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'exhibit an economy minting its own creditor','a-reflection'),
  ('B1-§26','Contact','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§29','The Honest Accounting','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§30','The Unauthored Author','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'exhibit the forms of holding bootstrapped from within','a-reflection'),
  ('B1-§31','The Harvest','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§33','The Entrance','attempt'::kind,'philosophy','live'::register,'captured'::stage,null,'carried'::verdict_source,null,'a-reflection'),
  ('B1-§34','The Field','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'engagement without commensurability (settlement between incommensurables)','a-reflection'),
  ('B1-§35','The Encounter','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§36','What Stays','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'a re-founding with no residue (books that start fresh, owe nothing)','a-reflection'),
  ('B1-§43','What Holds','attempt'::kind,'philosophy','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'exhibit truth that is not a holding — correctness with no holder, no stake, no measure','a-reflection'),
  ('B1-§44','The Bridge','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§48','The Strange Authority','attempt'::kind,'philosophy','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,'the two-axis frame fails its own revenge form','a-reflection'),
  ('B1-§50','The Felt','attempt'::kind,'mind','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§51','The Fork','attempt'::kind,'mind','live'::register,'has_result'::stage,'OPEN','carried'::verdict_source,null,'a-reflection'),
  ('B1-§52','The Diagonal','attempt'::kind,'mind','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('B1-§53','The Ground','attempt'::kind,'mind','live'::register,'in_protocol'::stage,'HOLDS','carried'::verdict_source,'exhibit stakes without valence (truth-apt, wrong-able, nothing matters)','a-reflection'),
  ('IT-6','AI False Model — Emotional Amputation (the severing claim)','attempt'::kind,'ethics','live'::register,'has_result'::stage,'HOLDS','carried'::verdict_source,null,'a-reflection'),
  ('the reader''s case','the reader''s case','leaf/borrow'::kind,'philosophy','live'::register,'captured'::stage,null,null,null,'a-reflection')
on conflict (node_id) do update set
  label=excluded.label, kind=excluded.kind, content_home=excluded.content_home,
  register=excluded.register, stage=excluded.stage, verdict=excluded.verdict,
  verdict_source=excluded.verdict_source, refuter=excluded.refuter;

-- ── Phase 2: edges (the firewall trigger validates acyclicity per insert) ────
delete from edge where source = any(ARRAY['could-it-suffer','essay-grief','essay-betrayal','essay-intelligence','B1-§1','B1-§3','B1-§6','B1-§7','B1-§8','B1-§9','B1-§10','B1-§12','B1-§13','B1-§14','B1-§15','B1-§16','B1-§19','B1-§25','B1-§26','B1-§29','B1-§30','B1-§31','B1-§33','B1-§34','B1-§35','B1-§36','B1-§43','B1-§44','B1-§48','B1-§50','B1-§51','B1-§52','B1-§53','IT-6']::text[]);
insert into edge (source,target,type) values
  ('could-it-suffer','IT-6','rests_on'::edge_type),
  ('could-it-suffer','B1-§53','rests_on'::edge_type),
  ('could-it-suffer','B1-§30','pulls_to'::edge_type),
  ('essay-grief','B1-§53','rests_on'::edge_type),
  ('essay-grief','B1-§36','rests_on'::edge_type),
  ('essay-grief','B1-§53','pulls_to'::edge_type),
  ('essay-betrayal','B1-§16','rests_on'::edge_type),
  ('essay-betrayal','B1-§43','pulls_to'::edge_type),
  ('essay-intelligence','B1-§50','rests_on'::edge_type),
  ('essay-intelligence','B1-§53','pulls_to'::edge_type),
  ('B1-§1','the reader''s case','rests_on'::edge_type),
  ('B1-§1','B1-§53','pulls_to'::edge_type),
  ('B1-§1','B1-§30','pulls_to'::edge_type),
  ('B1-§3','B1-§1','rests_on'::edge_type),
  ('B1-§6','B1-§1','rests_on'::edge_type),
  ('B1-§7','B1-§6','rests_on'::edge_type),
  ('B1-§8','B1-§6','rests_on'::edge_type),
  ('B1-§8','B1-§7','rests_on'::edge_type),
  ('B1-§9','B1-§6','rests_on'::edge_type),
  ('B1-§10','B1-§8','rests_on'::edge_type),
  ('B1-§10','B1-§9','rests_on'::edge_type),
  ('B1-§12','B1-§3','rests_on'::edge_type),
  ('B1-§13','B1-§12','rests_on'::edge_type),
  ('B1-§13','B1-§53','pulls_to'::edge_type),
  ('B1-§14','B1-§13','rests_on'::edge_type),
  ('B1-§15','B1-§14','rests_on'::edge_type),
  ('B1-§15','B1-§53','pulls_to'::edge_type),
  ('B1-§16','B1-§15','rests_on'::edge_type),
  ('B1-§16','B1-§53','pulls_to'::edge_type),
  ('B1-§19','B1-§15','rests_on'::edge_type),
  ('B1-§25','B1-§13','rests_on'::edge_type),
  ('B1-§25','B1-§19','rests_on'::edge_type),
  ('B1-§26','B1-§25','rests_on'::edge_type),
  ('B1-§29','B1-§25','rests_on'::edge_type),
  ('B1-§30','B1-§29','rests_on'::edge_type),
  ('B1-§30','B1-§53','pulls_to'::edge_type),
  ('B1-§31','B1-§30','rests_on'::edge_type),
  ('B1-§33','B1-§31','rests_on'::edge_type),
  ('B1-§34','B1-§26','rests_on'::edge_type),
  ('B1-§34','B1-§33','rests_on'::edge_type),
  ('B1-§35','B1-§34','rests_on'::edge_type),
  ('B1-§36','B1-§29','rests_on'::edge_type),
  ('B1-§36','B1-§34','rests_on'::edge_type),
  ('B1-§43','B1-§15','rests_on'::edge_type),
  ('B1-§43','B1-§35','rests_on'::edge_type),
  ('B1-§43','B1-§53','pulls_to'::edge_type),
  ('B1-§43','B1-§30','pulls_to'::edge_type),
  ('B1-§44','B1-§29','rests_on'::edge_type),
  ('B1-§44','B1-§43','rests_on'::edge_type),
  ('B1-§44','B1-§30','pulls_to'::edge_type),
  ('B1-§44','B1-§53','pulls_to'::edge_type),
  ('B1-§48','B1-§13','rests_on'::edge_type),
  ('B1-§48','B1-§43','rests_on'::edge_type),
  ('B1-§50','B1-§10','rests_on'::edge_type),
  ('B1-§50','B1-§44','rests_on'::edge_type),
  ('B1-§51','B1-§16','rests_on'::edge_type),
  ('B1-§51','B1-§50','rests_on'::edge_type),
  ('B1-§52','B1-§50','rests_on'::edge_type),
  ('B1-§52','B1-§51','rests_on'::edge_type),
  ('B1-§53','B1-§13','rests_on'::edge_type),
  ('B1-§53','B1-§48','rests_on'::edge_type),
  ('B1-§53','B1-§52','rests_on'::edge_type),
  ('IT-6','B1-§53','rests_on'::edge_type)
on conflict (source,target,type) do nothing;

-- ── Phase 3: the engine recomputes load + depth from the edges (§5) ─────────
select recompute_geometry();

-- ── Phase 4: B-page presentations (gated; placeholder body, never clobbered) ─
insert into construction (node_id,slug,title,body,min_tier,published) values
  ('B1-§1','b1-1','The Sentence',to_jsonb('[[PASTE — Book One B1-§1 “The Sentence” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§3','b1-3','The Method',to_jsonb('[[PASTE — Book One B1-§3 “The Method” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§6','b1-6','Appearing-As',to_jsonb('[[PASTE — Book One B1-§6 “Appearing-As” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§7','b1-7','The Cessation Boundary',to_jsonb('[[PASTE — Book One B1-§7 “The Cessation Boundary” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§8','b1-8','The Far End',to_jsonb('[[PASTE — Book One B1-§8 “The Far End” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§9','b1-9','The Someone',to_jsonb('[[PASTE — Book One B1-§9 “The Someone” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§10','b1-10','The Bend',to_jsonb('[[PASTE — Book One B1-§10 “The Bend” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§12','b1-12','The Knife',to_jsonb('[[PASTE — Book One B1-§12 “The Knife” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§13','b1-13','The Minimum Structure of Wrongness',to_jsonb('[[PASTE — Book One B1-§13 “The Minimum Structure of Wrongness” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§14','b1-14','Wrongness Before Recognition',to_jsonb('[[PASTE — Book One B1-§14 “Wrongness Before Recognition” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§15','b1-15','The Measure in the House',to_jsonb('[[PASTE — Book One B1-§15 “The Measure in the House” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§16','b1-16','The Hook Is Real',to_jsonb('[[PASTE — Book One B1-§16 “The Hook Is Real” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§19','b1-19','The Participant',to_jsonb('[[PASTE — Book One B1-§19 “The Participant” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§25','b1-25','Closure',to_jsonb('[[PASTE — Book One B1-§25 “Closure” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§26','b1-26','Contact',to_jsonb('[[PASTE — Book One B1-§26 “Contact” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§29','b1-29','The Honest Accounting',to_jsonb('[[PASTE — Book One B1-§29 “The Honest Accounting” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§30','b1-30','The Unauthored Author',to_jsonb('[[PASTE — Book One B1-§30 “The Unauthored Author” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§31','b1-31','The Harvest',to_jsonb('[[PASTE — Book One B1-§31 “The Harvest” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§33','b1-33','The Entrance',to_jsonb('[[PASTE — Book One B1-§33 “The Entrance” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§34','b1-34','The Field',to_jsonb('[[PASTE — Book One B1-§34 “The Field” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§35','b1-35','The Encounter',to_jsonb('[[PASTE — Book One B1-§35 “The Encounter” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§36','b1-36','What Stays',to_jsonb('[[PASTE — Book One B1-§36 “What Stays” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§43','b1-43','What Holds',to_jsonb('[[PASTE — Book One B1-§43 “What Holds” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§44','b1-44','The Bridge',to_jsonb('[[PASTE — Book One B1-§44 “The Bridge” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§48','b1-48','The Strange Authority',to_jsonb('[[PASTE — Book One B1-§48 “The Strange Authority” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§50','b1-50','The Felt',to_jsonb('[[PASTE — Book One B1-§50 “The Felt” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§51','b1-51','The Fork',to_jsonb('[[PASTE — Book One B1-§51 “The Fork” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§52','b1-52','The Diagonal',to_jsonb('[[PASTE — Book One B1-§52 “The Diagonal” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('B1-§53','b1-53','The Ground',to_jsonb('[[PASTE — Book One B1-§53 “The Ground” : full section prose, A Reflection’s voice. AI-prose ban (§17) holds.]]'::text),'continuations'::tier,true),
  ('IT-6','it-6','AI False Model — Emotional Amputation (the severing claim)',to_jsonb('[[PASTE — the severing claim in A Reflection’s voice: training-on-descriptions severs signal-from-state; why the AI case differs from the bat. Adapt from the wedge essay § on the firewall.]]'::text),'continuations'::tier,true)
on conflict (node_id) do update set
  slug=excluded.slug, title=excluded.title,
  body=coalesce(construction.body, excluded.body),
  min_tier=excluded.min_tier, published=excluded.published;

-- ── Phase 5: A-page presentations (entry public; essays tier-gated) ─────────
insert into thread (node_id,slug,title,body,arrived_from,featured,published,share_line) values
  ('could-it-suffer','could-it-suffer','Could It Suffer, and Does It Matter',to_jsonb('[[PASTE — the wedge essay (could-it-suffer-does-it-matter-v3). Place the two membranes inline where the prose bears on IT-6 and §53.]]'::text),'lesswrong',true,true,to_jsonb('[[PASTE — author-owned share line, one sentence, A Reflection’s voice]]'::text)),
  ('essay-grief','essay-grief','There Is a Song I Cannot Listen to Anymore',to_jsonb('[[PASTE — published grief essay, A Reflection’s voice. Membranes into §36 and §53.]]'::text),null,false,true,to_jsonb('[[PASTE — author-owned share line]]'::text)),
  ('essay-betrayal','essay-betrayal','Nobody Teaches You How to Read a Room',to_jsonb('[[PASTE — published betrayal essay. Membrane into §16.]]'::text),null,false,true,to_jsonb('[[PASTE — author-owned share line]]'::text)),
  ('essay-intelligence','essay-intelligence','Change Only Happens at the Depth It Is Allowed to Reach',to_jsonb('[[PASTE — published intelligence essay. Membrane into §50.]]'::text),null,false,true,to_jsonb('[[PASTE — author-owned share line]]'::text))
on conflict (node_id) do update set
  slug=excluded.slug, title=excluded.title,
  body=coalesce(thread.body, excluded.body),
  arrived_from=excluded.arrived_from, featured=excluded.featured, published=excluded.published,
  share_line=coalesce(thread.share_line, excluded.share_line);

-- ── Phase 6: membranes (the descend walk; structure, freely rebuilt) ────────
delete from membrane where thread_id = any(ARRAY['could-it-suffer','essay-grief','essay-betrayal','essay-intelligence']::text[]);
insert into membrane (thread_id,construction_id,teaser,position) values
  ('could-it-suffer','IT-6','the severing claim — the load-bearing weld',0),
  ('could-it-suffer','B1-§53','§53 — emotion as the non-truth-apt ground',1),
  ('essay-grief','B1-§36','What Stays — the deposit is permanent',0),
  ('essay-grief','B1-§53','the ground the grief moves',1),
  ('essay-betrayal','B1-§16','The Hook Is Real — the instrument that gets recalibrated',0),
  ('essay-intelligence','B1-§50','The Felt — depth is metric proximity, not intensity',0);

-- ── Phase 7: the atlas (structure, freely rebuilt) ──────────────────────────
delete from map_entry;
insert into map_entry (domain,verb,owes,status,node_id) values
  ('AI welfare','reframes','the severing claim must hold under interpretability advances','built','could-it-suffer'),
  ('Grief / the permanent past','applies','the deposit bound is physiological (§36)','built','essay-grief'),
  ('Reading people','applies','identity is positional, recalibrated by encounter','built','essay-betrayal'),
  ('How change takes hold','reframes','depth is metric proximity, not felt intensity','built','essay-intelligence'),
  ('Truth','reframes','shrinkage under the other as the test of holding (§43)','coming',null),
  ('Consciousness','dissolves','the hard problem relocated, §51 fork open','coming',null);

-- the why-ledger note (§8): history, not declaration
insert into commit_ledger (node_id, summary, diff) values
  (null, 'seed 0012: minimum viable paid spine',
   jsonb_build_object('continuations',4,'constructions',30,
     'leaves',1,'edges',63,'map_entries',6,
     'source','supabase/seed/spine-seed.json'));

commit;
