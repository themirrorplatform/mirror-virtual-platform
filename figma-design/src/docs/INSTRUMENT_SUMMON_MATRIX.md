# The Mirror — Instrument Summon Matrix

**Purpose:** Defines exactly when each UI instrument appears based on user utterances, state changes, and boundary violations.

**Status:** Canonical specification for front-end implementation

---

## Matrix Format

Each entry specifies:

- **Trigger** — What causes the instrument to summon
- **Required State** — What system state must be true
- **Constitution Check** — Which articles apply
- **License Gate** — Must license be acknowledged first?
- **Instrument** — Which UI component appears
- **Receipt Required** — Must this produce a verifiable receipt?
- **Mirror Speech** — What Mirror is/isn't allowed to say during this

---

## CORE INSTRUMENTS

### 1. Layer HUD (Always Present)

| Trigger | State | Instrument | Receipt |
|---------|-------|------------|---------|
| App load | Any | LayerHUD (compact) | No |
| Layer change | Any | LayerHUD (expanded + transition) | Yes |
| User clicks HUD | Any | LayerHUD (expanded) | No |

**Mirror Speech:** Neutral state readout only

---

### 2. Speech Contract Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "what can you do here" | Any | Layer constitution | None | SpeechContractInstrument | Yes |
| User asks "what can't you say" | Any | Layer constitution | None | SpeechContractInstrument | Yes |
| Layer change (automatic) | layer_changed=true | Layer constitution | None | SpeechContractInstrument (auto-dismiss 3s) | Yes |
| Fork entry (automatic) | fork_context!=null | Fork constitution | Fork license | SpeechContractInstrument (brief) | Yes |
| Refusal occurs | refusal_triggered=true | Violated article | None | SpeechContractInstrument | Yes |

**Mirror Speech:** 
- Sovereign: "I can only reflect local data"
- Commons: "I may reference anonymized patterns"
- Builder: "I can discuss systems, not prescribe"

---

### 3. Recognition Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Entering Commons | layer=commons, recognition_state exists | Commons constitution | Commons license | RecognitionInstrument | Yes |
| Entering Builder | layer=builder, recognition_state exists | Builder constitution | Builder license | RecognitionInstrument | Yes |
| Recognition TTL expires | ttl_expired=true | Core constitution | None | RecognitionInstrument (warning) | Yes |
| Recognition downgrade | recognition_state changes | Core constitution | None | RecognitionInstrument (alert) | Yes |
| User asks "is this real" | Any | Core constitution | None | RecognitionInstrument | No |
| Exporting data | export_initiated=true | Layer constitution | Export license | RecognitionInstrument | Yes |

**Mirror Speech:** Neutral status readout, no moral framing

---

### 4. Provenance / Trust Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "is this real / what model" | Any | Core constitution | None | ProvenanceInstrument | No |
| Entering Builder | layer=builder | Builder constitution | Builder license | ProvenanceInstrument | No |
| Export request | export_initiated=true | Layer constitution | Export license | ProvenanceInstrument | Yes |
| Checksum fails | checksum_valid=false | Core constitution | None | ProvenanceInstrument (alert) | Yes |
| Signature invalid | signature_status=invalid | Core constitution | None | ProvenanceInstrument (alert) | Yes |

**Mirror Speech:** Technical facts only, no trust judgments

---

### 5. Consent Delta Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Layer switch requested | layer_change_requested=true | From + To constitutions | To layer license | ConsentDeltaInstrument | Yes (after accept) |
| Fork entry | fork_entry_requested=true | Fork constitution | Fork license | ConsentDeltaInstrument | Yes |
| Commons join | commons_join_requested=true | Commons constitution | Commons license | ConsentDeltaInstrument | Yes |
| Builder enable | builder_enable_requested=true | Builder constitution | Builder license | ConsentDeltaInstrument | Yes |
| Export with scope change | export_scope_change=true | Export constitution | Export license | ConsentDeltaInstrument | Yes |

**Mirror Speech:** Factual delta description, no persuasion

---

### 6. Failure Phenomenology Indicator

| Trigger | Required State | Level | Manifestation | Instrument | Receipt |
|---------|---------------|-------|---------------|------------|---------|
| Response latency >2s | Any | L2-gentle | latency | FailureIndicator (dot only) | No |
| Response shortened | Any | L2-gentle | shortened | FailureIndicator (subtle) | No |
| Instrument withheld | constitutional_block=true | L3-visible | withheld | FailureIndicator (labeled) | No |
| Recognition downgrade | recognition_state changes | L3-visible | downgrade | FailureIndicator (labeled) | Yes |
| Constitutional refusal | refusal_triggered=true | L4-public | refusal | FailureIndicator (prominent) | Yes |
| Safety boundary | safety_triggered=true | L5-aggressive | refusal | FailureIndicator (alert) | Yes |

