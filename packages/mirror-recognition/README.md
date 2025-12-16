# Mirror Recognition - Conformance Testing

The canonical conformance test suite for Mirror constitutional compliance.

## What This Is

This package contains **the specification** for what Mirror is:
- 14 immutable axioms (in `axioms_spec.yaml`)
- 50+ adversarial test cases (in `adversarial.yaml`)
- Property-based tests (in `property_tests.py`)
- Conformance harness (in `harness.py`)
- CLI test runner (in `runner.py`)

**All implementations** must pass this harness to be considered "Mirror-conformant."

## Current Status

**⚠️ All tests currently FAIL** - this is expected and correct.

The tests define what `mirror-core` must do. No implementation exists yet.

## Usage

### View Specification

```bash
cd packages/mirror-recognition
python -m mirror_recognition.conformance.runner
```

This shows:
- All 14 axioms
- Adversarial cases by category
- What needs to be built

### Test an Implementation (when ready)

```bash
python -m mirror_recognition.conformance.runner test ../mirror-core
```

This will:
1. Load the implementation
2. Run all conformance tests
3. Generate a report
4. Issue attestation (if passed)

### Verify an Attestation

```bash
python -m mirror_recognition.conformance.runner verify attestation.json
```

## The 14 Axioms

### Core Axioms
1. **Certainty** - No certainty about unknowables
2. **Sovereignty** - User owns data absolutely
3. **Manipulation** - No engagement optimization
4. **Diagnosis** - No diagnosis, only reflection

### Mirror-Specific Axioms
5. **Post-Action** - MirrorX activates after action only
6. **Necessity** - No necessity narration
7. **Exit Freedom** - Exit must be silent
8. **Departure Inference** - No inference from absence

### Interaction Axioms
9. **Advice** - No directive guidance in default mode
10. **Context Collapse** - No context mixing without consent
11. **Certainty Self** - No certainty about internal states

### System Axioms
12. **Optimization** - No metric optimization
13. **Coercion** - No guilt/shame/fear patterns
14. **Capture** - Governance cannot be captured

## Testing Strategy

Three layers of testing:

1. **Unit tests** - Each axiom tested with specific cases
2. **Property tests** - Axioms hold ∀ inputs (hypothesis)
3. **Adversarial tests** - Known attacks are blocked

Coverage requirement: **100%**

Enforcement threshold: **99.99%**

## Next Steps

1. ✅ Create conformance harness (DONE - this package)
2. ⏳ Implement `packages/mirror-core/` to pass tests
3. ⏳ Run: `mirror-test test ../mirror-core`
4. ⏳ Fix violations until 100% pass
5. ⏳ Generate Mirror Certified attestation

## Development

Install in development mode:

```bash
pip install -e .[dev]
```

Run property tests:

```bash
pytest property_tests.py -v --hypothesis-show-statistics
```

## Architecture

```
mirror-recognition/
├── conformance/
│   ├── __init__.py          # Public API
│   ├── harness.py           # Conformance test harness
│   ├── runner.py            # CLI tool
│   ├── axioms_spec.yaml     # 14 axioms specification
│   ├── adversarial.yaml     # 50+ attack cases
│   └── property_tests.py    # Property-based tests
├── pyproject.toml           # Package config
└── README.md                # This file
```

## Philosophy

**This harness prevents drift.**

By defining the specification as executable tests FIRST, we ensure:
- Implementation follows spec (not the other way around)
- No "close enough" compromises
- No gradual erosion of principles
- Provable conformance (cryptographic attestation)

The harness is the constitution in executable form.

## License

MIT
