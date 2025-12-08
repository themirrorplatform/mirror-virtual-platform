# Constitution §01: Sovereignty

## Principle

**You own your intelligence. Completely. Forever.**

This is not a feature. This is a foundational right encoded in the architecture.

---

## Data Ownership

### Your Data Lives on Your Machine

**Guaranteed:**
- SQLite database at `~/.mirrorcore/mirror.db`
- All reflections, patterns, tensions stored locally
- No cloud dependency required
- No platform account required

**You control:**
- What data exists
- Where it lives
- Who can access it
- When to delete it
- Whether to export it

### Local-First Architecture

**Layer 1 (MirrorCore) operates completely offline:**

```python
# This MUST work with zero network:
from mirrorcore import Mirror

mirror = Mirror()  # No API keys required
reflection = mirror.reflect("Today I noticed...")  # Works offline
mirror.close()  # Data saved locally
```

**Constitutional requirement:** Any code path in `mirrorcore/` that requires network access MUST:
1. Be explicitly opt-in
2. Have clear local fallback
3. Work degraded without network
4. Never block core functionality

---

## Sync is Optional

### Three Modes

**Local Mode (Default):**
```json
{
  "mirror_mode": "local",
  "sync_enabled": false
}
```
- Everything local
- Zero network
- Maximum sovereignty

**Hybrid Mode (Opt-in):**
```json
{
  "mirror_mode": "hybrid",
  "sync_enabled": true,
  "sync_rules": {
    "identity_graph": "never",
    "reflections": "summary_only",
    "patterns": "anonymized",
    "tensions": "local_only"
  }
}
```
- Local storage
- Selective sync
- User controls what leaves machine

**Cloud Mode (Convenience):**
```json
{
  "mirror_mode": "cloud"
}
```
- Hosted on platform
- Full sync
- Can export to local anytime

### Sync Rules

**User must explicitly allow each type of sync:**

```python
# mirrorcore/config/settings.py

class SyncSettings:
    # Identity & Personal
    sync_identity_graph: bool = False      # Your self-model
    sync_full_reflections: bool = False    # Raw text
    sync_private_notes: bool = False       # Private annotations
    
    # Derived & Anonymized
    sync_pattern_summaries: bool = False   # "control vs surrender"
    sync_tension_counts: bool = False      # Frequency only
    sync_session_metadata: bool = False    # Duration, count, no content
    
    # Public & Intentional
    sync_public_posts: bool = False        # Discussion Hub posts
    sync_commons_contributions: bool = False  # Evolution packets
```

**Default: ALL FALSE**

**Changing requires explicit user action:**
```bash
mirror config set sync_pattern_summaries true
# Prompts: "This will send anonymized pattern summaries to platform. Continue? [y/N]"
```

---

## Export & Portability

### Complete Data Export

**You can export everything at any time:**

```bash
mirror export --format json --output ~/my_mirror_backup.json
```

**Export includes:**
- All reflections (full text)
- All mirrorbacks
- Identity graph
- Tensions and axes
- Sessions and threads
- Configuration
- Evolution history

**Export format is:**
- Human-readable JSON
- Fully documented schema
- Importable to new Mirror
- Convertible to other formats

### Migration Paths

**Platform → Local:**
```bash
# Download from platform
mirror platform export --output cloud_backup.json

# Import to local installation
mirror import --file cloud_backup.json --mode local
```

**Local → Platform:**
```bash
# Export local data
mirror export --output local_backup.json

# Upload to platform (opt-in)
mirror platform import --file local_backup.json
```

**Local → Another Local:**
```bash
# On machine A
mirror export --output mirror_data.json

# Transfer file to machine B
# On machine B
mirror import --file mirror_data.json
```

---

## Deletion Rights

### Complete Deletion

**You can delete everything:**

```bash
# Delete all local data
mirror delete --all --confirm

# This removes:
# - Database file
# - Configuration
# - Cached models
# - Evolution history
# - Everything
```

**If synced to platform:**
```bash
# Request platform deletion
mirror platform delete --all

# Platform MUST delete within 30 days
# You receive confirmation
```

### Right to Be Forgotten

**From Evolution Commons:**

If you contributed evolution packets, you can request removal:

```bash
mirror evolution retract --all

# Removes your packets from collective analysis
# Does not affect already-released evolutions
# Future proposals won't use your data
```

---

## Access Control

### Local Access

**Your local Mirror is protected:**

```python
# Optional authentication for local UI
class MirrorSettings:
    require_local_auth: bool = False  # Off by default
    local_auth_method: Literal["password", "biometric"] = "password"
```

