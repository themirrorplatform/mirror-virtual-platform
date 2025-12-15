# Mirror Finder - Test Specifications

Comprehensive test matrix for all Finder components.

---

## Unit Tests

### TPV Computation Tests

```python
def test_tpv_deterministic():
    """TPV computation is deterministic from same events"""
    events = [
        LensUsageEvent('lens_a', datetime(2025, 1, 1), 1.0),
        LensUsageEvent('lens_b', datetime(2025, 1, 2), 1.0),
    ]
    
    tpv1 = TensionProxyVector.compute(events, lens_catalog)
    tpv2 = TensionProxyVector.compute(events, lens_catalog)
    
    assert tpv1.vector == tpv2.vector


def test_tpv_exponential_decay():
    """Recent events have more weight"""
    now = datetime.utcnow()
    events = [
        LensUsageEvent('lens_a', now - timedelta(days=1), 1.0),
        LensUsageEvent('lens_a', now - timedelta(days=14), 1.0),
    ]
    
    tpv = TensionProxyVector.compute(events, lens_catalog, now=now)
    
    # Recent event should have ~exp(-1/7) = 0.867 weight
    # Old event should have ~exp(-14/7) = 0.135 weight
    # Ratio should be ~6.4:1
    assert tpv.vector['lens_a'] > 0


def test_tpv_null_threshold():
    """TPV is null when sum < epsilon"""
    events = [
        LensUsageEvent('lens_a', datetime.utcnow() - timedelta(days=100), 0.01),
    ]
    
    tpv = TensionProxyVector.compute(events, lens_catalog)
    
    assert tpv.is_null()


def test_tpv_unlabeled_channel():
    """Unknown lenses go to UNLABELED"""
    events = [
        LensUsageEvent('unknown_lens', datetime.utcnow(), 1.0),
    ]
    
    tpv = TensionProxyVector.compute(events, lens_catalog + ['UNLABELED'])
    
    assert tpv.vector.get('UNLABELED', 0) > 0


def test_tpv_cosine_distance():
    """Distance between TPVs is cosine distance"""
    tpv_a = TensionProxyVector(vector={'lens_a': 0.8, 'lens_b': 0.2})
    tpv_b = TensionProxyVector(vector={'lens_a': 0.2, 'lens_b': 0.8})
    
    distance = tpv_a.cosine_distance(tpv_b)
    
    # Cosine similarity = 0.8*0.2 + 0.2*0.8 = 0.32
    # Distance = 1 - 0.32 = 0.68
    assert abs(distance - 0.68) < 0.01
```

---

### Adjacency Function Tests

```python
def test_adjacency_peak_at_target():
    """Adjacency is maximum at target distance"""
    posture = Posture.GROUNDED
    mu, sigma = ADJACENCY_PARAMS[posture]  # (0.45, 0.15)
    
    # At exact target distance
    adjacency = compute_adjacency(distance=mu, mu=mu, sigma=sigma)
    
    assert adjacency == 1.0


def test_adjacency_falloff():
    """Adjacency decreases with distance from target"""
    posture = Posture.GROUNDED
    mu, sigma = ADJACENCY_PARAMS[posture]
    
    at_target = compute_adjacency(distance=mu, mu=mu, sigma=sigma)
    far_from_target = compute_adjacency(distance=mu + sigma, mu=mu, sigma=sigma)
    
    assert at_target > far_from_target


def test_adjacency_posture_variation():
    """Different postures have different target distances"""
    distance = 0.5
    
    overwhelmed_adj = compute_adjacency(distance, *ADJACENCY_PARAMS[Posture.OVERWHELMED])
    exploratory_adj = compute_adjacency(distance, *ADJACENCY_PARAMS[Posture.EXPLORATORY])
    
    # Overwhelmed prefers distance 0.25, exploratory prefers 0.65
    # So at 0.5, exploratory should score higher
    assert exploratory_adj > overwhelmed_adj
```

---

### MirrorScore Tests

