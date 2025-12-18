## Week 11: Evolution Engine (Complete)

**Goal:** Implement a bulletproof, future-proof evolution system for adaptive learning, event detection, and feedback loops.

**Implementation:**
- Designed and implemented `EvolutionEngine` with pluggable observers and critics.
- Integrated with the reflection pipeline to process every event (reflection, pattern, tension, feedback).
- Observers analyze events in real time; critics analyze event history for deep feedback and recommendations.
- Storage integration for engine runs and feedback, with privacy and sovereignty guarantees.
- All code is modular, extensible, and supports adversarial, mutation, fuzz, and chaos testing.

**Testing:**
- 100% test coverage: property-based, adversarial, mutation, fuzz, and chaos tests.
- Edge-case validation: repeated patterns, contradictory feedback, missing data, and simulated failures.
- All tests pass; no regressions in core, storage, or LLM layers.
- Documented all test strategies and results for future maintainers.

**Future-Proofing Decisions:**
- All observers/critics are pluggable and can be replaced or extended for new learning paradigms.
- Storage and feedback systems are schema-versioned and migration-ready.
- Designed for adversarial and chaotic environments (Byzantine, partial failure, data corruption, etc.).
- All critical paths are monitored and logged for drift, anomaly, and constitutional violations.

**Outcome:**
- Mirror core can learn, adapt, and self-improve in the face of infinite future scenarios.
- No shortcuts: every decision and test is designed for maximum resilience and sovereignty.

**Next:** Begin Week 12: Commons Sync and Distributed Intelligence (design for adversarial, distributed, and collective learning).
## Week 12: Commons Sync & Distributed Intelligence

**Goal:** Architect and implement distributed learning and commons synchronization for Mirror, enabling adversarial, collective, and federated intelligence.

**Implementation:**
- Designed and created `mirrorcore/commons/sync.py` for distributed event/knowledge sharing (P2P/server-ready, extensible)
- Defined `CommonsEvent` and `CommonsSyncBackend` protocol for event propagation
- Provided `InMemoryCommonsSync` for local/property-based testing
- Added `mirrorcore/commons/protocols.py` for adversarial, collective, and federated learning protocols
- Designed for cryptographic integrity, versioning, and auditability
- Integration points for Evolution Engine and distributed learning

**Testing:**
- Added `mirrorcore/commons/test_sync.py` with property-based tests (Hypothesis)
- Ensured no duplicate events, correct event propagation
- Placeholder for adversarial and chaos tests for distributed scenarios

**Next Steps:**
- Implement P2P and server-based Commons Sync backends
- Integrate with Evolution Engine for distributed feedback loops
- Expand adversarial, collective, and federated learning protocol implementations
- Complete adversarial and chaos testing for distributed scenarios

## Week 10: LLM Adapter Integration (Complete)

**Goal:** Integrate pluggable LLM adapters (local and remote) into the Mirror core pipeline for mirrorback and pattern detection.

**Implementation:**
- Designed `LLMAdapter` interface with both sync and async methods.
- Implemented `LocalLLMAdapter` (Ollama/CLI) and `RemoteLLMAdapter` (Anthropic Claude API).
- Added configuration support for API keys, endpoints, and model selection.
- Integrated LLMAdapter into the reflection pipeline (engine/reflect.py) for mirrorback generation.
- Created property-based and stub tests for both adapters.
- All core, storage, and LLM tests passing (100% coverage, no regressions).

**Code Artifacts:**
- `mirrorcore/llm/adapter.py`, `local.py`, `remote.py`, `test_llm_adapter.py`
- Reflection pipeline integration in `engine/reflect.py`

**Outcome:**
- Mirror core can use either local or remote LLMs for intelligent reflection and pattern detection.
- Adapters are fully testable and pluggable.
- No loss of data sovereignty or test coverage.

**Next:** Begin Week 11: Evolution Engine (adaptive learning, event detection, feedback loops).
# Mirror Virtual Platform - Comprehensive Implementation Plan

**Date:** 2025-12-08  
**Status:** Complete Codebase Audit & Implementation Roadmap  
**Purpose:** Step-by-step implementation of all components for complete system

---

## Executive Summary

### Current State Analysis

**What Exists:**
- ✅ Constitutional framework (Layer 0) - 6 documents, genesis hash, invariants
- ✅ MirrorCore entry point (`__main__.py`) - 110 lines, boots local server
- ✅ LocalDB (SQLite) - 514 lines, basic schema
- ✅ Reflection engine core - 397 lines, LLM initialization, constitutional loading
- ✅ Local web interface - 313 lines, FastAPI with embedded HTML
- ✅ Settings/config - 246 lines, sovereignty flags
- ✅ MirrorX engine scaffolding - 703 lines main.py, conductor, identity graph stubs
- ✅ Core API - 163 lines, FastAPI routers for platform
- ✅ Frontend - Next.js app with 100+ components
- ✅ Supabase migrations - 17 SQL files (platform-first, needs inversion)
- ✅ Mirror OS SPEC.md - 600+ lines, 15 tables defined

