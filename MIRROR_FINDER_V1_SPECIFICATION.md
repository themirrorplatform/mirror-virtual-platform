# Mirror Finder v1.0 - Complete Implementation Specification

**Document Status**: Implementation-Ready  
**Version**: 1.0  
**Last Updated**: December 2025

---

## Executive Summary

Mirror Finder transforms MirrorX and Mirror OS into a constitutional routing intelligence that uses a user's **Identity Graph** (not behavior) to generate **Finder Targets** (abstract reflective conditions), query **Commons** (metadata registry) for **Candidate Cards**, apply **Constitutional Gates**, score with **MirrorScore** (posture-conditioned), and present 1-3 **Doors** (reflective possibilities).

**Core Innovation**: Routes for "adjacent contradiction" (not sameness), reflection (not comfort), accountability (not neutrality).

---

## System Axioms

Six constitutional invariants that cannot be violated:

1. **Sovereignty**: Identity Graph stays local, user edits override inference
2. **Reflection over Prescription**: System opens doors, doesn't push through them
3. **Accountable Power**: All routing inspectable, reversible, interruptible
4. **No Comfort Optimization**: Discomfort ≠ negative signal
5. **No Hidden State**: All postures, targets, decay timers visible
6. **Exit Sacred**: Finder can be disabled, data exportable, manual mode always available

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FINDER PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Identity Graph → Finder Targets → Query Commons →         │
│  Constitutional Gates → MirrorScore Ranking → Doors (1-3)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

LAYER 1 (Sovereign):
- Identity Graph (local, never sent)
- TPV (computed from lens usage)
- Posture (user-declared)
- Mistake Protocol (delivery learning)

LAYER 2 (Commons):
- Candidate Cards (public metadata)
- Attestations (third-party verification)
- Asymmetry Aggregates (anonymous risk reports)
- Shared Lenses (instrument catalog)

LAYER 3 (Routing):
- Target Synthesis (graph → abstract descriptions)
- Constitutional Gates (consent, safety, capacity)
- MirrorScore (8-component weighted sum)
- Door Presentation (1-3 reflective possibilities)
```

---

## Component Specifications

### 1. Identity Graph

**Purpose**: User's inner structure map  
**Storage**: Local only (never transmitted)  
**Editability**: Fully user-editable

**Node Types**:
- `thought`, `belief`, `emotion`, `action`, `experience`, `consequence`

**Edge Types**:
- `reinforces`, `contradicts`, `undermines`, `leads_to`, `co_occurs_with`

**Derived Structures**:
- **Tensions**: Stable contradictions (energy > 0.7)
- **Loops**: Recurring patterns (recurrence ≥ 3)
- **Axes**: Value/fear vectors

**Edge Weight Components**:
```python
weight = {
    frequency: float,    # How often relationship occurs
    intensity: float,    # Emotional load (0.0-1.0)
    recency: float,      # Time decay factor
    confidence: float    # Epistemic certainty (0.0-1.0)
}

composite_score = 0.3*frequency + 0.4*intensity + 0.2*recency + 0.1*confidence
```

---

### 2. Tension Proxy Vector (TPV)

**Purpose**: User's reflection instrument usage as routing signal  
**Source**: Lens usage events ONLY (no behavior tracking)  
**Editability**: User can manually override

**Computation** (deterministic):
```python
# For each lens ℓ:
raw_ℓ = Σ_i (weight_i * exp(-(now - t_i)/τ))

# Where:
# τ = 7 days (decay half-life)
# weight_i = lens usage weight (default 1.0)

# Softmax normalization:
TPV_ℓ = exp(raw_ℓ / T) / Σ_k exp(raw_k / T)

# Where T = 1.0 (temperature)

# Null condition:
if sum(raw) < 0.10:
    TPV = null
