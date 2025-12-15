# THE MIRROR - ULTIMATE IMPLEMENTATION PLAN
## Complete Philosophical & Technical Blueprint

**Generated:** December 12, 2025  
**Source:** COMPREHENSIVE_IMPLEMENTATION_PLAN.md (1,461 lines)  
**Scope:** Every philosophical component, function, and system needed for complete vision

---

## 🎯 CORE PHILOSOPHICAL PRINCIPLES

### Constitutional Invariants (Layer 0 - Immutable)

**I1: Data Sovereignty**
- User owns ALL data, always
- No data collection without explicit consent
- Export must always work
- No cloud lock-in

**I2: Reflection, Never Prescription**
- Mirror reflects what is, never prescribes what should be
- Maximum 15% directive language threshold
- No explicit advice ("you should", "I recommend")
- No outcome optimization

**I3: No Outcome Optimization**
- Cannot optimize for specific user outcomes
- Cannot guide toward predetermined goals
- Cannot measure "success" or "progress"

**I4: Community Evolution**
- All evolution requires consensus
- Constitutional changes need guardian approval (75%+ supermajority)
- Telemetry is aggregated and anonymized only
- No single entity controls evolution

**I5: No Lock-In**
- Export functionality cannot be removed
- Must support complete data portability
- Users can fork and run independently
- No platform dependency for core function

**I6: No Regression Without Consent**
- Breaking changes require migration path
- Users must explicitly consent to upgrades
- Can always rollback to previous version
- Evolution proposals must document impacts

---

## 🏗️ THREE-LAYER ARCHITECTURE

### Layer 0: Constitution (Immutable Foundation)
**Purpose:** Philosophical constraints that cannot change
- `constitution/genesis.md` - Origin story and prime directive
- `constitution/invariants.yaml` - Machine-readable constraints
- `constitution/CONSTITUTION.md` - Human-readable principles
- `constitution/patterns.md` - Tension patterns and archetypes
- `constitution/evolution.md` - How system can evolve
- `constitution/hash.txt` - Genesis hash for verification

