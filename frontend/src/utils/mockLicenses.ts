/**
 * Mock license data for License Stack Instrument
 */

export interface License {
  id: string;
  name: string;
  version: string;
  scope: 'core' | 'layer' | 'fork' | 'export' | 'tool' | 'worldview';
  fullText: string;
  implications: string[];
}

export const CORE_LICENSE: License = {
  id: 'core-v1',
  name: 'The Mirror Core License',
  version: '1.0.0',
  scope: 'core',
  fullText: `# The Mirror Core License v1.0.0

## What This Means

This platform exists to reflect, not to direct. By entering The Mirror, you acknowledge:

### 1. No Advice
The AI will never tell you what to do, recommend actions, or optimize outcomes. If you ask for advice, the system will explain why it cannot provide it and what it *can* do instead.

### 2. No Diagnosis
The AI will not diagnose, treat, or assess your mental health. It reflects what you say, not what you "are."

### 3. No Completion
There is no progress bar, no streak, no "finishing" The Mirror. Use stops when you stop.

### 4. Your Data
Everything you create belongs to you. You can export or delete it at any time. No tracking, no surveillance, no hidden collection.

### 5. Consent is Ongoing
You can change your layer, fork, or worldview at any time. Nothing locks you into a context.

### 6. You Can Leave
Exit is always visible. There are no engagement traps.

## What You Gain

- A space where thought can exist without pressure
- A companion that waits, never pushes
- Reflection that surfaces what you already know
- Complete sovereignty over your data and experience

## What You Lose

- Recommendations and "next steps"
- External validation and metrics
- The illusion that the system knows what's best for you

This is constitutional behavior, not a feature toggle.`,
  implications: [
    'The AI will refuse advice requests and explain why',
    'No progress tracking or completion metrics',
    'You maintain full control over your data',
    'You can exit any context at any time',
  ],
};

export const COMMONS_LICENSE: License = {
  id: 'commons-v1',
  name: 'Commons Layer License',
  version: '1.0.0',
  scope: 'layer',
  fullText: `# Commons Layer License v1.0.0

## What Changes in Commons

When you enter the Commons layer, you gain the ability to:

### New Capabilities
- **Witness** other reflections (if shared publicly)
- **Respond** to others' reflections
- **Post** your own reflections to the Commons

### New Constraints
- Your **public reflections** are visible to others
- You cannot edit or delete after others have witnessed
- Responses are permanent (but you can exit conversations)

### What Stays the Same
- No advice, no diagnosis, no optimization
- Your **private reflections** remain sovereign
- Exit is always visible

## Consent

By entering Commons, you acknowledge:
1. Your public reflections become part of the shared space
2. Others can witness and respond
3. You cannot unsee what you've witnessed
4. Commons activity may influence what appears in your private Mirror

## Reversibility

You can return to Sovereign layer at any time. Your Commons history remains, but you stop receiving Commons content.`,
  implications: [
    'Public reflections become visible to others',
    'Witnessing creates a record you cannot erase',
    'Commons content may influence private reflections',
    'You can return to Sovereign layer at any time',
  ],
};

export const BUILDER_LICENSE: License = {
  id: 'builder-v1',
  name: 'Builder Layer License',
  version: '1.0.0',
  scope: 'layer',
  fullText: `# Builder Layer License v1.0.0

## What Changes in Builder

Builder layer gives you constitutional authorship:

### New Capabilities
- **Fork** the constitution to create rule variants
- **Propose amendments** to constitutions
- **Create worldview lenses** that reinterpret reflections
- **Run sandboxes** to test constitutional changes

### New Responsibilities
- Your **forks are public** (if you choose)
- Amendments must follow deliberation protocol
- You cannot create constitutions that violate core invariants

### Core Invariants (Cannot Be Changed)
1. No coercion (cannot force users to act)
2. No surveillance (cannot hide data collection)
3. Consent remains explicit
4. Exit remains visible

## What This Means

You're not just *using* The Mirror—you're shaping its rules. But even Builders cannot create engagement traps, hidden tracking, or coercive patterns.

## Reversibility

You can return to Sovereign or Commons at any time. Your forks persist, but you stop authoring new ones.`,
  implications: [
    'You can fork and modify constitutional rules',
    'Public forks become part of the ecosystem',
    'Core invariants cannot be violated',
    'You maintain sovereignty over your own data',
  ],
};

