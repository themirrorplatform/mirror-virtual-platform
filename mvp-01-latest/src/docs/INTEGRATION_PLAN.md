# Integration Plan
## The Mirror - Constitutional Instrument OS

**Status:** Ready for integration  
**Priority:** Wire instruments → Connect receipts → Remove old onboarding

---

## Pre-Integration Adjustments (Quick Fixes)

### 1. Surface Color Tokens
**Issue:** Hardcoded `#0a0a0a` backgrounds won't adapt to light theme  
**Fix:** Replace with `bg-[var(--color-surface-card)]`

**Files to update:**
- All 9 instrument files (Entry, Speech, License, Constitution, Fork, Worldview, Export, Provenance, Refusal)
- CommandPalette.tsx
- Instrument.tsx
- DraggableInstrument.tsx
- InstrumentDock.tsx
- ReceiptSystem.tsx

### 2. Border Consistency  
**Issue:** Mix of `border-white/10` and `border-[var(--color-border-subtle)]`  
**Fix:** Use CSS variable everywhere for theme adaptation

### 3. Motion Duration
**Issue:** Mix of 200ms, 250ms, 300ms  
**Fix:** Standardize to 250ms (0.25s)

---

## Integration Steps

### Phase 1: State Management (Foundation)

**Create:** `/hooks/useMirrorState.ts`

```typescript
interface MirrorState {
  // Core state
  layer: 'sovereign' | 'commons' | 'builder';
  fork: string | null;
  worldviews: string[];
  crisisMode: boolean;
  
  // Constitutional state
  constitutions: string[];
  licenses: string[];
  recognition: 'recognized' | 'conditional' | 'suspended' | 'revoked';
  provenance: 'local' | 'remote' | 'hybrid';
  
  // First-time user
  hasSeenEntry: boolean;
  
  // Preferences
  particlesEnabled: boolean;
  themeOverride: 'light' | 'dark' | 'auto';
}
```

**Actions:**
- Switch layer → Speech contract updates, delta shown, licenses required
- Enter fork → Fork Entry Instrument appears
- Apply worldview → Worldview stack updates
- Export data → Export Instrument appears, receipt created
- Boundary hit → Refusal Instrument appears

---

### Phase 2: Command Palette Wiring

**File:** `/components/CommandPalette.tsx`

**Connect handlers:**

```typescript
// Currently placeholders, make real:
const handleAction = (action: Action) => {
  switch (action.id) {
    case 'layer-switch':
      openLayerInstrument();
      break;
    case 'export':
      if (!state.hasSeenEntry) {
        openEntryInstrument();
      } else {
        openExportInstrument();
      }
      break;
    case 'crisis':
      setState({ crisisMode: true });
      openCrisisScreen();
      break;
    // ... etc
  }
};
```

**Add instrument state:**
```typescript
const [activeInstruments, setActiveInstruments] = useState<string[]>([]);

// Max limits:
const maxInstruments = state.layer === 'builder' ? 4 : 2;

const openInstrument = (id: string) => {
  if (activeInstruments.length >= maxInstruments) {
    // Show receipt: "Max instruments reached"
    return;
  }
  setActiveInstruments([...activeInstruments, id]);
};
```

---

### Phase 3: Receipt System Connection

**File:** `/components/ReceiptSystem.tsx`

**Wire to state:**
```typescript
// On layer switch:
addReceipt({
  type: 'layer_switch',
  title: `Layer: ${newLayer}`,
  timestamp: new Date(),
  details: {
    from: oldLayer,
    to: newLayer,
    constitutions: getActiveConstitutions(newLayer),
  },
});

// On license acknowledgment:
addReceipt({
  type: 'license',
  title: `License: ${license.name}`,
  timestamp: new Date(),
  details: {
    version: license.version,
    scope: license.scope,
  },
});

// On export:
addReceipt({
  type: 'export',
  title: 'Export complete',
  timestamp: new Date(),
  details: {
    scope: exportConfig.scope,
    format: exportConfig.format,
    checksum: exportReceipt.checksum,
  },
});
```

---

### Phase 4: Entry Instrument Trigger