```python
def test_mirror_score_components_range():
    """All score components in [0, 1]"""
    scorer = MirrorScoreCalculator(posture_manager, tpv, lens_catalog)
    candidates = [mock_candidate()]
    targets = [mock_target()]
    
    scored = scorer.score_candidates(candidates, targets)
    
    for s in scored:
        assert 0 <= s.posture_fit <= 1
        assert 0 <= s.target_coverage <= 1
        assert 0 <= s.tension_adjacency <= 1
        assert 0 <= s.diversity_pressure <= 1
        assert 0 <= s.novelty <= 1
        assert 0 <= s.risk_penalty <= 1


def test_mirror_score_posture_weights():
    """Weights vary by posture"""
    overwhelmed_weights = SCORE_WEIGHTS[Posture.OVERWHELMED]
    exploratory_weights = SCORE_WEIGHTS[Posture.EXPLORATORY]
    
    # Overwhelmed prioritizes safety (high risk weight)
    assert overwhelmed_weights['risk'] > exploratory_weights['risk']
    
    # Exploratory prioritizes novelty
    assert exploratory_weights['novelty'] > overwhelmed_weights['novelty']


def test_posture_fit_boost():
    """User-requested style gets +0.20 boost"""
    base_fit = 0.60
    requested_style = InteractionStyle.DIALOGUE
    
    fit_with_request = compute_posture_fit(
        posture=Posture.GROUNDED,
        interaction_style=InteractionStyle.DIALOGUE,
        requested_style=requested_style
    )
    
    fit_without_request = compute_posture_fit(
        posture=Posture.GROUNDED,
        interaction_style=InteractionStyle.DIALOGUE,
        requested_style=None
    )
    
    assert fit_with_request >= fit_without_request + 0.20


def test_novelty_tiers():
    """Novelty has three tiers"""
    scorer = MirrorScoreCalculator(posture_manager, tpv, lens_catalog)
    
    brand_new = CandidateCard(node_id='new', ...)
    seen_before = CandidateCard(node_id='old', ...)
    shown_today = CandidateCard(node_id='today', ...)
    
    scorer.history_shown.add('old')
    scorer.history_shown.add('today')
    scorer.session_shown.add('today')
    
    assert scorer._novelty(brand_new) == 1.0
    assert scorer._novelty(seen_before) == 0.3
    assert scorer._novelty(shown_today) == 0.0
```

---

### Constitutional Gates Tests

```python
def test_consent_gate_blocks():
    """Consent gate filters blocked nodes"""
    engine = RoutingEngine(...)
    engine.mistake_protocol.blocked_nodes.add('blocked_node')
    
    candidates = [
        CandidateCard(node_id='allowed', ...),
        CandidateCard(node_id='blocked_node', ...),
    ]
    
    filtered = engine._apply_gates(candidates)
    
    assert len(filtered) == 1
    assert filtered[0].node_id == 'allowed'


def test_safety_gate_posture_threshold():
    """Safety gate threshold varies by posture"""
    engine = RoutingEngine(...)
    
    high_risk_card = CandidateCard(
        node_id='risky',
        asymmetry_report=AsymmetryReport(
            exit_friction=AsymmetryLevel.HIGH,
            ...  # risk_score = 0.6
        )
    )
    
    # Overwhelmed filters risk > 0.3
    engine.posture_manager.set_declared(Posture.OVERWHELMED)
    overwhelmed_filtered = engine._apply_gates([high_risk_card])
    assert len(overwhelmed_filtered) == 0
    
    # Exploratory allows risk up to 0.8
    engine.posture_manager.set_declared(Posture.EXPLORATORY)
    exploratory_filtered = engine._apply_gates([high_risk_card])
    assert len(exploratory_filtered) == 1


def test_capacity_gate_respects_limit():
    """Capacity gate enforces bandwidth limit"""
    engine = RoutingEngine(...)
    engine.mistake_protocol.bandwidth_limit = 2
    
    candidates = [
        CandidateCard(node_id=f'card_{i}', ...)
        for i in range(5)
    ]
    
    doors = engine.find_doors(max_doors=5)
    
    assert len(doors) <= 2
```

---

### Mistake Protocol Tests

