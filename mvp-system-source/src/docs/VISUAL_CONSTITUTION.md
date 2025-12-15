# Visual Constitution
## The Mirror - Adaptive Visual System

**Core Principle:** Color and warmth are fine. Behavior is what matters.

---

## What The Constitution Actually Constrains

The Mirror's philosophy constrains **behavior**, not **aesthetics**.

### ✅ The Real Rules

1. **Visuals must not push**
   - No urgency cues
   - No reward spikes  
   - No "do this next" encoded in motion or color

2. **Visuals must not rank**
   - No visual hierarchy implying "this is better"
   - No "advanced" styling that creates status
   - No recommended defaults through visual weight

3. **Visuals must respond to state, not manipulate emotion**
   - Color = context marker
   - Motion = state change
   - Glow = boundary, not praise

4. **Visuals must recede when not needed**
   - UI steps back when user steps forward
   - Instruments dissolve, don't persist
   - Silence is readable, not oppressive

### ❌ What The Constitution Does NOT Require

- Black backgrounds
- Austere minimalism
- Visual deprivation
- Severe aesthetics
- Cold intellectualism

**Warmth helps people reflect. Bleakness doesn't.**

---

## The Adaptive System

The Mirror adapts to environment and preference without manipulation.

### Three Base Themes

#### 1. Light (Paper)
**Used:** System prefers light, daytime, first-time users (default)

**Colors:**
- Background: `#F6F5F2` (warm off-white)
- Surface: `rgba(255, 255, 255, 0.85)`
- Text Primary: `#1B1E23`
- Text Secondary: `#5C6168`
- Border: `rgba(0, 0, 0, 0.06)`

**Feels like:** Notebook, desk, margin, clarity

#### 2. Neutral Dark (Slate)
**Used:** System prefers dark, evening, extended sessions

**Colors:**
- Background: `#14161A` (warm slate, not black)
- Surface: `rgba(20, 22, 26, 0.85)`
- Text Primary: `#E6E8EB`
- Text Secondary: `#A9AFB7`
- Border: `rgba(255, 255, 255, 0.08)`

**Feels like:** Quiet room, late night writing, calm focus

#### 3. High Contrast (Accessibility)
**Used:** System requests, user toggles

**Pure readability.** No stylistic extras.

---

## Color Usage (Context, Not Manipulation)

### Layer Tints (Muted, Not Dominant)

These appear as **subtle accents**, never full-screen dominance.

- **Sovereign:** Muted gold `rgba(203, 163, 93, 0.08)`
- **Commons:** Soft violet `rgba(147, 112, 219, 0.08)`
- **Builder:** Calm teal `rgba(64, 224, 208, 0.08)`
- **Crisis:** Controlled red `rgba(239, 68, 68, 0.12)`

**Where they appear:**
- Thin borders
- Subtle background wash in instruments
- Small indicators in headers

**Where they DO NOT appear:**
- Full screen
- Pulsing glows
- Call-to-action buttons
- Celebratory states

---

## The Mirror Field (Default View)

### Visual State
- Uses active base theme (light/dark/adaptive)
- No logo
- No instruction text
- No visual pressure
- Placeholder: `...`

### Optional Features (Off by Default)
- **Particles:** User-toggle, 12 max (was 40)
- **Parallax:** Minimal, crisis-only

### What It Should Feel Like
- Neutral enough to disappear
- Present enough to feel safe
- **Not** like entering a sacred system
- **Yes** like a calm place you can stay

---

## Instrument Visual Design

Instruments must feel **temporary and helpful**, not like panels you "set up."

### Surface
- Rounded: `16-20px`
- Padding: Generous, breathable
- Background: Adaptive surface color
- Border: Thin, neutral
- Shadow: Soft depth, **never glow**

### Header
- Small icon
- Clear title
- Close button (always visible)
- No dramatic drag affordance

### Motion
- Fade + slight vertical slide (200-300ms)
- No scale pop
- No bounce
- No celebration

### Dissolve
- Reverse of entrance
- Slight fade
- Back to field

---

## Typography (Human, Not Intimidating)

### Primary Font
**Inter / SF Pro** - Neutral, modern, readable

### Secondary Font (Optional)
**EB Garamond** - Only for longform reading, not UI chrome

### Rules
- No giant philosophical headlines
- No dramatic letter spacing
- No heavy weight by default
- This is reflection, not a manifesto