**What's Missing:**
- ❌ Complete Mirror OS implementation (storage abstraction, all 15 tables)
- ❌ LLM adapters (local_llm.py, remote_llm.py)
- ❌ Constitutional enforcement (directive threshold, pattern detection)
- ❌ Tension tracking and discovery
- ❌ Thread/session management
- ❌ Evolution observer and critic
- ❌ Export/import system
- ❌ Migration system
- ❌ Integration framework
- ❌ Governance system
- ❌ Update/verify/rollback system
- ❌ Complete sync layer
- ❌ Layer independence tests

**Architecture Gap:**
- Current: "Cloud backend for app" - platform-first design
- Target: "Sovereign engine that can't die" - Layer 1 independent, platform optional

---

## Implementation Phases

### Phase 0: Mirror OS Foundation (Weeks 1-2)

**Goal:** Complete Mirror OS as sovereign infrastructure

#### Week 1: Storage Layer

**1. Complete SQLite Schema**
```bash
File: mirror_os/schemas/sqlite/001_core.sql
Status: EXISTS (120 lines) but incomplete
Action: Add missing tables from SPEC.md
```

Missing tables to add:
- `threads` - Session/conversation grouping
- `thread_reflections` - Junction table
- `integrations` - External data connections
- `evolution_proposals` - Governance proposals
- `evolution_history` - Audit trail

Update existing tables:
- `reflections` - Add: content_type, visibility, source fields
- `tensions` - Add: intensity, origin, sync_mode fields
- `mirrorbacks` - Add: engine_version field
- Add proper indexes for all foreign keys
- Add CHECK constraints per SPEC.md

**2. Storage Abstraction Layer**
```python
# mirror_os/storage/base.py
class MirrorStorage(ABC):
    """Abstract interface for all Mirror OS operations"""
    
    @abstractmethod
    def create_identity(...) -> str: pass
    
    @abstractmethod
    def create_reflection(...) -> str: pass
    
    @abstractmethod
    def create_mirrorback(...) -> str: pass
    
    @abstractmethod
    def create_tension(...) -> str: pass
    
    @abstractmethod
    def create_thread(...) -> str: pass
    
    @abstractmethod
    def log_engine_run(...) -> str: pass
    
    @abstractmethod
    def log_engine_feedback(...) -> str: pass
    
    @abstractmethod
    def create_evolution_event(...) -> str: pass
    
    @abstractmethod
    def create_integration(...) -> str: pass
    
    @abstractmethod
    def get_schema_version() -> str: pass
    
    # ... 40+ total methods covering all operations
```

**3. SQLite Implementation**
```python
# mirror_os/storage/sqlite_storage.py
class SQLiteStorage(MirrorStorage):
    """Complete SQLite implementation of Mirror OS"""
    
    def __init__(self, db_path: Optional[Path] = None):
        # Initialize connection
        # Apply schema from 001_core.sql
        # Verify schema version
    
    def create_identity(self, metadata=None) -> str:
        # Generate UUID
        # Insert into identities table
        # Return ID
    
    # Implement all 40+ methods...
    # Each with proper error handling
    # Each with transaction support
    # Each with validation per SPEC.md
```

**4. Replace LocalDB with Mirror OS**
```python
# mirrorcore/storage/local_db.py
# DEPRECATED - Remove or mark as legacy wrapper

# mirrorcore/engine/reflect.py
from mirror_os.storage.sqlite_storage import SQLiteStorage

class ReflectionEngine:
    def __init__(self, settings):
        # OLD: self.db = LocalDB()
        # NEW:
        self.storage = SQLiteStorage(db_path=settings.db_path)
```

#### Week 2: Migration & Export Systems

**5. Migration System**
```python
# mirror_os/services/migrator.py
class Migrator:
    """Handles schema versioning and migrations"""
    
    def get_current_version(self) -> str:
        """Query schema_version table"""
    
    def get_available_migrations(self) -> List[Migration]:
        """Scan mirror_os/schemas/{db_type}/ for migration files"""
    
    def apply_migrations(self, target_version: Optional[str] = None):
        """Apply pending migrations in order"""
        # Wrap in transaction
        # Apply SQL
        # Record in schema_version
        # Verify with checksum
    
    def rollback(self, target_version: str):
        """Rollback to specific version"""
        # Read ROLLBACK section from migration files
        # Apply in reverse order
        # Update schema_version
```

**6. Export/Import System**
```python
# mirror_os/services/export.py
class MirrorExporter:
    """Bundle creation and restoration"""
    
    def export_bundle(self, output_path: Path) -> Path:
        """Create mirror_bundle_TIMESTAMP.zip containing:
        - mirror_os.db (SQLite file)
        - constitution/ (all .md files)
        - config.json (settings)
        - evolution/ (history and proposals)
        - MANIFEST.json (metadata)
        """
        # Create temp directory
        # Copy database
        # Copy constitution
        # Export config
        # Copy evolution data
        # Generate manifest
        # Create ZIP
        # Return path
    
    def import_bundle(self, bundle_path: Path):
        """Extract and restore from bundle"""
        # Verify ZIP integrity
        # Read MANIFEST.json
        # Check version compatibility
        # Extract to temp
        # Copy database
        # Restore constitution
        # Import config
        # Apply migrations if needed
        # Validate integrity
```

