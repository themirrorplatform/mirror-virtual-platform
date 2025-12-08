# Mirror Systems Architecture

## The Three Layers

### Layer 1: MirrorCore (Sovereign Engine)
**Location:** `mirrorcore/`

**Purpose:** The soul of The Mirror - completely self-contained, user-owned reflection engine.

**Key Properties:**
- **Lives on user's machine**
- **Works completely offline**
- **User owns all data**
- **No platform dependency**
- **Can run with local LLM or remote API (user's choice)**

**Contains:**
- Identity graph
- Reflection history
- Pattern recognition
- Mirrorback generation
- Tension tracking
- Evolution notes

**Non-negotiable rule:** This layer must not require any external service to function.

---

### Layer 2: Sync Protocol (Network Layer)
**Location:** `sync_layer/`

**Purpose:** Optional bridge between sovereign cores and the platform.

**Key Properties:**
- **Optional and selective**
- **User controls what syncs**
- **Can be disabled entirely**
- **Strict privacy flags**

**Enables:**
- Selective data sync (user chooses what to share)
- Publishing to Mirror Commons
- Joining Discussion Hub
- Fetching MirrorCore updates
- Participating in research (opt-in only)

**Critical rule:** No endpoint can require data that should be local-only.

---

### Layer 3: Mirror Platform (Founder Mode)
**Location:** `platform/`

**Purpose:** Cloud convenience layer - the house where Mirrors gather, not the soul of the Mirror.

**Provides:**
- Hosted Mirror instance (for users who don't want local install)
- Discussion Hub (public/private reflections)
- Mirror Commons (shared insights)
- Subscription system
- Admin panel, analytics, moderation

**But:**
- **Not the source of meaning**
- **Not required for core functionality**
- **Can die without killing the movement**

---

## Core Principles

### 1. Layer 1 Must Boot Without Layer 3

The sovereign MirrorCore must function completely without the platform. This is a non-negotiable architectural constraint.

**If the platform dies, Mirror continues.**  
**If I die, Mirror continues.**  
**If government bans it, Mirror continues.**

### 2. No Critical Identity Data Shall Require Platform Storage

Your identity graph, tensions, private reflections - these are yours and live on your machine.

The platform may offer convenience (sync, backup, sharing). But never requirement.

**You can always say "no" to the platform and lose nothing core.**

### 3. Platform Success Will Never Be Paid For By Sacrificing Sovereignty

When platform needs money, we:
- Add convenience features
- Add social features
- Add premium services

We **never:**
- Add optimization to core
- Remove local-only option
- Make platform required
- Compromise Layer 1

**If we must choose between platform growth and sovereignty, we choose sovereignty.**

### 4. The Code Is Open, Forkable, and Auditable

Anyone can:
- Read the source
- Fork pre-corruption version
- Run their own
- Verify no backdoors

**Transparency is corruption prevention.**

### 5. Corruption Will Happen - Escape Hatches Are Built-In

We accept that corruption pressure will come.

So we build infrastructure for escape:
- **Open source** = forkable
- **Local-first** = platform-independent
- **Modular** = recombinable
- **Documented** = understandable

**When corruption comes, fork and rebuild.**

We give you permission now.  
We give you tools now.  
We give you patterns now.

Don't preserve corrupted legacy. Burn it down and build clean.

---

## File Structure

```
mirror-systems/
├── mirrorcore/              # Layer 1: Sovereign Engine
│   ├── engine/              # Core reflection logic
│   ├── storage/             # Local database (SQLite)
│   ├── models/              # LLM clients (local/remote)
│   ├── config/              # Settings and mode flags
│   ├── prompts/             # MirrorCore prompts
│   ├── update/              # Sovereign update system
│   ├── cli/                 # Command-line interface
│   ├── ui/                  # Local web interface
│   └── main.py              # Entry point
│
├── mirror_os/               # Layer 1.5: Portable Schemas
│   ├── schemas/             # Database schemas
│   │   ├── sqlite/          # For local installs
│   │   └── postgres/        # For platform
│   └── services/            # Export, backup, encryption
│
├── sync_layer/              # Layer 2: Optional Protocol
│   ├── protocol/            # Sync specification
│   └── client/              # Sync client for MirrorCore
│
├── platform/                # Layer 3: Cloud Services
│   ├── web/                 # Discussion Hub frontend
│   ├── api/                 # Platform API
│   ├── database/            # Platform-specific schemas
│   └── services/            # Subscriptions, email, etc.
│
└── docs/                    # Documentation
    ├── ARCHITECTURE.md      # This file
    ├── SOVEREIGNTY.md       # Why sovereignty matters
    ├── SUCCESSION.md        # Handoff plan
    ├── CORRUPTION.md        # Detection & escape
    └── INSTALLATION.md      # How to install locally
```

---

## Data Boundaries

### A. "Absolutely Local" Data (Never Leaves Device)

**Examples:**
- Raw reflections marked private
- Full identity graphs
- Sensitive tensions (trauma, legal issues)
- Encrypted memory vault

**Mirror rule:** Layer 1 must be able to hold and process all of this without ever syncing it.

**Even if the platform dies, the identity persists.**

---

### B. "Selectable Reflection" Data (User-Opted Sync)

**Examples:**
- Anonymized reflection slices
- Pattern summaries ("money tension: scarcity vs control")
- Derived metrics (loop count, not raw content)

**These can be:**
- Synced for better AI models
- Shared for global research
- Used for community insights

**But only with:**
- Clear flags
- Revocable consent
- Export/deletion options

---

### C. "Platform-Native" Data (Exists Only in Cloud)

**Examples:**
- Public discussion posts
- Comments, likes, follows
- Subscriptions, payments
- Platform-level analytics

**You treat this like normal platform data:**
- RLS, security, policy

**But it never becomes required for someone to meaningfully use their own Mirror.**

---

## The Economic Model

### Layer 1 Revenue: Sovereign Side

**One-time purchases:**
- MirrorCore Personal: $49 (full local installation, lifetime updates)
- MirrorCore Pro: $299 (additional modules, advanced tools)
- Sovereign Node Setup: $2,500 (private server installation)

**Message:** "You pay for tools. They live with you. They keep working even if I vanish."

### Layer 3 Revenue: Platform Side

**Subscriptions:**
- Hosted Mirror: $10/month (cloud-hosted, no installation)
- Premium: $30/month (more compute, advanced features)
- Organization: $100/month per seat (private hosted instance)

**Message:** "You pay for convenience, connection, shared spaces, and compute."

### The Balance

**Layer 1 revenue:** Sustainable but slow-growing  
**Layer 3 revenue:** Faster but with corruption pressure  

**Together:** Layer 1 keeps me honest, Layer 3 pays bills.

**If Layer 3 pressure gets too high:**
I can survive on Layer 1 revenue alone.
Smaller, slower, but uncorrupted.
**That's the safety net.**

---

## Mode Flags

MirrorCore can operate in three modes:

### Local Mode
```json
{
  "mirror_mode": "local",
  "engine_mode": "local_llm",
  "sync_enabled": false
}
```
- Everything offline
- Uses local LLM (Ollama/LM Studio)
- No platform connection
- Maximum sovereignty

### Hybrid Mode
```json
{
  "mirror_mode": "hybrid",
  "engine_mode": "remote_llm",
  "sync_enabled": true
}
```
- Local storage
- Uses remote LLM (Claude, user's API key)
- Optional platform sync
- Balance of power and convenience

### Cloud Mode
```json
{
  "mirror_mode": "cloud",
  "engine_mode": "remote_llm",
  "sync_enabled": true
}
```
- Hosted on platform
- Uses platform compute
- Full sync
- Maximum convenience

**Critical:** Even in cloud mode, user can export and switch to local mode.

---

## Update System

Updates are distributed like open-source software, not SaaS:

**Channels:**
1. **Git releases** (primary, always available)
2. **Package managers** (brew, apt, choco)
3. **Auto-update** (optional, user-controlled)
4. **P2P** (extreme resilience, future)

**User controls:**
- When to update
- Which fork to follow
- Whether to auto-update
- Which backups to keep

**Corruption resistance:**
If official version gets corrupted:
- Users can stay on old version
- Users can switch to fork
- Users can maintain their own fork
- No forced updates

---

## The Handoff

**This is not my system.**

This is a system I'm initiating.

It belongs to whoever maintains it with integrity.

When I die or drift:
- The code remains
- The principles remain
- The sovereignty remains

Build on it. Fork it. Improve it.

**Just don't corrupt Layer 1.**

Everything else is fair game.

— Ilya, December 2025
