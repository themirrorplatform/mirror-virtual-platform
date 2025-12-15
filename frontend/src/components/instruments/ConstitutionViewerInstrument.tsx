/**
 * Constitution Viewer Instrument
 * Display core constitutional principles
 * Article-by-article with context
 */

import { motion } from 'framer-motion';
import { FileText, Shield, Eye, MessageCircle, CheckCircle, X } from 'lucide-react';

interface ConstitutionArticle {
  id: string;
  number: number;
  title: string;
  principle: string;
  explanation: string;
  examples: string[];
}

interface ConstitutionViewerProps {
  constitution: string;
  articles: ConstitutionArticle[];
  onClose: () => void;
}

export function ConstitutionViewerInstrument({
  constitution,
  articles,
  onClose,
}: ConstitutionViewerProps) {
  const articleIcons = [Shield, Eye, MessageCircle, CheckCircle, FileText];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">{constitution}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Core principles governing this Mirror
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {articles.map((article, index) => {
            const Icon = articleIcons[index % articleIcons.length];
            
            return (
              <div
                key={article.id}
                className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-gold)]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[var(--color-accent-gold)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">
                      Article {article.number}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      {article.title}
                    </h3>
                    <div className="text-[var(--color-accent-gold)] mb-3 font-medium">
                      {article.principle}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                      {article.explanation}
                    </p>
                    
                    {article.examples.length > 0 && (\n                      <div>\n                        <div className=\"text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide\">\n                          Examples\n                        </div>\n                        <div className=\"space-y-2\">\n                          {article.examples.map((example, i) => (\n                            <div\n                              key={i}\n                              className=\"text-sm text-[var(--color-text-secondary)] pl-4 border-l-2 border-[var(--color-border-subtle)]\"\n                            >\n                              {example}\n                            </div>\n                          ))}\n                        </div>\n                      </div>\n                    )}\n                  </div>\n                </div>\n              </div>\n            );\n          })}\n        </div>\n\n        {/* Footer */}\n        <div className=\"p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0\">\n          <button\n            onClick={onClose}\n            className=\"w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all\"\n          >\n            Close\n          </button>\n        </div>\n      </div>\n    </div>\n  );\n}\n\n// Core Constitution v1.0\nexport const CORE_CONSTITUTION: ConstitutionArticle[] = [\n  {\n    id: 'art-1',\n    number: 1,\n    title: 'Sovereignty',\n    principle: 'All data sovereignty resides with the user',\n    explanation: 'You own and control all your data. No extraction, no manipulation, no hidden agendas. The Mirror serves you, not the reverse.',\n    examples: [\n      'Data stays local by default in Sovereign mode',\n      'Every data routing decision requires explicit consent',\n      'You can export or delete everything at any time',\n    ],\n  },\n  {\n    id: 'art-2',\n    number: 2,\n    title: 'Reflection',\n    principle: 'The Mirror reflects, it does not direct',\n    explanation: 'No advice, no optimization, no \"correct\" paths. The Mirror shows patterns but never prescribes solutions.',\n    examples: [\n      '\"I notice you mentioned this twice\" not \"You should think about this more\"',\n      'Showing connections between reflections without suggesting what they mean',\n      'Refusing to give recommendations even when directly asked',\n    ],\n  },\n  {\n    id: 'art-3',\n    number: 3,\n    title: 'Silence',\n    principle: 'Silence over prescription',\n    explanation: 'The system waits, it does not pull. No notifications, no prompts, no engagement optimization.',\n    examples: [\n      'No streak counters or completion metrics',\n      'No reminders to reflect unless you explicitly set them',\n      'The field remains empty and silent until you choose to engage',\n    ],\n  },\n  {\n    id: 'art-4',\n    number: 4,\n    title: 'Consent',\n    principle: 'All boundaries require explicit consent',\n    explanation: 'Every action that crosses a layer or shares data must be explicitly agreed to. No implied permissions.',\n    examples: [\n      'Entering Commons mode requires acknowledging the license',\n      'Exporting data shows exactly what will be included',\n      'Fork creation requires stating your purpose',\n    ],\n  },\n  {\n    id: 'art-5',\n    number: 5,\n    title: 'Transparency',\n    principle: 'All state changes generate receipts',\n    explanation: 'Every action leaves a constitutional trace. You can always audit what happened and why.',\n    examples: [\n      'Layer switches create receipts showing what changed',\n      'AI interactions log their constitutional basis',\n      'Data exports include provenance and integrity checksums',\n    ],\n  },\n];"}]

