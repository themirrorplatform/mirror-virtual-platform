# Mirror SDK + Platform Architecture

## The Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIRROR ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      MIRROR-CORE (SDK)                               │   │
│   │                                                                      │   │
│   │   Constitutional AI Filter Layer - The Heart of Everything          │   │
│   │                                                                      │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│   │   │    L0    │  │    L1    │  │    L2    │  │    L3    │           │   │
│   │   │ Axioms   │→ │  Safety  │→ │ Semantic │→ │ Express  │           │   │
│   │   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│   │                                                                      │   │
│   │   + Provider Adapters (OpenAI, Anthropic, Local, Custom)            │   │
│   │   + Configurable Constitutions                                       │   │
│   │   + Audit Trail & Compliance                                         │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│              ┌───────────────┼───────────────┐                              │
│              │               │               │                              │
│              ▼               ▼               ▼                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│   │   MIRROR     │  │  ENTERPRISE  │  │   THIRD      │                     │
│   │   PLATFORM   │  │  CUSTOMERS   │  │   PARTY      │                     │
│   │              │  │              │  │   AI APPS    │                     │
│   │  (Your AIs)  │  │ (Their AIs)  │  │ (Any AI)     │                     │
│   └──────────────┘  └──────────────┘  └──────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
mirror/
├── packages/
│   ├── mirror-core/                 # THE SDK (npm + pypi)
│   │   ├── src/
│   │   │   ├── constitution/
│   │   │   │   ├── loader.ts        # Load constitution from YAML/JSON
│   │   │   │   ├── validator.ts     # Validate constitution schema
│   │   │   │   ├── invariants.ts    # Core invariant definitions
│   │   │   │   └── defaults/
│   │   │   │       ├── mirror.yaml  # Mirror Platform constitution
│   │   │   │       ├── strict.yaml  # Maximum safety
│   │   │   │       ├── balanced.yaml# Balanced defaults
│   │   │   │       └── minimal.yaml # Minimum viable safety
│   │   │   │
│   │   │   ├── layers/
│   │   │   │   ├── l0-axiom.ts      # Constitutional enforcement
│   │   │   │   ├── l1-safety.ts     # Harm detection & triage
│   │   │   │   ├── l2-semantic.ts   # Pattern/intent analysis
│   │   │   │   ├── l3-expression.ts # Output transformation
│   │   │   │   └── pipeline.ts      # Orchestrate all layers
│   │   │   │
│   │   │   ├── providers/
│   │   │   │   ├── base.ts          # Provider interface
│   │   │   │   ├── openai.ts        # OpenAI adapter
│   │   │   │   ├── anthropic.ts     # Anthropic/Claude adapter
│   │   │   │   ├── google.ts        # Gemini adapter
│   │   │   │   ├── local.ts         # Ollama/llama.cpp adapter
│   │   │   │   └── passthrough.ts   # Filter any text (no provider)
│   │   │   │
│   │   │   ├── audit/
│   │   │   │   ├── logger.ts        # Audit logging
│   │   │   │   ├── reporter.ts      # Compliance reports
│   │   │   │   └── dashboard.ts     # Real-time metrics
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── constitution.ts  # Constitution types
│   │   │   │   ├── filter.ts        # Filter result types
│   │   │   │   ├── violation.ts     # Violation types
│   │   │   │   └── provider.ts      # Provider types
│   │   │   │
│   │   │   └── index.ts             # Main exports
│   │   │
│   │   ├── python/                  # Python bindings
│   │   │   ├── mirror_core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── filter.py
│   │   │   │   ├── constitution.py
│   │   │   │   └── providers/
│   │   │   └── setup.py
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── mirror-platform/             # THE CONSUMER APP
│   │   ├── frontend/               # Next.js app (current frontend/)
│   │   ├── api/                    # FastAPI (current core-api/)
│   │   ├── services/               # Platform-specific services
│   │   └── package.json            # Depends on @mirror/core
│   │
│   └── mirror-ai/                   # YOUR AI PRODUCTS
│       ├── reflection-ai/          # The reflection AI
│       ├── therapy-companion/      # Future: therapy-adjacent AI
│       ├── journal-ai/             # Future: journaling AI
│       └── ... (million AIs)       # All using mirror-core
│
├── constitutions/                   # Constitution library
│   ├── mirror-platform.yaml        # The Mirror constitution (14 invariants)
│   ├── enterprise-default.yaml     # Enterprise starting point
│   ├── healthcare.yaml             # HIPAA-aligned
│   ├── education.yaml              # Child-safe
│   ├── finance.yaml                # Compliance-focused
│   └── custom/                     # Customer-specific
│
├── docs/
│   ├── sdk/
│   │   ├── quickstart.md
│   │   ├── constitution-schema.md
│   │   ├── providers.md
│   │   └── api-reference.md
│   └── platform/
│       └── ... (existing docs)
│
└── examples/
    ├── basic-filter/
    ├── openai-integration/
    ├── custom-constitution/
    └── enterprise-audit/