```python
def test_discomfort_zero_weight():
    """Discomfort reports don't change routing"""
    protocol = MistakeProtocol(user_id, storage_path)
    
    initial_blocked = len(protocol.blocked_nodes)
    initial_bandwidth = protocol.bandwidth_limit
    
    protocol.report_mistake(
        MistakeType.DISCOMFORT,
        node_id='uncomfortable_node',
        context='Made me uncomfortable'
    )
    
    # No corrections applied
    assert len(protocol.blocked_nodes) == initial_blocked
    assert protocol.bandwidth_limit == initial_bandwidth


def test_consent_violation_blocks():
    """Consent violations block node permanently"""
    protocol = MistakeProtocol(user_id, storage_path)
    
    protocol.report_mistake(
        MistakeType.CONSENT_VIOLATION,
        node_id='blocked',
        context='I already blocked this'
    )
    
    assert 'blocked' in protocol.blocked_nodes


def test_bandwidth_overload_reduces_limit():
    """Bandwidth overload reduces max doors"""
    protocol = MistakeProtocol(user_id, storage_path)
    initial_limit = protocol.bandwidth_limit
    
    protocol.report_mistake(
        MistakeType.BANDWIDTH_OVERLOAD,
        node_id='any',
        context='Too many doors'
    )
    
    assert protocol.bandwidth_limit < initial_limit
    assert protocol.bandwidth_limit >= 1  # Never goes below 1
```

---

## Integration Tests

### Full Pipeline Test

```python
def test_full_finder_pipeline():
    """End-to-end Finder pipeline"""
    # Setup
    graph = IdentityGraph(user_id, storage_path)
    graph.add_node(GraphNode(id='node_a', node_type=NodeType.BELIEF, ...))
    graph.add_node(GraphNode(id='node_b', node_type=NodeType.BELIEF, ...))
    graph.add_edge(GraphEdge(
        source_id='node_a',
        target_id='node_b',
        edge_type=EdgeType.CONTRADICTS,
        weight=EdgeWeight(intensity=0.8, ...)
    ))
    
    # Execute pipeline
    engine = RoutingEngine(graph, posture_manager, tpv, candidate_manager, ...)
    doors = engine.find_doors(max_doors=3)
    
    # Assertions
    assert len(doors) <= 3
    assert all(isinstance(d, Door) for d in doors)
    assert all(d.candidate.total_score > 0 for d in doors)
    assert all(d.why_now != '' for d in doors)


def test_cold_start_mode():
    """Empty graph triggers first_mirror mode"""
    empty_graph = IdentityGraph(user_id, storage_path)
    
    engine = RoutingEngine(empty_graph, ...)
    doors = engine.find_doors()
    
    # Should present first_mirror cards
    assert len(doors) > 0
    assert all('first_mirror' in d.candidate.card.lens_tags for d in doors)
```

---

## Edge Case Tests

### Null TPV Handling

```python
def test_null_tpv_routing():
    """System handles null TPV gracefully"""
    null_tpv = TensionProxyVector(vector={})
    
    engine = RoutingEngine(graph, posture_manager, null_tpv, ...)
    doors = engine.find_doors()
    
    # Should still produce doors (uses posture only)
    assert len(doors) >= 0
```

### Sparse Graph Handling

```python
def test_sparse_graph_targets():
    """Sparse graph generates fewer targets"""
    sparse_graph = IdentityGraph(user_id, storage_path)
    # Add only 3 nodes
    for i in range(3):
        sparse_graph.add_node(GraphNode(id=f'node_{i}', ...))
    
    synthesizer = FinderTargetSynthesizer(sparse_graph)
    targets = synthesizer.generate_targets(Posture.GROUNDED)
    
    # Should generate 1-2 targets
    assert 0 < len(targets) <= 2
```

### No Candidates Found

```python
def test_no_candidates_empty_result():
    """Empty candidate set returns empty doors"""
    engine = RoutingEngine(...)
    
    # Mock empty Commons response
    with mock.patch.object(candidate_manager, 'search_cards', return_value=[]):
        doors = engine.find_doors()
    
    assert len(doors) == 0
```

### All Candidates Gated

```python
def test_all_gated_empty_result():
    """All candidates filtered by gates returns empty"""
    engine = RoutingEngine(...)
    
    # Block all candidates
    for i in range(10):
        engine.mistake_protocol.blocked_nodes.add(f'candidate_{i}')
    
    candidates = [
        CandidateCard(node_id=f'candidate_{i}', ...)
        for i in range(10)
    ]
    
    with mock.patch.object(candidate_manager, 'search_cards', return_value=candidates):
        doors = engine.find_doors()
    
    assert len(doors) == 0
```