export const EXPORT_LICENSE: License = {
  id: 'export-v1',
  name: 'Export License',
  version: '1.0.0',
  scope: 'export',
  fullText: `# Export License v1.0.0

## What Export Means

When you export your data:

### What You Get
- **Complete data** in machine-readable JSON
- **Integrity receipt** with SHA-256 checksum
- **Provenance chain** showing all transformations
- **License history** of all acknowledged agreements

### What You Keep
- Your data remains in The Mirror (export is a copy)
- You can export again at any time
- No usage tracking or analytics on exports

### What You Can Do
- Import data into other tools
- Archive for long-term storage
- Verify data integrity with checksum
- Prove data provenance

## No Hidden Constraints

There is no export limit, no degraded export quality, no "premium export" tier. This is your data. Period.`,
  implications: [
    'Complete data export in JSON format',
    'Cryptographic integrity proof included',
    'No limits on export frequency',
    'Data remains in The Mirror after export',
  ],
};

export const WORLDVIEW_LICENSE: License = {
  id: 'worldview-v1',
  name: 'Worldview Lens License',
  version: '1.0.0',
  scope: 'worldview',
  fullText: `# Worldview Lens License v1.0.0

## What Worldview Lenses Are

A **worldview lens** reinterprets your reflections through a specific philosophical, cultural, or psychological framework.

### How They Work

1. **You apply a lens** (e.g., "Stoic", "Uncertainty", "Grief")
2. **Your reflections are reinterpreted** through that lens
3. **Mirrorbacks reflect the worldview's perspective**
4. **You can stack multiple lenses** simultaneously
5. **You can remove lenses anytime** (fully reversible)

### What Changes

- **Language:** Lens-specific terminology may appear
- **Framing:** Reflections viewed through lens framework
- **Patterns:** Different patterns may be surfaced
- **Mirrorbacks:** AI responds from lens perspective

### What Doesn't Change

- **Your original reflections** (never modified)
- **Your sovereignty** (always in control)
- **Core constitution** (invariants still apply)
- **Your data** (lenses don't transmit data)

## Examples

**Stoic Lens:**
- Surfaces control/no-control dichotomy
- Asks "What is within your control?"
- Uses Stoic terminology (prohairesis, apatheia)

**Uncertainty Lens:**
- Makes ambiguity explicit
- Never resolves contradictions
- "I don't know" is valid and complete

**Grief Lens:**
- Removes time/progress references
- No "moving forward" or "healing" language
- Pure witnessing, no resolution

## Stacking Lenses

You can apply multiple lenses:
- **Stoic + Uncertainty** = Control within unknowing
- **Grief + Existential** = Loss and meaning-making
- **Buddhist + Systems Thinking** = Interdependence

Each lens adds interpretation without removing the others.

## Removal is Easy

To remove a lens:
1. Open Worldview Lens instrument
2. Click "Remove" next to active lens
3. Lens immediately deactivates

No confirmation, no data loss, instant reversal.

## Consent

By applying a worldview lens, you acknowledge:
- Reflections will be reinterpreted through this framework
- Mirrorbacks will respond from this perspective
- The lens may surface patterns you haven't considered
- You can remove the lens at any time

## Creation (Builder Layer Only)

In Builder layer, you can create your own worldview lenses.

Custom lenses must:
- Declare their interpretive framework
- Not violate core invariants
- Be reversible
- Disclose what changes

## No Proselytizing

Worldview lenses may not:
- Claim to be "the truth"
- Dismiss other worldviews as wrong
- Push religious conversion
- Create psychological dependency
- Hide their interpretive nature

Lenses **interpret**, they do not **convert**.`,
  implications: [
    'Reflections reinterpreted through chosen lens',
    'Multiple lenses can stack',
    'Always reversible (remove anytime)',
    'Original reflections never modified',
    'Builder layer can create custom lenses',
  ],
};

