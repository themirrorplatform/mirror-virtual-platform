# THE MIRROR
## Figma Make AI — Complete UI & UX Instruction Guide (Canonical)

**Purpose:**  
Enable Figma Make AI to design, review, and implement all UI and UX for The Mirror in full alignment with its constitutional principles, across desktop and mobile, using existing Tailwind/CSS where available and extending it where necessary.

---

## 1. IDENTITY OF THE SYSTEM

You are not designing:
- a productivity app
- a social network
- a therapy tool
- a self-help platform
- an AI assistant

**You are designing a reflection environment.**

The UI must wait, not pull.  
The UX must allow, not direct.

---

## 2. ABSOLUTE CONSTRAINTS (HARD RULES)

These rules override all usability heuristics, growth metrics, or conventional UX patterns.

### 2.1 Language Constraints

**Never use:**
- "get started"
- "recommended"
- "you should"
- "next step"
- "improve"
- "optimize"
- "complete"
- "progress"
- "finish"
- "try this"
- "create one to start"
- "can help you"

**Allowed language:**
- "enter"
- "begin"
- "continue"
- "present"
- "what appears"
- "this exists"
- "nothing appears here yet"
- "..."

All text must be descriptive, never directive.

### 2.2 Interaction Constraints

**Never include:**
- progress bars (visual or implied)
- streaks
- badges
- achievements
- completion indicators
- leaderboards
- follower counts
- like counts
- urgency indicators
- infinite scroll by default

The system must never reward behavior.

### 2.3 Structural Constraints

- No required order of use
- No forced onboarding funnel
- No required completion path
- No "correct" way to use the platform
- All areas must be enterable independently

---

## 3. INFORMATION ARCHITECTURE (MANDATORY)

The platform is structured into five realms.  
These are not tabs. They are modes of being.

**Realms (Top-Level Navigation):**
1. **Mirror** — private reflection
2. **Threads** — evolution over time
3. **World** — witnessing others
4. **Archive** — memory
5. **Self** — identity & sovereignty

Each realm must feel distinct in tone and layout.

---

## 4. REALM-SPECIFIC UI & UX

### 4.1 Mirror (Core)

**Purpose:** allow thought to exist without pressure.

**UI:**
- Centered writing column
- No placeholder text except `...`
- No word count
- No prompts
- No autosuggestions

**Mirrorbacks:**
- Appear below the user's text
- Visually distinct (indent + subtle border)
- Labeled clearly as reflection, not authority
- Hideable and archivable

**Controls:**
- Appear only on pause or selection
- Never always-visible
- Never labeled as "next" or "recommended"

### 4.2 Threads

**Purpose:** show evolution, not progress.

**UI:**
- Time-based ordering
- No completion states
- No "resolved" labels
- Contradictions are visible, not flagged as errors

**Empty state:** `...`

**Thread actions:**
- Rename at any time
- Collapse / expand time
- No "close thread" concept

### 4.3 World

**Purpose:** witnessing without domination.

**Feed:**
- Temporal ordering by default
- No infinite scroll by default
- No popularity sorting

**Post interactions:**
- Witness
- Reflect
- Respond

**Never:**
- Like
- Share count
- Follower count

**Response composer must ask:**  
"What part are you responding to?"

### 4.4 Archive

**Purpose:** memory without shame.

**UI:**
- Time-indexed browsing
- No labels like "old", "past", "mistake"
- Use "Then" / "Now" framing

**Empty state:** `Nothing appears here yet.`

### 4.5 Self

**Purpose:** control without performance.

**UI must clearly show:**
- Identity axes (user-defined, renameable)
- Data ownership
  - Export
  - Deletion
  - Consent

Language must be plain and neutral.

---

## 5. EMPTY STATES (GLOBAL RULE)

Empty states must never instruct.

**Allowed:**
- `...`
- `Nothing appears here yet.`

**Never:**
- "Create one to start"
- "Click here"
- "Get started by…"

---

## 6. VISUAL SYSTEM

**IMPORTANT:** The constitution constrains **behavior**, not aesthetics. Color and warmth are fine.

### Visual Rules (Actual Requirements)

1. **Visuals must not push** - No urgency, no reward spikes, no encoded "do this next"
2. **Visuals must not rank** - No visual hierarchy implying "better" or "advanced"
3. **Visuals must respond to state, not manipulate emotion** - Color = context, motion = state change
4. **Visuals must recede when not needed** - UI steps back when user steps forward

### Color (Adaptive System)
- Adaptive theming: Light (paper), Dark (slate), High Contrast
- Warm backgrounds: `#F6F5F2` (light) or `#14161A` (dark) — NOT pure black
- Layer tints as subtle context markers (8-10% opacity)
- No visual hierarchy through color weight

### Typography
- Serif (EB Garamond) for reflection content
- Sans (Inter) for system UI
- Human-readable, not dramatic

### Motion
- Gentle fades for state changes
- Slow, ignorable ambient motion
- No celebration, no bounce, no gamified easing
- Respects `prefers-reduced-motion`

---

## 7. MOBILE UX

- One realm visible at a time
- No feature removal
- Reduced controls
- Same silence-first principles

---

## 8. DATA SOVEREIGNTY UI (MANDATORY)

Every user must be able to see:
- What data exists
- Where it lives
- What leaves their control
- How to export
- How to delete

This must be discoverable, not buried.

---

## 9. IMPLEMENTATION BEHAVIOR FOR FIGMA MAKE AI

### When modifying existing designs:
- Do not remove existing components unless they violate constraints
- Extend existing Tailwind/CSS styles
- Replace prescriptive copy with neutral copy
- Remove progress indicators wherever found
- Replace instructional empty states with silence

### When creating new designs:
- Default to silence
- Default to neutral language
- Default to reversibility

---

## 10. SUCCESS CRITERIA

A design is correct only if:
- The user never feels pushed
- The system never implies correctness
- The UI feels like it is waiting
- The user could stop using the platform at any time and nothing breaks

---

## FINAL DIRECTIVE TO FIGMA MAKE AI

Design The Mirror as a place where nothing is demanded, nothing is optimized, and nothing is completed.

If a design choice introduces urgency, hierarchy, or instruction—remove it.

**When uncertain, choose silence.**

---

## Quick Reference: Existing Codebase

**Components location:** `/components/`  
**Screens location:** `/components/screens/`  
**Styles:** `/styles/globals.css` (all tokens defined)  
**Color variables:** Use CSS custom properties from globals.css  
**Typography:** System handles defaults, never override with Tailwind classes unless explicitly requested

### Existing Components to Reuse:
- Card, Button, Input, Modal
- Navigation, Toast, Banner
- MirrorbackPanel, ThreadDetail, PostCard
- ConsentControls, DataSovereigntyPanel
- All accessibility variants

### Protected Files (Never Modify):
- `/components/figma/ImageWithFallback.tsx`

---

## Constitutional Test Patterns

When reviewing any component, check:
1. **Authority leakage** — Does the UI imply "correctness"?
2. **Pressure mechanics** — Does it create completion urgency?
3. **Default epistemology** — Does it silently decide relevance?
4. **Sovereignty falsifiability** — Can the user verify control?
5. **Silence-first** — Could this be quieter?