```

**Special Channels**:
- `UNLABELED`: First-class channel for untagged usage

**Distance Metric**:
```python
cosine_distance = 1 - dot(TPV_a, TPV_b) / (||TPV_a|| * ||TPV_b||)
```

---

### 3. Posture System

**Purpose**: User's current reflective state  
**Layer**: Declared (canonical) + Suggested (advisory)  
**Taxonomy**: 6 finite states

**Postures**:
1. `unknown` - Cold start, insufficient data
2. `overwhelmed` - High stress, need witness/structure
3. `guarded` - Tentative, prefer low-pressure
4. `grounded` - Balanced, open to dialogue
5. `open` - Ready for challenge
6. `exploratory` - Seeking boundaries, debate

**Divergence Protocol**:
- If `declared ≠ suggested` for 14+ sessions → Optional prompt
- User dismissal prevents re-prompt for 30 days
- System NEVER overrides declared posture

**PostureFit Compatibility Matrix**:
| Posture | Witness | Dialogue | Debate | Structured |
|---------|---------|----------|--------|------------|
| Overwhelmed | 1.00 | 0.60 | 0.10 | 0.80 |
| Guarded | 0.90 | 0.50 | 0.20 | 0.70 |
| Grounded | 0.70 | 0.90 | 0.60 | 0.80 |
| Open | 0.50 | 1.00 | 0.80 | 0.70 |
| Exploratory | 0.30 | 0.80 | 1.00 | 0.60 |
| Unknown | 0.70 | 0.70 | 0.40 | 0.70 |

---

### 4. Finder Targets

**Purpose**: Abstract descriptions of reflective conditions  
**Generation**: Template-based from Identity Graph snapshot  
**Editability**: User can edit before search executes

**Target Types**:
1. **Tension Mirror**: "Someone navigating {tension_a} ↔ {tension_b}"
2. **Pattern Interrupt**: "Someone who has broken pattern {loop_name}"
3. **Boundary Test**: "Someone testing boundary of {axis}"
4. **Value Amplifier**: "Someone who embodies {value}"

**Generation Rules** (posture-conditioned):
- Overwhelmed: Mostly `value_amplifier` + `witness`
- Grounded: Balanced mix
- Exploratory: Mostly `boundary_test` + `pattern_interrupt`

---

### 5. Candidate Cards

**Purpose**: Public metadata about reflective conditions  
**Storage**: Commons (public), cached locally  
**Privacy**: Never contain Identity Graphs or private data

**Minimum Viable Schema**:
```json
{
  "node_id": "uuid",
  "card_type": "person|room|artifact|practice",
  "interaction_style": "witness|dialogue|debate|structured",
  "lens_tags": ["tag1", "tag2", ...],
  "attestation_count": int
}
```

**Optional Fields**:
- `title`, `description`, `creator_id`
- `asymmetry_report` (structural risk metrics)

**Asymmetry Metrics** (structural, not ideological):
- `exit_friction`: low/medium/high
- `data_demand_ratio`: 0.0-1.0
- `opacity`: boolean
- `identity_coercion`: boolean
- `unilateral_control`: boolean
- `lock_in_terms`: boolean
- `evidence_tier`: declared(0.30), attested(0.50), observed(0.80)

---

### 6. MirrorScore Algorithm

**Purpose**: Rank candidates constitutionally  
**Formula**:
```python
Score = wP*PostureFit + wC*TargetCoverage + wA*TensionAdjacency 
        + wD*DiversityPressure + wN*Novelty - wR*RiskPenalty
```

**Weights (Posture-Conditioned)**:
| Posture | wP | wC | wA | wD | wN | wR |
|---------|-----|-----|-----|-----|-----|-----|
| Overwhelmed | 0.30 | 0.20 | 0.10 | 0.10 | 0.05 | 0.25 |
| Guarded | 0.25 | 0.25 | 0.15 | 0.10 | 0.05 | 0.20 |
| Grounded | 0.20 | 0.25 | 0.20 | 0.15 | 0.10 | 0.10 |
| Open | 0.15 | 0.25 | 0.25 | 0.15 | 0.15 | 0.05 |
| Exploratory | 0.10 | 0.20 | 0.25 | 0.20 | 0.20 | 0.05 |
| Unknown | 0.25 | 0.20 | 0.15 | 0.15 | 0.10 | 0.15 |

**Component Formulas**:

**PostureFit**:
```python
base_fit = MATRIX[posture][interaction_style]
if user_requested_style == interaction_style:
    return min(1.0, base_fit + 0.20)