**Logic:**
```typescript
// In App.tsx or useMirrorState
const handleFirstBoundaryAction = (action: string) => {
  if (!state.hasSeenEntry) {
    // Open Entry Instrument
    setActiveInstrument('entry');
    
    // After Entry completes:
    onEntryComplete = (posture) => {
      setState({ 
        hasSeenEntry: true, 
        layer: posture 
      });
      
      // Show licenses for selected layer
      openLicenseStack(getLayerLicenses(posture));
      
      // After licenses acknowledged:
      onLicensesAcknowledged = () => {
        addReceipt({
          type: 'layer_switch',
          title: `Layer: ${posture}`,
          ...
        });
        
        // Proceed with original action
        executeAction(action);
      };
    };
  } else {
    // Normal action flow
    executeAction(action);
  }
};
```

---

### Phase 5: App.tsx Refactor

**Remove:**
- `EnhancedOnboardingScreen` component and imports
- Any onboarding state/routing

**Update entry point:**
```tsx
function App() {
  const mirrorState = useMirrorState();
  const [activeInstruments, setActiveInstruments] = useState<Instrument[]>([]);
  
  return (
    <MirrorField 
      layer={mirrorState.layer}
      crisisMode={mirrorState.crisisMode}
    >
      {/* Default: blank field with cursor */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[var(--color-text-muted)]">
          ...
        </div>
      </div>
      
      {/* Summoned instruments */}
      <AnimatePresence>
        {activeInstruments.map(instrument => (
          <DraggableInstrument
            key={instrument.id}
            {...instrument}
            onClose={() => closeInstrument(instrument.id)}
          />
        ))}
      </AnimatePresence>
      
      {/* Receipt system */}
      <ReceiptSystem />
      
      {/* Command palette */}
      <CommandPalette 
        onAction={handleAction}
        maxInstruments={mirrorState.layer === 'builder' ? 4 : 2}
      />
      
      {/* Crisis overlay */}
      {mirrorState.crisisMode && (
        <CrisisScreen onExit={() => setCrisisMode(false)} />
      )}
    </MirrorField>
  );
}
```

---

### Phase 6: Speech Contract Compilation

**File:** `/utils/speechContract.ts`

```typescript
export function compileSpeechContract(
  layer: Layer,
  fork: Fork | null,
  worldviews: Worldview[]
): SpeechContract {
  // Start with base layer contract
  let contract = getLayerContract(layer);
  
  // Apply fork modifications
  if (fork) {
    contract = applyForkRules(contract, fork);
  }
  
  // Apply worldview stack (top to bottom)
  for (const worldview of worldviews) {
    contract = applyWorldviewLens(contract, worldview);
  }
  
  return contract;
}
```

**Trigger updates:**
- On layer switch
- On fork entry/exit
- On worldview apply/remove/reorder

---

### Phase 7: License Stack Logic

**File:** `/utils/licenses.ts`

```typescript
export function getRequiredLicenses(
  action: string,
  currentState: MirrorState
): License[] {
  const licenses: License[] = [];
  
  // Core license (always)
  licenses.push(CORE_LICENSE);
  
  // Layer license
  if (currentState.layer === 'commons') {
    licenses.push(COMMONS_LICENSE);
  }
  if (currentState.layer === 'builder') {
    licenses.push(BUILDER_LICENSE);
  }
  
  // Fork license
  if (currentState.fork) {
    licenses.push(getForkLicense(currentState.fork));
  }
  
  // Tool-specific licenses
  if (action === 'export') {
    licenses.push(EXPORT_LICENSE);
  }
  if (action === 'voice') {
    licenses.push(VOICE_LICENSE);
  }
  
  // Filter already acknowledged
  return licenses.filter(l => !currentState.acknowledgedLicenses.includes(l.id));
}
```

---

### Phase 8: Keyboard Shortcuts

**File:** `/hooks/useGlobalKeyboard.ts`