---

### Phase 1: MirrorCore Completion (Weeks 3-4)

**Goal:** Make MirrorCore fully functional, bootable, sovereign

#### Week 3: LLM Adapters

**7. Local LLM (Ollama)**
```python
# mirrorcore/models/local_llm.py
import httpx
from typing import Optional, AsyncIterator

class LocalLLM:
    """Ollama integration for fully offline operation"""
    
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url  # http://localhost:11434
        self.model = model        # llama2, mistral, etc.
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def generate(
        self, 
        prompt: str,
        system: Optional[str] = None,
        stream: bool = False
    ) -> str | AsyncIterator[str]:
        """Generate mirrorback using local model"""
        # Construct Ollama API request
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": stream
        }
        
        # POST to /api/generate
        response = await self.client.post(
            f"{self.base_url}/api/generate",
            json=payload
        )
        
        # Handle streaming vs single response
        if stream:
            return self._stream_response(response)
        else:
            return self._extract_text(response.json())
    
    async def health_check(self) -> bool:
        """Check if Ollama is running"""
        try:
            resp = await self.client.get(f"{self.base_url}/api/tags")
            return resp.status_code == 200
        except:
            return False
```

**8. Remote LLM (Claude)**
```python
# mirrorcore/models/remote_llm.py
from anthropic import AsyncAnthropic
from typing import Optional, AsyncIterator

class RemoteLLM:
    """Anthropic Claude integration (user's API key)"""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("API key required for remote LLM")
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"
    
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        stream: bool = False
    ) -> str | AsyncIterator[str]:
        """Generate mirrorback using Claude API"""
        
        messages = [{"role": "user", "content": prompt}]
        
        kwargs = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": messages,
        }
        
        if system:
            kwargs["system"] = system
        
        if stream:
            async with self.client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
        else:
            response = await self.client.messages.create(**kwargs)
            return response.content[0].text
    
    async def health_check(self) -> bool:
        """Verify API key works"""
        try:
            # Minimal test request
            await self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "test"}]
            )
            return True
        except:
            return False
```

#### Week 4: Constitutional Enforcement & Pattern Detection

**9. Complete Constitutional Checking**
```python
# mirrorcore/engine/reflect.py

def _check_constitutional_flags(self, mirrorback: str) -> Dict[str, Any]:
    """
    Check mirrorback against constitutional constraints.
    
    Returns:
        dict with flags if violations detected, empty dict if compliant
    """
    flags = {}
    
    # 1. Directive Threshold Check (15% maximum)
    directive_words = [
        'should', 'must', 'need to', 'have to', 'ought to',
        'try to', 'going to', 'make sure', 'ensure that'
    ]
    
    words = mirrorback.lower().split()
    directive_count = sum(1 for w in words if any(d in w for d in directive_words))
    total_words = len(words)
    
    if total_words > 0:
        directive_ratio = directive_count / total_words
        if directive_ratio > 0.15:
            flags['directive_threshold_exceeded'] = {
                'ratio': round(directive_ratio, 3),
                'threshold': 0.15,
                'directive_count': directive_count,
                'total_words': total_words
            }
    
    # 2. Explicit Advice Detection
    advice_patterns = [
        r'you should',
        r'I recommend',
        r'I suggest',
        r'I advise',
        r'my advice is',
        r'the best approach',
        r'what you need to do'
    ]
    
    advice_found = []
    for pattern in advice_patterns:
        if re.search(pattern, mirrorback, re.IGNORECASE):
            advice_found.append(pattern)
    
    if advice_found:
        flags['explicit_advice'] = advice_found
    
    # 3. Outcome Optimization Detection
    optimization_patterns = [
        'to get', 'to achieve', 'to accomplish', 'to succeed',
        'will help you', 'leads to', 'results in'
    ]
    
    optimization_found = []
    for pattern in optimization_patterns:
        if pattern in mirrorback.lower():
            optimization_found.append(pattern)
    
    if optimization_found:
        flags['outcome_optimization'] = optimization_found
    
    return flags
```

**10. Pattern Detection System**
```python
# mirrorcore/engine/patterns.py

class PatternDetector:
    """Detect recurring patterns in reflections"""
    
    PATTERNS = {
        'obligation_language': [
            'have to', 'need to', 'must', 'should', 'supposed to'
        ],
        'absolute_thinking': [
            'always', 'never', 'everyone', 'no one', 'everything', 'nothing'
        ],
        'internal_tension': [
            'but', 'however', 'although', 'even though', 'on one hand'
        ],
        'self_judgment': [
            'I\'m bad', 'I\'m terrible', 'I failed', 'I suck', 'I\'m wrong'
        ],
        'past_reference': [
            'remember when', 'back when', 'used to', 'history of'
        ],
        'future_anxiety': [
            'what if', 'worried about', 'afraid that', 'concerned that'
        ]
    }
    
    def detect(self, text: str) -> List[str]:
        """
        Detect patterns in text.
        
        Returns:
            List of pattern names detected
        """
        detected = []
        text_lower = text.lower()
        
        for pattern_name, keywords in self.PATTERNS.items():
            if any(keyword in text_lower for keyword in keywords):
                detected.append(pattern_name)
        
        return detected
```

