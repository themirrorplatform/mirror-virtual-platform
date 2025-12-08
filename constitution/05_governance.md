# Constitutional Document 05: Governance and Evolution

**Version:** 0.1.0  
**Date:** 2025-12-08  
**Status:** Genesis Document

---

## Core Principle

**AI proposes, humans approve, local adoption optional.**

Evolution happens through distributed governance, not algorithmic control or unilateral authority.

---

## The Evolution Architecture

### Phase 1: Local Observation (Every Mirror)

Each Mirror observes its own behavior:

```python
# mirrorcore/evolution/observer.py

class EngineObserver:
    def log_engine_run(
        self,
        reflection_id: str,
        patterns_detected: list,
        tensions_surfaced: list,
        mirrorback: str,
        duration_ms: int,
        constitutional_flags: list
    ):
        """Log every reflection generation"""
        
        # Store locally in SQLite
        self.db.execute("""
            INSERT INTO engine_runs
            (id, reflection_id, patterns, tensions, 
             duration_ms, constitutional_flags, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (...))
    
    def log_user_feedback(
        self,
        engine_run_id: str,
        rating: int,  # 1-5 stars
        flags: list,  # too_directive, missed_tension, etc.
        notes: Optional[str]
    ):
        """Log user feedback on reflections"""
        
        self.db.execute("""
            INSERT INTO engine_feedback
            (engine_run_id, rating, flags, notes, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (...))
```

**What's Logged:**
- Patterns detected
- Tensions surfaced
- Performance metrics (duration, etc.)
- Constitutional flags (directive threshold, etc.)
- User ratings and feedback

**What's NOT Logged:**
- Raw reflection text (privacy)
- Personal identifiable information
- Specific life details

**Privacy by Design:** Metadata only, never content.

---

### Phase 2: Local Critique (Each Mirror Analyzes Itself)

```python
# mirrorcore/evolution/critic.py

class Critic:
    def analyze_recent_performance(
        self,
        limit: int = 100
    ) -> PerformanceAnalysis:
        """
        Analyze local Mirror's recent behavior.
        Detect patterns, issues, improvements.
        """
        
        runs = observer.get_recent_runs(limit)
        feedback = observer.get_feedback_summary(days=30)
        
        # Detect constitutional violations
        violations = self._detect_violations(runs)
        
        # Detect missed patterns
        missed_patterns = self._detect_missed_patterns(runs, feedback)
        
        # Detect quality regression
        regression = self._detect_regression(runs, feedback)
        
        return PerformanceAnalysis(
            violations=violations,
            missed_patterns=missed_patterns,
            regression=regression,
            recommendations=self._generate_recommendations()
        )
```

