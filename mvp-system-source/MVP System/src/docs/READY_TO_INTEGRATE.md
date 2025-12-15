# Ready to Integrate
## What I'd Adjust + What's Complete

**Date:** December 2024  
**Status:** Pre-integration adjustments documented  
**Priority:** Quick fixes → State → Wiring → Testing

---

## What I'd Adjust (Pre-Integration)

### 1. Adaptive Surface Colors (5 min)
**Issue:** Hardcoded `#0a0a0a` won't adapt to light theme

**Files to fix:**
- All 9 instrument components
- CommandPalette.tsx
- DraggableInstrument.tsx
- InstrumentDock.tsx
- ReceiptSystem.tsx

**Change:**
```tsx
// From:
className="bg-[#0a0a0a] border border-white/10"

// To:
className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
```

**Why:** Makes instruments adapt to light/dark themes automatically.

---

### 2. Motion Duration (2 min)
**Issue:** Mix of 200ms, 250ms, 300ms

**Fix:** Standardize to 250ms everywhere
```tsx
transition={{ duration: 0.25 }}
```

**Why:** Consistent feel, easier to maintain.

---

### 3. Remove Glow Variables (1 min)
**Issue:** Some CSS still references old `--glow-gold` tokens

**Fix:** Replace with context-appropriate colors
```tsx
// Instead of glow:
boxShadow: '0 0 60px var(--glow-gold)'

// Use subtle depth:
boxShadow: 'var(--shadow-medium)'
```

**Why:** Glows were part of the old "mystical" aesthetic.

---

### 4. Particle Count Enforcement (1 min)
**Issue:** MirrorField says "12 max" but doesn't enforce

**Fix:**
```tsx
{Array.from({ length: 12 }).map((_, i) => (...))}
// Already correct, just verify
```

**Why:** Constitutional limit (was 40).

---

## What's Already Complete

### ✅ Core Instruments (9 total)
1. EntryInstrument - First boundary moment
2. SpeechContractInstrument - "What I will/won't say"
3. LicenseStackInstrument - Scroll-required acknowledgment
4. ConstitutionStackInstrument - Read/diff/proposal
5. ForkEntryInstrument - Fork rule changes
6. WorldviewLensInstrument - Stackable lenses
7. ExportInstrument - Integrity receipts
8. ProvenanceInstrument - Trust primitives
9. RefusalInstrument - Boundary explanations

### ✅ State Management
- `/hooks/useMirrorState.ts` - Complete with all actions
- Persists to localStorage
- Receipt management included

### ✅ Keyboard Shortcuts
- `/hooks/useGlobalKeyboard.ts` - Cmd+K, Cmd+Shift+C, Esc

### ✅ Visual System
- Adaptive theming (light/dark/high-contrast)
- Layer tints (muted, contextual)
- Motion guidelines (gentle, purposeful)
- No manipulation aesthetics

### ✅ Documentation
- `/docs/USER_FLOW.md` - Complete UX flows
- `/docs/CONSTITUTIONAL_INSTRUMENTS.md` - Instrument catalog
- `/docs/BUILD_VERIFICATION.md` - Four-axis verification
- `/docs/VISUAL_CONSTITUTION.md` - Adaptive visual system
- `/docs/INTEGRATION_PLAN.md` - Step-by-step integration
- `/docs/ADAPTIVE_SYSTEM_COMPLETE.md` - Visual correction summary

---

## Integration Workflow

### Phase 1: Quick Fixes (30 min)
1. Replace all `bg-[#0a0a0a]` with `bg-[var(--color-surface-card)]`
2. Replace all `border-white/10` with `border-[var(--color-border-subtle)]`
3. Standardize motion to 250ms
4. Remove glow references

**Test:** Open each instrument, verify it looks good in light + dark

---

### Phase 2: Wire State (1 hour)
1. Import `useMirrorState` in App.tsx
2. Pass state to MirrorField, instruments, receipts
3. Test state persistence (refresh page, state should restore)
4. Test receipt creation (manually trigger actions)

**Test:** 
- State persists across refresh
- Receipts appear when actions happen
- Layer switch updates state

---

### Phase 3: Connect Command Palette (2 hours)
1. Replace placeholder handlers with real actions
2. Add instrument summoning logic
3. Enforce max instrument limits (2 for Sovereign/Commons, 4 for Builder)
4. Wire keyboard shortcuts

**Test:**
- Cmd+K opens palette
- Selecting action opens correct instrument
- Max limits enforced
- Cmd+Shift+C opens crisis mode
- Esc closes palette/instruments

---

### Phase 4: Entry Flow (1 hour)
1. Add `hasSeenEntry` check to first boundary action
2. Show Entry Instrument on first export/commons/builder attempt
3. After Entry, show License Stack
4. After licenses, proceed with original action

**Test:**
- Fresh user sees Entry Instrument on first boundary
- After completion, never sees it again
- Licenses shown after posture selection
- Receipt created after acknowledgment

---

### Phase 5: Remove Onboarding (10 min)
1. Delete `/components/screens/EnhancedOnboardingScreen.tsx`
2. Remove imports/references in App.tsx
3. Set default view to blank MirrorField

**Test:**
- App opens to blank field with `...`
- No onboarding flow
- First action triggers Entry Instrument

---

### Phase 6: Integration Testing (2 hours)

**Test scenarios:**

1. **First-time user:**
   - Open app → Blank field
   - Type reflection → Works
   - Press Cmd+K → Palette opens
   - Select "Export" → Entry Instrument appears
   - Choose Sovereign → License Stack appears
   - Scroll + acknowledge → Receipt created
   - Export completes → Checksum receipt

