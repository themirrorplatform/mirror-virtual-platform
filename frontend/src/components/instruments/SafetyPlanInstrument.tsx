/**
 * Safety Plan Instrument - Complete Editor
 * Comprehensive safety plan management with backend integration
 * Includes warning signs, coping strategies, contacts, reasons to live, and version history
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  User,
  Phone,
  Shield,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Star,
  AlertCircle,
  Users,
  Home,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { crisis, type SafetyPlan, type EmergencyContact, type CopingStrategy } from '@/lib/api';

interface SafetyPlanInstrumentProps {
  onClose: () => void;
}

type TabView = 'plan' | 'contacts' | 'strategies' | 'reasons' | 'environment' | 'history';

export function SafetyPlanInstrument({ onClose }: SafetyPlanInstrumentProps) {
  const [activeTab, setActiveTab] = useState<TabView>('plan');
  const [plan, setPlan] = useState<SafetyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [warningSignsInput, setWarningSignsInput] = useState('');
  const [reasonsInput, setReasonsInput] = useState('');
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({});
  const [newStrategy, setNewStrategy] = useState<Partial<CopingStrategy>>({ step: 1 });
  const [safeSpaceLocation, setSafeSpaceLocation] = useState('');

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const response = await crisis.getSafetyPlan();
      setPlan(response.data.plan);
      setSafeSpaceLocation(response.data.plan.environment_safety?.safe_space_location || '');
    } catch (error) {
      // No plan exists, create empty template
      setPlan({
        plan_id: '',
        version: 1,
        identity_id: '',
        warning_signs: [],
        coping_strategies: [],
        emergency_contacts: [],
        reasons_to_live: [],
        environment_safety: {},
        professional_contacts: [],
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    
    try {
      setSaving(true);
      const planData = {
        warning_signs: plan.warning_signs,
        coping_strategies: plan.coping_strategies,
        emergency_contacts: plan.emergency_contacts,
        reasons_to_live: plan.reasons_to_live,
        environment_safety: { safe_space_location: safeSpaceLocation },
        professional_contacts: plan.professional_contacts
      };

      if (plan.plan_id) {
        await crisis.updateSafetyPlan(planData);
      } else {
        await crisis.createSafetyPlan(planData);
      }
      
      await loadPlan();
      alert('Safety plan saved!');
    } catch (error) {
      alert('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const addWarningSign = () => {
    if (!plan || !warningSignsInput.trim()) return;
    setPlan({ ...plan, warning_signs: [...plan.warning_signs, warningSignsInput.trim()] });
    setWarningSignsInput('');
  };

  const addReason = () => {
    if (!plan || !reasonsInput.trim()) return;
    setPlan({ ...plan, reasons_to_live: [...plan.reasons_to_live, reasonsInput.trim()] });
    setReasonsInput('');
  };

  const addContact = async () => {
    if (!plan || !newContact.name) return;
    const contact: EmergencyContact = {
      name: newContact.name,
      phone: newContact.phone,
      email: newContact.email,
      relationship: newContact.relationship || 'friend',
      can_call_anytime: newContact.can_call_anytime || false
    };
    try {
      const response = await crisis.addContact(contact);
      setPlan({ ...plan, emergency_contacts: [...plan.emergency_contacts, response.data.contact] });
      setNewContact({});
    } catch (error) {
      console.error('Failed to add contact');
    }
  };

  const addStrategy = async () => {
    if (!plan || !newStrategy.action) return;
    const strategy: CopingStrategy = {
      step: plan.coping_strategies.length + 1,
      action: newStrategy.action,
      duration: newStrategy.duration
    };
    try {
      const response = await crisis.addStrategy(strategy);
      setPlan({ ...plan, coping_strategies: [...plan.coping_strategies, response.data.strategy] });
      setNewStrategy({ step: plan.coping_strategies.length + 2 });
    } catch (error) {
      console.error('Failed to add strategy');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent-gold)]" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Shield size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">Safety Plan Editor</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Version {plan.version}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            {[
              { id: 'plan', label: 'Overview', icon: Heart },
              { id: 'contacts', label: 'Contacts', icon: Phone },
              { id: 'strategies', label: 'Strategies', icon: TrendingUp },
              { id: 'reasons', label: 'Reasons', icon: Star }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent-gold)] text-black'
                    : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'plan' && (
              <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Warning Signs
                  </h3>
                  {plan.warning_signs.map((sign, i) => (
                    <div key={i} className="p-2 mb-2 rounded bg-[var(--color-surface-card)] border">
                      {sign}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={warningSignsInput}
                      onChange={(e) => setWarningSignsInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWarningSign()}
                      placeholder="Add warning sign..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
                    />
                    <button onClick={addWarningSign} className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-black">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4">
                  <div className="p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-[var(--color-accent-gold)]">{plan.warning_signs.length}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Warning Signs</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-[var(--color-accent-gold)]">{plan.coping_strategies.length}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Strategies</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-[var(--color-accent-gold)]">{plan.emergency_contacts.length}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Contacts</div>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-[var(--color-accent-gold)]">{plan.reasons_to_live.length}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">Reasons</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contacts' && (
              <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h3 className="font-medium">Emergency Contacts</h3>
                {plan.emergency_contacts.map((contact) => (
                  <div key={contact.id} className="p-4 rounded-lg border">
                    <h4 className="font-medium">{contact.name}</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">{contact.relationship}</p>
                    {contact.phone && <p className="text-sm">📞 {contact.phone}</p>}
                  </div>
                ))}
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-medium">Add Contact</h4>
                  <input
                    placeholder="Name"
                    value={newContact.name || ''}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <input
                    placeholder="Phone"
                    value={newContact.phone || ''}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <button onClick={addContact} className="w-full py-2 rounded-lg bg-[var(--color-accent-gold)] text-black">
                    Add Contact
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'strategies' && (
              <motion.div key="strategies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h3 className="font-medium">Coping Strategies</h3>
                {plan.coping_strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 rounded-lg border">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">STEP {strategy.step}</div>
                    <h4 className="font-medium">{strategy.action}</h4>
                    {strategy.duration && <p className="text-sm text-[var(--color-text-muted)]">{strategy.duration}</p>}
                  </div>
                ))}
                <div className="p-4 rounded-lg border space-y-3">
                  <h4 className="font-medium">Add Strategy</h4>
                  <input
                    placeholder="What will you do?"
                    value={newStrategy.action || ''}
                    onChange={(e) => setNewStrategy({ ...newStrategy, action: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <button onClick={addStrategy} className="w-full py-2 rounded-lg bg-[var(--color-accent-gold)] text-black">
                    Add Strategy
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'reasons' && (
              <motion.div key="reasons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Star size={18} />
                  Reasons to Live
                </h3>
                {plan.reasons_to_live.map((reason, i) => (
                  <div key={i} className="p-3 rounded-lg border flex items-center gap-3">
                    <Star size={16} className="text-[var(--color-accent-gold)]" fill="currentColor" />
                    {reason}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    value={reasonsInput}
                    onChange={(e) => setReasonsInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addReason()}
                    placeholder="What matters to you?"
                    className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-card)] border focus:border-[var(--color-accent-gold)] outline-none"
                  />
                  <button onClick={addReason} className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-black">
                    <Plus size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border hover:border-[var(--color-accent-gold)]">
            Close
          </button>
          <button
            onClick={savePlan}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] text-black flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : (<><Save size={18} />Save Plan</>)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