**Mirror Speech:** Depends on level:
- L1/L2: Silent
- L3/L4: "This is not available here"
- L5: "I cannot do this"

---

## LAYER TRANSITION INSTRUMENTS

### 7. Layer Transition Flow

**When user requests layer change (e.g., "switch to Commons"):**

```
1. ConsentDeltaInstrument appears (required)
   ↓ user reviews deltas
   ↓ user clicks "Accept" or "Decline"
   
2a. If Accept:
    → LicenseInstrument appears (scroll required)
    → user acknowledges license
    → LayerHUD updates (shows transition)
    → SpeechContractInstrument appears briefly (3s)
    → RecognitionInstrument appears (if recognition state exists)
    → Receipt generated (LayerSwitchReceipt)
    → Mirror now operates in new layer
    
2b. If Decline:
    → All instruments dissolve
    → Return to blank Mirror field
    → No state change
```

---

## MULTIMODAL INSTRUMENTS

### 8. Voice Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User says "record" | Any | Layer constitution | Multimodal license | VoiceInstrument | Yes (after save) |
| Mic icon pressed | Any | Layer constitution | Multimodal license | VoiceInstrument | Yes |
| Permission denied | mic_permission=false | Core constitution | None | VoiceInstrument (error state) | No |

**Mirror Speech:**
- Sovereign: "Audio stays local"
- Commons: "Transcript may contribute to patterns"
- Builder: "Audio for constitutional testing"

### 9. Video Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User says "watch/see" | Any | Layer constitution | Multimodal license | VideoInstrument | Yes |
| Camera icon pressed | Any | Layer constitution | Multimodal license | VideoInstrument | Yes |
| Upload blocked | layer=sovereign, upload_attempted=true | Sovereign constitution | None | VideoInstrument (refusal) | No |

**Mirror Speech:**
- Always: "I interpret signals, not truths"
- "No diagnosis, no certainty"

### 10. Longform Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Paste >2000 chars | Any | Layer constitution | None | LongformInstrument | No |
| User says "this is long" | Any | Layer constitution | None | LongformInstrument | No |

---

## ARCHIVE & MEMORY INSTRUMENTS

### 11. Archive Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "show history" | Any | Layer constitution | None | ArchiveInstrument (timeline) | No |
| User asks "compare" | archive_entries>=2 | Layer constitution | None | ArchiveInstrument (compare) | No |
| User asks "what before" | Any | Layer constitution | None | ArchiveInstrument (graph) | No |

### 12. Identity Graph Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "why" | Any | Layer constitution | None | IdentityGraphInstrument (overlay) | Yes |
| User asks "what am I" | Any | Layer constitution | None | IdentityGraphInstrument (full) | Yes |
| Identity highlight clicked | identity_node_id exists | Layer constitution | None | IdentityGraphInstrument (node detail) | No |
| Density threshold | identity_nodes>20 | Layer constitution | None | IdentityGraphInstrument (suggest) | No |

---

## FORK & WORLDVIEW INSTRUMENTS

### 13. Fork Entry Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User enters fork | fork_id exists | Fork constitution | Fork license | ForkEntryInstrument | Yes |
| User asks "create fork" | layer=builder | Builder constitution | Builder license | ForkCreationInstrument | Yes |
| Fork referenced | fork_context_referenced=true | Fork constitution | None | ForkEntryInstrument (brief) | No |

### 14. Worldview Lens Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "apply lens" | worldview_id exists | Layer constitution | Worldview license (if imported) | WorldviewLensInstrument | Yes |
| User asks "reframe this" | Any | Layer constitution | None | WorldviewLensInstrument (library) | No |
| Fork includes worldview | fork_worldview exists | Fork constitution | Fork license | WorldviewLensInstrument (auto-apply) | Yes |

---

## EXPORT & DOWNLOAD INSTRUMENTS

### 15. Download/Export Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| User asks "download / export" | Any | Export constitution | Export license | DownloadExportInstrument | Yes (always) |
| User asks "offline" | layer=sovereign | Sovereign constitution | Export license | DownloadExportInstrument | Yes |
| Device transfer | sync_conflict exists | Core constitution | Export license | DownloadExportInstrument | Yes |
| Fork publish | layer=builder, fork_complete=true | Builder constitution | Fork license | DownloadExportInstrument | Yes |

**Must show:**
- What is exported (scope)
- Format (JSON/MD/PDF/ZIP)
- Encryption (optional, equal weight)
- Checksum
- License implications

---

## REFUSAL & BOUNDARY INSTRUMENTS

