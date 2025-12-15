# Mirror Design System

## Existing Foundation
Use the existing Tailwind/CSS architecture in `/styles/globals.css`.
All tokens are already defined. Extend, never remove.

## Visual Identity

### Mood
"Midnight. Candlelight. Reflection on glass."

### Color Palette
**Base:**
- `--color-base-default: #000000` (true black, not dark gray)
- `--color-base-raised: #0B0B0D`

**Accents:**
- `--color-accent-gold: #CBA35D` (warm gold for focus)
- `--color-accent-gold-deep: #A17D3E`
- Muted spectral accents for context (blue/purple/red/green)

**Text:**
- Primary: `--color-text-primary: #F5F5F5` (warm ivory)
- Secondary: `--color-text-secondary: #C4C4CF`
- Muted: `--color-text-muted: #6C6F7A`

### Typography

**Primary (Reflection text):**
- Serif typeface (Garamond-like)
- For: user-written reflections, long-form content, identity text
- Generous line height (1.7–1.8)
- NOT for system UI

**Secondary (System text):**
- Sans-serif (Inter, already in use)
- For: labels, metadata, timestamps, buttons, navigation
- Current defaults in `globals.css` are correct

**Rules:**
- Never compress meaning for density
- Breathing space is a feature, not waste
- Reading column max-width: 680–760px for reflective text

### Motion

**Easing:**
- Slow, intentional transitions
- Use: `ease: [0.23, 1, 0.32, 1]` (existing in codebase)
- Duration: 0.3–0.5s for most transitions

**Forbidden:**
- Bounce effects
- Spring physics
- Gamified easing
- Attention-grabbing motion

**Rule:**
If motion is removed entirely, the system should still work.

### Layout

**Spacing:**
- Use existing spacing scale (`--spacing-1` through `--spacing-24`)
- Prefer large vertical breathing room
- Never wall-to-wall content

**Containers:**
- Reading column: max-w-2xl (680px) to max-w-3xl (760px)
- System UI: max-w-4xl (896px)
- Full-width only for spatial interfaces (graphs, timelines)

**Cards:**
- Background: `--color-surface-card`
- Border: `--color-border-subtle`
- Rounded: `--radius-md` (12px) or `--radius-lg` (16px)
- Hover: subtle border color change, NOT background change

## Component Principles

### Buttons
**3 levels only:**
1. Primary: gold accent, for main action
2. Secondary: border only, transparent bg
3. Ghost: text only, no border

**No:**
- Bright colors
- Multiple primary buttons in one context
- "Loud" states

### Forms
- Labels always visible (no floating-only labels)
- Placeholders are hints, not labels
- Error states are calm, not alarming

### Modals
- Rare; prefer inline panels or sheets
- Dark overlay, not opaque black
- Dismissible by default

### Empty States
- Silence, not instructions
- Examples: "..." or "Nothing appears here yet"
- Never: "Get started by..." or "Try adding..."

## Accessibility

All components must have:
- Focus states (visible, calm)
- Keyboard navigation
- ARIA labels where needed
- Sufficient color contrast (already in token system)

## Ambient Background System

Existing component: `/components/AmbientBackground.tsx`
- Context-aware color variants (default, crisis, commons, governance)
- Breathing glow orbs
- Slow animation
- Remain in place; do not add competing backgrounds