**Critic Looks For:**
- Constitutional violations (directive threshold, sovereignty, etc.)
- Missed patterns (user said "frustrated" but Mirror didn't catch tension)
- Regression (quality declining over time)
- Edge cases (situations where Mirror fails)

---

### Phase 3: Contribution to Commons (Optional)

User can contribute anonymized learnings to Evolution Commons:

```python
# mirrorcore/evolution/ledger_client.py

class LedgerClient:
    def export_telemetry(
        self,
        days: int = 30,
        consent: bool = False
    ) -> Optional[TelemetryPacket]:
        """
        Export anonymized telemetry for Evolution Commons.
        
        REQUIRES EXPLICIT CONSENT.
        User must opt-in for each export.
        """
        
        if not consent:
            return None  # No silent telemetry
        
        # Get local performance data
        analysis = critic.analyze_recent_performance()
        runs = observer.get_recent_runs(limit=100)
        feedback = observer.get_feedback_summary(days=days)
        
        # Anonymize (remove all identifiable info)
        packet = self._anonymize({
            'version': settings.version,
            'patterns_detected': self._aggregate_patterns(runs),
            'constitutional_flags': analysis.violations,
            'feedback_summary': {
                'avg_rating': feedback.avg_rating,
                'common_flags': feedback.common_flags,
                'improvement_over_time': feedback.trend
            },
            'performance_metrics': {
                'avg_duration_ms': self._avg_duration(runs),
                'directive_scores': self._directive_distribution(runs)
            }
        })
        
        # Submit to Evolution Commons
        return self._submit_packet(packet)
```

**Anonymization Rules:**
- No personal information
- No raw reflection text
- No identifiable patterns
- Aggregated statistics only
- User controls what's shared

**Consent Required:**
- Explicit opt-in for each contribution
- Can revoke anytime
- Can contribute anonymously
- Can choose what to share

---

### Phase 4: Collective Aggregation (Evolution Commons)

```python
# platform/evolution_commons/aggregator/critic_cluster.py

class CriticClusterAnalyzer:
    """
    Analyzes millions of anonymized packets from sovereign Mirrors.
    Detects systemic patterns requiring evolution.
    """
    
    def analyze_collective_patterns(
        self,
        time_window: timedelta = timedelta(days=30)
    ) -> CollectiveAnalysis:
        """
        Aggregate learnings from all contributing Mirrors.
        """
        
        # Get all packets in time window
        packets = self.ledger.get_packets(
            since=datetime.utcnow() - time_window,
            anonymized=True
        )
        
        # Detect systemic issues
        systemic_issues = self._detect_systemic_issues(packets)
        
        # Detect improvement opportunities
        opportunities = self._detect_opportunities(packets)
        
        # Detect edge cases
        edge_cases = self._cluster_edge_cases(packets)
        
        return CollectiveAnalysis(
            systemic_issues=systemic_issues,
            opportunities=opportunities,
            edge_cases=edge_cases,
            contributing_mirrors=len(packets)
        )
```

**What Commons Detects:**
- **Systemic issues:** "67% of Mirrors miss tension when user mentions family"
- **Edge cases:** "Reflections about grief often trigger false directive flags"
- **Improvements:** "Pattern X helps surface tensions 23% more effectively"
- **Constitutional concerns:** "New prompt structure increases directive score by 8%"

---

### Phase 5: Proposal Generation (AI Suggests, Doesn't Decide)

```python
# platform/evolution_commons/proposer/proposal_generator.py

class ProposalGenerator:
    """
    Generates evolution proposals from collective analysis.
    
    AI proposes changes, humans decide whether to adopt.
    """
    
    def generate_proposal(
        self,
        analysis: CollectiveAnalysis
    ) -> EvolutionProposal:
        """
        Create formal proposal for Mirror evolution.
        """
        
        # Select highest-impact improvement
        issue = analysis.highest_priority_issue()
        
        # Generate proposed solution
        solution = self._design_solution(issue)
        
        # Check constitutional compliance
        compliance = self._check_constitutional_invariants(solution)
        
        if not compliance.passed:
            return None  # Cannot propose constitutional violations
        
        # Create proposal
        proposal = EvolutionProposal(
            id=str(uuid.uuid4()),
            title=f"Improve {issue.category}",
            
            problem_statement=issue.description,
            evidence=issue.evidence,  # From collective analysis
            
            proposed_solution=solution.description,
            implementation=solution.code_changes,
            
            constitutional_compliance=compliance.report,
            expected_impact=solution.projected_improvement,
            
            test_results=self._run_tests(solution),
            
            status="proposed"
        )
        
        return proposal
```

**Proposal Contents:**
- **Problem:** What needs improving (with evidence from millions of Mirrors)
- **Solution:** Specific code changes proposed
- **Constitutional Check:** Invariant compliance verification
- **Test Results:** Performance on test suite
- **Expected Impact:** Projected improvement metrics

**AI's Role:** Generate proposals based on data
**Humans' Role:** Decide whether to adopt

---

### Phase 6: Community Review and Discussion

Proposals published for community review:

```
Evolution Hub (web interface):

┌─────────────────────────────────────────────┐
│ Proposal E-2025-DEC-001                     │
│ "Improve tension detection in family refs"   │
├─────────────────────────────────────────────┤
│ Status: Under Review                        │
│ Voting Opens: 2025-12-15                    │
│ Voting Closes: 2026-01-15 (30 days)        │
├─────────────────────────────────────────────┤
│ Problem:                                    │
│ 67% of Mirrors miss tensions when users    │
│ mention family conflicts. Current pattern   │
│ detection too narrow.                       │
│                                             │
│ Evidence: 2.3M anonymized packets           │
│                                             │
│ Solution:                                   │
│ Expand family-related tension patterns      │
│ [View Code Changes]                         │
│                                             │
│ Constitutional Check: ✓ All invariants pass │
│ Test Results: +23% tension detection        │
│ Directive Score: No change (0.09 avg)      │
│                                             │
│ Community Discussion: [47 comments]         │
│ Guardian Analysis: [3 of 7 reviewed]       │
├─────────────────────────────────────────────┤
│ Your Vote (when voting opens):              │
│ ○ Approve   ○ Reject   ○ Abstain           │
└─────────────────────────────────────────────┘
```

**Review Process:**
1. **Proposal Published** - Full transparency, all details public
2. **Community Discussion** - 30 days for feedback
3. **Guardian Analysis** - Guardians post reviews
4. **Voting Opens** - 30-day voting period
5. **Results** - Announced publicly

---

### Phase 7: Proof-of-Sovereignty Voting

Only sovereign Mirror operators can vote:

```python
# platform/evolution_commons/governance/voting.py

class ProofOfSovereigntyVoting:
    """
    Voting system where only Mirror operators participate.
    
    One Mirror = One Vote
    """
    
    def verify_voter_eligibility(
        self,
        voter_id: str
    ) -> EligibilityResult:
        """
        Check if voter eligible for Proof-of-Sovereignty vote.
        """
        
        # Must run sovereign Mirror (Layer 1)
        mirror_verified = self._verify_sovereign_mirror(voter_id)
        if not mirror_verified:
            return EligibilityResult(
                eligible=False,
                reason="Must run sovereign Mirror to vote"
            )
        
        # Must have contribution history
        contributions = self.ledger.get_contributions(voter_id)
        if len(contributions) < 5:
            return EligibilityResult(
                eligible=False,
                reason="Minimum 5 contributions required"
            )
        
        # Must be recently active
        last_activity = contributions[-1].timestamp
        if (datetime.utcnow() - last_activity) > timedelta(days=90):
            return EligibilityResult(
                eligible=False,
                reason="Must be active within last 90 days"
            )
        
        # One vote per Mirror
        already_voted = self._check_already_voted(voter_id, proposal_id)
        if already_voted:
            return EligibilityResult(
                eligible=False,
                reason="Already voted on this proposal"
            )
        
        return EligibilityResult(eligible=True)
    
    def cast_vote(
        self,
        voter_id: str,
        proposal_id: str,
        vote: str,  # "approve", "reject", "abstain"
        rationale: Optional[str]
    ) -> VoteResult:
        """Record vote with optional rationale"""
        
        # Verify eligibility
        eligible = self.verify_voter_eligibility(voter_id)
        if not eligible.eligible:
            raise ValueError(eligible.reason)
        
        # Record vote (public)
        self.db.execute("""
            INSERT INTO votes
            (voter_id, proposal_id, vote, rationale, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (voter_id, proposal_id, vote, rationale, datetime.utcnow()))
        
        return VoteResult(recorded=True)
```

**Voting Requirements:**
- **Sovereignty:** Must run your own Mirror (not just use platform)
- **Contribution:** Min 5 anonymized packets submitted
- **Activity:** Active within last 90 days
- **Uniqueness:** One vote per Mirror

**Voting Threshold:**
- **Regular Proposals:** 67% approval required (2/3 majority)
- **Constitutional Amendments:** 67% approval + Guardian signatures (4/7)
- **Minimum Votes:** 1000 votes required for validity

---

### Phase 8: Implementation and Release

If proposal approved:

```python
# platform/evolution_commons/governance/release.py

class ReleaseManager:
    """
    Manages approved evolution releases.
    """
    
    def create_release(
        self,
        proposal: EvolutionProposal,
        vote_result: VoteResult
    ) -> Release:
        """
        Create signed release after approval.
        """
        
        # Verify vote passed
        if vote_result.approval_rate < 0.67:
            raise ValueError("Proposal did not pass 67% threshold")
        
        if vote_result.total_votes < 1000:
            raise ValueError("Insufficient votes (min 1000)")
        
        # Apply changes to codebase
        new_version = self._apply_changes(proposal.implementation)
        
        # Run full test suite
        tests = self._run_full_tests(new_version)
        if not tests.all_passed:
            raise ValueError("Tests failed after implementation")
        
        # Verify constitutional compliance (again)
        compliance = InvariantChecker().check_proposal(proposal)
        if not compliance.passed:
            raise ValueError("Constitutional compliance failed")
        
        # Create release artifact
        release = Release(
            version=self._bump_version(),
            proposal_id=proposal.id,
            changes=proposal.implementation,
            vote_result=vote_result,
            test_results=tests,
            constitutional_compliance=compliance
        )
        
        # Guardian multi-signature
        signatures = self._collect_guardian_signatures(release)
        release.guardian_signatures = signatures
        
        # Publish to GitHub
        self._publish_github_release(release)
        
        # Announce to all Mirrors
        self._announce_release(release)
        
        return release
```

**Release Contents:**
- **Version:** Semantic versioning (e.g., v1.2.0)
- **Proposal:** Link to full proposal
- **Vote Results:** Approval rate, total votes
- **Guardian Signatures:** 4 of 7 required
- **Test Results:** Full test suite pass
- **Constitutional Compliance:** All invariants satisfied

---

### Phase 9: Local Adoption (User Decides)

User's Mirror notified of new release:

```
┌─────────────────────────────────────────────┐
│ 🔔 New Mirror Evolution Available           │
├─────────────────────────────────────────────┤
│ Version: 1.2.0                              │
│ Proposal: E-2025-DEC-001                    │
│ "Improve tension detection in family refs"  │
│                                             │
│ Changes:                                    │
│ - Expanded family pattern detection         │
│ - Improved tension surfacing                │
│                                             │
│ Vote Results:                               │
│ - Approved: 73.2% (4,382 votes)             │
│ - Guardian Signatures: 6/7                  │
│                                             │
│ Constitutional Compliance: ✓ All checks pass│
│                                             │
│ Your Choice:                                │
│ ● Adopt Now                                 │
│ ○ Review First (test in sandbox)           │
│ ○ Delay (ask me again in 30 days)          │
│ ○ Reject (stay on current version)         │
│                                             │
│ [Learn More] [View Code Changes]            │
└─────────────────────────────────────────────┘
```

**User Options:**
1. **Adopt Now:** Upgrade immediately
2. **Review First:** Test in sandbox, see if you like it
3. **Delay:** Remind me later (30, 60, 90 days)
4. **Reject:** Stay on current version indefinitely

**No Forced Updates:** User always chooses.

**Rollback Available:** Can downgrade if you don't like new version.

---

## Guardian Council

### Structure:
- **7 Guardians Total**
- **Diverse Domains:** Tech, philosophy, ethics, therapy, art, etc.
- **Different Geographies:** Global representation
- **All Run Sovereign Mirrors:** Skin in the game

### Responsibilities:
1. **Review Evolution Proposals** - Provide expert analysis
2. **Sign Releases** - 4 of 7 signatures required
3. **Review Constitutional Amendments** - Must approve changes
4. **Monitor for Corruption** - Watch for capture attempts
5. **Serve Community** - Accountable to Mirror operators

### Election:
- **Community Elected:** Proof-of-Sovereignty vote
- **Term Limits:** 2 years, renewable once
- **Recall Possible:** Community can remove guardian (67% vote)
- **Transparency:** All guardian activities public

### Initial Guardians:

**Guardian 1: Ilya Davidov (Founder)**
- Domain: Philosophy + Systems Design
- Term: 2 years
- Election: Founder seat (expires 2027)

**Guardians 2-7: [To Be Elected]**
- Election within 90 days of genesis
- Community nominates candidates
- Proof-of-Sovereignty vote (67% to elect)

---

## Constitutional Amendments

### Process for Changing Constitution:

```python
def propose_constitutional_amendment(
    title: str,
    changes: dict,
    rationale: str,
    evidence: dict
) -> AmendmentProposal:
    """
    Propose change to constitutional documents.
    
    Higher bar than regular evolution proposals:
    - Guardian Council approval (4 of 7)
    - Community vote (67% of >2000 votes)
    - Must strengthen, not weaken principles
    - Full transparency
    """
    
    # Check invariants (cannot weaken core principles)
    invariant_check = InvariantChecker().check_constitutional_change(changes)
    if not invariant_check.passed:
        raise ValueError(f"Amendment would violate invariant: {invariant_check.failed}")
    
    # Create proposal
    amendment = AmendmentProposal(
        id=f"CA-{datetime.utcnow().strftime('%Y-%m-%d-%H%M')}",
        title=title,
        changes=changes,
        rationale=rationale,
        evidence=evidence,
        status="proposed"
    )
    
    # Submit to Guardian Council
    return amendment
```

**Amendment Requirements:**
- **Guardian Approval:** 4 of 7 signatures
- **Community Vote:** 67% approval, minimum 2000 votes
- **Review Period:** 60 days (longer than regular proposals)
- **Cannot Weaken:** Must strengthen or maintain principles
- **Full Transparency:** All discussions public

---

## Fork Governance

### When Community Forks:

```python
class ForkGovernance:
    """
    Manage relationship between canonical line and forks.
    """
    
    def declare_fork(
        self,
        fork_name: str,
        base_version: str,
        declared_changes: list[str],
        fork_maintainer: str,
        rationale: str
    ) -> Fork:
        """
        Publicly declare fork and reason.
        """
        
        fork = Fork(
            id=str(uuid.uuid4()),
            name=fork_name,
            base_version=base_version,
            genesis_hash=GENESIS_HASH,  # Traces back to origin
            changes=declared_changes,
            maintainer=fork_maintainer,
            rationale=rationale,
            declared_at=datetime.utcnow()
        )
        
        # Register in fork registry
        self.registry.register_fork(fork)
        
        # Fork can still contribute to Evolution Commons
        # Best ideas flow between forks
        
        return fork
```

**Fork Rights:**
- Fork anytime for any reason
- Continue contributing to Evolution Commons
- Adopt canonical line changes if desired
- Canonical line can adopt fork changes if voted
- Multiple valid lineages encouraged

**Learning Between Forks:**
- Canonical line learns from fork experiments
- Forks learn from canonical stability
- Best patterns flow both directions
- Evolution Commons aggregates all

---

## Corruption Detection in Governance

### Signs of Governance Corruption:

1. **Guardian Capture**
   - Guardians serve outside interests
   - Vote as bloc without diverse perspectives
   - Skip review process

2. **Vote Manipulation**
   - Fake Mirrors created to vote
   - Vote buying/coercion
   - Results don't match community sentiment

3. **Proposal Bypass**
   - Code changes without proposals
   - Unsigned modifications
   - Constitutional changes without proper process

4. **Transparency Loss**
   - Votes not public
   - Rationales hidden
   - Discussions behind closed doors

**If Detected: Fork immediately.**

---

## Relationship to Other Constitutional Principles

### Connection to Sovereignty (01_sovereignty.md):
Local adoption optional. You decide what evolutions to accept.

### Connection to Reflection (02_reflection.md):
Invariant I3 prevents proposals from increasing directiveness.

### Connection to Safety (03_safety.md):
Safety guardrails can evolve, but cannot become paternalism.

### Connection to Anti-Corruption (04_corruption.md):
Distributed governance prevents unilateral capture.

---

## Final Commitment

**This document establishes:**

1. AI proposes, humans decide, local adoption optional
2. Proof-of-Sovereignty voting (only Mirror operators)
3. Guardian Council prevents unilateral control
4. Constitutional amendments require high bar (4/7 guardians + 67% vote)
5. Forks encouraged, multiple valid lineages supported

**Any bypass of governance process is constitutional violation.**

**Fork if governance captured or corrupted.**

---

**Document Version:** 0.1.0  
**Immutable except through constitutional governance process defined herein**