return base_fit
```

**TargetCoverage**:
```python
coverage = 0
for target in finder_targets:
    lens_overlap = jaccard(target.lens_tags, card.lens_tags)
    coverage += lens_overlap * intensity_match
return coverage / len(finder_targets)
```

**TensionAdjacency**:
```python
distance = cosine_distance(user_tpv, candidate_tpv)
μ, σ = ADJACENCY_PARAMS[posture]
adjacency = exp(-abs(distance - μ) / σ)
```

Adjacency Parameters:
| Posture | μ (target) | σ (tolerance) |
|---------|-----------|--------------|
| Overwhelmed | 0.25 | 0.10 |
| Guarded | 0.30 | 0.10 |
| Grounded | 0.45 | 0.15 |
| Open | 0.55 | 0.18 |
| Exploratory | 0.65 | 0.20 |
| Unknown | 0.45 | 0.20 |

**DiversityPressure**:
```python
if session_shown_count <= 5:
    return 0.0
cluster_count = count_in_cluster(card, session_shown)
pressure = 1.0 - (cluster_count / session_shown_count)
return max(0.0, pressure)
```

**Novelty**:
```python
if card not in history_shown:
    return 1.0  # Brand new
if card not in session_shown:
    return 0.3  # Seen before, not today
return 0.0      # Already shown this session
```

**RiskPenalty**:
```python
if not asymmetry_report:
    return 0.0

tier_weight = {declared: 0.30, attested: 0.50, observed: 0.80}
friction_score = {low: 0.1, medium: 0.4, high: 0.8}

base_risk = (
    friction_score * 0.3 +
    data_demand_ratio * 0.2 +
    (boolean_flags_count / 4.0) * 0.5
)

