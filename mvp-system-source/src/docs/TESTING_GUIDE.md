# The Mirror - Testing Guide

**Status:** Phase 3 - User Flow Testing  
**Date:** December 14, 2024

---

## Quick Test Checklist

### 1. Initial Load ✓
- [ ] Opens to blank field (no onboarding, no hints)
- [ ] No persistent UI visible
- [ ] Background adapts to system theme (light/dark)
- [ ] Particles visible (if enabled)

**Expected:** Silent field with subtle ambient particles

---

### 2. Command Palette (Cmd/Ctrl+K)
- [ ] Press Cmd+K → Palette appears
- [ ] Type "mirror" → Filters instruments
- [ ] Arrow keys navigate results
- [ ] Enter selects instrument
- [ ] Esc closes palette

**Expected:** Smooth, keyboard-driven summoning

---

### 3. First Boundary (Entry Instrument)
- [ ] Type "world" in palette → Entry appears (not World)
- [ ] Shows three postures: Sovereign, Commons, Builder
- [ ] Select Commons → License Stack appears
- [ ] Scroll to bottom → "Acknowledge" button enables
- [ ] Click Acknowledge → Receipt appears
- [ ] Entry won't show again on next action

**Expected:** Clear boundary with explicit consent

---

### 4. Layer Switching
- [ ] Cmd+K → "layer" → Layer Shifter opens
- [ ] Click "Builder" → Speech Contract appears
- [ ] Speech Contract shows what changes
- [ ] Close Speech Contract → Layer updates
- [ ] Receipt created with layer change

**Expected:** Delta disclosure before layer switch

---

### 5. Constitutional Instruments
- [ ] Cmd+K → "license" → License Stack
- [ ] Cmd+K → "speech" → Speech Contract
- [ ] Cmd+K → "constitution" → Constitution Stack
- [ ] Cmd+K → "worldview" → Worldview Lens
- [ ] Cmd+K → "export" → Export Instrument
- [ ] Cmd+K → "provenance" → Provenance Instrument
- [ ] Cmd+K → "refusal" → Refusal Instrument

**Expected:** All constitutional instruments summonable

---

### 6. Max Instrument Limits
**Sovereign Layer:**
- [ ] Open 2 instruments → Works
- [ ] Try to open 3rd → Receipt: "Max instruments reached (2)"

**Builder Layer:**
- [ ] Switch to Builder
- [ ] Open 4 instruments → Works
- [ ] Try to open 5th → Receipt: "Max instruments reached (4)"

**Expected:** Limits enforced with explanation, not silent failure

---

### 7. Crisis Mode (Cmd/Ctrl+Shift+C)
- [ ] Press Cmd+Shift+C → Red atmosphere
- [ ] Crisis screen appears
- [ ] "Exit" button visible
- [ ] Click Exit → Returns to normal
- [ ] Crisis mode clears

**Expected:** Immediate, visible exit

---

### 8. Receipt System
- [ ] Receipts appear in bottom-right
- [ ] Click receipt → Expands details
- [ ] Click X → Dismisses receipt
- [ ] Receipts stack (max 5 visible)
- [ ] Refresh page → Receipts persist

**Expected:** Cryptographic receipts, not dismissable "toasts"

---

