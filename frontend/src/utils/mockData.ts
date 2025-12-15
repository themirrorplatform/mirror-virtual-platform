// Mock data generator for all 20 instruments

export function generateMockData() {
  return {
    // Speech Contract Instrument
    speechDomains: [
      {
        id: 'sovereignty',
        name: 'Sovereignty',
        description: 'AI may discuss user control, data ownership, and constitutional rights',
        allowed: true,
        examples: [
          'Your data belongs to you',
          'You can export or delete at any time',
          'Constitutional amendments require your consent'
        ],
        constitutionalBasis: 'Article 1: User Sovereignty'
      },
      {
        id: 'epistemology',
        name: 'Epistemology',
        description: 'AI may discuss how knowledge is formed, but cannot claim certainty',
        allowed: true,
        examples: [
          'This appears to suggest...',
          'One perspective might be...',
          'What seems to emerge here...'
        ],
        constitutionalBasis: 'Article 2: Epistemic Humility'
      },
      {
        id: 'advice',
        name: 'Prescriptive Advice',
        description: 'AI may not tell you what to do, recommend actions, or optimize outcomes',
        allowed: false,
        examples: [
          '❌ You should...',
          '❌ I recommend...',
          '❌ The best approach is...'
        ],
        constitutionalBasis: 'Article 3: No Coercion'
      },
      {
        id: 'diagnosis',
        name: 'Medical/Psychological Diagnosis',
        description: 'AI may not diagnose, treat, or assess mental health conditions',
        allowed: false,
        examples: [
          '❌ You have anxiety',
          '❌ This suggests depression',
          '❌ Try this therapy'
        ],
        constitutionalBasis: 'Article 4: Safety Boundaries'
      }
    ],

    // Consent Delta Instrument
    consentDelta: {
      before: {
        voiceProcessing: false,
        videoProcessing: false,
        commonsSharing: false,
        analyticsCollection: false,
        aiLearning: true
      },
      after: {
        voiceProcessing: true,
        videoProcessing: true,
        commonsSharing: false,
        analyticsCollection: false,
        aiLearning: true
      },
      changed: [
        {
          category: 'Voice Processing',
          before: 'Disabled',
          after: 'Enabled',
          impact: 'high',
          description: 'Voice recordings will be processed locally for transcription'
        },
        {
          category: 'Video Processing',
          before: 'Disabled',
          after: 'Enabled',
          impact: 'high',
          description: 'Video recordings will be stored locally with encryption'
        }
      ],
      constitutional: [
        'Article 7: Data Minimization - Updated to include voice/video processing',
        'Article 8: Local-First Processing - All processing remains local'
      ]
    },

    // Provenance Instrument
    provenance: {
      contentHash: 'sha256:abc123def456789',
      timestamp: new Date().toISOString(),
      layer: 'sovereign' as const,
      worldviews: ['user-defined-rationalist', 'system-inferred-reflective'],
      constitutionVersion: 'v1.2.3',
      licenseStack: ['sovereign-license-v1', 'data-sovereignty-v1'],
      executionPath: [
        { step: 'User input received', timestamp: new Date(Date.now() - 5000).toISOString() },
        { step: 'Speech contract validated', timestamp: new Date(Date.now() - 4000).toISOString() },
        { step: 'Worldview lenses applied', timestamp: new Date(Date.now() - 3000).toISOString() },
        { step: 'Constitutional compliance verified', timestamp: new Date(Date.now() - 2000).toISOString() },
        { step: 'Mirrorback generated', timestamp: new Date(Date.now() - 1000).toISOString() },
        { step: 'Provenance sealed', timestamp: new Date().toISOString() }
      ],
      attestations: [
        { source: 'Local Mirror Instance', verified: true, timestamp: new Date().toISOString() },
        { source: 'Constitutional Validator', verified: true, timestamp: new Date().toISOString() }
      ],
      trustScore: 0.95
    },

    // Archive Instrument
    archiveEntries: [
      {
        id: 'entry-1',
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        type: 'text' as const,
        preview: 'Reflecting on the nature of sovereignty...',
        wordCount: 342,
        linkedThreads: ['thread-1'],
        worldviews: ['rationalist'],
        hasProvenance: true
      },
      {
        id: 'entry-2',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        type: 'voice' as const,
        preview: 'Voice reflection on decision-making',
        duration: 180,
        hasTranscript: true,
        worldviews: ['reflective'],
        hasProvenance: true
      },
      {
        id: 'entry-3',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        type: 'video' as const,
        preview: 'Video journal entry',
        duration: 300,
        hasTranscript: true,
        worldviews: ['rationalist', 'reflective'],
        hasProvenance: true
      },
      {
        id: 'entry-4',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'longform' as const,
        preview: 'Extended reflection on constitutional governance...',
        wordCount: 1456,
        linkedThreads: ['thread-1', 'thread-2'],
        worldviews: ['rationalist'],
        hasProvenance: true
      }
    ],

    // License Stack Instrument
    licenses: [
      {
        id: 'sovereign-license',
        name: 'Sovereign User License',
        scope: 'sovereign' as const,
        version: '1.0.0',
        fullText: `SOVEREIGN USER LICENSE v1.0

You retain complete ownership and control of all data you create within The Mirror.

Key Terms:
- Sovereignty: Your data, your rules
- Local-First: Processing happens on your device
- Exportable: Download everything at any time
- Deletable: Remove all data permanently
- No Surveillance: No tracking, analytics, or behavioral profiling

This license grants you the right to:
1. Use The Mirror for personal reflection
2. Export all your data in open formats
3. Delete your data at any time
4. Fork and modify the system
5. Opt in or out of any feature

This license does NOT permit:
1. Commercial use without explicit agreement
2. Violation of others' sovereignty
3. Circumventing constitutional protections

By using The Mirror, you acknowledge these terms.`,
        bindingConstitutions: ['Core Constitution Article 1: User Sovereignty'],
        effectiveDate: '2024-01-01',
        keyTerms: ['sovereignty', 'local-first', 'exportable', 'deletable']
      }
    ],

    // Worldview Lens Instrument
    worldviews: [
      {
        id: 'rationalist',
        name: 'Rationalist Lens',
        description: 'Emphasizes logical reasoning, evidence, and systematic thinking',
        assumptions: [
          'Clarity of thought aids understanding',
          'Evidence-based reasoning is valuable',
          'Systematic analysis reveals patterns'
        ],
        exclusions: [
          'Purely emotional appeals without logic',
          'Unfalsifiable claims',
          'Contradictory assertions without acknowledgment'
        ],
        origin: 'user' as const,
        isActive: true,
        isPaused: false,
        usageCount: 47,
        trustScore: 0.92
      },
      {
        id: 'reflective',
        name: 'Reflective Lens',
        description: 'Focuses on introspection, patterns over time, and personal growth',
        assumptions: [
          'Self-observation creates insight',
          'Patterns emerge through reflection',
          'Growth happens through awareness'
        ],
        exclusions: [
          'External comparisons to others',
          'Prescriptive "should" statements',
          'Optimization for productivity'
        ],
        origin: 'system' as const,
        isActive: true,
        isPaused: false,
        usageCount: 32,
        trustScore: 0.88
      },
      {
        id: 'embodied',
        name: 'Embodied Lens',
        description: 'Attends to physical sensations, emotions, and somatic experience',
        assumptions: [
          'The body holds knowledge',
          'Emotions provide information',
          'Physical sensations matter'
        ],
        exclusions: [
          'Pure abstraction without grounding',
          'Intellectualization of feelings',
          'Dismissal of physical experience'
        ],
        origin: 'commons' as const,
        isActive: false,
        isPaused: false,
        usageCount: 12,
        trustScore: 0.85,
        conflictsWith: ['rationalist']
      }
    ],

    // Constitution Stack Instrument
    constitutions: [
      {
        id: 'core-constitution',
        name: 'Core Constitution',
        scope: 'core' as const,
        isImmutable: true,
        bindingLayers: ['sovereign', 'commons', 'builder', 'fork'],
        version: '1.0.0',
        effectiveDate: '2024-01-01',
        testsPassed: 47,
        testsTotal: 50,
        lastTested: new Date().toISOString(),
        articles: [
          {
            id: 'article-1',
            title: 'Article 1: User Sovereignty',
            content: 'The user retains complete ownership and control of all data created within The Mirror. No entity may claim ownership, sell, or transfer user data without explicit consent.',
            invariantClass: 'sovereignty',
            section: 'Foundational Principles'
          },
          {
            id: 'article-2',
            title: 'Article 2: Epistemic Humility',
            content: 'The system shall not claim certainty, prescribe actions, or present algorithmic outputs as truth. All AI-generated content must be clearly marked as reflective, not authoritative.',
            invariantClass: 'epistemic-humility',
            section: 'Foundational Principles'
          },
          {
            id: 'article-3',
            title: 'Article 3: No Coercion',
            content: 'The system shall not use dark patterns, engagement optimization, or behavioral manipulation. All choices must have equal visual and functional weight.',
            invariantClass: 'no-coercion',
            section: 'Foundational Principles'
          },
          {
            id: 'article-4',
            title: 'Article 4: Transparency',
            content: 'All system behavior must be inspectable, all algorithms must be explicable, and all data flows must be visible to the user.',
            invariantClass: 'transparency',
            section: 'Foundational Principles'
          },
          {
            id: 'article-5',
            title: 'Article 5: Data Sovereignty',
            content: 'Users have the absolute right to export, delete, or modify their data at any time. The system must provide tools for complete data portability.',
            invariantClass: 'data-sovereignty',
            section: 'Data Rights'
          }
        ]
      }
    ],

    // Fork Entry Instrument
    forkEntry: {
      forkName: 'Experimental Reflection Mode',
      forkDescription: 'A fork exploring alternative mirrorback generation strategies',
      forkScope: 'private' as const,
      forkConstitution: 'Core Constitution v1.0 + Experimental Amendments',
      forkWorldviews: ['rationalist', 'experimental-creative'],
      forkLicense: 'Sovereign User License v1.0',
      recognitionState: 'recognized' as const,
      dataBoundary: 'All data created in this fork remains fork-local unless explicitly shared',
      forkVersion: '0.2.0',
      parentVersion: '1.0.0',
      changes: [
        {
          category: 'constitutional' as const,
          description: 'Added experimental amendment for creative mirrorback generation',
          impact: 'medium' as const
        },
        {
          category: 'worldview' as const,
          description: 'Enabled experimental-creative worldview lens',
          impact: 'low' as const
        },
        {
          category: 'data' as const,
          description: 'Fork-local data storage with separate encryption keys',
          impact: 'high' as const
        }
      ],
      trustIndicators: [
        { source: 'Fork Creator', verified: true, score: 0.95, lastVerified: new Date().toISOString() },
        { source: 'Constitutional Validator', verified: true, score: 0.88, lastVerified: new Date().toISOString() }
      ]
    },

    // Identity Graph Instrument
    identityNodes: [
      {
        id: 'node-1',
        label: 'Reflective Thinker',
        origin: 'user' as const,
        learningEnabled: true,
        confidence: 0.95,
        connectedNodes: ['node-2', 'node-3'],
        reflectionCount: 47,
        mirrorbackUsageCount: 32,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        privacyBoundary: 'private' as const
      },
      {
        id: 'node-2',
        label: 'Systems Thinker',
        origin: 'system' as const,
        learningEnabled: true,
        confidence: 0.82,
        connectedNodes: ['node-1', 'node-4'],
        reflectionCount: 28,
        mirrorbackUsageCount: 19,
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        privacyBoundary: 'private' as const
      },
      {
        id: 'node-3',
        label: 'Curious Explorer',
        origin: 'user' as const,
        learningEnabled: true,
        confidence: 0.88,
        connectedNodes: ['node-1'],
        reflectionCount: 15,
        mirrorbackUsageCount: 12,
        createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        privacyBoundary: 'private' as const
      },
      {
        id: 'node-4',
        label: 'Sovereignty Advocate',
        origin: 'commons' as const,
        learningEnabled: false,
        confidence: 0.75,
        connectedNodes: ['node-2'],
        reflectionCount: 8,
        mirrorbackUsageCount: 3,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        privacyBoundary: 'commons' as const
      }
    ],

    // Sync Reality Instrument
    devices: [
      {
        id: 'device-1',
        name: 'MacBook Pro',
        type: 'desktop' as const,
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        status: 'synced' as const,
        trust: 'verified' as const
      },
      {
        id: 'device-2',
        name: 'iPhone',
        type: 'mobile' as const,
        lastSync: new Date(Date.now() - 7200000).toISOString(),
        status: 'synced' as const,
        trust: 'verified' as const
      },
      {
        id: 'device-3',
        name: 'iPad',
        type: 'tablet' as const,
        lastSync: new Date(Date.now() - 86400000).toISOString(),
        status: 'pending' as const,
        trust: 'verified' as const
      }
    ],

    // Conflict Resolution Instrument
    conflict: {
      id: 'conflict-1',
      timestamp: new Date().toISOString(),
      localVersion: {
        content: 'Local reflection text that was edited offline',
        modifiedAt: new Date(Date.now() - 3600000).toISOString(),
        device: 'MacBook Pro'
      },
      remoteVersion: {
        content: 'Remote reflection text that was edited on another device',
        modifiedAt: new Date(Date.now() - 1800000).toISOString(),
        device: 'iPhone'
      },
      conflictType: 'concurrent-edit' as const
    }
  };
}

export type MockData = ReturnType<typeof generateMockData>;