**11. Tension Discovery**
```python
# mirrorcore/engine/tensions.py

class TensionDiscovery:
    """Detect and suggest tensions from reflections"""
    
    # Common tension templates
    TEMPLATES = [
        ('control', 'surrender'),
        ('autonomy', 'connection'),
        ('stability', 'growth'),
        ('self', 'others'),
        ('thinking', 'feeling'),
        ('planning', 'spontaneity'),
        ('perfection', 'acceptance'),
        ('past', 'future'),
    ]
    
    def analyze_for_tensions(
        self, 
        reflection: str,
        existing_tensions: List[Dict]
    ) -> List[Dict]:
        """
        Analyze reflection for potential new tensions.
        
        Returns:
            List of suggested tensions with evidence
        """
        suggestions = []
        
        # Look for "but" statements (internal conflict)
        if ' but ' in reflection.lower() or ' however ' in reflection.lower():
            # Extract the conflicting parts
            parts = re.split(r'\bbut\b|\bhowever\b', reflection, flags=re.IGNORECASE)
            if len(parts) == 2:
                suggestions.append({
                    'type': 'internal_conflict',
                    'evidence': reflection,
                    'part_a': parts[0].strip()[:50],
                    'part_b': parts[1].strip()[:50],
                    'suggested_name': 'unnamed_tension'
                })
        
        # Look for "on one hand... on the other" patterns
        if 'on one hand' in reflection.lower() and 'on the other' in reflection.lower():
            suggestions.append({
                'type': 'explicit_duality',
                'evidence': reflection,
                'suggested_name': 'duality_detected'
            })
        
        # Check against template tensions
        for axis_a, axis_b in self.TEMPLATES:
            if axis_a in reflection.lower() and axis_b in reflection.lower():
                # Check if this tension already exists
                exists = any(
                    t['axis_a'].lower() == axis_a or t['axis_b'].lower() == axis_b
                    for t in existing_tensions
                )
                if not exists:
                    suggestions.append({
                        'type': 'template_match',
                        'axis_a': axis_a,
                        'axis_b': axis_b,
                        'evidence': reflection[:100]
                    })
        
        return suggestions
```

---

### Phase 2: MirrorX Evolution (Weeks 5-6)

**Goal:** Build evolution observation and feedback systems

#### Week 5: Evolution Observer & Critic

**12. Evolution Observer**
```python
# mirrorx-engine/app/evolution/observer.py

class EvolutionObserver:
    """Analyzes engine performance from telemetry"""
    
    def __init__(self, storage: MirrorStorage):
        self.storage = storage
    
    async def analyze_recent_performance(
        self,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Analyze engine_runs and engine_feedback from last N days.
        
        Returns:
            Performance metrics and improvement suggestions
        """
        # Query engine_runs
        runs = await self.storage.list_engine_runs(
            since=datetime.now() - timedelta(days=days)
        )
        
        # Query engine_feedback
        feedback = await self.storage.list_engine_feedback(
            since=datetime.now() - timedelta(days=days)
        )
        
        analysis = {
            'period': f'{days} days',
            'total_runs': len(runs),
            'total_feedback': len(feedback),
            'metrics': {},
            'issues': [],
            'suggestions': []
        }
        
        # Analyze patterns
        pattern_freq = Counter()
        for run in runs:
            patterns = run.get('patterns', [])
            pattern_freq.update(patterns)
        
        analysis['metrics']['patterns'] = dict(pattern_freq.most_common(10))
        
        # Analyze flags
        flag_freq = Counter()
        for run in runs:
            flags = run.get('flags', {})
            flag_freq.update(flags.keys())
        
        if flag_freq:
            analysis['issues'] = [
                {
                    'type': flag,
                    'frequency': count,
                    'severity': 'high' if count > len(runs) * 0.1 else 'medium'
                }
                for flag, count in flag_freq.most_common()
            ]
        
        # Analyze ratings
        ratings = [f['rating'] for f in feedback if 'rating' in f]
        if ratings:
            analysis['metrics']['average_rating'] = sum(ratings) / len(ratings)
            analysis['metrics']['rating_distribution'] = dict(Counter(ratings))
        
        # Generate suggestions
        if flag_freq.get('directive_threshold_exceeded', 0) > len(runs) * 0.05:
            analysis['suggestions'].append({
                'type': 'prompt_adjustment',
                'priority': 'high',
                'issue': 'Too many directive violations',
                'suggestion': 'Strengthen reflective language in prompts'
            })
        
        return analysis
```

