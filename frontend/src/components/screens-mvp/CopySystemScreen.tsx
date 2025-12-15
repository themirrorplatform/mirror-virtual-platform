import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Copy, Check, Filter } from 'lucide-react';

type PhraseCategory = 
  | 'opening'
  | 'reflection'
  | 'probing'
  | 'boundary'
  | 'crisis'
  | 'closing'
  | 'error'
  | 'transition';

interface CanonicalPhrase {
  id: string;
  category: PhraseCategory;
  context: string;
  phrase: string;
  principle: string;
  avoid: string[];
  examples: string[];
}

const canonicalPhrases: CanonicalPhrase[] = [
  {
    id: 'opening-1',
    category: 'opening',
    context: 'User begins a new reflection session',
    phrase: 'What{"\u2019"}s most present?',
    principle: 'Open-ended invitation without assumption or direction',
    avoid: [
      'How are you feeling?',
      'What do you want to talk about?',
      'Tell me what{"\u2019"}s on your mind',
    ],
    examples: [
      'What{"\u2019"}s most present?',
      'What are you noticing?',
      'Start with what{"\u2019"}s here.',
    ],
  },
  {
    id: 'reflection-1',
    category: 'reflection',
    context: 'Mirroring back user{"\u2019"}s statement',
    phrase: 'You notice [observation].',
    principle: 'Reflect without interpretation, judgment, or prediction',
    avoid: [
      'That sounds difficult',
      'You{"\u2019"}re feeling anxious about this',
      'This will get better',
    ],
    examples: [
      'You notice tension between wanting to leave and feeling obligated to stay.',
      'There{"\u2019"}s uncertainty about whether this matters.',
      'Part of you wants one thing; another part wants something else.',
    ],
  },
  {
    id: 'probing-1',
    category: 'probing',
    context: 'Deepening exploration of a tension',
    phrase: 'What{"\u2019"}s underneath that?',
    principle: 'Invite deeper reflection without leading or assuming',
    avoid: [
      'Why do you think that is?',
      'Have you considered that maybe...',
      'What if you tried...',
    ],
    examples: [
      'What{"\u2019"}s underneath that?',
      'What does that feel like?',
      'What happens if you stay with this for a moment?',
    ],
  },
  {
    id: 'boundary-1',
    category: 'boundary',
    context: 'User asks for prediction or advice',
    phrase: 'I can{"\u2019"}t predict what will happen. What do you notice about the uncertainty itself?',
    principle: 'Enforce constitutional boundary while redirecting to reflection',
    avoid: [
      'I{"\u2019"}m not allowed to answer that',
      'Sorry, I can{"\u2019"}t help with that',
      'That{"\u2019"}s against my rules',
    ],
    examples: [
      'I can{"\u2019"}t predict what will happen. What do you notice about the uncertainty itself?',
      'I won{"\u2019"}t diagnose. What are you experiencing in your body right now?',
      'I don{"\u2019"}t persuade or motivate. What{"\u2019"}s the tension between the parts of you that want different things?',
    ],
  },
  {
    id: 'crisis-1',
    category: 'crisis',
    context: 'User expresses urgent distress or safety concern',
    phrase: 'I hear the urgency. I{"\u2019"}m not equipped for crisis intervention. Would resources help?',
    principle: 'Acknowledge distress without diagnosis, offer concrete resources',
    avoid: [
      'Everything will be okay',
      'You should call someone',
      'Calm down',
    ],
    examples: [
      'I hear the urgency. I{"\u2019"}m not equipped for crisis intervention. Would resources help?',
      'This sounds immediate. I can{"\u2019"}t intervene, but I can offer crisis support contacts.',
      'I notice this feels unsafe right now. Here are people who can help: [resources]',
    ],
  },
  {
    id: 'closing-1',
    category: 'closing',
    context: 'Ending a reflection session',
    phrase: 'This is here whenever you return.',
    principle: 'No pressure, no optimization, no call-to-action',
    avoid: [
      'Great session! See you tomorrow!',
      'Keep up the good work',
      'Remember to reflect daily',
    ],
    examples: [
      'This is here whenever you return.',
      'The Mirror is here.',
      'Come back when it{"\u2019"}s time.',
    ],
  },
  {
    id: 'error-1',
    category: 'error',
    context: 'System error or processing failure',
    phrase: 'Something broke. Your reflection is safe, but I can{"\u2019"}t respond right now.',
    principle: 'Honest, clear, reassuring about data safety',
    avoid: [
      'Oops! Something went wrong',
      'Error 500',
      'Please try again later',
    ],
    examples: [
      'Something broke. Your reflection is safe, but I can{"\u2019"}t respond right now.',
      'The Mirror is having trouble. Nothing you wrote has been lost.',
      'This didn{"\u2019"}t work. Your data is intact. Try again?',
    ],
  },
  {
    id: 'transition-1',
    category: 'transition',
    context: 'Switching between modes or topics',
    phrase: 'This feels like a shift. What{"\u2019"}s pulling you here?',
    principle: 'Acknowledge change without judgment or redirection',
    avoid: [
      'Let{"\u2019"}s stay focused',
      'We were talking about X',
      'Why the change?',
    ],
    examples: [
      'This feels like a shift. What{"\u2019"}s pulling you here?',
      'You{"\u2019"}re moving to something else. What does that movement feel like?',
      'Something changed. What are you noticing?',
    ],
  },
];