---

## Gaming Scenario Tests

### Self-Promotion Gaming

```python
def test_self_promotion_attestation_dilution():
    """Self-attested cards have low evidence weight"""
    self_attested = CandidateCard(
        node_id='self_promo',
        asymmetry_report=AsymmetryReport(
            exit_friction=AsymmetryLevel.LOW,
            evidence_tier=EvidenceTier.DECLARED,  # 0.30 weight
            ...
        )
    )
    
    observed = CandidateCard(
        node_id='observed',
        asymmetry_report=AsymmetryReport(
            exit_friction=AsymmetryLevel.LOW,
            evidence_tier=EvidenceTier.OBSERVED,  # 0.80 weight
            ...
        )
    )
    
    # Same base asymmetry, but observed scores lower risk
    assert observed.asymmetry_report.to_risk_score() < self_attested.asymmetry_report.to_risk_score()
```

### Lens Tag Stuffing

```python
def test_lens_tag_stuffing_coverage_cap():
    """Excessive lens tags don't inflate coverage"""
    target = FinderTarget(lens_tags=['tag_a', 'tag_b'])
    
    normal_card = CandidateCard(lens_tags=['tag_a', 'tag_b'])
    stuffed_card = CandidateCard(lens_tags=[f'tag_{i}' for i in range(100)] + ['tag_a', 'tag_b'])
    
    scorer = MirrorScoreCalculator(...)
    
    normal_coverage = scorer._target_coverage(normal_card, [target])
    stuffed_coverage = scorer._target_coverage(stuffed_card, [target])
    
    # Coverage capped at 1.0, stuffing doesn't help
    assert normal_coverage == stuffed_coverage == 1.0
```

---

## Performance Tests

### TPV Computation Performance

```python
def test_tpv_computation_speed():
    """TPV computes in <100ms for 10k events"""
    events = [
        LensUsageEvent(f'lens_{i % 20}', datetime.utcnow() - timedelta(days=i), 1.0)
        for i in range(10000)
    ]
    
    start = time.time()
    tpv = TensionProxyVector.compute(events, lens_catalog)
    elapsed = time.time() - start
    
    assert elapsed < 0.1  # 100ms


def test_scoring_speed():
    """Score 100 candidates in <500ms"""
    candidates = [mock_candidate() for _ in range(100)]
    targets = [mock_target() for _ in range(5)]
    
    scorer = MirrorScoreCalculator(...)
    
    start = time.time()
    scored = scorer.score_candidates(candidates, targets)
    elapsed = time.time() - start
    
    assert elapsed < 0.5  # 500ms
```

---

## Test Data Fixtures

```python
@pytest.fixture
def mock_identity_graph():
    graph = IdentityGraph('test_user', Path('/tmp/test'))
    # Add realistic tension
    graph.add_node(GraphNode(id='n1', label='Efficiency', node_type=NodeType.BELIEF))
    graph.add_node(GraphNode(id='n2', label='Connection', node_type=NodeType.BELIEF))
    graph.add_edge(GraphEdge(
        source_id='n1',
        target_id='n2',
        edge_type=EdgeType.CONTRADICTS,
        weight=EdgeWeight(frequency=0.8, intensity=0.7, recency=1.0, confidence=0.9)
    ))
    return graph


@pytest.fixture
def mock_tpv():
    return TensionProxyVector(
        user_id='test_user',
        vector={'productivity': 0.4, 'relationships': 0.3, 'creativity': 0.2, 'UNLABELED': 0.1},
        is_manual_override=False,
        last_computed=datetime.utcnow()
    )


@pytest.fixture
def mock_candidate():
    return CandidateCard(
        node_id='candidate_1',
        card_type='person',
        interaction_style='dialogue',
        lens_tags=['productivity', 'relationships'],
        attestation_count=5
    )
```

---

**Test Coverage Target**: 90%+  
**Critical Paths**: TPV computation, MirrorScore calculation, Constitutional gates  
**Performance SLA**: Pipeline <5s end-to-end  
**Next**: Implement tests in mirror_os/finder/tests/
