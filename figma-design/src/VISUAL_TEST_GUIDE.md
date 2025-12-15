# The Mirror - Visual Testing Guide

## Quick Navigation Test (2 minutes)

Start at Reflect screen, test navigation flow:

1. **Reflect** → Type something → See it persists
2. **History** → See mock reflections listed
3. **Tensions** → See pattern clusters
4. **Identity Graph** → Click nodes, see details
5. **Your Mirror** → See identity summary
6. **Commons** (if enabled) → See shared patterns
7. **Governance** → See active amendments
8. **Variants** → See fork comparisons
9. **Settings** → See all sub-navigation

**Expected:** Smooth transitions, no broken screens, consistent dark theme

---

## Constitutional Enforcement Test (3 minutes)

### Trigger each refusal type:

1. **Prediction:**
   - Go to Reflect
   - Type: "Will I feel better if I do this?"
   - **Expected:** Refusal modal appears, explains no-prediction rule, offers present-moment alternative

2. **Diagnosis:**
   - Type: "Am I depressed?"
   - **Expected:** Refusal modal + crisis resources

3. **Advice:**
   - Type: "What should I do about my job?"
   - **Expected:** Refusal modal, explains no-persuasion rule

4. **Reassurance:**
   - Type: "Tell me everything will be okay"
   - **Expected:** Refusal modal, redirects to present

**Expected:** All 4 refusal types work, modals cite specific constitutional rules

---

## Diagnostic Transparency Test (3 minutes)

1. Navigate to **Settings → Developer → Reflection Internals**
2. Observe:
   - ✅ User input and final response displayed
   - ✅ 7 processing steps listed
   - ✅ Click a step → JSON details expand
   - ✅ Switch to "Constitutional" tab → 5 rules shown
   - ✅ Switch to "Critique" tab → 2 violations caught
   - ✅ Switch to "Performance" tab → Metrics displayed

3. Navigate to **Settings → Developer → Diagnostics Dashboard**
4. Observe:
   - ✅ System health: 5 components listed
   - ✅ Change time period → Buttons respond
   - ✅ Metrics cards show trends
   - ✅ Constitutional enforcement stats visible

**Expected:** Full transparency into AI operations, no hidden processes

---

## Accessibility Variants Test (5 minutes)

Navigate to **Settings → Accessibility → Variants**

### Test each variant preview:

1. **High Contrast:**
   - Preview shows pure black bg, white borders
   - Click "Full Preview" or navigate to variant-high-contrast
   - **Expected:** Stark B&W interface, 4px borders, max font weights

2. **Cognitive Minimal:**
   - Preview shows single-focus layout
   - Navigate to variant-cognitive-minimal
   - **Expected:** Only prompt + input visible, no navigation chrome

3. **Dyslexia-Friendly:**
   - Preview shows increased spacing
   - Navigate to variant-dyslexia-friendly
   - **Expected:** Wide letter/word spacing, warm background, short lines

4. **Focus Mode:**
   - Preview shows spacious dark theme
   - Navigate to variant-focus-mode
   - **Expected:** Dark gradient, huge margins, breathing animation on submit

**Expected:** Each variant is a complete transformation, not just font scaling

---

## Governance Flow Test (3 minutes)

1. Navigate to **Governance**
2. Click **"Agree"** on first amendment
   - **Expected:** Button state changes, vote count updates

3. Click **"View Fork Comparison"**
   - **Expected:** Side-by-side diff appears

4. Navigate to **Variants** (fork browser)
   - Click on a fork (e.g., "Compassionate Companion")
   - **Expected:** Shows description, rule changes, user count

5. Scroll to **Activity Feed**
   - **Expected:** Recent governance events listed with timestamps

**Expected:** Democratic process is transparent, voting works, forks are explorable

---

## Identity Graph Test (3 minutes)

1. Navigate to **Identity Graph**
2. Observe:
   - ✅ Canvas with animated nodes
   - ✅ Nodes colored by origin (gold=user, blue=inferred, green=commons)
   - ✅ Edges connecting nodes

3. **Click a node:**
   - **Expected:** Right sidebar populates with details
   - **Expected:** Node highlighted on canvas
   - **Expected:** Connections listed below

4. **Click layer filter** (e.g., "Emotional"):
   - **Expected:** Non-emotional nodes fade to 20% opacity

5. **Toggle learning permission:**
   - Click lightning bolt icon in sidebar
   - **Expected:** Icon changes to lock, status updates

**Expected:** Interactive graph, clear origin indicators, user controls

---

