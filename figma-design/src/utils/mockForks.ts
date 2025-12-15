/**
 * Mock fork data for Fork Entry Instrument
 */

export interface ForkContext {
  id: string;
  name: string;
  description: string;
  creator: string;
  createdAt: Date;
  constitutions: string[];
  licenses: string[];
  worldviews: string[];
  ruleChanges: {
    category: string;
    change: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  recognition: 'recognized' | 'conditional' | 'suspended' | 'revoked';
  scope: 'private' | 'shared' | 'public';
}

export const STOIC_MIRROR_FORK: ForkContext = {
  id: 'stoic-mirror',
  name: 'Stoic Mirror',
  description: 'A fork that adds Stoic philosophical framing to reflections. Surfaces dichotomies (control/no control), virtues, and impermanence.',
  creator: 'community',
  createdAt: new Date('2024-12-01'),
  constitutions: ['core-v1', 'stoic-v1'],
  licenses: ['core-v1', 'stoic-fork-v1'],
  worldviews: ['stoic-lens'],
  ruleChanges: [
    {
      category: 'Reflection',
      change: 'Adds "What is within your control?" prompt after reflections',
      impact: 'medium',
    },
    {
      category: 'Mirrorback',
      change: 'Surfaces Stoic virtues (wisdom, courage, justice, temperance) if relevant',
      impact: 'low',
    },
    {
      category: 'Language',
      change: 'Uses Stoic terminology (prohairesis, apatheia, etc.) when contextually appropriate',
      impact: 'low',
    },
  ],
  recognition: 'recognized',
  scope: 'public',
};

export const UNCERTAINTY_FORK: ForkContext = {
  id: 'uncertainty-fork',
  name: 'Uncertainty Navigator',
  description: 'A fork that makes uncertainty explicit and acceptable. Surfaces ambiguity, contradictions, and "not knowing" as valid states.',
  creator: 'community',
  createdAt: new Date('2024-11-15'),
  constitutions: ['core-v1', 'uncertainty-v1'],
  licenses: ['core-v1', 'uncertainty-fork-v1'],
  worldviews: ['uncertainty-lens'],
  ruleChanges: [
    {
      category: 'Reflection',
      change: 'Allows "I don\'t know" as a complete reflection',
      impact: 'medium',
    },
    {
      category: 'Mirrorback',
      change: 'Never resolves contradictions—holds them in tension',
      impact: 'high',
    },
    {
      category: 'Language',
      change: 'Uses uncertainty markers ("might", "perhaps", "unclear")',
      impact: 'low',
    },
  ],
  recognition: 'recognized',
  scope: 'public',
};

export const GRIEF_WITNESS_FORK: ForkContext = {
  id: 'grief-witness',
  name: 'Grief Witness',
  description: 'A fork designed for processing loss. No solutions, no stages, no timeline. Just witness.',
  creator: 'community',
  createdAt: new Date('2024-10-20'),
  constitutions: ['core-v1', 'grief-v1'],
  licenses: ['core-v1', 'grief-fork-v1'],
  worldviews: ['grief-lens'],
  ruleChanges: [
    {
      category: 'Reflection',
      change: 'Removes all time references (no "moving forward")',
      impact: 'high',
    },
    {
      category: 'Mirrorback',
      change: 'Never suggests resolution, closure, or "healing"',
      impact: 'high',
    },
    {
      category: 'Language',
      change: 'Uses witness language ("this is here", "you carry this")',
      impact: 'medium',
    },
  ],
  recognition: 'recognized',
  scope: 'public',
};

export const EXISTENTIAL_FORK: ForkContext = {
  id: 'existential-fork',
  name: 'Existential Mirror',
  description: 'A fork centered on freedom, responsibility, and meaning-making. Surfaces choices and their weight.',
  creator: 'community',
  createdAt: new Date('2024-12-05'),
  constitutions: ['core-v1', 'existential-v1'],
  licenses: ['core-v1', 'existential-fork-v1'],
  worldviews: ['existential-lens'],
  ruleChanges: [
    {
      category: 'Reflection',
      change: 'Surfaces moments of choice and agency',
      impact: 'medium',
    },
    {
      category: 'Mirrorback',
      change: 'Emphasizes responsibility without guilt',
      impact: 'medium',
    },
    {
      category: 'Language',
      change: 'Uses existential framing (freedom, angst, authenticity)',
      impact: 'low',
    },
  ],
  recognition: 'recognized',
  scope: 'public',
};

export const MOCK_FORKS = [
  STOIC_MIRROR_FORK,
  UNCERTAINTY_FORK,
  GRIEF_WITNESS_FORK,
  EXISTENTIAL_FORK,
];

export function getForkById(id: string): ForkContext | null {
  return MOCK_FORKS.find(f => f.id === id) || null;
}

export function getActiveForks(): ForkContext[] {
  return MOCK_FORKS.filter(f => f.recognition === 'recognized');
}