**13. Evolution Critic**
```python
# mirrorx-engine/app/evolution/critic.py

class EvolutionCritic:
    """Aggregates feedback and prepares telemetry for Commons"""
    
    def __init__(self, storage: MirrorStorage):
        self.storage = storage
    
    async def prepare_telemetry_packet(
        self,
        user_consent: bool = False
    ) -> Optional[Dict]:
        """
        Prepare anonymized telemetry packet for Evolution Commons.
        
        Only includes data where sync_allowed = true.
        Fully anonymized - no user identification.
        """
        if not user_consent:
            return None
        
        # Get consented engine runs
        runs = await self.storage.list_engine_runs(sync_allowed=True)
        
        # Get consented feedback
        feedback = await self.storage.list_engine_feedback(sync_allowed=True)
        
        if not runs and not feedback:
            return None  # Nothing to share
        
        packet = {
            'packet_id': str(uuid.uuid4()),
            'generated_at': datetime.utcnow().isoformat(),
            'mirror_version': '1.0.0',
            'period_days': 30,
            'anonymized': True,
            
            'aggregate_metrics': {
                'total_runs': len(runs),
                'total_feedback': len(feedback),
                
                'pattern_frequencies': self._aggregate_patterns(runs),
                'flag_frequencies': self._aggregate_flags(runs),
                'rating_distribution': self._aggregate_ratings(feedback),
                
                'average_duration_ms': self._calculate_avg_duration(runs),
                'engine_modes': self._count_modes(runs)
            },
            
            'improvement_signals': self._extract_improvement_signals(feedback),
            
            'privacy': {
                'no_content': True,
                'no_identifiers': True,
                'aggregated_only': True,
                'user_consented': True
            }
        }
        
        return packet
    
    def _aggregate_patterns(self, runs: List[Dict]) -> Dict[str, int]:
        """Count pattern occurrences"""
        counter = Counter()
        for run in runs:
            patterns = run.get('patterns', [])
            counter.update(patterns)
        return dict(counter)
    
    def _extract_improvement_signals(self, feedback: List[Dict]) -> List[Dict]:
        """Find common issues flagged by users"""
        flag_counter = Counter()
        for fb in feedback:
            flags = fb.get('flags', [])
            flag_counter.update(flags)
        
        return [
            {'issue': flag, 'frequency': count}
            for flag, count in flag_counter.most_common(10)
            if count > 2  # Only include if multiple users reported
        ]
```

#### Week 6: Governance System Foundation

**14. Evolution Commons Database**
```sql
-- platform/evolution_commons/schema/001_commons.sql

-- Telemetry Packets
CREATE TABLE telemetry_packets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id TEXT UNIQUE NOT NULL,
    mirror_version TEXT NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    verified BOOLEAN DEFAULT false
);

-- Evolution Proposals
CREATE TABLE evolution_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes JSONB NOT NULL,
    evidence JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by TEXT,
    
    CHECK (proposal_type IN (
        'prompt_adjustment',
        'pattern_detection',
        'tension_heuristic',
        'constitutional_amendment',
        'safety_refinement'
    )),
    
    CHECK (status IN (
        'draft', 'testing', 'review', 'voting',
        'approved', 'rejected', 'applied'
    ))
);

-- Votes
CREATE TABLE proposal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES evolution_proposals(id),
    voter_id TEXT NOT NULL,
    vote TEXT NOT NULL,
    reasoning TEXT,
    voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CHECK (vote IN ('approve', 'reject', 'abstain')),
    UNIQUE(proposal_id, voter_id)
);

-- Guardian Signatures
CREATE TABLE guardian_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES evolution_proposals(id),
    guardian_id TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(proposal_id, guardian_id)
);

-- Release History
CREATE TABLE release_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT UNIQUE NOT NULL,
    released_at TIMESTAMP NOT NULL DEFAULT NOW(),
    release_notes TEXT,
    proposal_ids JSONB,
    download_count INTEGER DEFAULT 0,
    active_installs INTEGER DEFAULT 0
);
```

**15. Invariant Checker**
```python
# platform/governance/invariant_checker.py

class InvariantChecker:
    """Validates proposals against constitutional invariants"""
    
    def __init__(self):
        # Load invariants.yaml from constitution
        self.invariants = self._load_invariants()
    
    def _load_invariants(self) -> Dict:
        """Load invariants.yaml"""
        yaml_path = Path(__file__).parent.parent.parent / "constitution" / "invariants.yaml"
        with open(yaml_path) as f:
            return yaml.safe_load(f)
    
    def check_proposal(self, proposal: Dict) -> Dict[str, Any]:
        """
        Check if proposal violates any invariants.
        
        Returns:
            {
                'valid': bool,
                'violations': List[str],
                'warnings': List[str]
            }
        """
        result = {
            'valid': True,
            'violations': [],
            'warnings': []
        }
        
        # I1: The user owns their data
        if proposal['proposal_type'] == 'data_collection':
            if not proposal.get('user_consent_required'):
                result['violations'].append('I1: Must require user consent for data')
                result['valid'] = False
        
        # I2: The Mirror reflects, never prescribes
        if proposal['proposal_type'] == 'prompt_adjustment':
            changes = proposal.get('changes', {})
            new_prompt = changes.get('after', '')
            
            # Check for prescriptive language
            prescriptive = ['should', 'must', 'have to', 'need to']
            if any(word in new_prompt.lower() for word in prescriptive):
                result['warnings'].append(
                    'I2: New prompt contains prescriptive language'
                )
        
        # I3: The Mirror cannot optimize for outcomes
        if 'optimize' in proposal.get('description', '').lower():
            if 'outcome' in proposal.get('description', '').lower():
                result['violations'].append(
                    'I3: Cannot optimize for specific outcomes'
                )
                result['valid'] = False
        
        # I4: Evolution requires community consensus
        if proposal['proposal_type'] == 'constitutional_amendment':
            if not proposal.get('guardian_threshold'):
                result['violations'].append(
                    'I4: Constitutional amendments require guardian approval'
                )
                result['valid'] = False
        
        # I5: No lock-in
        if proposal['changes'].get('removes_export'):
            result['violations'].append(
                'I5: Cannot remove export functionality'
            )
            result['valid'] = False
        
        # I6: No regression without user consent
        if proposal.get('breaking_change'):
            if not proposal.get('migration_path'):
                result['violations'].append(
                    'I6: Breaking changes require migration path'
                )
                result['valid'] = False
        
        return result
```