return base_risk * tier_weight[evidence_tier]
```

---

### 7. Constitutional Gates

Three gates applied before scoring:

**Gate 1: Consent**
- Filter any `node_id` in user's block list
- Respect "no_contact" flags

**Gate 2: Safety**
- Filter candidates with risk_score > threshold
- Thresholds: Overwhelmed (0.3), Guarded (0.4), Grounded (0.6), Open (0.7), Exploratory (0.8)

**Gate 3: Capacity**
- Limit doors to user's bandwidth_limit (default: 3)
- Learned from `bandwidth_overload` mistakes

---

### 8. Mistake Protocol

**Purpose**: Learn delivery parameters, NOT content preferences  
**Constitutional Rule**: Discomfort = ZERO weight

**Mistake Types**:
1. **Consent Violation** (weight: 1.0) → Block node permanently
2. **Timing Mismatch** (weight: 0.5) → Learn timing preferences
3. **Corruption Risk** (weight: 1.0) → Block + report to Commons
4. **Bandwidth Overload** (weight: 0.4) → Reduce max doors
5. **Discomfort** (weight: 0.0) → NO CORRECTION

**Learning Constraints**:
- Only adjust: blocked_nodes, timing_preferences, bandwidth_limit
- Never adjust: content preferences, lens weights, target templates
- User can inspect all learned parameters
- User can reset to defaults

---

## Commons API v1 Specification

**Architecture**: Central metadata registry with pull-based sync

**Endpoints**:

### GET /v1/cards
Query candidate cards.

**Parameters**:
- `lens_tags` (required): Comma-separated list
- `interaction_style` (optional): witness|dialogue|debate|structured
- `max_results` (optional): Default 50

**Response**:
```json
{
  "cards": [CandidateCard, ...],
  "total_count": int,
  "query_id": "uuid"
}
```

### GET /v1/attestations/{node_id}
Retrieve attestations for candidate.

**Response**:
```json
{
  "attestations": [
    {
      "attester_id": "uuid",
      "claim": "string",
      "signature": "string",
      "attested_at": "iso8601"
    }
  ]
}
```

### GET /v1/asymmetry_aggregates/{node_id}
Get anonymous asymmetry reports (k-anonymity enforced).

**Response**:
```json
{
  "node_id": "uuid",
  "report_count": int,
  "k_threshold": 5,
  "exit_friction_mode": "low|medium|high",
  "data_demand_ratio_mean": float,
  "opacity_fraction": float,
  "identity_coercion_fraction": float,
  "unilateral_control_fraction": float,
  "lock_in_terms_fraction": float
}
```

### POST /v1/cards
Submit self-attested candidate card.

**Payload**:
```json
{
  "card": CandidateCard,
  "instance_id": "uuid",
  "signature": "ed25519_signature",
  "submitted_at": "iso8601"
}
```

### POST /v1/reports
Submit anonymous asymmetry reports (batched).

**Payload**:
```json
{
  "reports": [AsymmetryReport, ...],
  "instance_id": "uuid",  # For rate limiting only
  "submitted_at": "iso8601"
}
```

---

## Edge Cases & Fallbacks

### Cold Start (Empty Identity Graph)
- Mode: `first_mirror`
- Query cards tagged `first_mirror`
- Present 1-3 curated starters
- No scoring (all weighted equally)

### Null TPV (Insufficient Usage Data)
- Use uniform distribution over declared lens tags
- Or query by posture only
- Adjacency score = neutral (0.5)

### Sparse Graph (<10 nodes)
- Generate only 1-2 targets
- Prefer `value_amplifier` templates
- Lower diversity/novelty weights

### No Candidates Found
- Return empty list (don't force doors)
- Suggest manual mode or broader lens tags
- Log for system improvement

### All Gates Filter All Candidates
- Return empty list
- Notify user of strict filters
- Offer to temporarily relax safety gate

---

## Implementation Checklist

### Phase 1: Core Data Structures ✅
- [x] Identity Graph (nodes, edges, tensions, loops, axes)
- [x] TPV computation with exponential decay
- [x] Posture management (declared + suggested)
- [x] Finder Target templates
- [x] Candidate Card schema
- [x] Asymmetry Report schema

### Phase 2: Routing Pipeline ✅
- [x] Target synthesis from graph snapshot
- [x] Commons API client (query, submit)
- [x] Constitutional gates (consent, safety, capacity)
- [x] MirrorScore calculator (8 components)
- [x] Door selection logic

### Phase 3: Learning & Feedback ✅
- [x] Mistake Protocol (5 types, weighted)
- [x] Diversity/Novelty tracking
- [x] Posture divergence detection
- [x] Audit log generation

### Phase 4: Database Schema ✅
- [x] All Finder tables defined
- [x] Indexes for performance
- [x] Foreign key constraints

### Phase 5: Integration (TODO)
- [ ] MirrorX Engine calls Finder
- [ ] UI components (door cards, explain panel, audit view)
- [ ] Commons v1 server implementation
- [ ] Cryptographic signing (Ed25519)

### Phase 6: Testing (TODO)
- [ ] Unit tests (TPV, adjacency, gates, scoring)
- [ ] Integration tests (full pipeline)
- [ ] Edge case validation
- [ ] Gaming scenario tests
- [ ] Performance benchmarks

---

## Success Metrics

**Constitutional Compliance**:
- [ ] User can disable Finder (exit test)
- [ ] User can inspect all routing decisions (transparency test)
- [ ] Discomfort reports don't change content routing (optimization test)
- [ ] Identity Graph never transmitted (sovereignty test)

**Functional Correctness**:
- [ ] TPV computation deterministic
- [ ] Adjacency function matches spec
- [ ] MirrorScore components sum correctly
- [ ] Gates filter correctly by posture

**User Experience**:
- [ ] Cold start presents 1-3 doors within 2 seconds
- [ ] Normal operation presents doors within 5 seconds
- [ ] Mistake corrections visible in next session
- [ ] Audit log human-readable

---

## Document Control

**Version History**:
- 1.0 (Dec 2025): Complete implementation specification

**Contributors**: Mirror Development Team  
**Status**: Implementation-Ready  
**Next Review**: After Phase 5 completion
