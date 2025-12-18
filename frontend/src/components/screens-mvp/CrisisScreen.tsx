import { useState, useEffect } from 'react';
import { Heart, Phone, Wind, FileText, X, AlertTriangle, TrendingUp, Calendar, Users } from 'lucide-react';
import { SupportResources } from '../SupportResources';
import { PauseAndGround } from '../PauseAndGround';
import { SafetyPlan } from '../SafetyPlan';
import { motion } from 'framer-motion';
import { crisis, type CrisisResource, type SafetyEvent, type GroundingExercise } from '@/lib/api';

type ViewMode = 'home' | 'resources' | 'ground' | 'plan' | 'history' | 'check-in';

export function CrisisScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskSeverity, setRiskSeverity] = useState<string>('');
  const [recentEvents, setRecentEvents] = useState<SafetyEvent[]>([]);
  const [crisisResources, setCrisisResources] = useState<CrisisResource[]>([]);
  const [groundingExercises, setGroundingExercises] = useState<GroundingExercise[]>([]);
  const [hasSafetyPlan, setHasSafetyPlan] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Load crisis data on mount
  useEffect(() => {
    loadCrisisData();
  }, []);

  const loadCrisisData = async () => {
    try {
      setLoading(true);
      
      // Load risk score
      try {
        const riskData = await crisis.getRiskScore();
        setRiskScore(riskData.data.risk_score);
        setRiskSeverity(riskData.data.severity);
      } catch (err) {
        console.log('No risk score available yet');
      }

      // Load recent events
      try {
        const eventsData = await crisis.getEvents({ limit: 10 });
        setRecentEvents(eventsData.data.events);
      } catch (err) {
        console.log('No events found');
      }

      // Load crisis resources
      try {
        const resourcesData = await crisis.getResources('US');
        setCrisisResources(resourcesData.data.resources);
      } catch (err) {
        console.log('Failed to load resources');
      }

      // Load grounding exercises
      try {
        const exercisesData = await crisis.getGroundingExercises();
        setGroundingExercises(exercisesData.data.exercises);
      } catch (err) {
        console.log('Failed to load exercises');
      }

      // Check if safety plan exists
      try {
        await crisis.getSafetyPlan();
        setHasSafetyPlan(true);
      } catch (err) {
        setHasSafetyPlan(false);
      }
    } catch (error) {
      console.error('Failed to load crisis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (mood: string, notes: string) => {
    try {
      await crisis.checkIn({ mood, notes });
      await loadCrisisData(); // Reload data after check-in
      setViewMode('home');
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    }
  };

  const handleEscalate = async () => {
    if (!confirm('This will alert your designated guardians. Continue?')) {
      return;
    }
    
    try {
      await crisis.escalate({
        reason: 'User manually requested crisis escalation',
        request_guardian_contact: true
      });
      alert('Your guardians have been notified. Help is on the way.');
    } catch (error) {
      console.error('Failed to escalate crisis:', error);
      alert('Failed to send alerts. Please call 988 directly.');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'text-red-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskLabel = (severity: string) => {
    if (severity === 'critical') return 'High Risk';
    if (severity === 'warning') return 'Elevated';
    return 'Stable';
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {viewMode === 'home' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <h1>You're here</h1>
              <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
                That's enough for right now. You don't have to solve anything. 
                You can just be here, and that's okay.
              </p>
            </div>

            {/* Risk Score Display */}
            {!loading && riskScore !== null && (
              <div className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className={getRiskColor(riskScore)} />
                    <div>
                      <div className="text-sm text-[var(--color-text-muted)]">Current Status</div>
                      <div className="font-medium">{getRiskLabel(riskSeverity)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewMode('check-in')}
                    className="text-sm px-4 py-2 rounded-lg bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/20 transition-colors"
                  >
                    Check In
                  </button>
                </div>
              </div>
            )}

            {/* Immediate support callout */}
            <div className="p-6 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 text-center">
              <h3 className="mb-2">If this moment feels urgent</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                988 Suicide & Crisis Lifeline — 24/7, free, confidential
              </p>
              <div className="flex gap-3 justify-center">
                <a
                  href="tel:988"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent-gold)] text-black hover:bg-[var(--color-accent-gold)]/90 transition-colors"
                >
                  <Phone size={18} />
                  Call 988
                </a>
                <a
                  href="sms:741741?body=HELLO"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-accent-gold)] transition-colors"
                >
                  Text 741741
                </a>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setViewMode('ground')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <Wind size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Pause & Ground</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Breathing, grounding, finding solid ground right now
                </p>
              </button>

              <button
                onClick={() => setViewMode('resources')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <Phone size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Support Resources</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Hotlines, crisis text lines, peer support
                </p>
              </button>

              <button
                onClick={() => setViewMode('plan')}
                className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left group"
              >
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/20 inline-block group-hover:bg-[var(--color-accent-gold)]/30 transition-colors">
                  <FileText size={24} className="text-[var(--color-accent-gold)]" />
                </div>
                <h3 className="mb-2">Safety Plan</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {hasSafetyPlan ? 'View and update your safety plan' : 'Create your personal safety plan'}
                </p>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setViewMode('history')}
                className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-left flex items-center gap-3"
              >
                <Calendar size={20} className="text-[var(--color-text-muted)]" />
                <div>
                  <div className="font-medium text-sm">Crisis History</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {recentEvents.length} recent events
                  </div>
                </div>
              </button>

              <button
                onClick={handleEscalate}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors text-left flex items-center gap-3"
              >
                <AlertTriangle size={20} className="text-red-500" />
                <div>
                  <div className="font-medium text-sm text-red-500">Alert Guardians</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    Notify your support network
                  </div>
                </div>
              </button>
            </div>

            {/* Exit */}
            <div className="text-center pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                <X size={16} />
                Return to Mirror
              </a>
            </div>

            {/* Spacer for breathing room */}
            <div className="h-16" />
          </motion.div>
        )}

        {viewMode === 'resources' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <SupportResources
              onClose={() => setViewMode('home')}
            />
          </motion.div>
        )}

        {viewMode === 'ground' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <PauseAndGround
              onComplete={() => setViewMode('home')}
              onSkip={() => setViewMode('home')}
            />
          </motion.div>
        )}

        {viewMode === 'plan' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <SafetyPlan
              onSave={async (plan) => {
                try {
                  if (hasSafetyPlan) {
                    await crisis.updateSafetyPlan(plan);
                  } else {
                    await crisis.createSafetyPlan(plan);
                  }
                  await loadCrisisData();
                  alert('Safety plan saved successfully');
                } catch (error) {
                  console.error('Failed to save safety plan:', error);
                  alert('Failed to save safety plan');
                }
              }}
            />
          </motion.div>
        )}

        {viewMode === 'history' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-medium">Crisis History</h2>
              <p className="text-[var(--color-text-secondary)]">
                Your recent check-ins and safety events
              </p>
              
              <div className="space-y-3">
                {recentEvents.length === 0 ? (
                  <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-center">
                    <Calendar size={32} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-secondary)]">No events recorded yet</p>
                  </div>
                ) : (
                  recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            event.severity === 'critical' ? 'bg-red-500' :
                            event.severity === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="font-medium capitalize">{event.category.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {new Date(event.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {event.action_taken && (
                        <p className="text-sm text-[var(--color-text-secondary)]">{event.action_taken}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'check-in' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-6">
              <button
                onClick={() => setViewMode('home')}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors"
              >
                ← Back
              </button>
            </div>
            <CheckInForm onSubmit={handleCheckIn} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Check-in form component
function CheckInForm({ onSubmit }: { onSubmit: (mood: string, notes: string) => void }) {
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');

  const moods = [
    { value: 'struggling', label: 'Struggling', color: 'bg-red-500' },
    { value: 'difficult', label: 'Difficult', color: 'bg-orange-500' },
    { value: 'okay', label: 'Okay', color: 'bg-yellow-500' },
    { value: 'good', label: 'Good', color: 'bg-green-500' },
    { value: 'great', label: 'Great', color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium mb-2">Check In</h2>
        <p className="text-[var(--color-text-secondary)]">
          How are you doing right now?
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Current mood</label>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                mood === m.value
                  ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] hover:border-[var(--color-accent-gold)]/50'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${m.color} mx-auto mb-2`} />
              <div className="text-xs">{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent-gold)] focus:outline-none resize-none"
          rows={4}
        />
      </div>

      <button
        onClick={() => mood && onSubmit(mood, notes)}
        disabled={!mood}
        className="w-full py-3 rounded-lg bg-[var(--color-accent-gold)] text-black hover:bg-[var(--color-accent-gold)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Check-In
      </button>
    </div>
  );
}