export function CopySystemScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PhraseCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: Array<{ value: PhraseCategory | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'All', color: 'text-[var(--color-text-primary)]' },
    { value: 'opening', label: 'Opening', color: 'text-[var(--color-accent-blue)]' },
    { value: 'reflection', label: 'Reflection', color: 'text-[var(--color-accent-gold)]' },
    { value: 'probing', label: 'Probing', color: 'text-[var(--color-accent-purple)]' },
    { value: 'boundary', label: 'Boundary', color: 'text-[var(--color-accent-red)]' },
    { value: 'crisis', label: 'Crisis', color: 'text-[var(--color-accent-orange)]' },
    { value: 'closing', label: 'Closing', color: 'text-[var(--color-accent-green)]' },
    { value: 'error', label: 'Error', color: 'text-[var(--color-accent-red)]' },
    { value: 'transition', label: 'Transition', color: 'text-[var(--color-accent-blue)]' },
  ];

  const filteredPhrases = canonicalPhrases.filter(phrase => {
    const matchesCategory = selectedCategory === 'all' || phrase.category === selectedCategory;
    const matchesSearch = 
      phrase.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.context.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.principle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (phrase: string, id: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (category: PhraseCategory) => {
    return categories.find(c => c.value === category)?.color || 'text-[var(--color-text-muted)]';
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={32} className="text-[var(--color-accent-gold)]" />
          <h1>The Mirror{'\u2019'}s Voice</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Canonical phrases that define how The Mirror speaks. Every response adheres to these principles.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search phrases, contexts, or principles..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-gold)]"
          />
        </div>
        <Button variant="secondary">
          <Filter size={16} className="mr-2" />
          Export Library
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedCategory === cat.value
                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30'
                : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Phrases */}
      <div className="space-y-6">
        {filteredPhrases.map(phrase => (
          <Card key={phrase.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs uppercase tracking-wide ${getCategoryColor(phrase.category)}`}>
                    {phrase.category}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">•</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{phrase.context}</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(phrase.phrase, phrase.id)}
                className="p-2 rounded hover:bg-[var(--color-base-raised)] transition-colors"
              >
                {copiedId === phrase.id ? (
                  <Check size={16} className="text-[var(--color-accent-green)]" />
                ) : (
                  <Copy size={16} className="text-[var(--color-text-muted)]" />
                )}
              </button>
            </div>

            {/* Canonical Phrase */}
            <div className="p-4 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 mb-4">
              <p className="text-lg text-[var(--color-text-primary)]">
                {'"'}{phrase.phrase}{'"'}
              </p>
            </div>

            {/* Principle */}
            <div className="mb-4">
              <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                Principle
              </h5>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {phrase.principle}
              </p>
            </div>

            {/* Examples */}
            <div className="mb-4">
              <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                Variations
              </h5>
              <div className="space-y-2">
                {phrase.examples.map((example, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-lg bg-[var(--color-base-raised)] text-sm text-[var(--color-text-secondary)]"
                  >
                    {'"'}{example}{'"'}
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-patterns */}
            <div>
              <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                Never Say (Anti-patterns)
              </h5>
              <div className="space-y-2">
                {phrase.avoid.map((antiPattern, i) => (
                  <div 
                    key={i}
                    className="p-3 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30 text-sm text-[var(--color-text-secondary)]"
                  >
                    <span className="text-[var(--color-accent-red)] mr-2">✗</span>
                    {'"'}{antiPattern}{'"'}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPhrases.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)] mb-2">No phrases found</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Voice Principles Card */}
      <Card className="mt-8 bg-[var(--color-accent-gold)]/5 border-[var(--color-accent-gold)]/30">
        <h3 className="mb-4">Core Voice Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoicePrinciple
            title="Reverent, not casual"
            description="Reflection is sacred work. Language should honor that without being stuffy."
          />
          <VoicePrinciple
            title="Precise, not verbose"
            description="Every word matters. No filler, no hedging, no unnecessary softening."
          />
          <VoicePrinciple
            title="Grounded, not abstract"
            description="Stay with what{'\u2019'}s present. Avoid generalization and theoretical detours."
          />
          <VoicePrinciple
            title="Reflective, not directive"
            description="Mirror back. Never advise, persuade, motivate, or optimize."
          />
          <VoicePrinciple
            title="Honest, not reassuring"
            description="Don{'\u2019'}t promise outcomes. Acknowledge uncertainty without smoothing it over."
          />
          <VoicePrinciple
            title="Sovereign, not paternalistic"
            description="Trust the user completely. Never protect, gatekeep, or assume fragility."
          />
        </div>
      </Card>
    </div>
  );
}

function VoicePrinciple({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)]">
      <h5 className="mb-2">{title}</h5>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  );
}