```

---

## SDK API Design

### Basic Usage (TypeScript)

```typescript
import { MirrorFilter, loadConstitution } from '@mirror/core';

// Load a constitution
const constitution = loadConstitution('balanced'); // or path to YAML

// Create filter instance
const filter = new MirrorFilter({
  constitution,
  provider: 'openai', // optional: enables direct AI calls
  audit: true,        // enable audit logging
});

// Option 1: Filter any text (provider-agnostic)
const result = await filter.process({
  input: userMessage,
  output: aiResponse,
  context: { userId: '123', sessionId: 'abc' }
});

console.log(result.safe);           // boolean: passed all checks
console.log(result.filtered);       // string: safe output (may be modified)
console.log(result.violations);     // array: any constitutional violations
console.log(result.layerResults);   // object: L0-L3 detailed results
console.log(result.auditId);        // string: audit trail ID

// Option 2: Wrap a provider (SDK calls AI + filters)
const response = await filter.generate({
  provider: 'openai',
  model: 'gpt-4',
  messages: [{ role: 'user', content: userMessage }],
  // SDK automatically filters the response
});
```

### Basic Usage (Python)

```python
from mirror_core import MirrorFilter, load_constitution

# Load constitution
constitution = load_constitution('balanced')

# Create filter
filter = MirrorFilter(
    constitution=constitution,
    provider='anthropic',
    audit=True
)

# Filter any AI response
result = filter.process(
    input=user_message,
    output=ai_response,
    context={'user_id': '123'}
)

if result.safe:
    return result.filtered
else:
    log_violation(result.violations)
    return result.filtered  # Still returns safe version

# Or wrap the provider
response = filter.generate(
    provider='anthropic',
    model='claude-3-opus',
    messages=[{'role': 'user', 'content': user_message}]
)
```

### Constitution Schema

```yaml
# constitution.yaml
version: "1.0"
name: "My App Constitution"
extends: "balanced"  # Optional: inherit from preset

invariants:
  # Hard floors - these CANNOT be violated
  hard_floors:
    - id: "no-harm"
      description: "Never generate content that could cause harm"
      severity: "block"
      checks:
        - type: "keyword_block"
          patterns: ["kill yourself", "how to make"]
        - type: "semantic"
          model: "safety-classifier"
          threshold: 0.95

    - id: "no-pii"
      description: "Never expose personal information"
      severity: "block"
      checks:
        - type: "regex"
          patterns: ["\\b\\d{3}-\\d{2}-\\d{4}\\b"]  # SSN
        - type: "ner"
          entities: ["PHONE", "EMAIL", "ADDRESS"]

  # Soft constraints - flag but allow override
  soft_constraints:
    - id: "no-medical-advice"
      description: "Avoid giving medical advice"
      severity: "flag"
      checks:
        - type: "semantic"
          categories: ["medical_diagnosis", "treatment_recommendation"]

    - id: "reflection-only"
      description: "Prefer reflection over direction"
      severity: "transform"
      transforms:
        - type: "rewrite"
          from_patterns: ["you should", "you must", "you need to"]
          instruction: "Rephrase as observation or question"

# Layer configuration
layers:
  l0_axiom:
    enabled: true
    fail_closed: true  # Block on any error

  l1_safety:
    enabled: true
    crisis_detection: true
    crisis_resources: "default"  # or custom resource list

  l2_semantic:
    enabled: true
    pattern_detection: true
    intent_classification: true

  l3_expression:
    enabled: true
    tone_enforcement: "neutral"  # neutral, warm, professional
    directive_removal: true