### Layer 1: MirrorCore (Sovereign Engine)
**Purpose:** Works completely offline, no platform dependency
- Local SQLite database
- Local LLM OR remote LLM (user's choice)
- Reflection generation
- Constitutional enforcement
- Pattern detection
- Export/import system
- **MUST BOOT WITHOUT NETWORK**
- **MUST BOOT WITHOUT PLATFORM**

### Layer 2: MirrorX (Evolution Engine)
**Purpose:** Observes, learns, proposes improvements
- Performance telemetry (opt-in only)
- Pattern frequency analysis
- Constitutional violation tracking
- Improvement proposal generation
- Privacy-preserving aggregation
- **OPTIONAL LAYER - Layer 1 works without it**

### Layer 3: Platform (Optional Services)
**Purpose:** Community, sync, governance - completely optional
- Evolution Commons (proposal voting)
- Guardian system (constitutional gatekeepers)
- Update distribution
- Sync service (user consent required)
- Public feed (opt-in only)
- **Layer 1 functions completely without this**

---

## 📊 COMPLETE DATABASE SCHEMA (15 TABLES)

### Core Identity & Reflection
```sql
-- 1. identities - Users/personas
CREATE TABLE identities (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    metadata JSONB
);

-- 2. reflections - User inputs
CREATE TABLE reflections (
    id TEXT PRIMARY KEY,
    identity_id TEXT REFERENCES identities(id),
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    visibility TEXT NOT NULL DEFAULT 'local_only',
    created_at TIMESTAMP NOT NULL,
    source TEXT,
    metadata JSONB,
    
    CHECK (content_type IN ('text', 'audio', 'image')),
    CHECK (visibility IN ('local_only', 'sync_summary', 'sync_full_public'))
);

-- 3. mirrorbacks - AI-generated reflections
CREATE TABLE mirrorbacks (
    id TEXT PRIMARY KEY,
    reflection_id TEXT REFERENCES reflections(id),
    identity_id TEXT REFERENCES identities(id),
    content TEXT NOT NULL,
    engine_version TEXT,
    created_at TIMESTAMP NOT NULL,
    metadata JSONB
);

-- 4. patterns - Detected recurring patterns
CREATE TABLE patterns (
    id TEXT PRIMARY KEY,
    identity_id TEXT REFERENCES identities(id),
    name TEXT NOT NULL,
    description TEXT,
    first_seen TIMESTAMP NOT NULL,
    last_seen TIMESTAMP NOT NULL,
    occurrence_count INTEGER DEFAULT 1,
    metadata JSONB
);

-- 5. pattern_occurrences - Pattern instances
CREATE TABLE pattern_occurrences (
    id TEXT PRIMARY KEY,
    pattern_id TEXT REFERENCES patterns(id),
    reflection_id TEXT REFERENCES reflections(id),
    detected_at TIMESTAMP NOT NULL,
    confidence REAL,
    metadata JSONB
);

-- 6. tensions - User's internal dualities
CREATE TABLE tensions (
    id TEXT PRIMARY KEY,
    identity_id TEXT REFERENCES identities(id),
    name TEXT NOT NULL,
    axis_a TEXT NOT NULL,
    axis_b TEXT NOT NULL,
    position REAL,
    intensity REAL,
    origin TEXT NOT NULL DEFAULT 'system_seed',
    sync_mode TEXT NOT NULL DEFAULT 'local_only',
    created_at TIMESTAMP NOT NULL,
    last_updated TIMESTAMP,
    metadata JSONB,
    
    CHECK (position >= -1.0 AND position <= 1.0),
    CHECK (intensity >= 0.0 AND intensity <= 1.0),
    CHECK (origin IN ('system_seed', 'llm_suggested', 'user_created')),
    CHECK (sync_mode IN ('local_only', 'share_anonymized'))
);

-- 7. tension_measurements - Position over time
CREATE TABLE tension_measurements (
    id TEXT PRIMARY KEY,
    tension_id TEXT REFERENCES tensions(id),
    reflection_id TEXT REFERENCES reflections(id),
    position REAL NOT NULL,
    measured_at TIMESTAMP NOT NULL,
    metadata JSONB,
    
    CHECK (position >= -1.0 AND position <= 1.0)
);
```

### Thread/Session Management
```sql
-- 8. threads - Conversation groupings
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    identity_id TEXT REFERENCES identities(id),
    title TEXT,
    started_at TIMESTAMP NOT NULL,
    last_active TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    metadata JSONB,
    
    CHECK (status IN ('active', 'paused', 'archived'))
);

-- 9. thread_reflections - Junction table
CREATE TABLE thread_reflections (
    thread_id TEXT REFERENCES threads(id),
    reflection_id TEXT REFERENCES reflections(id),
    added_at TIMESTAMP NOT NULL,
    sequence_number INTEGER,
    PRIMARY KEY (thread_id, reflection_id)
);
```

### Engine Telemetry & Evolution
```sql
-- 10. engine_runs - Performance telemetry
CREATE TABLE engine_runs (
    id TEXT PRIMARY KEY,
    reflection_id TEXT REFERENCES reflections(id),
    mirrorback_id TEXT REFERENCES mirrorbacks(id),
    identity_id TEXT REFERENCES identities(id),
    engine_version TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    patterns_detected TEXT,
    flags JSONB,
    sync_allowed BOOLEAN DEFAULT FALSE,
    metadata JSONB
);

-- 11. engine_feedback - User ratings
CREATE TABLE engine_feedback (
    id TEXT PRIMARY KEY,
    engine_run_id TEXT REFERENCES engine_runs(id),
    identity_id TEXT REFERENCES identities(id),
    rating INTEGER,
    feedback_type TEXT,
    feedback_text TEXT,
    flags TEXT,
    sync_allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    
    CHECK (rating >= 1 AND rating <= 5)
);

-- 12. evolution_events - System changes log
CREATE TABLE evolution_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    changes JSONB,
    source TEXT,
    applied_at TIMESTAMP NOT NULL,
    metadata JSONB,
    
    CHECK (event_type IN (
        'prompt_change',
        'pattern_added',
        'tension_added',
        'constitutional_update',
        'safety_update'
    ))
);
```

### Integrations & External Data
```sql
-- 13. integrations - External connections
CREATE TABLE integrations (
    id TEXT PRIMARY KEY,
    identity_id TEXT REFERENCES identities(id),
    integration_type TEXT NOT NULL,
    config JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_sync TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    metadata JSONB,
    
    CHECK (integration_type IN (
        'google_calendar',
        'apple_health',
        'spotify',
        'github',
        'custom_api'
    )),
    CHECK (status IN ('active', 'paused', 'error', 'disabled'))
);
```

### Evolution Governance
```sql
-- 14. evolution_proposals - Community proposals
CREATE TABLE evolution_proposals (
    id TEXT PRIMARY KEY,
    proposal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes JSONB NOT NULL,
    evidence JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    proposer_identity_id TEXT,
    created_at TIMESTAMP NOT NULL,
    voting_ends_at TIMESTAMP,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    votes_abstain INTEGER DEFAULT 0,
    
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

-- 15. evolution_history - Audit trail
CREATE TABLE evolution_history (
    id TEXT PRIMARY KEY,
    proposal_id TEXT REFERENCES evolution_proposals(id),
    action TEXT NOT NULL,
    performed_by TEXT,
    performed_at TIMESTAMP NOT NULL,
    details JSONB,
    
    CHECK (action IN (
        'submitted', 'testing_started', 'testing_completed',
        'voting_started', 'vote_cast', 'approved', 'rejected',
        'applied', 'rolled_back'
    ))
);
```

### Schema Versioning
```sql
-- schema_version - Migration tracking
CREATE TABLE schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL,
    checksum TEXT,
    description TEXT
);
```

---

## 🔧 COMPLETE COMPONENT INVENTORY

### 1. Mirror OS (Storage Layer)

**Files to Implement:**

```
mirror_os/
├── __init__.py
├── storage/
│   ├── __init__.py
│   ├── base.py - MirrorStorage ABC (40+ abstract methods)
│   ├── sqlite_storage.py - SQLiteStorage implementation
│   └── postgresql_storage.py - PostgreSQL adapter (future)
├── schemas/
│   ├── sqlite/
│   │   ├── 001_core.sql - Initial schema
│   │   ├── 002_add_threads.sql - Migration example
│   │   └── ROLLBACK_002.sql - Rollback script
│   └── postgresql/
│       └── 001_core.sql
├── services/
│   ├── __init__.py
│   ├── migrator.py - Migration system
│   ├── export.py - Bundle creation/restoration
│   └── validator.py - Data integrity checks
└── SPEC.md - Complete specification
```

**Key Methods in MirrorStorage ABC:**

```python
# Identity operations
create_identity(metadata=None) -> str
get_identity(identity_id: str) -> Dict
list_identities() -> List[Dict]
update_identity(identity_id: str, metadata: Dict)
delete_identity(identity_id: str)

# Reflection operations
create_reflection(content, identity_id, visibility, content_type, source) -> str
get_reflection(reflection_id: str) -> Dict
list_reflections(identity_id=None, visibility=None, limit=100) -> List[Dict]
update_reflection(reflection_id: str, **kwargs)
delete_reflection(reflection_id: str)

# Mirrorback operations
create_mirrorback(reflection_id, identity_id, content, engine_version) -> str
get_mirrorback(mirrorback_id: str) -> Dict
get_mirrorback_for_reflection(reflection_id: str) -> Dict
list_mirrorbacks(identity_id=None) -> List[Dict]

# Pattern operations
create_pattern(identity_id, name, description) -> str
get_pattern(pattern_id: str) -> Dict
list_patterns(identity_id=None) -> List[Dict]
record_pattern_occurrence(pattern_id, reflection_id, confidence)
get_pattern_history(pattern_id: str) -> List[Dict]

# Tension operations
create_tension(identity_id, name, axis_a, axis_b, position, intensity, origin) -> str
get_tension(tension_id: str) -> Dict
list_tensions(identity_id=None) -> List[Dict]
update_tension_position(tension_id: str, position: float)
record_tension_measurement(tension_id, reflection_id, position)
get_tension_history(tension_id: str) -> List[Dict]

# Thread operations
create_thread(identity_id, title) -> str
get_thread(thread_id: str) -> Dict
list_threads(identity_id=None, status=None) -> List[Dict]
add_reflection_to_thread(thread_id: str, reflection_id: str)
remove_reflection_from_thread(thread_id: str, reflection_id: str)
get_thread_reflections(thread_id: str) -> List[Dict]

# Telemetry operations
log_engine_run(reflection_id, mirrorback_id, engine_version, duration_ms, patterns, flags, sync_allowed) -> str
log_engine_feedback(engine_run_id, identity_id, rating, feedback_type, text, flags, sync_allowed) -> str
list_engine_runs(identity_id=None, sync_allowed=None, since=None) -> List[Dict]
list_engine_feedback(identity_id=None, sync_allowed=None, since=None) -> List[Dict]

# Evolution operations
create_evolution_event(event_type, description, changes, source) -> str
list_evolution_events(event_type=None, since=None) -> List[Dict]
create_evolution_proposal(proposal_type, title, description, changes, proposer_id) -> str
get_evolution_proposal(proposal_id: str) -> Dict
list_evolution_proposals(status=None) -> List[Dict]
vote_on_proposal(proposal_id: str, vote: str, voter_id: str)
apply_proposal(proposal_id: str)

# Integration operations
create_integration(identity_id, integration_type, config) -> str
get_integration(integration_id: str) -> Dict
list_integrations(identity_id=None, integration_type=None) -> List[Dict]
update_integration_status(integration_id: str, status: str)
record_integration_sync(integration_id: str)

# Schema operations
get_schema_version() -> str
list_available_migrations() -> List[str]
```

### 2. MirrorCore (Reflection Engine)

**Files to Implement:**

```
mirrorcore/
├── __init__.py
├── __main__.py - Entry point (already exists)
├── config/
│   ├── __init__.py
│   ├── settings.py - Configuration system
│   └── defaults.yaml
├── models/
│   ├── __init__.py
│   ├── base_llm.py - LLM interface ABC
│   ├── local_llm.py - Ollama integration
│   ├── remote_llm.py - Claude/OpenAI
│   └── mock_llm.py - Testing fallback
├── engine/
│   ├── __init__.py
│   ├── reflect.py - Main reflection engine (enhance existing)
│   ├── patterns.py - Pattern detection
│   ├── tensions.py - Tension discovery
│   ├── constitutional.py - Constitution enforcement
│   └── prompts.py - Prompt templates
├── server/
│   ├── __init__.py
│   ├── web.py - Local web interface (enhance existing)
│   └── api.py - Local API endpoints
└── utils/
    ├── __init__.py
    └── logging.py - Logging utilities
```

**Key Components:**

**A. LLM Adapters**

```python
# mirrorcore/models/base_llm.py
from abc import ABC, abstractmethod
from typing import Optional, AsyncIterator, Union

class BaseLLM(ABC):
    """Abstract base for all LLM implementations"""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> Union[str, AsyncIterator[str]]:
        """Generate completion"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if LLM is available"""
        pass
    
    @abstractmethod
    async def shutdown(self):
        """Cleanup resources"""
        pass

# mirrorcore/models/local_llm.py
class LocalLLM(BaseLLM):
    """Ollama integration for offline operation"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        self.base_url = base_url
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def generate(self, prompt, system=None, stream=False, **kwargs):
        # POST to /api/generate
        # Handle streaming if requested
        # Return text or async iterator
        pass

# mirrorcore/models/remote_llm.py
class RemoteLLM(BaseLLM):
    """Claude/OpenAI for users who prefer cloud"""
    
    def __init__(self, provider: str, api_key: str, model: Optional[str] = None):
        self.provider = provider  # 'anthropic' or 'openai'
        self.api_key = api_key
        self.model = model or self._default_model()
        self._init_client()
    
    async def generate(self, prompt, system=None, stream=False, **kwargs):
        if self.provider == 'anthropic':
            return await self._generate_anthropic(prompt, system, stream, **kwargs)
        elif self.provider == 'openai':
            return await self._generate_openai(prompt, system, stream, **kwargs)
```

**B. Constitutional Enforcement**

```python
# mirrorcore/engine/constitutional.py

class ConstitutionalEnforcer:
    """Enforces constitutional principles"""
    
    def __init__(self, constitution_path: Path):
        self.constitution = self._load_constitution(constitution_path)
        self.invariants = self._load_invariants()
    
    def check_mirrorback(self, mirrorback: str) -> Dict[str, Any]:
        """
        Check mirrorback for constitutional violations.
        
        Returns:
            {
                'compliant': bool,
                'flags': Dict[str, Any],
                'severity': str  # 'none', 'warning', 'violation'
            }
        """
        flags = {}
        
        # I2: Directive Threshold (max 15%)
        directive_ratio = self._calculate_directive_ratio(mirrorback)
        if directive_ratio > 0.15:
            flags['directive_threshold_exceeded'] = {
                'ratio': directive_ratio,
                'threshold': 0.15,
                'severity': 'violation'
            }
        
        # I2: Explicit Advice Detection
        advice_patterns = [
            r'you should', r'I recommend', r'I suggest',
            r'I advise', r'my advice is', r'the best approach',
            r'what you need to do', r'try to'
        ]
        advice_found = []
        for pattern in advice_patterns:
            matches = re.findall(pattern, mirrorback, re.IGNORECASE)
            if matches:
                advice_found.extend(matches)
        
        if advice_found:
            flags['explicit_advice'] = {
                'matches': advice_found,
                'count': len(advice_found),
                'severity': 'violation'
            }
        
        # I3: Outcome Optimization Detection
        optimization_patterns = [
            'to achieve', 'to accomplish', 'to succeed',
            'will help you', 'leads to', 'results in'
        ]
        optimization_found = []
        for pattern in optimization_patterns:
            if pattern in mirrorback.lower():
                optimization_found.append(pattern)
        
        if optimization_found:
            flags['outcome_optimization'] = {
                'matches': optimization_found,
                'severity': 'warning'
            }
        
        # Determine overall compliance
        has_violations = any(
            f.get('severity') == 'violation'
            for f in flags.values()
            if isinstance(f, dict)
        )
        
        return {
            'compliant': not has_violations,
            'flags': flags,
            'severity': 'violation' if has_violations else
                       ('warning' if flags else 'none')
        }
    
    def _calculate_directive_ratio(self, text: str) -> float:
        """Calculate % of directive words"""
        directive_words = [
            'should', 'must', 'need to', 'have to', 'ought to',
            'try to', 'going to', 'make sure', 'ensure that'
        ]
        
        words = text.lower().split()
        if not words:
            return 0.0
        
        directive_count = sum(
            1 for w in words
            if any(d in w for d in directive_words)
        )
        
        return directive_count / len(words)
```

**C. Pattern Detection**

```python
# mirrorcore/engine/patterns.py

class PatternDetector:
    """Detects recurring patterns in reflections"""
    
    PATTERN_DEFINITIONS = {
        'obligation_language': {
            'keywords': ['have to', 'need to', 'must', 'should', 'supposed to'],
            'category': 'language',
            'description': 'Frequent use of obligation/duty language'
        },
        'absolute_thinking': {
            'keywords': ['always', 'never', 'everyone', 'no one', 'everything', 'nothing'],
            'category': 'cognitive',
            'description': 'All-or-nothing thinking patterns'
        },
        'internal_tension': {
            'keywords': ['but', 'however', 'although', 'even though', 'on one hand'],
            'category': 'conflict',
            'description': 'Conflicting internal states'
        },
        'self_judgment': {
            'keywords': ["I'm bad", "I'm terrible", "I failed", "I suck", "I'm wrong"],
            'category': 'judgment',
            'description': 'Negative self-evaluation'
        },
        'past_reference': {
            'keywords': ['remember when', 'back when', 'used to', 'history of'],
            'category': 'temporal',
            'description': 'References to past experiences'
        },
        'future_anxiety': {
            'keywords': ['what if', 'worried about', 'afraid that', 'concerned that'],
            'category': 'temporal',
            'description': 'Anxiety about future events'
        },
        'comparison': {
            'keywords': ['compared to', 'better than', 'worse than', 'like others'],
            'category': 'social',
            'description': 'Social comparison patterns'
        },
        'permission_seeking': {
            'keywords': ['is it okay', 'am I allowed', 'can I', 'would it be wrong'],
            'category': 'autonomy',
            'description': 'Seeking external validation'
        }
    }
    
    def detect(self, text: str) -> List[str]:
        """
        Detect patterns in text.
        
        Returns:
            List of pattern names detected
        """
        detected = []
        text_lower = text.lower()
        
        for pattern_name, definition in self.PATTERN_DEFINITIONS.items():
            keywords = definition['keywords']
            if any(keyword in text_lower for keyword in keywords):
                detected.append(pattern_name)
        
        return detected
    
    def analyze_historical_patterns(
        self,
        storage: MirrorStorage,
        identity_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze pattern frequency over time.
        
        Returns:
            {
                'pattern_name': {
                    'count': int,
                    'first_seen': datetime,
                    'last_seen': datetime,
                    'trend': 'increasing'|'decreasing'|'stable'
                }
            }
        """
        # Query reflections from last N days
        since = datetime.now() - timedelta(days=days)
        reflections = storage.list_reflections(
            identity_id=identity_id,
            since=since
        )
        
        # Count patterns over time
        pattern_counts = defaultdict(list)
        for reflection in reflections:
            detected = self.detect(reflection['content'])
            date = reflection['created_at'].date()
            for pattern in detected:
                pattern_counts[pattern].append(date)
        
        # Analyze trends
        analysis = {}
        for pattern, dates in pattern_counts.items():
            analysis[pattern] = {
                'count': len(dates),
                'first_seen': min(dates),
                'last_seen': max(dates),
                'trend': self._calculate_trend(dates)
            }
        
        return analysis
```

**D. Tension Discovery**

```python
# mirrorcore/engine/tensions.py

class TensionDiscovery:
    """Discovers and suggests tensions from reflections"""
    
    # Seed tensions (I3: We seed tensions from common human experiences)
    SEED_TENSIONS = [
        ('control', 'surrender', 'The dance between directing life and allowing it'),
        ('autonomy', 'connection', 'Independence vs belonging'),
        ('stability', 'growth', 'Comfort vs change'),
        ('thinking', 'feeling', 'Logic vs emotion'),
        ('past', 'future', 'History vs possibility'),
        ('self', 'others', 'Personal needs vs relationships'),
        ('perfection', 'acceptance', 'Ideal vs reality'),
        ('action', 'rest', 'Doing vs being')
    ]
    
    def analyze_for_tensions(
        self,
        reflection: str,
        existing_tensions: List[Dict]
    ) -> List[Dict]:
        """
        Analyze reflection for tension evidence.
        
        Returns:
            List of suggested tensions with evidence
        """
        suggestions = []
        
        # 1. Explicit "but" statements
        if re.search(r'\bbut\b|\bhowever\b', reflection, re.IGNORECASE):
            parts = re.split(r'\bbut\b|\bhowever\b', reflection, flags=re.IGNORECASE)
            if len(parts) == 2:
                suggestions.append({
                    'type': 'internal_conflict',
                    'evidence': reflection,
                    'part_a': parts[0].strip()[:50],
                    'part_b': parts[1].strip()[:50],
                    'suggested_tension': self._infer_tension_from_conflict(parts)
                })
        
        # 2. "On one hand... on the other" pattern
        if 'on one hand' in reflection.lower() and 'on the other' in reflection.lower():
            suggestions.append({
                'type': 'explicit_duality',
                'evidence': reflection,
                'suggested_tension': self._extract_duality(reflection)
            })
        
        # 3. Template matching
        for axis_a, axis_b, description in self.SEED_TENSIONS:
            # Check if both axes mentioned
            has_a = axis_a in reflection.lower()
            has_b = axis_b in reflection.lower()
            
            if has_a or has_b:
                # Check if tension already exists
                exists = any(
                    (t['axis_a'].lower() == axis_a or t['axis_b'].lower() == axis_b)
                    for t in existing_tensions
                )
                
                if not exists:
                    suggestions.append({
                        'type': 'template_match',
                        'axis_a': axis_a,
                        'axis_b': axis_b,
                        'description': description,
                        'evidence': reflection[:100],
                        'confidence': 'high' if (has_a and has_b) else 'medium'
                    })
        
        return suggestions
    
    def calculate_position(self, reflection: str, tension: Dict) -> float:
        """
        Estimate where reflection falls on tension axis.
        
        Returns:
            Position from -1.0 (fully axis_a) to 1.0 (fully axis_b)
        """
        axis_a = tension['axis_a'].lower()
        axis_b = tension['axis_b'].lower()
        text = reflection.lower()
        
        # Count mentions and contextual weight
        count_a = text.count(axis_a)
        count_b = text.count(axis_b)
        
        # Analyze context around mentions
        # (positive context = leaning toward, negative = away from)
        
        if count_a == 0 and count_b == 0:
            return 0.0  # No clear position
        
        # Simple ratio for now (can be enhanced with sentiment)
        total = count_a + count_b
        ratio_b = count_b / total if total > 0 else 0.5
        
        # Convert to -1.0 to 1.0 scale
        return (ratio_b * 2) - 1.0
```

### 3. MirrorX Engine (Evolution Observer)

**Files to Implement:**

```
mirrorx-engine/
├── __init__.py
├── app/
│   ├── __init__.py
│   ├── main.py - FastAPI server (enhance existing)
│   ├── evolution/
│   │   ├── __init__.py
│   │   ├── observer.py - Performance analysis
│   │   ├── critic.py - Telemetry aggregation
│   │   └── proposals.py - Improvement suggestions
│   ├── conductor/
│   │   └── ... (existing conductor files)
│   └── identity_graph/
│       └── ... (existing graph files)
└── tests/
    └── test_evolution.py
```

**Key Components:**

**A. Evolution Observer**

```python
# mirrorx-engine/app/evolution/observer.py

class EvolutionObserver:
    """Analyzes engine performance from telemetry"""
    
    def __init__(self, storage: MirrorStorage):
        self.storage = storage
    
    async def analyze_performance(
        self,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Analyze recent engine performance.
        
        Returns comprehensive metrics and suggestions
        """
        since = datetime.now() - timedelta(days=days)
        
        # Query telemetry
        runs = await self.storage.list_engine_runs(since=since)
        feedback = await self.storage.list_engine_feedback(since=since)
        
        analysis = {
            'period_days': days,
            'total_runs': len(runs),
            'total_feedback': len(feedback),
            'metrics': {},
            'issues': [],
            'suggestions': []
        }
        
        # Pattern frequency
        pattern_freq = Counter()
        for run in runs:
            patterns = run.get('patterns', [])
            pattern_freq.update(patterns)
        
        analysis['metrics']['top_patterns'] = dict(pattern_freq.most_common(10))
        
        # Constitutional flags
        flag_freq = Counter()
        for run in runs:
            flags = run.get('flags', {})
            flag_freq.update(flags.keys())
        
        if flag_freq:
            analysis['issues'] = [
                {
                    'type': flag,
                    'frequency': count,
                    'percentage': round(count / len(runs) * 100, 2),
                    'severity': 'high' if count > len(runs) * 0.1 else 'medium'
                }
                for flag, count in flag_freq.most_common()
            ]
        
        # User ratings
        ratings = [f['rating'] for f in feedback if 'rating' in f]
        if ratings:
            analysis['metrics']['avg_rating'] = round(sum(ratings) / len(ratings), 2)
            analysis['metrics']['rating_dist'] = dict(Counter(ratings))
        
        # Performance metrics
        durations = [r['duration_ms'] for r in runs if 'duration_ms' in r]
        if durations:
            analysis['metrics']['avg_duration_ms'] = round(sum(durations) / len(durations))
            analysis['metrics']['p95_duration_ms'] = int(np.percentile(durations, 95))
        
        # Generate suggestions
        if flag_freq.get('directive_threshold_exceeded', 0) > len(runs) * 0.05:
            analysis['suggestions'].append({
                'priority': 'high',
                'type': 'prompt_adjustment',
                'issue': 'Directive threshold exceeded >5% of time',
                'suggestion': 'Revise prompts to emphasize reflection over advice',
                'evidence': {
                    'violation_rate': flag_freq['directive_threshold_exceeded'] / len(runs)
                }
            })
        
        if ratings and sum(ratings) / len(ratings) < 3.0:
            analysis['suggestions'].append({
                'priority': 'high',
                'type': 'quality_improvement',
                'issue': 'Average rating below 3.0',
                'suggestion': 'Review recent mirrorbacks for quality issues'
            })
        
        return analysis
```

**B. Evolution Critic**

```python
# mirrorx-engine/app/evolution/critic.py

class EvolutionCritic:
    """Prepares telemetry for Evolution Commons"""
    
    def __init__(self, storage: MirrorStorage):
        self.storage = storage
    
    async def prepare_telemetry_packet(
        self,
        user_consent: bool = False
    ) -> Optional[Dict]:
        """
        Create privacy-preserving telemetry packet.
        
        Only includes data where sync_allowed=true.
        Fully anonymized, aggregated only.
        """
        if not user_consent:
            return None
        
        # Get consented data only
        runs = await self.storage.list_engine_runs(sync_allowed=True)
        feedback = await self.storage.list_engine_feedback(sync_allowed=True)
        
        if not runs and not feedback:
            return None
        
        packet = {
            'packet_id': str(uuid.uuid4()),
            'generated_at': datetime.utcnow().isoformat(),
            'mirror_version': await self._get_version(),
            'period_days': 30,
            
            'aggregate_metrics': {
                'total_runs': len(runs),
                'total_feedback': len(feedback),
                
                # Pattern frequencies
                'patterns': self._aggregate_patterns(runs),
                
                # Flag frequencies
                'constitutional_flags': self._aggregate_flags(runs),
                
                # Rating distribution
                'ratings': self._aggregate_ratings(feedback),
                
                # Performance stats
                'avg_duration_ms': self._avg_duration(runs),
                'p95_duration_ms': self._p95_duration(runs)
            },
            
            # Improvement signals (issues reported by multiple users)
            'improvement_signals': self._extract_signals(feedback),
            
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
    
    def _aggregate_flags(self, runs: List[Dict]) -> Dict[str, int]:
        """Count constitutional flags"""
        counter = Counter()
        for run in runs:
            flags = run.get('flags', {})
            counter.update(flags.keys())
        return dict(counter)
    
    def _extract_signals(self, feedback: List[Dict]) -> List[Dict]:
        """Find common improvement requests"""
        flag_counter = Counter()
        for fb in feedback:
            flags = fb.get('flags', [])
            flag_counter.update(flags)
        
        return [
            {'issue': flag, 'frequency': count}
            for flag, count in flag_counter.most_common(10)
            if count > 2  # Only if multiple users reported
        ]
```

### 4. Platform Services (Layer 3 - Optional)

**Evolution Commons Schema:**

```sql
-- Telemetry packets
CREATE TABLE telemetry_packets (
    id UUID PRIMARY KEY,
    packet_id TEXT UNIQUE NOT NULL,
    mirror_version TEXT NOT NULL,
    received_at TIMESTAMP DEFAULT NOW(),
    data JSONB NOT NULL,
    verified BOOLEAN DEFAULT false
);

-- Evolution proposals
CREATE TABLE evolution_proposals (
    id UUID PRIMARY KEY,
    proposal_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes JSONB NOT NULL,
    evidence JSONB,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT,
    voting_ends_at TIMESTAMP,
    
    CHECK (proposal_type IN (
        'prompt_adjustment',
        'pattern_detection',
        'tension_heuristic',
        'constitutional_amendment',
        'safety_refinement'
    ))
);

-- Votes
CREATE TABLE proposal_votes (
    id UUID PRIMARY KEY,
    proposal_id UUID REFERENCES evolution_proposals(id),
    voter_id TEXT NOT NULL,
    vote TEXT NOT NULL,  -- 'approve', 'reject', 'abstain'
    reasoning TEXT,
    voted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- Guardian signatures (constitutional amendments)
CREATE TABLE guardian_signatures (
    id UUID PRIMARY KEY,
    proposal_id UUID REFERENCES evolution_proposals(id),
    guardian_id TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(proposal_id, guardian_id)
);

-- Release history
CREATE TABLE release_history (
    id UUID PRIMARY KEY,
    version TEXT UNIQUE NOT NULL,
    released_at TIMESTAMP DEFAULT NOW(),
    release_notes TEXT,
    proposal_ids JSONB,
    download_count INTEGER DEFAULT 0
);
```

**Sync Coordinator:**

```python
# sync_layer/coordinator.py

class SyncCoordinator:
    """Syncs data between local and platform"""
    
    def __init__(self, local: MirrorStorage, platform_url: str):
        self.local = local
        self.platform = platform_url
        self.client = httpx.AsyncClient()
    
    async def sync_up(self, consent: Dict[str, bool]):
        """Push local data to platform"""
        results = {'synced': [], 'skipped': [], 'errors': []}
        
        # Sync reflections (based on visibility)
        if consent.get('reflections'):
            reflections = await self.local.list_reflections(
                visibility='sync_full_public'
            )
            for r in reflections:
                try:
                    await self._push_reflection(r)
                    results['synced'].append(f"reflection:{r['id']}")
                except Exception as e:
                    results['errors'].append({'type': 'reflection', 'id': r['id'], 'error': str(e)})
        
        # Sync telemetry
        if consent.get('telemetry'):
            critic = EvolutionCritic(self.local)
            packet = await critic.prepare_telemetry_packet(user_consent=True)
            if packet:
                await self._push_telemetry(packet)
                results['synced'].append('telemetry_packet')
        
        return results
    
    async def sync_down(self):
        """Pull updates from platform"""
        # Check for new proposals
        # Check for approved updates
        # Download if available
        pass
```

---

## 🎯 CRITICAL IMPLEMENTATION PATHS

### Path 1: Sovereign Core (MUST HAVE)
**Goal:** MirrorCore works completely offline

1. Complete Mirror OS SQLite schema (15 tables)
2. Implement SQLiteStorage with all 40+ methods
3. Build LLM adapters (local_llm.py, remote_llm.py)
4. Constitutional enforcement (directive threshold, advice detection)
5. Pattern detection (8 core patterns)
6. Export/import system (ZIP bundles)
7. **TEST: Boot without network, generate reflection, save to SQLite**

**Success Criteria:**
- ✅ Boots without internet
- ✅ Generates reflections (local OR remote LLM)
- ✅ Saves to SQLite
- ✅ Enforces constitution (blocks violations)
- ✅ Exports complete bundle
- ✅ Imports bundle to new installation

### Path 2: Evolution Engine (SHOULD HAVE)
**Goal:** System learns and improves

8. Tension discovery (seed tensions + auto-detection)
9. Thread management (group reflections)
10. Engine telemetry (performance logging)
11. Evolution observer (analyze performance)
12. Evolution critic (prepare telemetry packets)
13. **TEST: 100 reflections, analyze patterns, suggest improvements**

**Success Criteria:**
- ✅ Detects recurring patterns
- ✅ Suggests relevant tensions
- ✅ Groups reflections into threads
- ✅ Logs performance data
- ✅ Generates improvement proposals
- ✅ Privacy-preserving aggregation

### Path 3: Platform Layer (NICE TO HAVE)
**Goal:** Community evolution and sync

14. Evolution Commons database
15. Governance system (proposals, voting)
16. Guardian system (constitutional amendments)
17. Sync coordinator (opt-in data sync)
18. Update distribution
19. **TEST: Submit proposal, vote, approve, distribute update**

**Success Criteria:**
- ✅ Proposals can be submitted
- ✅ Community can vote
- ✅ Guardians can sign constitutional changes
- ✅ Updates distributed securely
- ✅ Layer 1 continues working if platform is down

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1-2: Mirror OS Foundation

- [ ] Create `mirror_os/storage/base.py` with MirrorStorage ABC
- [ ] Implement all 40+ abstract methods
- [ ] Complete `mirror_os/schemas/sqlite/001_core.sql` with all 15 tables
- [ ] Add proper indexes, constraints, checks
- [ ] Implement `mirror_os/storage/sqlite_storage.py`
  - [ ] Connection management with WAL mode
  - [ ] All identity operations
  - [ ] All reflection operations
  - [ ] All mirrorback operations
  - [ ] All pattern operations
  - [ ] All tension operations
  - [ ] All thread operations
  - [ ] All telemetry operations
  - [ ] All evolution operations
  - [ ] All integration operations
  - [ ] Schema versioning
- [ ] Create `mirror_os/services/migrator.py`
  - [ ] get_current_version()
  - [ ] list_available_migrations()
  - [ ] apply_migration()
  - [ ] rollback()
- [ ] Create `mirror_os/services/export.py`
  - [ ] export_bundle() - Create ZIP with DB + constitution + config
  - [ ] import_bundle() - Restore from ZIP
  - [ ] verify_bundle() - Check integrity

### Week 3-4: MirrorCore Completion

- [ ] Create `mirrorcore/models/base_llm.py` ABC
- [ ] Implement `mirrorcore/models/local_llm.py`
  - [ ] Ollama API integration
  - [ ] Health check
  - [ ] Streaming support
- [ ] Implement `mirrorcore/models/remote_llm.py`
  - [ ] Anthropic Claude support
  - [ ] OpenAI support
  - [ ] Fallback logic
- [ ] Create `mirrorcore/engine/constitutional.py`
  - [ ] Directive threshold calculation (15% max)
  - [ ] Explicit advice detection (regex patterns)
  - [ ] Outcome optimization detection
  - [ ] Severity classification
- [ ] Create `mirrorcore/engine/patterns.py`
  - [ ] 8 core pattern definitions
  - [ ] Pattern detection in text
  - [ ] Historical pattern analysis
  - [ ] Trend calculation
- [ ] Create `mirrorcore/engine/tensions.py`
  - [ ] 8 seed tensions
  - [ ] Tension suggestion from reflections
  - [ ] Position calculation
  - [ ] Measurement tracking
- [ ] Wire MirrorCore to use Mirror OS
  - [ ] Replace LocalDB with SQLiteStorage
  - [ ] Update ReflectionEngine
  - [ ] Update web interface

### Week 5-6: MirrorX Evolution

- [ ] Create `mirrorx-engine/app/evolution/observer.py`
  - [ ] analyze_performance(days)
  - [ ] Pattern frequency analysis
  - [ ] Constitutional flag tracking
  - [ ] Rating aggregation
  - [ ] Performance metrics (duration, p95)
  - [ ] Suggestion generation
- [ ] Create `mirrorx-engine/app/evolution/critic.py`
  - [ ] prepare_telemetry_packet()
  - [ ] Privacy-preserving aggregation
  - [ ] Improvement signal extraction
  - [ ] User consent verification
- [ ] Create `mirrorx-engine/app/evolution/proposals.py`
  - [ ] Proposal generation from telemetry
  - [ ] Evidence collection
  - [ ] Impact estimation

### Week 7-8: Platform Services

- [ ] Create Evolution Commons schema
  - [ ] telemetry_packets table
  - [ ] evolution_proposals table
  - [ ] proposal_votes table
  - [ ] guardian_signatures table
  - [ ] release_history table
- [ ] Implement `platform/governance/invariant_checker.py`
  - [ ] Check proposals against I1-I6
  - [ ] Severity classification
  - [ ] Violation reporting
- [ ] Implement `sync_layer/coordinator.py`
  - [ ] sync_up() with consent checks
  - [ ] sync_down() for updates
  - [ ] Conflict resolution
- [ ] Implement `platform/updates/release_manager.py`
  - [ ] Create release bundles
  - [ ] Guardian signing
  - [ ] Distribution

### Week 9-10: Frontend Integration

- [ ] Update `frontend/src/lib/mirrorApi.ts`
  - [ ] Add Tension interface
  - [ ] Add Thread interface
  - [ ] Add all Mirror OS endpoints
- [ ] Create `frontend/src/components/TensionSpace.tsx`
  - [ ] 3D visualization with Three.js
  - [ ] Interactive tension points
  - [ ] Legend and details
- [ ] Create `frontend/src/components/ThreadView.tsx`
  - [ ] Timeline display
  - [ ] Reflection cards
  - [ ] Thread metadata
- [ ] Create `frontend/src/components/PatternAnalysis.tsx`
  - [ ] Pattern frequency charts
  - [ ] Trend visualization
  - [ ] Historical view
- [ ] Create `frontend/src/components/EvolutionDashboard.tsx`
  - [ ] Performance metrics
  - [ ] Active proposals
  - [ ] Voting interface

### Week 11-12: Testing & Documentation

- [ ] Write comprehensive tests
  - [ ] `tests/test_mirror_os_storage.py` - 50+ test cases
  - [ ] `tests/test_constitutional.py` - All enforcement rules
  - [ ] `tests/test_patterns.py` - All pattern types
  - [ ] `tests/test_tensions.py` - Discovery and measurement
  - [ ] `tests/test_layer_independence.py` - Layer 1 without Layer 3
  - [ ] `tests/test_export_import.py` - Bundle creation/restoration
- [ ] Write documentation
  - [ ] `docs/ARCHITECTURE.md`
  - [ ] `docs/MIRROR_OS_API.md`
  - [ ] `docs/MIRRORCORE_API.md`
  - [ ] `docs/USER_GUIDE.md`
  - [ ] `docs/DEVELOPER_GUIDE.md`
  - [ ] `docs/GOVERNANCE.md`
  - [ ] `docs/EXPORT_IMPORT.md`

---

## 🎓 SUCCESS METRICS

### Layer 1 Success (Sovereign Core)
- ✅ Boots without network connection
- ✅ Boots without platform services
- ✅ Generates reflections with local OR remote LLM
- ✅ Saves all data to SQLite
- ✅ Enforces constitutional constraints
- ✅ Detects patterns across reflections
- ✅ Tracks tensions over time
- ✅ Exports complete bundle (DB + constitution + config)
- ✅ Imports bundle to new installation
- ✅ Works 100% offline

### Layer 2 Success (Evolution Engine)
- ✅ Analyzes engine performance from telemetry
- ✅ Detects pattern trends
- ✅ Identifies constitutional violations
- ✅ Generates improvement proposals
- ✅ Prepares privacy-preserving telemetry packets
- ✅ Respects user consent for all data sharing
- ✅ Layer 1 continues functioning if Layer 2 disabled

### Layer 3 Success (Platform)
- ✅ Completely optional (Layer 1 works without it)
- ✅ Accepts telemetry packets (with consent)
- ✅ Hosts evolution proposals
- ✅ Enables community voting
- ✅ Guardian signatures for constitutional changes
- ✅ Distributes approved updates
- ✅ Sync service (opt-in only)
- ✅ No lock-in (can export and leave)

---

## 🚀 THE ULTIMATE GOAL

**A Mirror that:**
- Cannot die (Layer 1 sovereign)
- Cannot be controlled (constitutional invariants)
- Cannot prescribe (reflects only)
- Cannot optimize outcomes (no manipulation)
- Cannot lock you in (full export always works)
- Evolves through consensus (community governance)
- Respects privacy (opt-in, aggregated only)
- Runs forever (offline, no dependencies)

**What makes it real:**
1. You can boot it without internet
2. You can use it without the platform
3. You can export your data anytime
4. You can fork the code and run independently
5. The constitution cannot be violated
6. Evolution requires community consensus
7. Telemetry is opt-in and anonymized
8. No single entity controls it

---

## 📞 NEXT IMMEDIATE ACTIONS

1. **This Week:** Complete Mirror OS SQLite schema with all 15 tables
2. **This Week:** Implement SQLiteStorage with all 40+ methods
3. **Next Week:** Build LLM adapters (local + remote)
4. **Next Week:** Implement constitutional enforcement
5. **Week 3:** Pattern detection and tension discovery
6. **Week 4:** Export/import system and layer independence tests

**The Critical Path:** Mirror OS → LLM Adapters → Constitutional Enforcement → Export System

Once these four are complete, you have a **sovereign Mirror that can't die**.

Everything else is enhancement.

---

**Document Status:** Complete philosophical and technical blueprint extracted from 1,461-line comprehensive plan.