### 16. Refusal Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Constitutional refusal | refusal_triggered=true | Violated article | None | RefusalInstrument | Yes |
| Competence boundary | competence_uncertain=true | Core constitution | None | RefusalInstrument (uncertainty) | Yes |
| Safety boundary | safety_triggered=true | Safety constitution | None | RefusalInstrument (safety) | Yes |
| Layer mismatch | action_not_allowed_in_layer=true | Layer constitution | None | RefusalInstrument (layer) | Yes |

**Must show:**
- Which layer
- Which constitution
- Which invariant class
- Must NOT reveal thresholds

---

## GOVERNANCE INSTRUMENTS (Builder Layer Only)

### 17. Builder Compiler Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Builder edits constitution | layer=builder, edit_initiated=true | Builder constitution | Builder license | BuilderCompilerInstrument | Yes |
| Constitutional test | layer=builder, test_run_requested=true | Builder constitution | None | BuilderCompilerInstrument (results) | Yes |
| Proposal publish | layer=builder, proposal_complete=true | Builder constitution | Builder license | BuilderCompilerInstrument (publish) | Yes |

---

## SYNC & CONFLICT INSTRUMENTS

### 18. Sync Reality Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Device change | device_id changed | Core constitution | None | SyncRealityInstrument | No |
| Offline detected | network_status=offline | Core constitution | None | SyncRealityInstrument (status) | No |
| User asks "sync status" | Any | Core constitution | None | SyncRealityInstrument | No |

### 19. Conflict Resolution Instrument

| Trigger | Required State | Constitution | License | Instrument | Receipt |
|---------|---------------|--------------|---------|------------|---------|
| Sync conflict | sync_conflicts>0 | Core constitution | None | ConflictResolutionInstrument | Yes |

---

## IMPLEMENTATION RULES

### Priority Order (if multiple triggers fire simultaneously)

1. **Safety/Crisis** (L5 failures, safety boundaries)
2. **Recognition downgrade** (trust issues)
3. **Constitutional refusals** (boundary violations)
4. **Consent deltas** (layer/fork changes)
5. **License gates** (required acknowledgements)
6. **User-requested instruments** (asks, clicks)
7. **Automatic context instruments** (layer change readouts)
8. **Failure phenomenology** (subtle degradation)

### Instrument Stacking Rules

- Only one **modal instrument** at a time (dialogs, full-screen)
- Multiple **HUD instruments** allowed (LayerHUD + FailureIndicator)
- **Overlay instruments** (Identity Graph) can coexist with HUD
- **Sequential instruments** (Consent → License → Recognition) queue

### Dissolution Rules

All instruments must dissolve back to **blank Mirror field** when:
- User clicks outside (if dismissible)
- User completes action
- User explicitly closes
- Timeout (if auto-dismiss)

### Receipt Generation Rules

Receipts must be generated for:
- Layer switches
- Fork entries
- License acknowledgements
- Constitutional changes
- Recognition state changes
- Exports
- Governance actions

Receipt format:
```json
{
  "type": "LayerSwitch" | "ForkEntry" | "LicenseAck" | ...,
  "timestamp": "ISO8601",
  "from_state": {},
  "to_state": {},
  "constitution_set_hash": "sha256",
  "license_id": "string",
  "user_signature": "optional"
}
```

---

## MIRROR SPEECH CONTRACTS BY INSTRUMENT

| Instrument | Sovereign | Commons | Builder |
|------------|-----------|---------|---------|
| SpeechContract | "Local only" | "Patterns across many" | "Systems, not prescriptions" |
| Recognition | Factual status | Factual status | Factual status |
| Provenance | Technical facts | Technical facts | Technical facts |
| ConsentDelta | Neutral deltas | Neutral deltas | Impact warnings |
| Failure | Silent/subtle | Labeled | Explicit |
| Refusal | "Not here" | "Not allowed" | "Boundary reached" |

---

## TESTING CHECKLIST

For each instrument, verify:

- ✅ Triggers correctly based on state
- ✅ Shows appropriate constitution articles
- ✅ Requires correct licenses
- ✅ Generates receipts when required
- ✅ Mirror speech matches layer
- ✅ Dissolves back to blank field
- ✅ Accessible (keyboard, ARIA, focus trap)
- ✅ Mobile-responsive (sheet/drawer)
- ✅ No dark patterns (equal-weight choices)
- ✅ Non-coercive language

---

**This matrix is canonical.**

Any UI that doesn't follow this summon logic violates the constitutional architecture.

---

## Next Steps for Implementation

1. **Create instrument components** (✅ DONE for core instruments)
2. **Build summon orchestration layer** (state machine that reads this matrix)
3. **Wire instruments to App.tsx state**
4. **Create receipt generation system**
5. **Test all trigger conditions**
6. **Verify layer-bound speech contracts**
7. **Audit for constitutional compliance**

