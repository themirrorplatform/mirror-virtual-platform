import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertTriangle, Users, Heart, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarningSigns {
  thoughts: string[];
  feelings: string[];
  behaviors: string[];
}

interface CopingStrategy {
  id: string;
  description: string;
}

interface SupportContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  notes?: string;
}

interface SafetyPlanProps {
  warningSignsData?: WarningSigns;
  copingStrategiesData?: CopingStrategy[];
  supportContactsData?: SupportContact[];
  onSave?: (plan: any) => void;
}

export function SafetyPlan({
  warningSignsData,
  copingStrategiesData = [],
  supportContactsData = [],
  onSave,
}: SafetyPlanProps) {
  const [warningSigns, setWarningSigns] = useState<WarningSigns>(
    warningSignsData || { thoughts: [], feelings: [], behaviors: [] }
  );
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>(copingStrategiesData);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>(supportContactsData);

  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newStrategy, setNewStrategy] = useState('');
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '', notes: '' });

  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      const strategy: CopingStrategy = {
        id: Date.now().toString(),
        description: newStrategy,
      };
      setCopingStrategies([...copingStrategies, strategy]);
      setNewStrategy('');
      setIsAddingStrategy(false);
    }
  };

  const handleDeleteStrategy = (id: string) => {
    setCopingStrategies(copingStrategies.filter(s => s.id !== id));
  };

  const handleAddContact = () => {
    if (newContact.name.trim()) {
      const contact: SupportContact = {
        id: Date.now().toString(),
        ...newContact,
      };
      setSupportContacts([...supportContacts, contact]);
      setNewContact({ name: '', relationship: '', phone: '', notes: '' });
      setIsAddingContact(false);
    }
  };

  const handleDeleteContact = (id: string) => {
    setSupportContacts(supportContacts.filter(c => c.id !== id));
  };

  const handleSave = () => {
    onSave?.({
      warningSigns,
      copingStrategies,
      supportContacts,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="mb-2">Safety Plan</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          A map you create for yourself, for when things get hard. This is yours to define and change.
        </p>
      </div>

      {/* Warning signs */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20">
            <AlertTriangle size={18} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h3 className="text-sm">Warning signs</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              What tells you things are getting harder?
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                Thoughts I notice
              </label>
              <textarea
                value={warningSigns.thoughts.join('\n')}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWarningSigns({
                  ...warningSigns,
                  thoughts: e.target.value.split('\n').filter(t => t.trim()),
                })}
                placeholder="e.g., 'Everyone would be better off without me'"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                Feelings I notice
              </label>
              <textarea
                value={warningSigns.feelings.join('\n')}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWarningSigns({
                  ...warningSigns,
                  feelings: e.target.value.split('\n').filter(f => f.trim()),
                })}
                placeholder="e.g., Overwhelming sadness, numbness, despair"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-2">
                Behaviors I notice
              </label>
              <textarea
                value={warningSigns.behaviors.join('\n')}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setWarningSigns({
                  ...warningSigns,
                  behaviors: e.target.value.split('\n').filter(b => b.trim()),
                })}
                placeholder="e.g., Isolating, skipping meals, sleeping too much or too little"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Coping strategies */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20">
            <Heart size={18} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h3 className="text-sm">What helps</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Things you can do when warning signs appear
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {copingStrategies.map((strategy) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] group"
              >
                <span className="flex-1 text-sm text-[var(--color-text-primary)]">
                  {strategy.description}
                </span>
                <button
                  onClick={() => handleDeleteStrategy(strategy.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAddingStrategy ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newStrategy}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewStrategy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStrategy()}
                placeholder="e.g., Take a walk, call a friend, listen to music"
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
              />
              <button
                onClick={handleAddStrategy}
                disabled={!newStrategy.trim()}
                className="p-2 rounded-lg text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/20 disabled:opacity-30 transition-colors"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => {
                  setIsAddingStrategy(false);
                  setNewStrategy('');
                }}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-base-raised)] transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setIsAddingStrategy(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors w-full"
            >
              <Plus size={16} />
              <span className="text-sm">Add coping strategy</span>
            </button>
          )}
        </div>
      </section>

      {/* Support contacts */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent-gold)]/20">
            <Users size={18} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h3 className="text-sm">People to reach out to</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Who can you call when you need support?
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {supportContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm">{contact.name}</h4>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({contact.relationship})
                      </span>
                    </div>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-xs text-[var(--color-accent-gold)] hover:underline mb-1"
                      >
                        <Phone size={12} />
                        {contact.phone}
                      </a>
                    )}
                    {contact.notes && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAddingContact ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-accent-gold)]"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Name"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                />
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewContact({ ...newContact, relationship: e.target.value })}
                  placeholder="Relationship (e.g., friend, therapist, sibling)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                />
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                />
                <input
                  type="text"
                  value={newContact.notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Notes (optional, e.g., 'Available weekdays after 6pm')"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setIsAddingContact(false);
                      setNewContact({ name: '', relationship: '', phone: '', notes: '' });
                    }}
                    className="px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-base-raised)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={!newContact.name.trim()}
                    className="px-3 py-2 rounded-lg text-sm bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/30 disabled:opacity-30 transition-colors"
                  >
                    Add contact
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setIsAddingContact(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors w-full"
            >
              <Plus size={16} />
              <span className="text-sm">Add support contact</span>
            </button>
          )}
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)]">
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/30 transition-colors"
        >
          Save safety plan
        </button>
      </div>

      {/* Footer note */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          This safety plan is for you, not for anyone else. You can change it anytime. 
          It's a tool, not a rule—use it when it helps, ignore it when it doesn't.
        </p>
      </div>
    </div>
  );
}