2. **Layer switch:**
   - Cmd+K → "Switch layer"
   - See delta disclosure
   - Confirm → Speech contract updates
   - Receipt created

3. **Fork entry:**
   - Cmd+K → "Browse forks"
   - Select fork → Fork Entry appears
   - See rule changes + recognition
   - Enter → Receipt created
   - Exit always visible

4. **Refusal:**
   - Ask for advice → Refusal appears
   - See invariant class
   - See allowed reframes
   - Link to constitution

5. **Crisis mode:**
   - Cmd+Shift+C → Red atmosphere
   - Crisis screen opens
   - Exit visible
   - Return to field

6. **Receipts:**
   - Check all receipts created
   - Expand details
   - Dismiss individually
   - Persist across refresh

7. **Light/Dark theme:**
   - Check system preference switch
   - Manual override in Self screen
   - All instruments adapt
   - No pure black (#000000)

---

## What Still Needs Building (Future)

### Not Critical for Integration
- Speech contract compilation logic (can be placeholder)
- Real fork data (use mock examples)
- Real provenance checking (use mock status)
- Signature verification (use mock checksums)
- Sync/conflict resolution (future feature)
- Full constitution content (partial is fine)
- Complete license text (partial is fine)

### Can Use Mock Data
All of these can use `/utils/mockData.ts`:
- Reflection history
- Thread structure
- Identity graph nodes
- Fork examples
- Worldview examples
- Constitution articles

---

## Success Criteria

Integration is complete when:

### Must Pass:
- [ ] Opens to blank field (no onboarding)
- [ ] Cmd+K opens command palette
- [ ] First boundary triggers Entry Instrument
- [ ] Layer switch creates receipt
- [ ] Export completes with checksum
- [ ] Refusal shows on advice request
- [ ] Crisis mode (Cmd+Shift+C) works
- [ ] Receipts persist across refresh
- [ ] Light/dark theme auto-switches
- [ ] All instruments use adaptive colors
- [ ] Max instrument limits enforced
- [ ] Motion respects `prefers-reduced-motion`

### Should Pass:
- [ ] Fork entry shows rule changes
- [ ] Worldview stacking works
- [ ] Speech contract updates on layer change
- [ ] License stack shows required licenses
- [ ] Provenance shows trust state
- [ ] Constitution viewer shows articles

### Nice to Have:
- [ ] Real signature checking
- [ ] Full constitution content
- [ ] Complete license text
- [ ] Sync conflict UI
- [ ] Builder compiler features

---

## Time Estimate

### Quick fixes: 30 min
- Surface colors
- Border consistency
- Motion duration

### Core integration: 4-5 hours
- State wiring
- Command palette
- Entry flow
- Remove onboarding

### Testing: 2-3 hours
- All user flows
- Edge cases
- Accessibility
- Theme switching

### **Total: ~7-9 hours to fully working integration**

---

## What I'd Do First

If I were integrating right now:

### Hour 1: Quick Fixes
1. Find/replace `bg-[#0a0a0a]` → `bg-[var(--color-surface-card)]`
2. Find/replace `border-white/10` → `border-[var(--color-border-subtle)]`
3. Test one instrument in light + dark
4. Verify looks good

### Hour 2-3: State + Palette
1. Wire `useMirrorState` into App.tsx
2. Connect Command Palette handlers
3. Add keyboard shortcuts
4. Test basic flow (open palette, summon instrument)

### Hour 4-5: Entry + Receipts
1. Add Entry Instrument trigger
2. Connect receipt creation to actions
3. Remove old onboarding
4. Test first-time user flow

### Hour 6-7: Integration Testing
1. Test all instruments
2. Test all flows
3. Test light/dark themes
4. Fix any issues

### Hour 8-9: Polish
1. Add loading states
2. Add error handling
3. Improve transitions
4. Final testing

---

## Risk Assessment

### Low Risk (Easy to Fix)
- Color token updates
- Motion timing
- Receipt creation
- State persistence

### Medium Risk (Requires Testing)
- Entry Instrument trigger logic
- Max instrument limits
- Speech contract updates
- Fork context switching

### High Risk (Needs Careful Testing)
- Command palette action routing
- First-time user flow
- Crisis mode interaction
- Multiple instruments at once

**Mitigation:** Extensive testing with real user scenarios.

---

## What I Won't Touch

These are working and constitutional:
- MirrorField (adaptive backgrounds)
- Receipt System (neutral presentation)
- All 9 instruments (constitutional behavior)
- Guidelines.md (corrected visual section)
- Visual Constitution (adaptive philosophy)

No need to rebuild. Just wire them together.

---

## Final Checklist

Before marking "integration complete":

- [ ] No `#0a0a0a` in codebase
- [ ] No `border-white/10` in codebase  
- [ ] All motion is 250ms or intentionally different
- [ ] State persists to localStorage
- [ ] Receipts persist to localStorage
- [ ] Cmd+K works
- [ ] Cmd+Shift+C works
- [ ] Esc works
- [ ] Entry Instrument triggers correctly
- [ ] License Stack shows on boundary
- [ ] Export completes with receipt
- [ ] Refusal appears on advice
- [ ] Crisis mode activates
- [ ] Light theme works
- [ ] Dark theme works
- [ ] High contrast works
- [ ] Reduced motion works
- [ ] EnhancedOnboardingScreen deleted
- [ ] No onboarding references in App.tsx
- [ ] All instruments adaptive
- [ ] All receipts created
- [ ] All flows tested

---

**Status:** Ready for integration  
**Estimated time:** 7-9 hours  
**Risk level:** Medium (requires careful testing)  
**Blockers:** None

Proceed?