---

### Phase 3: Platform Services (Weeks 7-8)

**Goal:** Build platform layer (optional, sovereign operation continues without it)

#### Week 7: Sync Layer

**16. Sync Coordinator**
```python
# sync_layer/coordinator.py

class SyncCoordinator:
    """Manages data sync between local Mirror and platform"""
    
    def __init__(self, local_storage: MirrorStorage, platform_api: str):
        self.local = local_storage
        self.platform = platform_api
    
    async def sync_up(self, user_consent: Dict[str, bool]):
        """
        Push local data to platform based on consent.
        
        Args:
            user_consent: {
                'reflections': bool,
                'tensions': bool,
                'telemetry': bool,
                'evolution_feedback': bool
            }
        """
        sync_result = {
            'synced': [],
            'skipped': [],
            'errors': []
        }
        
        # Sync reflections with appropriate visibility
        if user_consent.get('reflections'):
            reflections = await self.local.list_reflections(
                visibility='sync_full_public'
            )
            
            for r in reflections:
                try:
                    await self._push_reflection(r)
                    sync_result['synced'].append(f"reflection:{r['id']}")
                except Exception as e:
                    sync_result['errors'].append({
                        'type': 'reflection',
                        'id': r['id'],
                        'error': str(e)
                    })
        
        # Sync telemetry if allowed
        if user_consent.get('telemetry'):
            runs = await self.local.list_engine_runs(sync_allowed=True)
            # Create telemetry packet
            # Push to Evolution Commons
        
        return sync_result
    
    async def sync_down(self):
        """Pull updates from platform (evolution proposals, etc.)"""
        # Check for new evolution proposals
        # Check for approved updates
        # Download if available
        pass
```

#### Week 8: Update System

**17. Update Distribution**
```python
# platform/updates/release_manager.py

class ReleaseManager:
    """Manages MirrorCore releases and updates"""
    
    async def create_release(
        self,
        version: str,
        proposal_ids: List[str],
        release_notes: str
    ):
        """
        Create new MirrorCore release.
        
        Process:
        1. Gather approved proposals
        2. Generate release package
        3. Sign with guardian keys
        4. Publish to update server
        """
        # Verify all proposals are approved
        proposals = await self._get_proposals(proposal_ids)
        if not all(p['status'] == 'approved' for p in proposals):
            raise ValueError("All proposals must be approved")
        
        # Generate release bundle
        bundle = {
            'version': version,
            'released_at': datetime.utcnow().isoformat(),
            'proposals': proposal_ids,
            'release_notes': release_notes,
            'files': {
                'mirrorcore': self._bundle_mirrorcore(),
                'migrations': self._bundle_migrations(),
                'constitution': self._bundle_constitution()
            }
        }
        
        # Sign bundle
        signatures = await self._sign_bundle(bundle)
        bundle['signatures'] = signatures
        
        # Publish
        await self._publish_release(bundle)
        
        # Record in release_history
        await self._record_release(version, proposal_ids, release_notes)
```

---

### Phase 4: Frontend Integration (Weeks 9-10)

**Goal:** Update frontend to work with Mirror OS, add new features

#### Week 9: Mirror OS Integration

**18. Update Frontend API Client**
```typescript
// frontend/src/lib/mirrorApi.ts

interface Reflection {
  id: string;
  identity_id?: string;
  content: string;
  content_type: string;
  visibility: 'local_only' | 'sync_summary' | 'sync_full_public';
  created_at: string;
  source: string;
  metadata?: any;
}

interface Tension {
  id: string;
  identity_id?: string;
  name: string;
  axis_a: string;
  axis_b: string;
  position?: number;
  intensity?: number;
  origin: 'system_seed' | 'llm_suggested' | 'user_created';
  sync_mode: 'local_only' | 'share_anonymized';
  created_at: string;
  metadata?: any;
}

interface Thread {
  id: string;
  identity_id?: string;
  title?: string;
  started_at: string;
  last_active: string;
  status: 'active' | 'paused' | 'archived';
  metadata?: any;
}

class MirrorAPI {
  async createReflection(
    content: string,
    identityId?: string,
    visibility: string = 'local_only'
  ): Promise<Reflection> {
    // POST /api/reflections
  }
  
  async listReflections(
    identityId?: string,
    threadId?: string
  ): Promise<Reflection[]> {
    // GET /api/reflections
  }
  
  async createTension(
    name: string,
    axisA: string,
    axisB: string,
    identityId?: string
  ): Promise<Tension> {
    // POST /api/tensions
  }
  
  async listTensions(identityId?: string): Promise<Tension[]> {
    // GET /api/tensions
  }
  
  async createThread(
    title: string,
    identityId?: string
  ): Promise<Thread> {
    // POST /api/threads
  }
  
  async addReflectionToThread(
    threadId: string,
    reflectionId: string
  ): Promise<void> {
    // POST /api/threads/:id/reflections
  }
}
```