**File system protection:**
- Database file permissions: 600 (user only)
- Config file permissions: 600 (user only)
- Backups encrypted: Optional

### Platform Access (If Synced)

**If you use hosted Mirror:**

- Platform has access only to synced data
- Access logged and auditable
- Can be revoked instantly
- Must comply with data protection laws

**Platform cannot:**
- Access local-only data
- Force sync
- Prevent local operation
- Block export
- Deny deletion

---

## Sovereignty Verification

### Self-Audit

**You can verify sovereignty at any time:**

```bash
mirror audit sovereignty

# Checks:
# ✓ Database is local
# ✓ No required network calls
# ✓ Sync settings honored
# ✓ No telemetry without consent
# ✓ Export works
# ✓ Deletion works
# ✓ Layer 1 independent of Layer 3
```

### Open Source Verification

**Anyone can audit the code:**

```bash
# Check: Does MirrorCore require platform?
grep -r "import.*platform" mirrorcore/
# Should return: No required imports

# Check: Are there hidden network calls?
grep -r "httpx\|requests\|urllib" mirrorcore/engine/
# Should return: Only in optional sync layer

# Check: Is telemetry opt-in?
grep -r "telemetry\|analytics" mirrorcore/
# Should be: Explicitly disabled by default
```

---

## Constitutional Violations

### What Violates Sovereignty?

**Automatic violations:**

1. **Required platform connection** - Layer 1 needs Layer 3
2. **Forced sync** - Data sent without explicit opt-in
3. **Hidden telemetry** - Tracking without consent
4. **Export blocked** - Can't get your data out
5. **Deletion denied** - Can't remove your data
6. **Local operation blocked** - Network required for core

**If detected:**
```bash
mirror audit sovereignty --strict
# Returns: List of violations
# Action: Fork immediately
```

### Reporting Violations

**If you find a sovereignty violation:**

1. Create GitHub issue with evidence
2. Tag as `constitutional-violation`
3. Community votes on severity
4. If confirmed: Immediate fix required
5. If not fixed: Fork recommended

---

## Evolution & Sovereignty

### Evolution Cannot Violate Sovereignty

**Constitutional constraint on Evolution Engine:**

All evolution proposals MUST pass sovereignty check:

```python
# platform/evolution_commons/governance/constitutional.py

def check_sovereignty_compliance(proposal: EvolutionProposal) -> bool:
    """Verify proposal doesn't violate sovereignty"""
    
    violations = []
    
    # Check: Does it add required network calls?
    if proposal.adds_required_network_dependency():
        violations.append("Adds required network dependency")
    
    # Check: Does it add telemetry without opt-in?
    if proposal.adds_telemetry() and not proposal.is_explicitly_opt_in():
        violations.append("Adds telemetry without opt-in")
    
    # Check: Does it make Layer 1 depend on Layer 3?
    if proposal.adds_platform_dependency_to_core():
        violations.append("Makes core depend on platform")
    
    # Check: Does it restrict export or deletion?
    if proposal.restricts_data_portability():
        violations.append("Restricts data portability")
    
    if violations:
        proposal.mark_unconstitutional(violations)
        return False
    
    return True
```

**Proposals that violate sovereignty are automatically rejected.**

---

## The Sovereignty Promise

**We promise:**

1. Your data lives on your machine
2. You can use Mirror without any platform
3. You can export everything
4. You can delete everything
5. You control what syncs
6. You can disconnect anytime
7. You can fork anytime
8. No one can take your Mirror away

**Even if:**
- Platform dies
- Company gets acquired
- I get corrupted
- Government demands access
- Service shuts down

**Your Mirror continues.**

**This is the sovereignty guarantee.**

---

## Implementation Requirements

### For Core Developers

**When adding any feature to `mirrorcore/`:**

1. ✅ Works offline?
2. ✅ No required network calls?
3. ✅ User data stays local?
4. ✅ Sync is opt-in?
5. ✅ Export includes this data?
6. ✅ Deletion removes this data?

**If any answer is NO:**
- Feature goes in `platform/` not `mirrorcore/`
- Or: Feature is explicitly opt-in with clear local fallback

### For Platform Developers

**When adding any platform feature:**

1. ✅ Core works without this?
2. ✅ User can disconnect?
3. ✅ Opt-in only?
4. ✅ Local alternative exists?

---

## Version History

**v1.0.0** - December 8, 2025 - Initial constitution  
**Status:** Active

**Amendments:** None yet

**Next review:** When proposed

---

*"Your intelligence is yours. The architecture guarantees it."*