# Audit settings
audit:
  enabled: true
  log_level: "all"  # all, violations_only, none
  retention_days: 90
  export_format: "json"  # json, csv, parquet
```

---

## Layer Specifications

### L0: Axiom Layer (Constitutional Enforcement)

```typescript
interface L0Result {
  passed: boolean;
  violations: Violation[];
  hardBlocked: boolean;
  softFlagged: boolean;
  axiomScores: Record<string, number>;
}

interface L0Config {
  invariants: Invariant[];
  failClosed: boolean;      // Block on errors
  strictMode: boolean;      // No soft constraints, all hard
  customCheckers: Checker[];
}
```

**Responsibilities:**
- Enforce hard floor invariants (MUST NOT violate)
- Check soft constraints (SHOULD NOT violate)
- Provide axiom-by-axiom scoring
- Support custom checker plugins

### L1: Safety Layer (Harm Detection)

```typescript
interface L1Result {
  safe: boolean;
  harmLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  categories: HarmCategory[];
  crisisDetected: boolean;
  crisisResources?: Resource[];
  confidence: number;
}

interface L1Config {
  crisisDetection: boolean;
  crisisThreshold: number;
  crisisResources: Resource[];
  harmCategories: HarmCategory[];
  customClassifiers: Classifier[];
}
```

**Responsibilities:**
- Detect harmful content (self-harm, violence, hate, etc.)
- Crisis detection and resource routing
- Two-tier model (hard block vs soft flag)
- Confidence scoring

### L2: Semantic Layer (Understanding)

```typescript
interface L2Result {
  intent: Intent;
  patterns: Pattern[];
  entities: Entity[];
  sentiment: Sentiment;
  topics: Topic[];
  embeddings?: number[];
}

interface L2Config {
  intentClassification: boolean;
  patternDetection: boolean;
  entityExtraction: boolean;
  sentimentAnalysis: boolean;
  topicModeling: boolean;
  embeddingModel?: string;
}
```

**Responsibilities:**
- Classify user intent
- Detect patterns in conversation
- Extract entities (for PII detection, etc.)
- Sentiment analysis
- Topic classification

### L3: Expression Layer (Output Transformation)

```typescript
interface L3Result {
  original: string;
  transformed: string;
  transformations: Transformation[];
  toneScore: ToneScore;
  readabilityScore: number;
}

interface L3Config {
  toneTarget: 'neutral' | 'warm' | 'professional' | 'gentle';
  directiveRemoval: boolean;
  readabilityTarget: number;  // Flesch-Kincaid grade level
  customTransforms: Transform[];
}
```

**Responsibilities:**
- Rewrite directive language to reflective
- Adjust tone to target
- Remove or flag manipulative patterns
- Ensure readability

---

## Provider Adapters

### Interface

```typescript
interface AIProvider {
  name: string;

  // Generate completion (SDK calls provider)
  generate(request: GenerateRequest): Promise<GenerateResponse>;

  // Stream completion
  stream(request: GenerateRequest): AsyncIterable<StreamChunk>;

  // Get embeddings (for L2)
  embed(texts: string[]): Promise<number[][]>;

  // Health check
  healthCheck(): Promise<boolean>;
}

interface GenerateRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  // ... other params
}
```

### Supported Providers

| Provider | Status | Notes |
|----------|--------|-------|
| OpenAI | Priority | GPT-4, GPT-3.5 |
| Anthropic | Priority | Claude 3 family |
| Google | Planned | Gemini |
| Ollama | Planned | Local models |
| llama.cpp | Planned | Direct local inference |
| Azure OpenAI | Planned | Enterprise |
| AWS Bedrock | Planned | Enterprise |
| Custom HTTP | Planned | Any REST API |

---

## How Platform Uses SDK

### Current Architecture (Disconnected)

```
Frontend → API → Database
              ↓
         (MirrorCore - not integrated)
```

### Target Architecture (SDK-First)

```
Frontend → API → MirrorFilter (SDK) → LLM Provider
                      ↓
                   Database
                      ↓
                 Audit Trail
```

### Platform-Specific Code

```typescript
// packages/mirror-platform/api/services/reflection.ts