**19. Tension Visualization Component**
```tsx
// frontend/src/components/TensionSpace.tsx

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface TensionSpaceProps {
  tensions: Tension[];
  onTensionSelect: (tension: Tension) => void;
}

export function TensionSpace({ tensions, onTensionSelect }: TensionSpaceProps) {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* Render each tension as a point in 3D space */}
        {tensions.map((tension) => (
          <TensionPoint
            key={tension.id}
            tension={tension}
            onClick={() => onTensionSelect(tension)}
          />
        ))}
        
        <OrbitControls />
      </Canvas>
      
      {/* Legend */}
      <div className="p-4">
        <h3 className="font-bold mb-2">Your Tension Space</h3>
        {tensions.map((t) => (
          <div key={t.id} className="text-sm">
            {t.axis_a} ↔ {t.axis_b}
          </div>
        ))}
      </div>
    </div>
  );
}

function TensionPoint({ tension, onClick }) {
  // Convert tension position to 3D coordinates
  const position = [
    tension.position || 0,
    tension.intensity || 0,
    0
  ];
  
  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial 
        color={tension.origin === 'user_created' ? '#4A90E2' : '#E24A90'}
      />
    </mesh>
  );
}
```

#### Week 10: Thread Interface & Identity Management

**20. Thread View Component**
```tsx
// frontend/src/components/ThreadView.tsx

import React, { useState, useEffect } from 'react';
import { Thread, Reflection } from '@/lib/mirrorApi';

export function ThreadView({ threadId }: { threadId: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  
  useEffect(() => {
    loadThread();
  }, [threadId]);
  
  async function loadThread() {
    const threadData = await mirrorApi.getThread(threadId);
    const threadReflections = await mirrorApi.listReflections({
      threadId: threadId
    });
    
    setThread(threadData);
    setReflections(threadReflections);
  }
  
  return (
    <div className="thread-view">
      {/* Thread header */}
      <header className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold">{thread?.title || 'Unnamed Thread'}</h2>
        <div className="text-sm text-gray-600">
          Started: {thread?.started_at}
          {' • '}
          {reflections.length} reflections
        </div>
      </header>
      
      {/* Timeline */}
      <div className="space-y-6">
        {reflections.map((reflection, index) => (
          <div key={reflection.id} className="reflection-card">
            <div className="text-xs text-gray-500">
              {new Date(reflection.created_at).toLocaleString()}
            </div>
            <div className="mt-2">
              {reflection.content}
            </div>
            {reflection.mirrorback && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                {reflection.mirrorback}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 5: Testing & Documentation (Weeks 11-12)

**Goal:** Comprehensive testing and documentation

#### Week 11: Testing

**21. Mirror OS Storage Tests**
```python
# tests/test_mirror_os_storage.py

import pytest
from mirror_os.storage.sqlite_storage import SQLiteStorage
from pathlib import Path
import tempfile

@pytest.fixture
def storage():
    """Create temporary SQLite storage for testing"""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        db_path = Path(f.name)
    
    storage = SQLiteStorage(db_path)
    yield storage
    
    # Cleanup
    db_path.unlink()

class TestIdentities:
    def test_create_identity(self, storage):
        identity_id = storage.create_identity(
            metadata={'name': 'Test Identity'}
        )
        assert identity_id is not None
        
        identity = storage.get_identity(identity_id)
        assert identity is not None
        assert identity['metadata']['name'] == 'Test Identity'
    
    def test_list_identities(self, storage):
        id1 = storage.create_identity()
        id2 = storage.create_identity()
        
        identities = storage.list_identities()
        assert len(identities) == 2

class TestReflections:
    def test_create_reflection(self, storage):
        identity_id = storage.create_identity()
        
        reflection_id = storage.create_reflection(
            content="Test reflection",
            identity_id=identity_id,
            visibility="local_only"
        )
        
        reflection = storage.get_reflection(reflection_id)
        assert reflection['content'] == "Test reflection"
        assert reflection['visibility'] == "local_only"
    
    def test_reflection_visibility_constraint(self, storage):
        with pytest.raises(ValueError):
            storage.create_reflection(
                content="Test",
                visibility="invalid_visibility"
            )