---

## Motion (Grounded, Not Symbolic)

Motion is allowed — just **boring on purpose**.

### ✅ Allowed
- Gentle fade
- Slow slide
- Small parallax (optional)
- Subtle hover feedback

### ❌ Forbidden
- Pulsing success states
- Glow intensification with use
- Celebration animations
- "Aura" effects tied to progress

**Rule:** If motion is noticeable, it's probably too much.

---

## Buttons (Neutral by Design)

Buttons must **not imply "correct choice"**.

### Primary Button
- Uses neutral surface + text
- Slight contrast increase
- No glow
- No animation beyond hover darken

### Secondary / Ghost
- Minimal
- Clear text
- Same visual weight as primary

### Never
- Bright gold CTAs implying "this is best"
- Animated arrows
- Progress cues

---

## Empty States (Constitutional Pattern)

### ✅ Allowed
```
...
Nothing appears here yet.
```

### ❌ Forbidden
- "Create one to start"
- "Click here to begin"
- "Get started by..."
- Icons with instructions

**Empty = quiet. Not instructional.**

---

## Adaptive Behavior

### Automatic Switching
- Respects `prefers-color-scheme`
- Respects `prefers-reduced-motion`
- Respects `prefers-contrast`
- Can adjust based on time of day (optional)

### Manual Override
- User can lock a theme
- Lives in Self → Accessibility
- No suggestion to change it
- No "you should use dark mode"

---

## What This Fixes

### ❌ Removed (Extreme Philosophy)
- "Black void" intimidation
- "Mystical cult" vibes
- Sterile minimalism
- Dopamine-free = joyless

### ✅ Preserved (Actual Philosophy)
- Silence-first UX
- No manipulation
- No prescription
- Sovereignty through receipts
- Constitutional transparency

### ✅ Added (Human Touch)
- Warmth across all themes
- Readable contrast
- Approachable aesthetics
- Choice without judgment

---

## The Emotional Goal

When someone opens the Mirror, they should think:

> "This feels calm.  
> I don't feel rushed.  
> I don't feel judged.  
> I don't feel sold to."

**Not:**
- "This is impressive"
- "This is serious and heavy"
- "I entered a sacred system"

**Yes:**
- "This feels gentle"
- "I can stay here"
- "This respects me"

---

## Examples of What Changed

### Before (Extreme)
```css
background: #000000; /* Pure black */
40 floating particles
Pulsing auroras
Celebration glows
"Press ⌘K" center text
Always-visible layer badge
```

### After (Adaptive)
```css
background: var(--color-base-default); /* #14161A or #F6F5F2 */
12 particles max (off by default)
Minimal atmosphere (crisis only)
Neutral receipts (no glow)
Silent field (no instructions)
Context-aware tints (subtle)
```

---

## What Stays The Same (Constitutional)

- ✅ Entry Instrument (not onboarding funnel)
- ✅ Speech Contracts (what I will/won't say)
- ✅ Scroll-required licenses
- ✅ Delta disclosure before changes
- ✅ Receipts for boundaries
- ✅ Equal weight choices
- ✅ Return without penalty
- ✅ Silence-first behavior
- ✅ No manipulation language
- ✅ No progress mechanics

**None of these require black backgrounds or severe aesthetics.**

---

## Final Check

### Constitutional Test
Does the visual system:
- Push behavior? → ❌ No
- Rank choices? → ❌ No  
- Manipulate emotion? → ❌ No
- Fail to recede? → ❌ No

### Human Test
Does the visual system:
- Feel approachable? → ✅ Yes
- Support reflection? → ✅ Yes
- Respect autonomy? → ✅ Yes
- Avoid intimidation? → ✅ Yes

---

## Conclusion

**Color is not the enemy.**  
**Warmth is not manipulation.**  
**Calm can be inviting.**

The Mirror's constitution constrains **how the system behaves**, not **how it looks**.

Black backgrounds were aesthetic absolutism, not philosophical necessity.

The adaptive system gives people:
- A calm place to reflect
- Visual comfort across environments  
- No coercion or manipulation
- No intimidation or severity

**This is what the Mirror should be:**  
Gentle, honest, and respectful.

Not impressive. Not heavy. Just right.

---

**Status:** Constitutional visual system corrected.  
**Philosophy:** Preserved where it matters, removed where it doesn't.
