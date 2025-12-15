/**
 * Safety Plan Instrument
 * Personalized crisis management plan
 * Based on evidence-based safety planning
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, User, Phone, Map, Shield, Edit3, Save, X } from 'lucide-react';

interface SafetyPlanData {
  warningSignsidentified: string[];
  copingStrategies: string[];
  distractions: string[];
  supportContacts: Array<{ name: string; phone: string }>;
  professionalContacts: Array<{ name: string; phone: string; role: string }>;
  safeEnvironment: string[];
}

interface SafetyPlanInstrumentProps {
  plan: SafetyPlanData;
  onUpdate: (plan: SafetyPlanData) => void;
  onClose: () => void;
}

export function SafetyPlanInstrument({ plan, onUpdate, onClose }: SafetyPlanInstrumentProps) {
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);

  const handleSave = () => {
    onUpdate(editedPlan);
    setEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Shield size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Safety Plan</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Your personalized plan for difficult moments</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing && (
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-white/5">
                  <Edit3 size={20} className="text-[var(--color-text-muted)]" />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
                <X size={20} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <SectionCard title="Warning Signs" icon={Heart} items={editing ? editedPlan.warningSignsidentified : plan.warningSignsidentified} editing={editing} onChange={(items) => setEditedPlan({...editedPlan, warningSignsidentified: items})} />
          <SectionCard title="Coping Strategies" icon={Shield} items={editing ? editedPlan.copingStrategies : plan.copingStrategies} editing={editing} onChange={(items) => setEditedPlan({...editedPlan, copingStrategies: items})} />
          <SectionCard title="Support Contacts" icon={Phone} items={editing ? editedPlan.supportContacts.map(c => `${c.name}: ${c.phone}`) : plan.supportContacts.map(c => `${c.name}: ${c.phone}`)} editing={editing} onChange={(items) => setEditedPlan({...editedPlan, supportContacts: items.map(i => ({name: i.split(':')[0].trim(), phone: i.split(':')[1]?.trim() || ''}))})} />
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          {editing ? (
            <div className="flex gap-3">
              <button onClick={() => setEditing(false)} className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)]">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]">
                <Save size={18} className="inline mr-2" />Save
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)]">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({title, icon: Icon, items, editing, onChange}: any) {
  return (
    <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-[var(--color-accent-gold)]" />
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      {editing ? (
        <textarea value={items.join('\n')} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value.split('\n'))} rows={4} className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]" />
      ) : (
        <ul className="space-y-2">
          {items.map((item: string, i: number) => (
            <li key={i} className="text-sm text-[var(--color-text-secondary)] pl-4 border-l-2 border-[var(--color-border-subtle)]">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

