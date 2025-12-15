# The Mirror - Complete User Experience Flow

## Platform: Any (Web-based, works everywhere)

---

## 1. FIRST LAUNCH (New User)

### Step 1: Welcome Screen
**Visual:**
- Pure black background (#000000)
- 20 floating gold particles drifting upward
- Large gold-ringed mirror emoji (🪞) slowly rotating (20s)
- Gold glow radiating from center

**Content:**
- Title: "Welcome to The Mirror"
- Subtitle: "A sovereign intelligence for reflection"
- Tagline: "..."
- Button: "Enter" (gold, with arrow icon)

**Interactions:**
- Particles drift eternally
- Logo rotates continuously
- Button has hover scale (1.05x) and tap scale (0.95x)
- Smooth fade-in animations (staggered by 0.2s delays)

**Duration:** User-controlled (can proceed immediately)

---

### Step 2: Principles Screen
**Visual:**
- 3 feature cards with icons and descriptions
- Cards animate in sequentially (0.15s delays)
- Gold accent borders on hover

**Cards:**
1. **Sovereign** (Lock icon)
   - "Your data never leaves your device unless you explicitly choose"
   
2. **Reflective** (Eye icon)
   - "The Mirror shows, it never directs or optimizes"
   
3. **Constitutional** (Sparkles icon)
   - "Governed by principles that protect you from manipulation"

**Buttons:**
- "Back" (ghost style, left)
- "Continue" (primary gold, right with arrow)

**Interactions:**
- Back button returns to welcome
- Continue proceeds to mode selection
- Cards have subtle lift on hover

---

### Step 3: Mode Selection
**Visual:**
- 3 large selection cards
- Selected card glows with category color
- Radio button on right animates on selection

**Modes:**

1. **Sovereign** (Shield icon, Gold glow)
   - Complete privacy
   - Features:
     - All processing on your device
     - Zero data sharing
     - Full control
     - Enable Commons later if desired

2. **Sovereign + Commons** (Globe icon, Violet glow)
   - Private + Collective
   - Features:
     - Everything from Sovereign
     - Contribute anonymized patterns
     - Receive evolution proposals
     - Collective learning

3. **Builder** (Wrench icon, Cyan glow)
   - Experimental
   - Features:
     - Access experimental features
     - Fork and test variants
     - Sandbox mode
     - Direct learning controls

**Interactions:**
- Click card to select
- Card scales to 1.02 on hover, 0.98 on tap
- Selected card gets border glow and background tint
- Radio button fills with category color
- Can change selection before proceeding

**Buttons:**
- "Back" → Principles screen
- "Continue" → Constitution screen

---

### Step 4: Constitution Preview
**Visual:**
- 5 principle cards with checkmarks
- Gold borders and soft backgrounds
- Informational footer about accessing full constitution

**Principles:**
1. The Mirror serves you, never a platform
2. Reflection without judgment or agenda
3. Your sovereignty is absolute
4. No gamification or manipulation
5. Silence over prescription

**Interactions:**
- Each principle fades in with stagger (0.1s)
- Checkmark icons pulse subtly
- Info card explains "⌘K → constitution" access

**Buttons:**
- "Back" → Mode selection
- "I Understand" → Ready screen

---

### Step 5: Ready Screen
**Visual:**
- Large checkmark icon in gold circle
- Pulsing glow effect
- Confirmation of chosen mode

**Content:**
- "You're Ready"
- "You've chosen [Mode Name]"
- Hint: "Press ⌘K anytime to summon instruments"

**Button:**
- "Begin Reflection" (large, gold, centered)

**Interactions:**
- Checkmark scales in with spring animation
- Final celebration moment
- Button press transitions to main app

---

## 2. MAIN INTERFACE (Post-Onboarding)

### The Field (Background Environment)

**Visual Layers:**

1. **Deep Space** (z-0)
   - Pure black (#000000)
   - 200 tiny stars (0.5-2px)
   - Stars pulse individually (3-7s cycles)
   - Parallax effect on mouse movement (-20px to +20px)

2. **Grid Layer** (z-1)
   - Subtle grid lines (80px spacing)
   - Opacity: 3%
   - Color: Current layer color
   - Parallax movement (half speed of stars)

3. **Constellation Layer** (z-2)
   - Lines connecting nearby particles (<15% distance)
   - Animated opacity (0 → 0.2 → 0, 6s cycles)
   - Staggered delays (0.2s per line)

4. **Particle Layer** (z-3)
   - 40 floating particles (1-3px)
   - Rise from bottom to top
   - Opacity fade: 0 → 0.8 → 0
   - Scale animation: 0.5 → 1.5 → 0.5
   - Speed: 10-20s per complete cycle
   - Color: Current layer color with glow

5. **Atmosphere Layer** (z-4)
   - Radial gradient from center
   - Breathing animation (8s cycle)
   - Opacity: 0.5 → 0.8 → 0.5
   - Changes with layer (gold/violet/cyan)

6. **Mouse Reactive Layer** (z-5)
   - Radial gradient follows mouse
   - Smooth transition (0.3s ease-out)
   - Creates ambient light effect

7. **Aurora Layer** (z-6, when instruments active)
   - Top-down gradient
   - Waves slowly (5s cycle)
   - Intensifies with instrument count

8. **Vignette** (z-top)
   - Radial gradient to black
   - Darkens edges
   - Creates depth perception

**Layer Colors:**
- **Sovereign:** Gold `rgba(203, 163, 93, 0.15)`
- **Commons:** Violet `rgba(147, 112, 219, 0.15)`
- **Builder:** Cyan `rgba(64, 224, 208, 0.15)`
- **Crisis:** Red `rgba(239, 68, 68, 0.2)` (overrides all)

**Layer Indicator:**
- Top-left badge
- Rounded pill shape
- Glass morphism backdrop
- Border in layer color
- Pulsing glow (3s cycle)
- Hover: scales to 1.05, increases glow

---

### On-Screen Elements (Initial State)

**Bottom-Right Corner:**
```
⌘K  Instruments
⌘⇧C Crisis
```
- Small text (12px)
- Muted color
- Keyboard shortcuts in boxes with subtle borders
- Always visible except when command palette open

**Center (No Instruments):**
```
Press ⌘K to summon an instrument
```
- Centered text
- Fades in after 1s
- Disappears when first instrument opens

**Initial Instrument:**
- "Mirror" (reflection input) automatically loaded
- Positioned center
- 600x600px default size
- Can be dragged, minimized, closed

---

## 3. COMMAND PALETTE (⌘K)

### Activation
**Triggers:**
- Keyboard: `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- Focus shifts to search input automatically

### Visual
- Center of screen
- Glass morphism panel: `bg-[#0a0a0a]/95` with `backdrop-blur-2xl`
- Rounded: 24px
- Border: white 10% opacity
- Shadow: Large ambient shadow
- Width: 600px max
- Max height: 70vh

**Structure:**
```
┌─────────────────────────────┐
│  🔍 [Search input...]       │ ← Auto-focused
├─────────────────────────────┤
│  Recent ────────────────    │ ← If has recents
│  • Item 1        [Active]   │
│  • Item 2                   │
│                             │
│  Input Instruments ─────    │ ← Category headers
│  • Mirror                   │
│  • Voice Reflection         │
│                             │
│  [... more categories]      │
├─────────────────────────────┤
│  ↑↓ Navigate • ↵ Select     │ ← Footer hints
│  Esc Close                  │
└─────────────────────────────┘
```

### Search Input
- Placeholder: "Search instruments..."
- No border
- Large text (18px)
- Gold cursor
- Clears on Esc
- Auto-focuses on open

### Results
**Categories (in order):**
1. Recent (if any, max 5)
2. Input Instruments
3. Reflection & AI
4. Threads & Time  
5. Identity
6. Commons & World
7. Crisis Support
8. Constitutional & Builder
9. Data Sovereignty

**Each Result:**
- Icon (20px, category color)
- Title (primary text)
- Description (secondary, smaller)
- Keyboard shortcut (if any)
- "Active" badge (if already open)
- Left border accent (4px, category color, appears on hover/selection)

### Interactions
- **Hover:** 
  - Background lightens
  - Left border appears (category color)
  - Cursor: pointer

- **Keyboard Selection:**
  - Up/Down arrows navigate
  - Selected item has background + border
  - Scrolls to keep selected visible

- **Enter:** 
  - Selects current item
  - Closes palette
  - Opens/focuses instrument
  - Adds to recent instruments

- **Esc:** 
  - Closes palette
  - Clears search if not empty
  - Second Esc closes palette

- **Click Outside:** 
  - Closes palette

### Animations
- **Open:** 
  - Fade in opacity: 0 → 1 (200ms)
  - Scale: 0.95 → 1 (200ms)
  - Blur background

- **Close:**
  - Fade out: 1 → 0 (150ms)
  - Scale: 1 → 0.95 (150ms)

- **Results:**
  - Stagger in: 30ms delay each
  - Fade + slide from left

---

## 4. INSTRUMENTS (Floating Panels)

### Draggable Instrument Anatomy

**Header** (64px height):
```
┌──────────────────────────────────────┐
│ ⊕ [Icon] Title           ─ □ ✕       │ ← Draggable area
└──────────────────────────────────────┘
```
- **Move Icon (⊕):** Rotates 360° while dragging
- **Category Icon:** Colored circle with icon
- **Title:** Primary text
- **Minimize (─):** Sends to dock
- **Maximize (□):** Fullscreen toggle
- **Close (✕):** Removes instrument, rotates 90° on hover

**Content Area:**
- Scrollable (custom gold scrollbar)
- Padding: 24px
- Full instrument functionality

**Border:**
- 2px solid category color
- Glow: `0 0 40px [category-color]`
- Increases to 60px while dragging

**Background:**
- `bg-[#0a0a0a]/95`
- `backdrop-blur-2xl`
- Slight gradient overlay

**Resize Handle** (bottom-right):
- 32x32px triangular area
- Semi-transparent category color gradient
- Cursor: `se-resize`
- Visible on hover

### Dragging Behavior
- **Grab:** Click header
- **Drag:** Free movement within viewport
- **Constraints:** Cannot drag outside window
- **Momentum:** None (stops on release)
- **Snap:** None (free positioning)
- **Z-Index:** Brings to front (z:100) while dragging
- **Shadow:** Intensifies while dragging
- **Saved:** Position saved to localStorage

### Stacking (Z-Order)
- Click any instrument → brings to front
- Active instrument: z-index 100
- Others: z-index 30
- Brief animation (100ms)

### Maximized State
- Expands to window size - 64px margin
- Remembers previous position
- Toggle button becomes "Minimize to Window"
- No dragging allowed
- Resize handle hidden

### Animations
- **Open:** 
  - Opacity: 0 → 1
  - Scale: 0.9 → 1  
  - Y: 20px → 0
  - Duration: 400ms
  - Easing: [0.23, 1, 0.32, 1]

- **Close:**
  - Reverse of open
  - 400ms duration

- **Drag Start:**
  - Glow intensifies
  - Shadow deepens
  - Move icon rotates

- **Drag End:**
  - Glow returns to normal
  - Shadow lightens
  - Move icon returns to 0°

---

## 5. EVERY BUTTON STATE

### Primary Button (Gold)

**Default:**
- Background: `var(--color-accent-gold)`
- Text: Black
- Shadow: `0 0 20px rgba(203, 163, 93, 0.3)`
- Rounded: 16px
- Padding: 12px 24px

**Hover:**
- Scale: 1.02
- Shadow: `0 0 30px rgba(203, 163, 93, 0.5)`
- Cursor: pointer
- Transition: 200ms

**Active (Press):**
- Scale: 0.98
- Ripple effect from center
- Ripple: white 30% opacity, expands from 0 to full in 400ms

**Disabled:**
- Opacity: 50%
- Cursor: not-allowed
- No hover effects
- Greyed appearance

**Loading:**
- Spinner icon (rotating)
- Text remains visible
- Disabled state
- Spinner: 360° rotation, 1s linear infinite

### Secondary Button

**Default:**
- Background: `var(--color-surface-card)`
- Border: 1px solid white 10%
- Text: Primary color

**Hover:**
- Border: white 20%
- Background: slightly lighter
- Shadow: `0 0 20px rgba(255, 255, 255, 0.1)`

**States:** Same as Primary

### Ghost Button

**Default:**
- Background: transparent
- Text: Secondary color
- No shadow

**Hover:**
- Text: Primary color
- Background: white 5%

**States:** Same as Primary (without shadow/glow)

### Icon Button

**Default:**
- Square: 40x40px
- Rounded: 12px
- Icon: 18px
- Background: transparent or subtle

**Hover:**
- Scale: 1.1
- Background: white 10%

**Active:**
- Scale: 0.95

**Example:** Close button (✕)
- Hover: Rotates 90°, red tint
- Active: Scale 0.95

---

## 6. EVERY CARD VARIANT

### Standard Card

**Visual:**
- Background: `rgba(255, 255, 255, 0.03)`
- Border: 1px white 10%
- Rounded: 16px
- Padding: 24px
- Backdrop blur: 10px

**Hover:** (if interactive)
- Border: white 20%
- Background: white 5%
- Lift: translateY(-2px)
- Shadow: ambient glow

### Selection Card (Mode cards, etc.)

**Unselected:**
- Border: white 10%
- Background: white 2%

**Selected:**
- Border: 2px category color
- Background: category color 15%
- Shadow: `0 0 30px [category-color]40`
- Radio indicator filled

**Hover:**
- Scale: 1.02

**Active:**
- Scale: 0.98

### Feature Card (Principles, etc.)

**Visual:**
- Icon box (56px) with category background
- Title + description
- Bullet points with colored dots

**Animation:**
- Stagger in on load
- Icon scales from 0
- Content fades in

### Reflection Card (in Archive/Threads)

**Structure:**
```
┌─────────────────────────────┐
│ [Timestamp]      [Actions]  │
│                             │
│ Preview text...             │
│                             │
│ [Thread tag] [Mirrorback ✓] │
└─────────────────────────────┘
```

**Hover:**
- Background lightens
- Actions fade in
- Border appears

**States:**
- Has Mirrorback: Sparkles badge
- In Thread: Thread name tag
- Selected: Gold border

---

## 7. INPUT FIELDS

### Text Input

**Default:**
- Background: `rgba(255, 255, 255, 0.05)`
- Border: 1px white 10%
- Rounded: 12px
- Padding: 12px 16px
- Text: Primary color
- Placeholder: Muted color

**Focus:**
- Border: Gold 60%
- Shadow: `0 0 20px rgba(203, 163, 93, 0.3)`
- Outline: none

**Filled:**
- Border: white 20%

**Error:**
- Border: Red
- Shadow: red glow
- Error message below (red text)

### Textarea (Reflection Input)

**Visual:**
- Minimal border
- Placeholder: "..."
- No word count (unless requested)
- Auto-expanding height

**Focus:**
- Gold border left side only (4px)
- Breathing glow

**Typing:**
- Smooth cursor animation
- Auto-save indicator (subtle)

### Search Input

**Visual:**
- Search icon left
- Clear button right (appears when filled)
- Borderless
- Background: transparent

**Focus:**
- Bottom border (gold)
- Icon color brightens

---

## 8. MODALS & OVERLAYS

### Modal Structure

**Backdrop:**
- Background: `rgba(0, 0, 0, 0.8)`
- Blur: 10px
- Fade in: 200ms

**Panel:**
- Center positioned
- Max width: 600px
- Background: `#0a0a0a`
- Border: white 10%
- Rounded: 24px
- Shadow: large ambient

**Header:**
- Icon + Title
- Close button (top-right)
- Bottom border

**Content:**
- Scrollable
- Padding: 32px

**Footer:**
- Action buttons
- Border top
- Right-aligned or spaced

**Animations:**
- Backdrop: opacity 0 → 1
- Panel: scale 0.9 → 1, opacity 0 → 1
- Close: reverse

---

## 9. TOAST NOTIFICATIONS

### Position
- Top-right corner
- Stacked vertically
- 16px gap

### Variant States

**Info:**
- Blue border/glow
- Info icon

**Success:**
- Green border/glow
- Checkmark icon

**Warning:**
- Yellow border/glow
- Alert icon

**Error:**
- Red border/glow
- X icon

### Animation
- Slide in from right
- Auto-dismiss: 4s (hovering pauses)
- Dismiss on click
- Slide out on close

---

## 10. LOADING STATES

### Spinner
- Circular
- Gold color
- Rotating 360° continuously
- Size: 16px (inline), 40px (page)

### Skeleton
- Shimmer effect
- Grey blocks
- Pulse animation

### Progress
- Never used (anti-pattern for The Mirror)

---

## 11. EMPTY STATES

### Allowed Patterns
- "..." 
- "Nothing appears here yet."

### Forbidden
- "Get started"
- "Create one"
- Any instruction

### Visual
- Centered
- Muted text
- Subtle icon (optional)
- No action buttons

---

## 12. ERROR STATES

### Error Boundary
- Full screen
- Error icon
- Message: "Something unexpected occurred"
- Button: "Reload" or "Return to Field"
- No technical details shown

### Form Errors
- Red border on field
- Error icon right side
- Error text below (small, red)
- Shake animation on submit

---

## 13. CRISIS MODE (⌘⇧C)

### Activation
- Keyboard: `⌘⇧C`
- Entire atmosphere shifts to red
- Pulsing glow (1.5s cycles)
- Crisis instrument auto-opens

### Visual Changes
- All particles turn red
- Field atmosphere: red
- Pulsing intensity
- Grid turns red
- Stars pulse faster

### Crisis Instrument
- Immediate resources
- Emergency contacts
- Grounding exercises
- No data collection
- Exit button always visible

### Exit
- Close crisis instrument
- Fade back to normal layer color
- 2s transition

---

## 14. KEYBOARD SHORTCUTS (Complete List)

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command Palette |
| `⌘⇧C` / `Ctrl+Shift+C` | Crisis Mode |
| `Esc` | Close Palette / Instruments |
| `↑` `↓` | Navigate Palette |
| `Enter` | Select in Palette |
| `⌘S` / `Ctrl+S` | Save (if applicable) |

---

## 15. MOBILE ADAPTATIONS

### Responsive Breakpoints
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

### Mobile Changes
- Command Palette: Full screen
- Instruments: Full screen (can't drag)
- Touch gestures: swipe to close
- Bottom nav: appears on mobile
- Single instrument at a time

---

## 16. ACCESSIBILITY

### Keyboard Navigation
- All interactive elements focusable
- Focus indicators (gold glow)
- Tab order logical
- Skip links available

### Screen Readers
- ARIA labels on all icons
- Semantic HTML
- Live regions for updates
- Descriptive alt text

### Color Contrast
- AAA rated throughout
- Never color-only indicators
- Text readable on all backgrounds

### Motion
- Respects `prefers-reduced-motion`
- Can disable particles
- Can disable animations

---

**This is the complete user experience of The Mirror.**
**Every interaction is intentional. Every element serves reflection.**
**Silence over noise. Sovereignty over extraction.**