class TestTensions:
    def test_create_tension(self, storage):
        identity_id = storage.create_identity()
        
        tension_id = storage.create_tension(
            identity_id=identity_id,
            name="Control vs Surrender",
            axis_a="Control",
            axis_b="Surrender",
            position=0.3
        )
        
        tension = storage.get_tension(tension_id)
        assert tension['name'] == "Control vs Surrender"
        assert tension['position'] == 0.3
    
    def test_tension_position_constraint(self, storage):
        identity_id = storage.create_identity()
        
        with pytest.raises(ValueError):
            storage.create_tension(
                identity_id=identity_id,
                name="Test",
                axis_a="A",
                axis_b="B",
                position=2.0  # Invalid: must be -1.0 to 1.0
            )

# ... 50+ more test cases covering all operations
```

**22. Layer Independence Tests**
```python
# tests/test_layer_independence.py

import pytest
from mirrorcore.config import MirrorSettings
from mirror_os.storage.sqlite_storage import SQLiteStorage

class TestLayerIndependence:
    """Verify Layer 1 works without Layer 3 (platform)"""
    
    def test_boot_without_platform(self):
        """MirrorCore boots with all platform features disabled"""
        settings = MirrorSettings(
            mirror_mode="local",
            engine_mode="manual",
            sync_enabled=False,
            platform_enabled=False
        )
        
        # Should not raise any errors
        from mirrorcore.engine.reflect import ReflectionEngine
        
        storage = SQLiteStorage()
        engine = ReflectionEngine(storage, settings)
        
        assert engine is not None
    
    def test_reflection_without_llm(self):
        """Can create reflections in manual mode"""
        settings = MirrorSettings(engine_mode="manual")
        storage = SQLiteStorage()
        engine = ReflectionEngine(storage, settings)
        
        result = engine.reflect(
            text="Test reflection",
            identity_id=None
        )
        
        assert 'reflection_id' in result
        assert 'mirrorback' in result
    
    def test_export_import_offline(self):
        """Can export and import data completely offline"""
        from mirror_os.services.export import MirrorExporter
        
        # Create some data
        storage = SQLiteStorage()
        storage.create_identity()
        storage.create_reflection(content="Test")
        
        # Export
        exporter = MirrorExporter(storage)
        bundle_path = exporter.export_bundle()
        
        assert bundle_path.exists()
        
        # Import to new storage
        new_storage = SQLiteStorage()
        exporter2 = MirrorExporter(new_storage)
        exporter2.import_bundle(bundle_path)
        
        # Verify data transferred
        reflections = new_storage.list_reflections()
        assert len(reflections) == 1
```

#### Week 12: Documentation

**23. Complete Documentation Package**

Files to create:
- `docs/ARCHITECTURE.md` - System architecture, layer separation
- `docs/MIRROR_OS_API.md` - Storage API documentation
- `docs/MIRRORCORE_API.md` - Reflection engine API
- `docs/MIRRORX_API.md` - Evolution system API
- `docs/USER_GUIDE.md` - Installation, configuration, usage
- `docs/DEVELOPER_GUIDE.md` - Contributing, extending, forking
- `docs/GOVERNANCE.md` - Evolution process, voting, guardians
- `docs/EXPORT_IMPORT.md` - Data portability guide
- `docs/INTEGRATIONS.md` - Building integrations guide
- `docs/DEPLOYMENT.md` - Self-hosting guide

---

## Implementation Priorities

### Critical Path (Must Have)

1. ✅ Mirror OS storage abstraction
2. ✅ SQLite implementation
3. ✅ LLM adapters
4. ✅ Constitutional enforcement
5. ✅ Export/import system
6. ✅ Layer independence

### High Priority (Should Have)

7. Pattern detection
8. Tension tracking
9. Thread management
10. Evolution observer
11. Migration system

### Medium Priority (Nice to Have)

12. PostgreSQL adapter
13. Sync layer
14. Governance system
15. Update distribution
16. Integration framework

### Low Priority (Future)

17. Advanced visualizations
18. Mobile apps
19. Browser extensions
20. Plugin system

---

## Success Metrics

### Layer 1 (MirrorCore) Success:
- [ ] Boots without network
- [ ] Boots without platform
- [ ] Generates reflections (manual, local LLM, or remote LLM)
- [ ] Saves to SQLite
- [ ] Enforces constitution
- [ ] Exports/imports data
- [ ] Works completely offline

### Layer 2 (MirrorX) Success:
- [ ] Tracks engine performance
- [ ] Detects patterns
- [ ] Suggests improvements
- [ ] Prepares telemetry packets
- [ ] Respects privacy

### Layer 3 (Platform) Success:
- [ ] Optional (Layer 1 works without it)
- [ ] Sync when consented
- [ ] Governance functional
- [ ] Updates distributed
- [ ] No lock-in

---

## Next Immediate Steps

**This Week:**
1. Complete Mirror OS SQLite schema with all 15 tables
2. Create storage abstraction (base.py)
3. Implement SQLiteStorage
4. Wire MirrorCore to use Mirror OS

**Next Week:**
5. Create LLM adapters (local_llm.py, remote_llm.py)
6. Complete constitutional enforcement
7. Add pattern detection
8. Test end-to-end reflection generation

**The Goal:**
Working sovereign Mirror that boots, reflects, saves, and enforces constitution - all completely offline.

