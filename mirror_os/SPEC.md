# Mirror OS Schema Specification

**Version:** 1.0.0  
**Date:** 2025-12-08  
**Status:** Genesis Specification

---

## Core Principle

**Mirror OS is a portable, sovereign operating system for identity and reflection.**

This specification defines the data structures and semantics that make a Mirror work, independent of any particular database or platform.

---

## Design Principles

### 1. Database Agnostic
The spec works with SQLite (local), PostgreSQL (platform), or any future database. Implementations are adapters, not the spec itself.

### 2. Platform Independent
No `auth.users` foreign keys. No Supabase-specific constructs. No platform assumptions. Core tables work completely offline.

### 3. Sync Semantics Explicit
Every table/row declares its sharing policy. Default is `local_only`. Sync is opt-in, never assumed.

### 4. Evolution Built-In
Telemetry, feedback, proposals, and history are first-class schema concerns, not afterthoughts.

### 5. Versioned and Migratable
Schema version tracked. Migrations are reversible. Users can upgrade, downgrade, or fork.

### 6. Export/Import by Design
Complete data portability. No lock-in. Bundle format standardized.

---

## Core Entities

### 1. Identities

**Purpose:** Represents a self, role, or context for reflection.

**Semantics:**
- One person may have multiple identities (work self, personal self, creative self)
- Identities can be ephemeral or long-lived
- No connection to platform users (that's an adapter concern)
- Default sync: `local_only`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `created_at` | TIMESTAMP | Yes | When created |
| `updated_at` | TIMESTAMP | Yes | Last modified |
| `metadata` | JSON | No | Flexible metadata (name, avatar, settings, etc.) |

**Metadata Structure (suggested):**
```json
{
  "name": "Professional Self",
  "avatar_url": "...",
  "context": "work",
  "settings": {
    "reflection_frequency": "daily",
    "tension_tracking": true
  }
}
```

**Sync Policy:** `local_only` (identities never sync)

---

### 2. Reflections

**Purpose:** Raw input from user. The source material for all mirroring.

**Semantics:**
- User writes/speaks → becomes reflection
- Can be text, audio transcription, imported notes
- Each reflection has explicit visibility setting
- Belongs to an identity (or anonymous)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `identity_id` | TEXT/UUID | No | Foreign key to identities (null = anonymous) |
| `content` | TEXT | Yes | What user wrote/said |
| `content_type` | TEXT | No | Format: "text", "markdown", "audio_transcript" |
| `visibility` | TEXT | Yes | Sync permission (see below) |
| `created_at` | TIMESTAMP | Yes | When created |
| `source` | TEXT | No | Where it came from: "direct", "import", "integration" |
| `metadata` | JSON | No | Additional data (tags, context, etc.) |

**Visibility Values:**
- `local_only` - Never leaves device (default)
- `sync_summary` - Anonymized patterns only
- `sync_full_private` - Full content, encrypted, only to user's other devices
- `sync_full_public` - Full content, can be shared publicly

**Metadata Structure (suggested):**
```json
{
  "tags": ["work", "anxiety"],
  "context": "weekly_review",
  "imported_from": "notion",
  "word_count": 342,
  "emotional_tone": "contemplative"
}
```

**Constraints:**
- `content` cannot be null or empty
- `visibility` must be one of allowed values
- If `identity_id` is null, `visibility` must be `local_only`

**Sync Policy:** Explicit per-row via `visibility` field

---

### 3. Mirrorbacks

**Purpose:** AI-generated reflections back to user.

**Semantics:**
- Response to a reflection
- Multiple mirrorbacks possible per reflection (regeneration, different engines)
- Inherits sync policy from parent reflection
- Includes engine metadata for evolution

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `reflection_id` | TEXT/UUID | Yes | Foreign key to reflections |
| `content` | TEXT | Yes | What Mirror said back |
| `engine_version` | TEXT | Yes | Config version that generated this |
| `created_at` | TIMESTAMP | Yes | When generated |
| `metadata` | JSON | No | Engine details, model used, etc. |

**Metadata Structure (suggested):**
```json
{
  "model": "claude-3.5-sonnet",
  "engine_mode": "remote_llm",
  "duration_ms": 2341,
  "patterns_detected": ["obligation_language", "internal_tension"],
  "tensions_surfaced": ["control_vs_surrender"],
  "directive_score": 0.08,
  "constitutional_flags": []
}
```

**Constraints:**
- Must have valid `reflection_id`
- `content` cannot be null

**Sync Policy:** Same as parent reflection

---

### 4. Threads

**Purpose:** Sequences of reflections over time. Sessions, conversations, ongoing topics.

**Semantics:**
- Groups related reflections
- Has temporal boundaries (start/end)
- Can be named or unnamed
- Reflections can belong to multiple threads

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `identity_id` | TEXT/UUID | No | Foreign key to identities |
| `title` | TEXT | No | Optional thread name |
| `started_at` | TIMESTAMP | Yes | First reflection timestamp |
| `last_active` | TIMESTAMP | Yes | Most recent activity |
| `status` | TEXT | Yes | "active", "paused", "archived" |
| `metadata` | JSON | No | Context, tags, etc. |

**Metadata Structure (suggested):**
```json
{
  "tags": ["career", "decision"],
  "context": "job_transition_2025",
  "reflection_count": 12,
  "total_words": 4823,
  "primary_tensions": ["stability_vs_risk", "autonomy_vs_security"]
}
```

**Relationships:**
- Reflections linked via `thread_reflections` junction table

**Sync Policy:** `local_only` (thread structure doesn't sync)

---

### 5. Thread-Reflection Junction

**Purpose:** Many-to-many relationship between threads and reflections.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `thread_id` | TEXT/UUID | Yes | Foreign key to threads |
| `reflection_id` | TEXT/UUID | Yes | Foreign key to reflections |
| `position` | INTEGER | Yes | Order in thread |
| `added_at` | TIMESTAMP | Yes | When added to thread |

**Constraints:**
- Primary key: (`thread_id`, `reflection_id`)
- Position unique within thread

---

### 6. Tensions

**Purpose:** Named paradoxes, conflicts, or dualities.

**Semantics:**
- Represents ongoing inner conflict
- Position shows where you currently are (-1 to 1, 0 = center)
- Can be system-seeded, LLM-suggested, or user-created
- Explicit sync consent required

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `identity_id` | TEXT/UUID | No | Foreign key to identities |
| `name` | TEXT | Yes | Tension name (e.g., "Control vs Surrender") |
| `axis_a` | TEXT | Yes | First pole (e.g., "Control") |
| `axis_b` | TEXT | Yes | Second pole (e.g., "Surrender") |
| `position` | REAL | No | Current position: -1.0 (axis_a) to 1.0 (axis_b) |
| `intensity` | REAL | No | How strongly felt: 0.0 to 1.0 |
| `origin` | TEXT | Yes | How discovered (see below) |
| `sync_mode` | TEXT | Yes | Sharing permission (see below) |
| `created_at` | TIMESTAMP | Yes | When discovered |
| `updated_at` | TIMESTAMP | Yes | Last position/intensity change |
| `metadata` | JSON | No | Evolution history, related reflections, etc. |

**Origin Values:**
- `system_seed` - From default tension set
- `llm_suggested` - AI detected in reflections
- `user_created` - Explicitly added by user

**Sync Mode Values:**
- `local_only` - Never shared (default)
- `share_anonymized` - Contribute tension patterns to Commons
- `share_full` - Full tension + position shareable

**Metadata Structure (suggested):**
```json
{
  "discovered_in_reflection": "uuid-...",
  "related_reflections": ["uuid-1", "uuid-2"],
  "position_history": [
    {"date": "2025-12-01", "position": -0.3},
    {"date": "2025-12-08", "position": 0.1}
  ],
  "notes": "This feels more active during work weeks"
}
```

**Constraints:**
- `name` should be concise (max 100 chars)
- `position` if present must be between -1.0 and 1.0
- `intensity` if present must be between 0.0 and 1.0

**Sync Policy:** Explicit via `sync_mode` field

---

### 7. Axes

**Purpose:** Dimensions for mapping tensions. The coordinate system.

**Semantics:**
- Named dimension (e.g., "Stability", "Autonomy", "Connection")
- Multiple tensions can reference same axis
- Helps visualize tension space

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `identity_id` | TEXT/UUID | No | Foreign key to identities |
| `name` | TEXT | Yes | Axis name |
| `description` | TEXT | No | What this dimension means |
| `category` | TEXT | No | "relational", "temporal", "existential", etc. |
| `created_at` | TIMESTAMP | Yes | When created |
| `metadata` | JSON | No | Examples, related tensions |

**Metadata Structure (suggested):**
```json
{
  "examples": [
    "Saying yes vs saying no",
    "Accommodating vs holding boundaries"
  ],
  "related_tensions": ["autonomy_vs_connection", "self_vs_others"],
  "visual_color": "#4A90E2"
}
```

**Sync Policy:** `local_only`

---

## Evolution & Telemetry

### 8. Engine Runs

**Purpose:** Telemetry for every MirrorCore invocation. Foundation of evolution system.

**Semantics:**
- One record per reflection generation
- Logs what engine did: patterns detected, flags raised, performance
- User decides if this data can contribute to Evolution Commons
- Never logs raw reflection content (privacy)

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `reflection_id` | TEXT/UUID | No | Foreign key to reflections |
| `config_version` | TEXT | Yes | Engine version (e.g., "1.2.0") |
| `engine_mode` | TEXT | Yes | "local_llm", "remote_llm", "manual" |
| `model_name` | TEXT | No | Specific model if applicable |
| `patterns` | JSON | No | Detected patterns array |
| `tensions_surfaced` | JSON | No | Which tensions detected |
| `mirrorback_length` | INTEGER | No | Character count of output |
| `duration_ms` | INTEGER | No | Processing time |
| `flags` | JSON | No | Constitutional violations/warnings |
| `timestamp` | TIMESTAMP | Yes | When run |
| `sync_allowed` | BOOLEAN | Yes | Can contribute to Commons (default: false) |

**Patterns Structure:**
```json
["obligation_language", "absolute_thinking", "internal_tension", "past_trauma_reference"]
```

**Flags Structure:**
```json
{
  "directive_threshold_exceeded": {
    "ratio": 0.18,
    "threshold": 0.15,
    "directive_count": 7,
    "total_words": 39
  },
  "explicit_advice": ["you should", "you need to"]
}
```

**Constraints:**
- If `sync_allowed` is true, must not contain identifiable information
- `duration_ms` must be positive

**Sync Policy:** Opt-in via `sync_allowed` field

---

### 9. Engine Feedback

**Purpose:** User ratings and feedback on mirrorbacks. Quality signal for evolution.

**Semantics:**
- One or more feedback entries per engine run
- User rates quality, flags issues
- Contributes to local critic and (optionally) Evolution Commons

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `engine_run_id` | TEXT/UUID | Yes | Foreign key to engine_runs |
| `rating` | INTEGER | No | 1-5 stars |
| `flags` | JSON | No | Issue tags array |
| `notes` | TEXT | No | Free-form feedback |
| `timestamp` | TIMESTAMP | Yes | When given |
| `sync_allowed` | BOOLEAN | Yes | Can contribute to Commons (default: false) |

**Flag Values (suggested):**
```json
[
  "too_directive",
  "missed_tension",
  "too_generic",
  "over_explained",
  "felt_judged",
  "unhelpful",
  "too_long",
  "too_short",
  "off_topic",
  "actually_helpful"
]
```

**Constraints:**
- `rating` if present must be 1-5
- At least one of `rating`, `flags`, or `notes` must be provided

**Sync Policy:** Opt-in via `sync_allowed` field

---

### 10. Evolution Proposals

**Purpose:** Candidate changes to engine, prompts, or constitution.

**Semantics:**
- Generated from collective analysis or manual submission
- Goes through testing → voting → approval flow
- Transparent governance trail

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `proposal_type` | TEXT | Yes | What's changing (see below) |
| `status` | TEXT | Yes | Current state (see below) |
| `from_version` | TEXT | No | Current version |
| `to_version` | TEXT | No | Target version |
| `title` | TEXT | Yes | Short description |
| `description` | TEXT | Yes | Full rationale |
| `changes` | JSON | Yes | Detailed diff/changes |
| `evidence` | JSON | No | Supporting data from Commons |
| `test_results` | JSON | No | Sandbox outcomes |
| `vote_results` | JSON | No | Governance vote data |
| `created_at` | TIMESTAMP | Yes | When proposed |
| `approved_at` | TIMESTAMP | No | When approved (if applicable) |
| `applied_at` | TIMESTAMP | No | When applied (if applicable) |
| `metadata` | JSON | No | Author, discussion links, etc. |

**Proposal Types:**
- `prompt_adjustment` - Modify MirrorCore prompts
- `pattern_detection` - Improve pattern recognition
- `tension_heuristic` - Adjust tension detection
- `constitutional_amendment` - Modify Layer 0 principles
- `safety_refinement` - Adjust safety thresholds
- `performance_optimization` - Speed/efficiency improvements

**Status Values:**
- `draft` - Being written
- `testing` - In sandbox evaluation
- `review` - Open for community review
- `voting` - Active governance vote
- `approved` - Passed vote, pending implementation
- `applied` - Successfully applied
- `rejected` - Failed vote or testing

**Changes Structure (example):**
```json
{
  "type": "prompt_adjustment",
  "file": "mirrorcore/prompts/reflection.txt",
  "diff": {
    "before": "Notice patterns in what you wrote",
    "after": "Notice recurring themes and tensions in what you wrote"
  },
  "expected_impact": "Increase tension detection by ~15%"
}
```

**Evidence Structure (example):**
```json
{
  "packets_analyzed": 2400000,
  "problem_frequency": 0.23,
  "pattern": "missed_tension_in_family_context",
  "success_rate_before": 0.45,
  "success_rate_after": 0.68
}
```

**Vote Results Structure:**
```json
{
  "eligible_voters": 15420,
  "votes_cast": 8934,
  "approve": 6123,
  "reject": 2811,
  "approval_rate": 0.685,
  "threshold": 0.67,
  "guardian_signatures": 5,
  "guardian_required": 4
}
```

**Constraints:**
- `status` transitions must follow valid flow
- `proposal_type` must be recognized value

**Sync Policy:** Public by default (governance transparency)

---

### 11. Evolution History

**Purpose:** Record of what actually changed. Audit trail.

**Semantics:**
- One entry per evolution event
- Immutable history (no updates, only inserts)
- Enables rollback and forking

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `evolution_id` | TEXT | Yes | Reference to proposal or event |
| `event_type` | TEXT | Yes | What happened (see below) |
| `from_version` | TEXT | No | Previous state |
| `to_version` | TEXT | No | New state |
| `applied_at` | TIMESTAMP | Yes | When it happened |
| `applied_by` | TEXT | No | Who/what applied it |
| `reversible` | BOOLEAN | Yes | Can be rolled back |
| `metadata` | JSON | No | Why, impact, etc. |

**Event Types:**
- `upgrade` - Applied approved proposal
- `downgrade` - Rolled back to previous version
- `fork` - Branched from canonical line
- `rollback` - Reverted specific change
- `merge` - Adopted changes from fork
- `hotfix` - Emergency patch

**Metadata Structure (example):**
```json
{
  "reason": "Constitutional violation detected in v1.3.0",
  "impact": "Reverted to v1.2.1, 3 changes rolled back",
  "affected_users": 1247,
  "rollback_reason": "directive_threshold_exceeded",
  "related_proposal": "E-2025-DEC-042"
}
```

**Sync Policy:** Local by default, shareable if opted in

---

### 12. Evolution Events

**Purpose:** Lifecycle events for learning. Birth, death, adoption, rejection.

**Semantics:**
- Logs major Mirror lifecycle events
- Contributes to meta-learning (what makes Mirrors succeed/fail)
- Anonymized by default

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `event_type` | TEXT | Yes | What happened (see below) |
| `from_version` | TEXT | No | Version context |
| `to_version` | TEXT | No | If version changed |
| `event_data` | JSON | Yes | Event details |
| `timestamp` | TIMESTAMP | Yes | When occurred |
| `mirror_signature` | TEXT | No | Cryptographic proof of authenticity |
| `sync_allowed` | BOOLEAN | Yes | Can submit to Commons |

**Event Types:**
- `installation` - New Mirror created
- `deletion` - Mirror permanently removed
- `fork` - Branched from canonical
- `regression` - Downgraded after bad upgrade
- `integration_add` - Connected external service
- `integration_remove` - Disconnected service
- `upgrade` - Adopted new version
- `downgrade` - Reverted version
- `config_change` - Modified settings
- `export` - Data exported
- `import` - Data imported

**Event Data Structure (examples):**

Installation:
```json
{
  "install_type": "fresh",
  "platform": "windows",
  "python_version": "3.11",
  "initial_mode": "local_llm",
  "user_context": "personal"
}
```

Regression:
```json
{
  "from_version": "1.3.0",
  "to_version": "1.2.1",
  "reason": "constitutional_violation",
  "violation_type": "directive_threshold_exceeded",
  "time_to_rollback_hours": 3.5,
  "user_initiated": true
}
```

Fork:
```json
{
  "fork_name": "mirror-therapy-focused",
  "base_version": "1.2.0",
  "declared_changes": ["trauma_sensitive_prompts", "extended_safety_system"],
  "fork_maintainer": "username",
  "fork_reason": "Need specialized trauma-informed features"
}
```

**Constraints:**
- `event_type` must be recognized value
- `event_data` must be valid JSON

**Sync Policy:** Opt-in via `sync_allowed` field

---

## Integrations

### 13. Integrations

**Purpose:** External connections (calendar, notes, health data, etc.)

**Semantics:**
- Connects Mirror to other data sources
- Each integration has own sync/permission rules
- Can be active, paused, or disconnected
- Config is integration-specific

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT/UUID | Yes | Primary key |
| `identity_id` | TEXT/UUID | No | Foreign key to identities |
| `integration_type` | TEXT | Yes | What's connected (see below) |
| `status` | TEXT | Yes | Current state |
| `config` | JSON | Yes | Connection details |
| `connected_at` | TIMESTAMP | Yes | When added |
| `last_sync` | TIMESTAMP | No | Last successful sync |
| `metadata` | JSON | No | Sync frequency, permissions, etc. |

**Integration Types:**
- `calendar` - Google Calendar, Outlook, etc.
- `notes` - Notion, Obsidian, Apple Notes, etc.
- `email` - Gmail, etc. (read-only)
- `health` - Apple Health, Fitbit, etc.
- `journal` - Day One, etc.
- `tasks` - Todoist, Things, etc.
- `music` - Spotify, Apple Music (listening data)
- `location` - Location history
- `custom` - User-defined webhook

**Status Values:**
- `active` - Currently syncing
- `paused` - Temporarily disabled
- `disconnected` - Credentials invalid or revoked
- `error` - Sync failing

**Config Structure (example - Calendar):**
```json
{
  "provider": "google_calendar",
  "calendar_ids": ["primary", "work"],
  "sync_direction": "read_only",
  "sync_frequency": "daily",
  "look_back_days": 7,
  "oauth_token_encrypted": "...",
  "last_event_synced": "2025-12-08T10:00:00Z"
}
```

**Metadata Structure (suggested):**
```json
{
  "permissions_granted": ["read_calendar_events", "read_event_details"],
  "data_retention": "local_only",
  "auto_reflect": false,
  "pattern_detection": true
}
```

**Constraints:**
- `integration_type` must be recognized or "custom"
- `config` must contain provider-specific required fields

**Sync Policy:** `local_only` (integration config never syncs)

---

## Schema Management

### 14. Schema Version

**Purpose:** Track which migrations have been applied.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | Yes | Auto-increment primary key |
| `version` | TEXT | Yes | Schema version (e.g., "1.0.0") |
| `description` | TEXT | No | What this version adds/changes |
| `applied_at` | TIMESTAMP | Yes | When migration ran |
| `checksum` | TEXT | No | Migration file hash (verify integrity) |

**Usage:**
- Check current version: `SELECT version FROM schema_version ORDER BY id DESC LIMIT 1`
- Verify migration state before applying new migrations
- Support rollback by tracking version history

---

## Sync & Sharing Semantics

### Default Policy: Local First

**Everything is local-only by default.** User must explicitly opt-in to sync.

### Sync Levels:

1. **local_only** (Default)
   - Never leaves device
   - Not shared with platform
   - Not contributed to Evolution Commons

2. **sync_summary**
   - Anonymized aggregates only
   - Example: "This Mirror detected 'obligation_language' pattern 23 times"
   - No raw content

3. **sync_full_private**
   - Full content, encrypted
   - Only syncs to user's other devices
   - Platform cannot read

4. **sync_full_public**
   - Full content, public
   - User consciously shares (e.g., Discussion Hub post)
   - Clear attribution

5. **share_anonymized**
   - Pattern-level data
   - Example: Tension existence + position (no context)
   - Contributes to collective learning

### Enforcement:

Enforced at three layers:

1. **Schema** - Fields like `visibility`, `sync_mode`, `sync_allowed`
2. **MirrorCore** - Sync layer checks before transmission
3. **Platform API** - Rejects non-consented data

### Telemetry Consent:

Evolution telemetry (`engine_runs`, `engine_feedback`, `evolution_events`) requires explicit `sync_allowed = true`.

User opts in per-record or globally via settings.

---

## Platform Extensions (Not Core)

**The following tables exist ONLY in platform context** (Supabase, hosted services):

### platform_users
Maps platform authentication to Mirror identities.

### platform_profiles
Public profile info (username, avatar, bio).

### discussion_posts
Public discussion hub posts.

### discussion_comments
Comments on posts.

### discussion_votes
Upvotes/downvotes on posts/comments.

### subscriptions
Payment plans, billing.

### platform_analytics
Aggregate platform metrics (not per-user).

### cloud_sync_queue
Temporary sync coordination.

**These are NOT part of Mirror OS core spec.**

They are platform adapters and services.

---

## Migration Strategy

### Version Numbering

**Semantic Versioning:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (requires data migration)
- **MINOR:** New tables/fields (backwards compatible)
- **PATCH:** Indexes, constraints, non-breaking fixes

### Migration Files

**Location:** `mirror_os/schemas/{sqlite|postgres}/XXX_description.sql`

**Naming:** `001_core.sql`, `002_add_threads.sql`, `003_add_integrations.sql`

**Structure:**
```sql
-- Migration: 002_add_threads.sql
-- Version: 1.1.0
-- Date: 2025-12-15
-- Description: Add thread/session support

-- Forward migration
CREATE TABLE IF NOT EXISTS threads (
    -- ...
);

-- Rollback (at end of file, commented)
-- ROLLBACK:
-- DROP TABLE threads;
-- DROP TABLE thread_reflections;
```

### Migration Process

1. Check current version
2. Apply missing migrations in order
3. Record in `schema_version`
4. Verify checksum
5. Test query on upgraded schema

### Rollback Process

1. Check current version
2. Identify target rollback version
3. Apply reverse migrations in reverse order
4. Remove entries from `schema_version`
5. Verify integrity

---

## Export/Import Format

### Bundle Structure

**File:** `mirror_bundle_YYYYMMDD_HHMMSS.zip`

**Contents:**
```
mirror_bundle_20251208_153000.zip
├── MANIFEST.json           # Bundle metadata
├── mirror_os.db           # SQLite database (or SQL dump)
├── config.json            # User configuration
├── constitution/          # Constitutional files
│   ├── 00_manifesto.md
│   ├── 01_sovereignty.md
│   └── ...
├── evolution/             # Evolution history
│   ├── proposals/
│   └── history/
└── integrations/          # Integration configs (sanitized)
    └── configs.json
```

### MANIFEST.json

```json
{
  "version": "1.0",
  "exported_at": "2025-12-08T15:30:00Z",
  "mirror_version": "1.2.0",
  "schema_version": "1.0.0",
  "database_type": "sqlite",
  "database_size_bytes": 5242880,
  "record_counts": {
    "identities": 2,
    "reflections": 347,
    "mirrorbacks": 347,
    "tensions": 12,
    "engine_runs": 347,
    "engine_feedback": 89
  },
  "includes": {
    "constitution": true,
    "evolution_history": true,
    "integration_configs": true
  },
  "privacy": {
    "sanitized": false,
    "encryption": "none"
  }
}
```

### Import Process

1. Extract bundle
2. Verify MANIFEST integrity
3. Check schema version compatibility
4. Import database (SQLite copy or SQL restore)
5. Apply migrations if needed
6. Restore constitution
7. Restore evolution history
8. Re-configure integrations (user re-auth required)

---

## Implementation Checklist

### Phase 1: Core Local

- [ ] Complete SQLite schema (001_core.sql)
- [ ] `MirrorStorage` interface
- [ ] `SQLiteStorage` implementation
- [ ] Schema versioning
- [ ] Migration system
- [ ] Basic export/import

### Phase 2: MirrorCore Integration

- [ ] Wire MirrorCore to use Mirror OS
- [ ] Remove Supabase dependencies from core
- [ ] Test: reflections save to SQLite
- [ ] Test: Layer 1 boots without platform

### Phase 3: Platform Adapter

- [ ] PostgreSQL schema matching spec
- [ ] `PostgresStorage` implementation
- [ ] Platform-specific extensions
- [ ] Sync service

### Phase 4: Evolution System

- [ ] Evolution Commons database
- [ ] Proposal system
- [ ] Voting interface
- [ ] Release management

---

## Validation Rules

### Identity
- ID must be valid UUID or unique text
- Timestamps must be ISO 8601

### Reflection
- Content cannot be empty
- Visibility must be valid enum
- If anonymous, must be local_only

### Tension
- Position must be -1.0 to 1.0
- Intensity must be 0.0 to 1.0
- Origin must be valid enum
- Sync mode must be valid enum

### Engine Run
- Duration must be positive
- Config version must match format
- If sync_allowed, patterns must be anonymized

### Engine Feedback
- Rating must be 1-5 if provided
- Must have rating OR flags OR notes

---

## Future Considerations

### Possible Additions (v2.0+)

- **Attachments table** - Files associated with reflections
- **Relationships table** - Named connections between identities
- **Goals/Intentions** - Not optimization targets, but declared directions
- **Timeline/Journal** - Structured temporal view
- **Wisdom/Insights** - User-marked important patterns
- **Dreams** - Separate content type with own analysis
- **Dialogues** - Multi-turn conversations (vs single reflections)

### Possible Removals

If adoption shows these aren't used:
- Axes (if tension mapping doesn't resonate)
- Threads (if users prefer flat reflection list)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-12-08 | Genesis specification - Core entities defined |

---

**This specification is the source of truth for Mirror OS.**

**All implementations (SQLite, PostgreSQL, future databases) must conform to this spec.**

**Deviations require either spec update or clear documentation of adapter-specific extensions.**

