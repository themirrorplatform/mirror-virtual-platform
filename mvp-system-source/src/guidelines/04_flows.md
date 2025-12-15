# User Flows — The Mirror

## Core Philosophy
- Users are never "onboarded" — they discover through presence
- System never prescribes next actions
- All flows are interruptible and resumable
- User can navigate away at any time without loss

---

## Entry Flow

### First Entry
**What happens:**
1. User sees OnboardingScreen (exists)
2. Chooses mode: Sovereign / Commons / Builder
3. Lands in **Mirror realm** (not World, not settings)

**Why Mirror first:**
- Establishes private reflection as primary
- No pressure to "set up profile" or "connect"
- Silence-first experience

**What NOT to do:**
- Don't show tutorial overlay
- Don't force profile completion
- Don't ask for permissions upfront
- Don't show "tour" popups

---

## Mirror Flow (Private Reflection)

### Primary Path: Write → Reflect → Archive/Thread

**Step 1: Enter Mirror**
- User sees centered text field
- Empty state: "..." (no instructions)
- Cursor blinks slowly

**Step 2: Write**
- User begins typing
- Text grows vertically (never boxed)
- Markdown allowed, never required
- Auto-saves to local draft

**Step 3: Generate Mirrorback (Optional)**
- InlineActionBar appears on pause/selection
- User clicks "Reflect" icon
- Mirrorback generates below text
- Clearly labeled and distinguished

**Step 4: Save / Archive / Link**
- Save: adds to Archive
- Archive: saves and removes from active view
- Link to Thread: prompts thread selection/creation

**Alternative Paths:**
- User can navigate away mid-writing (draft persists)
- User can skip Mirrorback entirely
- User can edit/regenerate Mirrorback
- User can hide Mirrorback and save only their text

---

## Threads Flow (Evolution Over Time)

### Primary Path: View Threads → Open Thread → Add Reflection

**Step 1: Navigate to Threads**
- User sees ThreadList (vertical timeline)
- Existing threads shown (if any)
- Empty state: "No threads yet" (silent)

**Step 2: Create Thread**
- User clicks "New Thread"
- Prompted to name it
- No default name ("Thread 1"), user must choose
- Thread created, opens to detail view

**Step 3: Add to Thread**
- From Mirror: select "Link to Thread"
- Choose thread or create new
- Reflection becomes node in thread

**Step 4: View Thread Evolution**
- Nodes appear in chronological order
- Tension markers show recurring patterns
- Contradiction markers glow between opposing nodes
- User can collapse/expand time ranges

**Step 5: Rename / Archive Thread**
- Thread names are editable anytime
- Archiving hides thread (doesn't delete)
- Deletion requires confirmation → undo window

---

## World Flow (Witnessing / Social)

### Primary Path: View Feed → Witness → Respond

**Step 1: Navigate to World**
- User sees WorldFeed (temporal order by default)
- Posts from other users (if Commons enabled)
- Empty state: "World is quiet" (if no content)

**Step 2: View Options**
- Toggle: Temporal / Resonance / Silence-weighted / Random
- No infinite scroll (pagination)
- No algorithmic ranking by default

**Step 3: Witness a Post**
- Click "Witness" (not "Like")
- Simple acknowledgment, no counter shown
- Witnessing is private (only user sees what they witnessed)

**Step 4: Respond to Post**
- Click "Respond"
- System asks: "What part of this are you responding to?"
- User can quote specific text
- Slows reaction, encourages reflection

**Step 5: Manage World Visibility**
- User can opt out of World entirely
- Can control who sees their posts
- Can disconnect without losing data

**What NOT to do:**
- Don't show "recommended" posts first
- Don't show follower/like counts
- Don't prompt "invite friends"
- Don't use engagement metrics to rank content

---

## Archive Flow (Memory)

### Primary Path: Browse Time → Compare Then/Now

**Step 1: Navigate to Archive**
- User sees ArchiveTimeline (chronological)
- All saved reflections shown
- Time slider for quick navigation

**Step 2: Search (Optional)**
- Semantic search if AI connected
- Keyword search fallback
- Results show context, not just matches

**Step 3: Open Reflection**
- View full text + Mirrorback (if exists)
- See which thread it belongs to (if any)
- Option to edit, archive, or delete

**Step 4: Compare Then/Now**
- Select two reflections
- Side-by-side view
- Dates and context preserved
- Shows evolution, not "improvement"

**Step 5: Export / Delete**
- Export: all formats (JSON, Markdown, PDF)
- Delete: confirmation → undo window → permanent deletion

---

## Self Flow (Identity & Sovereignty)

### Primary Path: Define Identity → Control Data

**Step 1: Navigate to Self**
- User sees identity overview
- Axes shown as user-defined fields (not fixed categories)

**Step 2: Edit Identity Axes**
- Click to edit any axis
- Rename labels
- Change values
- Example: "Wealth: Uncertain / Curious / Resistant"
- No "save" button (edits apply immediately)

**Step 3: View Data Sovereignty**
- What exists (clear inventory)
- Where it lives (local / cloud / encrypted)
- How to export (one-click options)
- How to delete (with consequences explained)

**Step 4: Manage Consent**
- Explicit controls for all data usage
- Opt-in for Commons
- Opt-in for AI training (if ever)
- Opt-in for analytics (if user chooses)

**Step 5: Access Nested Settings**
- Accessibility (existing)
- Boundaries (existing)
- Devices & Sync (existing)
- Model Integrity (existing)

---

## Crisis Flow (Always Available)

### Emergency Path: Crisis Button → Resources → Resume

**Step 1: User Activates Crisis Mode**
- Click crisis button (available in nav)
- CrisisModal opens immediately
- Ambient changes to red glow

**Step 2: Crisis Resources**
- External hotlines (not AI mediation)
- Local support information
- Option to pause reflection
- No tracking of crisis activation

**Step 3: Exit Crisis Mode**
- User exits when ready
- No questions asked
- Returns to previous view
- No "follow-up" messages

---

## Refusal Flow (Constitutional Boundaries)

### When Mirror Refuses

**Scenario:** User asks Mirror to do something outside constitutional boundaries (persuade, optimize, advise)

**Step 1: Detect Boundary**
- System recognizes request type
- Determines refusal category (constitutional, safety, capacity)

**Step 2: Show RefusalModal**
- Explain which principle applies
- Explain why refusal occurred
- Show allowed alternatives
- No blame language ("You shouldn't ask that")

**Step 3: Offer Alternatives**
- "Reflect on what you notice about the decision"
- "Explore the tension between different parts of yourself"
- User chooses or dismisses

**Step 4: Log Refusal (If Enabled)**
- Transparency logs in diagnostics
- User can review refusal history
- Can amend constitution if desired (fork/governance)

---

## Navigation Principles

### Global Rules
1. User can navigate away at any time
2. State persists (drafts, scroll position, filters)
3. No "unsaved changes" warnings (auto-save)
4. Navigation is instant (no loading for realm switch)
5. Back button works (browser history)

### Realm Entry Points
- **Mirror:** Default entry (after onboarding)
- **Threads:** From Mirror ("Link to Thread") or direct nav
- **World:** User must enable Commons first
- **Archive:** Always available
- **Self:** Always available

### Mobile Differences
- One realm at a time (no sidebar)
- Bottom nav or hamburger menu
- Fewer controls visible (progressive disclosure)
- No feature loss, only pacing