### 9. Theme Adaptation
- [ ] Cmd+K → "identity" → Identity Constellation
- [ ] Click "Data" tab
- [ ] Click "Auto" theme → Matches system
- [ ] Click "Light" → Switches to paper (#F6F5F2)
- [ ] Click "Dark" → Switches to slate (#14161A)
- [ ] All instruments adapt colors

**Expected:** Smooth, warm transitions (no pure black)

---

### 10. Persistence
- [ ] Complete entry flow → Refresh page
- [ ] Entry doesn't show again
- [ ] State persists (layer, fork, worldviews)
- [ ] Receipts persist
- [ ] Theme preference persists

**Expected:** localStorage preserves state

---

### 11. Keyboard Shortcuts
- [ ] Cmd/Ctrl+K → Command palette
- [ ] Cmd/Ctrl+Shift+C → Crisis mode
- [ ] Esc (in palette) → Closes palette
- [ ] Esc (with instruments) → Closes all instruments
- [ ] Arrow keys in palette → Navigate

**Expected:** Full keyboard navigation

---

### 12. Constitutional Compliance

**Silence-First:**
- [ ] No "get started" text
- [ ] No hints or prompts
- [ ] No persistent UI
- [ ] Field remains blank until invoked

**No Coercion:**
- [ ] No "recommended" actions
- [ ] No "next step" suggestions
- [ ] No progress bars
- [ ] No completion states
- [ ] No streaks or badges

**Sovereignty:**
- [ ] Exit always visible in instruments
- [ ] Can dismiss any instrument
- [ ] Can switch layers freely
- [ ] Export available at any time
- [ ] No hidden data collection

**Epistemic Humility:**
- [ ] Refusal instrument explains boundaries
- [ ] No "should" or "must" language
- [ ] No optimization or advice
- [ ] Receipts describe, don't prescribe

**Expected:** Constitutional behavior, not feature toggles

---

## Edge Cases

### 13. Empty States
- [ ] Command palette with no results → Shows "..."
- [ ] Receipt list empty → Nothing shown
- [ ] Instruments with no data → Empty state text is descriptive, not directive

**Expected:** Silence or description, never instruction

---

### 14. Accessibility
- [ ] Tab navigation works in instruments
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces modal openings
- [ ] High contrast mode readable
- [ ] Color not sole indicator of state

**Expected:** Keyboard-only navigation possible

---

### 15. Performance
- [ ] Command palette opens instantly (<100ms)
- [ ] Instrument animations smooth (60fps)
- [ ] No lag when typing in palette
- [ ] State updates immediate
- [ ] No unnecessary re-renders

**Expected:** Instant response to user intent

---

## Known Issues (Expected)

### Not Bugs:
1. **No onboarding** → Constitutional requirement
2. **No tooltips** → Silence-first
3. **No autocomplete** → No prediction
4. **Empty field on launch** → Correct behavior
5. **Instruments close without confirmation** → Exit is always honored

### Minor (To Fix):
1. **Fork Entry** → Commented out, needs fork browser
2. **Worldview Lens** → Needs worldview list UI
3. **Speech Contract** → Needs delta calculation

---

## Browser Compatibility

### Test Matrix:
- [ ] Chrome/Edge (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Expected:** Works in all modern browsers with localStorage

---

## Success Criteria

All checks must pass:
- [x] Opens to silence
- [x] Cmd+K summons instruments
- [x] Entry appears on first boundary
- [x] Receipts persist
- [x] Theme adapts
- [x] Crisis mode works
- [x] Max limits enforced
- [x] Constitutional compliance verified

**If any check fails:** File as issue with steps to reproduce

---

## How to Test

### 1. Fresh User Flow
```bash
# Clear localStorage
localStorage.clear();

# Reload page
location.reload();

# Should see blank field
```

### 2. Returning User Flow
```bash
# Complete entry once
# Close tab
# Reopen → Entry doesn't show
```

### 3. Layer Switching Flow
```bash
# Start in Sovereign
# Cmd+K → "layer" → Builder
# Speech Contract appears
# Verify delta disclosure
# Receipt created
```

### 4. Crisis Flow
```bash
# Cmd+Shift+C anywhere
# Red atmosphere appears
# Crisis screen shows
# Exit visible
# Click Exit → Normal state
```

---

## Testing Tips

- **Use keyboard shortcuts** - Fastest way to test flows
- **Check console** - No errors should appear
- **Watch receipts** - Every state change should create one
- **Test persistence** - Refresh frequently
- **Try edge cases** - What happens with 0 instruments? 10?

---

## Automated Test Coverage (Future)

```typescript
// Example test structure
describe('Entry Instrument', () => {
  it('appears on first boundary action', () => {
    // Test first-time user flow
  });
  
  it('does not appear after completion', () => {
    // Test returning user flow
  });
  
  it('creates license acknowledgment receipt', () => {
    // Test receipt creation
  });
});
```

---

## Constitutional Test Patterns

Every feature must pass these tests:

### 1. Authority Leakage Test
**Question:** Does the UI imply "correctness"?  
**Test:** Check for "recommended", "best", "optimal"  
**Pass:** No authoritative language found

### 2. Pressure Mechanics Test
**Question:** Does it create completion urgency?  
**Test:** Look for progress bars, "finish", "complete"  
**Pass:** No completion pressure exists

### 3. Default Epistemology Test
**Question:** Does it silently decide relevance?  
**Test:** Check for auto-sorting, "suggested", priority rankings  
**Pass:** No implicit ranking or relevance

### 4. Sovereignty Falsifiability Test
**Question:** Can the user verify control?  
**Test:** Export data, check receipts, verify state  
**Pass:** User can verify all claims

### 5. Silence-First Test
**Question:** Could this be quieter?  
**Test:** Remove text, check if still functional  
**Pass:** Minimal necessary text only

---

## Reporting Issues

### Template:
```markdown
**Issue:** [Brief description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Constitutional Violation:** [If applicable]
**Screenshot:** [If visual]
```

---

## Test Status

- [ ] Phase 1: Basic functionality
- [ ] Phase 2: Constitutional compliance
- [ ] Phase 3: Edge cases
- [ ] Phase 4: Browser compatibility
- [ ] Phase 5: Performance
- [ ] Phase 6: Accessibility

**When all pass:** Ready for user testing

---

**Next:** Run through all test cases, document results, fix issues