```typescript
export function useGlobalKeyboard(handlers: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handlers.openCommandPalette();
      }
      
      // Cmd/Ctrl + Shift + C → Crisis Mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        handlers.openCrisis();
      }
      
      // Escape → Close active instruments
      if (e.key === 'Escape') {
        handlers.closeAllInstruments();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

---

### Phase 9: Data Persistence

**File:** `/utils/storage.ts`

```typescript
// localStorage for preferences and receipts
export const storage = {
  // State
  saveMirrorState: (state: MirrorState) => {
    localStorage.setItem('mirror_state', JSON.stringify(state));
  },
  
  loadMirrorState: (): MirrorState | null => {
    const saved = localStorage.getItem('mirror_state');
    return saved ? JSON.parse(saved) : null;
  },
  
  // Receipts
  saveReceipt: (receipt: Receipt) => {
    const receipts = storage.loadReceipts();
    receipts.push(receipt);
    localStorage.setItem('mirror_receipts', JSON.stringify(receipts));
  },
  
  loadReceipts: (): Receipt[] => {
    const saved = localStorage.getItem('mirror_receipts');
    return saved ? JSON.parse(saved) : [];
  },
  
  // Preferences
  savePreferences: (prefs: Preferences) => {
    localStorage.setItem('mirror_preferences', JSON.stringify(prefs));
  },
};
```

---

### Phase 10: Testing Flow

**Test sequence:**

1. **First launch:**
   - Opens to blank field (no onboarding)
   - User types → Reflection appears
   - User presses Cmd+K → Command palette opens
   - User selects "Export" → Entry Instrument appears
   - User selects "Sovereign" → License stack appears
   - User scrolls + acknowledges → Receipt created
   - Export Instrument opens → User completes export
   - Receipt with checksum appears

2. **Layer switch:**
   - User presses Cmd+K → "Switch layer"
   - Layer Instrument shows delta disclosure
   - User confirms → Speech contract updates
   - Receipt created

3. **Fork entry:**
   - User presses Cmd+K → "Browse forks"
   - User selects fork → Fork Entry Instrument appears
   - Shows rule changes + recognition
   - User enters → Receipt created
   - Exit button always visible

4. **Refusal:**
   - User asks for advice → Refusal Instrument appears
   - Shows invariant class + allowed reframes
   - Links to constitution articles
   - User returns to field

---

## What Needs Mock Data

For initial integration (before real backend):

1. **Reflections** - Mock reflection history
2. **Threads** - Mock thread structure
3. **Forks** - Example forks (Stoic Mirror, etc.)
4. **Worldviews** - Example worldview lenses
5. **Constitutions** - Full constitution articles
6. **Licenses** - Complete license text
7. **Identity Graph** - Mock identity nodes

Can use `/utils/mockData.ts` and expand it.

---

## Integration Priority Order

### Must Have (Week 1)
1. ✅ Surface color tokens (adaptive)
2. ✅ State management hook
3. ✅ Command palette wiring
4. ✅ Receipt system connection
5. ✅ Entry Instrument trigger
6. ✅ Remove old onboarding
7. ✅ Keyboard shortcuts

### Should Have (Week 2)
8. Speech contract compilation
9. License stack logic
10. Fork entry flow
11. Worldview stacking
12. Data persistence

### Nice to Have (Week 3)
13. Real provenance checking
14. Signature verification
15. Sync/conflict resolution
16. Full constitution content
17. Complete license text

---

## Files to Create

1. `/hooks/useMirrorState.ts` - Core state management
2. `/hooks/useGlobalKeyboard.ts` - Keyboard shortcuts
3. `/utils/speechContract.ts` - Contract compilation
4. `/utils/licenses.ts` - License logic
5. `/utils/mockData.ts` - Expand with more examples

---

## Files to Update

1. `/App.tsx` - Remove onboarding, add state + instruments
2. `/components/CommandPalette.tsx` - Wire real handlers
3. `/components/ReceiptSystem.tsx` - Connect to actions
4. All 9 instrument files - Adaptive colors
5. `/components/DraggableInstrument.tsx` - Adaptive colors
6. `/components/InstrumentDock.tsx` - Adaptive colors

---

## Files to Delete

1. `/components/screens/EnhancedOnboardingScreen.tsx` - Constitutional violation
2. Any onboarding-related utilities

---

## Success Criteria

Integration is complete when:

- [ ] User opens app to blank field (no onboarding)
- [ ] Cmd+K opens command palette with all instruments
- [ ] First boundary action triggers Entry Instrument
- [ ] Layer switch shows delta + creates receipt
- [ ] Export completes with checksum receipt
- [ ] Refusal shows on advice request
- [ ] Fork entry shows rule changes
- [ ] Speech contract updates on context change
- [ ] Receipts persist in localStorage
- [ ] Light/dark theme switches automatically
- [ ] Crisis mode (Cmd+Shift+C) works
- [ ] Max instrument limits enforced
- [ ] All motion respects prefers-reduced-motion

---

## Next Steps

1. Apply quick fixes (colors, borders, motion)
2. Create state management hook
3. Wire command palette
4. Test first-time user flow
5. Test layer switching
6. Test fork entry
7. Document any issues

---

**Ready to proceed?**