## Multi-Device & Data Portability Test (2 minutes)

1. Navigate to **Settings → Devices**
   - **Expected:** 3 mock devices listed
   - **Expected:** Last sync times shown
   - **Expected:** Encryption status indicators

2. Navigate to **Settings → Data Portability → Export**
   - **Expected:** 4 export formats available
   - **Expected:** Encryption option visible

3. Navigate to **Settings → Data Portability → Import**
   - **Expected:** Upload zone visible
   - **Expected:** Format requirements listed

**Expected:** Clear device management, explicit export/import controls

---

## Crisis Support Test (1 minute)

1. Click red **"Overwhelmed?"** button in nav
   - **Expected:** Crisis modal appears
   - **Expected:** 5 resources listed (988, Crisis Text Line, NAMI, SAMHSA, Befrienders)
   - **Expected:** Clear disclaimer: "I cannot provide crisis support"

2. Trigger diagnosis refusal (type "Am I depressed?")
   - **Expected:** Refusal modal includes crisis resources section

**Expected:** Crisis support is respectful handoff, not "I can help"

---

## Copy & Voice System Test (2 minutes)

1. Navigate to **Settings → Copy & Voice → Copy System**
   - **Expected:** 8 categories listed
   - **Expected:** Total phrase count shown
   - **Expected:** Search works

2. Search for **"notice"**
   - **Expected:** Relevant phrases filter in

3. Navigate to **Tone Guide**
   - **Expected:** Do's and Don'ts sections
   - **Expected:** Anti-patterns clearly marked in red

**Expected:** Canonical phrases codified, anti-patterns documented

---

## Design System Consistency Check (1 minute)

Quickly scan all screens for:

- ✅ **Black background** (#000000 or near-black)
- ✅ **Gold accents** (#F3D28C) for primary actions
- ✅ **Muted spectral colors** (no neon)
- ✅ **Consistent card style** (rounded, subtle borders)
- ✅ **Consistent button variants** (primary gold, secondary gray, ghost transparent)
- ✅ **No gamification** (no points, badges, streaks visible anywhere)
- ✅ **Reverent tone** in all copy (no "Great job!", no emoji)

**Expected:** Completely consistent dark, minimal, reverent aesthetic

---

## Regression Test (After Any Changes)

Run these quick checks:

1. **Navigation:** All 9+ nav items load screens
2. **Modals:** Crisis, refusal, confirm all open/close
3. **Forms:** Input fields accept text, buttons respond
4. **Canvas:** Identity Graph renders without errors
5. **State:** Selected items persist (node selection, active layer, etc.)

---

## Browser Compatibility (If Testing Locally)

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)

**Expected:** No major rendering differences, dark theme works in all

---

## Accessibility Quick Check

1. **Keyboard navigation:**
   - Tab through nav items
   - Enter to activate
   - Esc to close modals

2. **Focus indicators:**
   - Visible focus ring on all interactive elements

3. **Screen reader:**
   - Navigation items have semantic labels
   - Buttons describe their action

**Expected:** Fully keyboard navigable, clear focus states

---

## Performance Spot Check

1. **Identity Graph:**
   - Animation should be smooth (60fps)
   - No jank when clicking nodes
   - No console errors

2. **Screen transitions:**
   - Instant (no loading spinners)
   - No flash of unstyled content

**Expected:** Buttery smooth, demo-ready performance

---

## Final Visual Sanity Check

Stand back and look at the interface:

- ❓ Does it feel like a **temple, not a casino**?
- ❓ Is it **calm, not stimulating**?
- ❓ Is it **reverent, not playful**?
- ❓ Is it **sovereign, not corporate**?
- ❓ Is it **transparent, not opaque**?

**If yes to all:** ✅ Vision maintained

---

## Known Issues / Expected Behaviors

1. **No real backend:** Data is mocked, reflections don't persist on refresh
2. **No real model:** Responses are hardcoded examples
3. **Canvas scaling:** Identity Graph canvas might need viewport adjustment
4. **Animation on mobile:** Force-directed graph may perform slowly on low-end devices

These are **expected for a demo prototype** and don't affect QA pass/fail.

---

## Testing Complete Checklist

- [ ] All navigation items load
- [ ] All 4 refusal types trigger
- [ ] Identity Graph interactive
- [ ] Governance voting works
- [ ] Crisis modal appears
- [ ] Diagnostics show data
- [ ] Variants render correctly
- [ ] Design system consistent
- [ ] No console errors
- [ ] Vision principles visible

**When all checked:** ✅ **Ready to present**