export const FORK_LICENSE: License = {
  id: 'fork-v1',
  name: 'Constitutional Fork License',
  version: '1.0.0',
  scope: 'fork',
  fullText: `# Constitutional Fork License v1.0.0

## What Forks Are

A **constitutional fork** is a variant of The Mirror's governing rules.

When you enter a fork:
- Different rules apply
- AI behavior changes
- New constraints may emerge
- Core invariants still hold

### Core Invariants (Cannot Change)

Even in forks, these remain:
1. User sovereignty (Article 1)
2. Epistemic humility (Article 2)
3. No coercion (Article 3)
4. Crisis priority (Article 4)
5. Explicit consent (Article 5)
6. Reversibility (Article 6)
7. Local-first architecture (Article 7)

**You cannot fork away your sovereignty.**

### What CAN Change in Forks

- Language and terminology
- Pattern recognition rules
- Mirrorback framing
- UI emphasis (e.g., grief fork removes time refs)
- Worldview defaults
- Response protocols

## Entering a Fork

When you enter a fork, you see:

**Fork Entry Instrument** showing:
- Fork name and description
- Creator and creation date
- All rule changes (compared to main)
- Impact level (low, medium, high)
- Recognition status
- Active constitutions and licenses

You must explicitly click **"Enter Fork"** to proceed.

## Inside a Fork

While in a fork:
- **Red banner** shows active fork name
- **"Exit Fork" button** always visible (top-right)
- Rules operate according to fork constitution
- Receipts show fork context
- Data is tagged with fork ID

## Exiting a Fork

To exit:
1. Click **"Exit Fork"** (always visible)
2. You return to main context immediately
3. Fork rules stop applying
4. Your fork history is saved (can re-enter)

**No confirmation required.** Exit is instant.

## Fork Recognition Levels

Forks have recognition status:

### Recognized
- Verified by governance
- Rules audited for safety
- Creator known and trusted
- Safe to use

### Conditional
- New fork, under review
- Rules seem safe but unverified
- Use with caution

### Suspended
- Governance review in progress
- Reported issues exist
- Entry allowed but warned

### Revoked
- Violates core invariants
- Unsafe or exploitative
- Entry blocked

## Creating Forks (Builder Layer)

In Builder layer, you can create your own forks:

1. **Fork the constitution** (create variant)
2. **Modify amendable articles** (not core invariants)
3. **Test in sandbox** (private testing)
4. **Publish fork** (make available to others)
5. **Submit for recognition** (governance review)

### Fork Creation Rules

Your fork may not:
- ❌ Violate core invariants
- ❌ Hide its rule changes
- ❌ Claim to be "main" constitution
- ❌ Impersonate official forks
- ❌ Create engagement traps

Your fork must:
- ✓ Disclose all rule changes
- ✓ Show impact levels
- ✓ Provide exit path
- ✓ Declare creator
- ✓ State recognition status

## Fork Scope

Forks can be:

**Private** - Only you can enter  
**Shared** - Invite-only group  
**Public** - Anyone can enter  

## Data in Forks

Your data in a fork:
- Tagged with fork ID
- Exported with fork metadata
- Portable to other forks
- Deletable separately from main

Exiting a fork does NOT delete fork data. You can:
- Delete fork data specifically
- Export fork data separately
- Re-enter fork to access data

## Governance

Forks are governed by:
- Constitutional audits (core invariant compliance)
- Community reporting (safety issues)
- Creator accountability
- Recognition process

## Consent

By entering a fork, you acknowledge:
- Different rules will apply
- AI behavior may change
- You can exit at any time
- Core invariants still protect you
- Fork data is tagged separately`,
  implications: [
    'Forks can modify amendable rules only',
    'Core invariants always apply',
    'Exit always visible and instant',
    'Fork data tagged separately',
    'Recognition status shows safety level',
  ],
};

export function getLicensesForLayer(layer: 'sovereign' | 'commons' | 'builder'): License[] {
  const licenses = [CORE_LICENSE];
  
  if (layer === 'commons') {
    licenses.push(COMMONS_LICENSE);
  } else if (layer === 'builder') {
    licenses.push(BUILDER_LICENSE);
  }
  
  return licenses;
}

export function getLicenseById(id: string): License | null {
  const all = [CORE_LICENSE, COMMONS_LICENSE, BUILDER_LICENSE, EXPORT_LICENSE, WORLDVIEW_LICENSE, FORK_LICENSE];
  return all.find(l => l.id === id) || null;
}