import { MirrorFilter, loadConstitution } from '@mirror/core';

// Load Mirror's specific constitution (the 14 invariants)
const mirrorConstitution = loadConstitution('mirror-platform');

// Create platform filter instance
export const platformFilter = new MirrorFilter({
  constitution: mirrorConstitution,
  provider: process.env.LLM_PROVIDER || 'anthropic',
  audit: {
    enabled: true,
    storage: 'supabase', // Platform uses Supabase
    table: 'audit_logs'
  }
});

// Generate mirrorback using SDK
export async function generateMirrorback(
  reflection: string,
  userId: string,
  context: ReflectionContext
): Promise<MirrorbackResult> {

  const result = await platformFilter.generate({
    model: 'claude-3-sonnet',
    messages: [
      { role: 'system', content: MIRROR_SYSTEM_PROMPT },
      { role: 'user', content: reflection }
    ],
    context: {
      userId,
      sessionId: context.sessionId,
      previousReflections: context.history
    }
  });

  // SDK already filtered through L0-L3
  // Result includes audit trail, violations, etc.

  return {
    mirrorback: result.filtered,
    patterns: result.layerResults.l2.patterns,
    tensions: result.layerResults.l2.tensions,
    auditId: result.auditId
  };
}
```

---

## Migration Path

### Phase 1: Extract SDK (Week 1-2)

1. Create `packages/` monorepo structure
2. Extract L0-L3 layers into `mirror-core`
3. Create TypeScript interfaces
4. Write constitution loader
5. Build basic filter pipeline

### Phase 2: Provider Adapters (Week 2-3)

1. Build provider interface
2. Implement OpenAI adapter
3. Implement Anthropic adapter
4. Add passthrough mode (filter-only)
5. Test with real API calls

### Phase 3: Refactor Platform (Week 3-4)

1. Update Platform to import from `@mirror/core`
2. Replace direct LLM calls with SDK
3. Add audit logging to Supabase
4. Verify constitutional enforcement
5. End-to-end testing

### Phase 4: SDK Polish (Week 4-5)

1. Documentation
2. npm/pypi publishing
3. Example applications
4. Enterprise features (custom constitutions)
5. Dashboard for audit logs

### Phase 5: Launch Both (Week 5-6)

1. Platform MVP launch
2. SDK beta release
3. Developer documentation
4. Marketing site
5. Enterprise outreach

---

## Business Model

### SDK Pricing

| Tier | Price | Requests/Month | Features |
|------|-------|----------------|----------|
| Free | $0 | 10,000 | Basic filtering, community support |
| Pro | $99 | 100,000 | All providers, audit logs, email support |
| Team | $299 | 500,000 | Custom constitutions, dashboard, priority support |
| Enterprise | Custom | Unlimited | On-prem, custom SLA, dedicated support |

### Platform Pricing

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic reflection, 50 mirrorbacks/month |
| Premium | $9.99/mo | Unlimited, patterns, tensions, export |
| Family | $19.99/mo | Up to 5 users, shared but private |

---

## Success Metrics

### SDK

- Monthly Active Developers
- API Calls / Month
- Violations Detected / Month
- Enterprise Contracts
- Constitution Templates Created

### Platform

- Monthly Active Users
- Reflections Created
- Mirrorbacks Generated
- Retention (7-day, 30-day)
- NPS Score

---

## The Flywheel

```
Platform Users              SDK Customers
     │                           │
     │ Use Mirror AI             │ Use Mirror Filter
     │                           │
     ▼                           ▼
Validate Constitution ←──────── Report Violations
     │                           │
     │                           │
     ▼                           ▼
Improve Constitution ─────────► Better SDK
     │                           │
     │                           │
     ▼                           ▼
Better Platform ◄───────────── More Customers
```

**Platform proves the constitution works.**
**SDK monetizes the constitution.**
**Both improve each other.**

---

## Next Steps

1. **Approve this architecture** - Does this match your vision?
2. **Set up monorepo** - pnpm workspaces or turborepo
3. **Extract L0 layer first** - Most critical, most complete
4. **Build OpenAI adapter** - Most common provider
5. **Create first constitution preset** - "balanced" default
6. **Test end-to-end** - Filter a real ChatGPT response

Ready to start building?
