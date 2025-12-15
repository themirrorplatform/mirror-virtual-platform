import { useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  Sparkles,
  Clock,
  Target,
  Shield,
  Lock,
  Smartphone,
  Database,
  Award,
  FileText,
  Eye,
} from "lucide-react";
import { useMirrorStateContext } from "@/contexts/MirrorStateContext";
import { AnimatePresence } from "framer-motion";
import { PrivacyDashboardInstrument } from "./instruments/PrivacyDashboardInstrument";
import { EncryptionInstrument } from "./instruments/EncryptionInstrument";
import { DeviceRegistryInstrument } from "./instruments/DeviceRegistryInstrument";
import { DatabaseHealthInstrument } from "./instruments/DatabaseHealthInstrument";
import { RecognitionInstrument } from "./instruments/RecognitionInstrument";
import { ConstitutionViewerInstrument } from "./instruments/ConstitutionViewerInstrument";

type SovereigntyInstrument = 
  | 'privacy'
  | 'encryption' 
  | 'devices'
  | 'database'
  | 'recognition'
  | 'constitution'
  | null;

export function SelfView() {
  const { state, actions } = useMirrorStateContext();
  const [activeInstrument, setActiveInstrument] = useState<SovereigntyInstrument>(null);

  const handleInstrumentComplete = (instrumentType: string, data?: any) => {
    setActiveInstrument(null);
    actions.addReceipt({
      id: `${instrumentType}-${Date.now()}`,
      type: 'layer_switch',
      timestamp: new Date().toISOString(),
      title: `${instrumentType} Updated`,
      description: 'Sovereignty settings configured',
      layer: state.layer,
      data: data || {}
    });
  };

  return (
    <>
      {/* Constitutional Instruments */}
      <AnimatePresence>
        {activeInstrument === 'privacy' && (
          <PrivacyDashboardInstrument
            onComplete={(settings) => handleInstrumentComplete('Privacy', settings)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'encryption' && (
          <EncryptionInstrument
            onComplete={(config) => handleInstrumentComplete('Encryption', config)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'devices' && (
          <DeviceRegistryInstrument
            onComplete={(devices) => handleInstrumentComplete('Devices', devices)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'database' && (
          <DatabaseHealthInstrument
            onComplete={(health) => handleInstrumentComplete('Database', health)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'recognition' && (
          <RecognitionInstrument
            onComplete={(status) => handleInstrumentComplete('Recognition', status)}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
        {activeInstrument === 'constitution' && (
          <ConstitutionViewerInstrument
            onComplete={() => handleInstrumentComplete('Constitution')}
            onDismiss={() => setActiveInstrument(null)}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-b from-[#14141a] to-[#0b0b0d]">
        <div className="max-w-[1534px] mx-auto px-[24px] py-[40px]">
          {/* Header with Recognition Status */}
          <div className="mb-[40px]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-['EB_Garamond:Regular',sans-serif] text-[60px] leading-[72px] text-neutral-200 mb-[8px]">
                  Self Realm
                </h1>
                <p className="font-['Inter:Regular',sans-serif] text-[16px] leading-[24px] text-[rgba(196,196,207,0.6)]">
                  Your sovereignty, privacy, and personal evolution
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-lg">
                <Award className="w-4 h-4 text-[#cba35d]" />
                <span className="text-sm text-[#cba35d] capitalize">{state.recognition}</span>
              </div>
            </div>
          </div>

          {/* Sovereignty Controls */}
          <div className="mb-[48px]">
            <h2 className="font-['EB_Garamond:Regular',sans-serif] text-[24px] leading-[32px] text-neutral-200 mb-[24px]">
              Sovereignty & Privacy
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[16px]">
              <SovereigntyButton
                icon={<Eye className="w-5 h-5" />}
                label="Privacy"
                description="Control visibility"
                onClick={() => setActiveInstrument('privacy')}
              />
              <SovereigntyButton
                icon={<Lock className="w-5 h-5" />}
                label="Encryption"
                description="Key management"
                onClick={() => setActiveInstrument('encryption')}
              />
              <SovereigntyButton
                icon={<Smartphone className="w-5 h-5" />}
                label="Devices"
                description="Trusted devices"
                onClick={() => setActiveInstrument('devices')}
              />
              <SovereigntyButton
                icon={<Database className="w-5 h-5" />}
                label="Database"
                description="System health"
                onClick={() => setActiveInstrument('database')}
              />
              <SovereigntyButton
                icon={<Award className="w-5 h-5" />}
                label="Recognition"
                description="Status & rights"
                onClick={() => setActiveInstrument('recognition')}
              />
              <SovereigntyButton
                icon={<FileText className="w-5 h-5" />}
                label="Constitution"
                description="View principles"
                onClick={() => setActiveInstrument('constitution')}
              />
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-[48px]">
          {/* Profile Sidebar */}
          <div className="space-y-[24px]">
            <div className="bg-[rgba(24,24,32,0.6)] border border-[rgba(48,48,58,0.3)] rounded-[24px] p-[32px]">
              {/* Avatar */}
              <div className="w-[120px] h-[120px] mx-auto mb-[24px] bg-gradient-to-br from-[#cba35d] to-[#d6af36] rounded-full flex items-center justify-center">
                <User size={48} className="text-black" />
              </div>

              {/* Name */}
              <h2 className="font-['EB_Garamond:Regular',sans-serif] text-[28px] leading-[36px] text-neutral-200 text-center mb-[8px]">
                You
              </h2>
              <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[rgba(203,163,93,0.7)] text-center mb-[24px]">
                Seeker
              </p>

              {/* Stats */}
              <div className="space-y-[12px] pt-[24px] border-t border-[rgba(48,48,58,0.3)]">
                <div className="flex items-center justify-between">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)]">
                    Member since
                  </span>
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
                    Oct 2024
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)]">
                    Total reflections
                  </span>
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
                    127
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)]">
                    Active threads
                  </span>
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
                    8
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
              <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(203,163,93,0.7)] tracking-[0.7px] uppercase mb-[16px]">
                Recent Activity
              </h3>
              <div className="space-y-[12px]">
                <ActivityItem
                  action="Shared reflection"
                  time="2 hours ago"
                  icon={<Sparkles size={14} />}
                />
                <ActivityItem
                  action="Joined thread"
                  time="1 day ago"
                  icon={<TrendingUp size={14} />}
                />
                <ActivityItem
                  action="Profile update"
                  time="3 days ago"
                  icon={<User size={14} />}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-[32px]">
            {/* Self History Timeline */}
            <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[24px] p-[40px]">
              <h2 className="font-['EB_Garamond:Regular',sans-serif] text-[32px] leading-[40px] text-neutral-200 mb-[32px]">
                Your Journey
              </h2>

              <SelfHistoryTimeline />
            </div>

            {/* Evolution Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
              <MetricCard
                icon={<Target size={24} />}
                label="Clarity Score"
                value="87%"
                trend="+12%"
                color="#4ed4a7"
              />
              <MetricCard
                icon={<Activity size={24} />}
                label="Engagement"
                value="94%"
                trend="+5%"
                color="#3a8bff"
              />
              <MetricCard
                icon={<Sparkles size={24} />}
                label="Breakthrough Rate"
                value="23%"
                trend="+8%"
                color="#cba35d"
              />
            </div>

            {/* Personal Themes */}
            <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[24px] p-[40px]">
              <h2 className="font-['EB_Garamond:Regular',sans-serif] text-[32px] leading-[40px] text-neutral-200 mb-[24px]">
                Recurring Themes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <ThemeCard
                  title="Pattern Recognition"
                  count={34}
                  description="You frequently explore cycles and recurring behaviors"
                  color="#cba35d"
                />
                <ThemeCard
                  title="Self-Observation"
                  count={28}
                  description="Deep interest in awareness and meta-cognition"
                  color="#4ed4a7"
                />
                <ThemeCard
                  title="Change & Resistance"
                  count={21}
                  description="Exploring the gap between knowing and doing"
                  color="#3a8bff"
                />
                <ThemeCard
                  title="Paradox"
                  count={18}
                  description="Engaging with contradictions and dualities"
                  color="#f5a623"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfHistoryTimeline() {
  const events = [
    {
      date: "Dec 2024",
      title: "Major Breakthrough",
      description:
        "Connected awareness patterns to embodied action",
      type: "breakthrough",
    },
    {
      date: "Nov 2024",
      title: "Thread Evolution",
      description:
        "The Awareness Paradox thread reached 8 reflections",
      type: "milestone",
    },
    {
      date: "Oct 2024",
      title: "First Reflection",
      description:
        "Began exploring consciousness and self-observation",
      type: "start",
    },
  ];

  return (
    <div className="space-y-[24px]">
      {events.map((event, index) => (
        <div key={index} className="relative pl-[32px]">
          {/* Timeline line */}
          {index < events.length - 1 && (
            <div className="absolute left-[7px] top-[24px] bottom-[-24px] w-[2px] bg-[rgba(203,163,93,0.2)]" />
          )}

          {/* Timeline dot */}
          <div
            className={`absolute left-0 top-[4px] w-[16px] h-[16px] rounded-full border-2 ${
              event.type === "breakthrough"
                ? "bg-[#cba35d] border-[#cba35d]"
                : event.type === "milestone"
                  ? "bg-[#4ed4a7] border-[#4ed4a7]"
                  : "bg-[#3a8bff] border-[#3a8bff]"
            }`}
          />

          <div>
            <div className="flex items-center gap-[12px] mb-[4px]">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.6)]">
                {event.date}
              </span>
              {event.type === "breakthrough" && (
                <span className="flex items-center gap-[4px] px-[8px] py-[2px] bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-full">
                  <Sparkles
                    size={10}
                    className="text-[#cba35d]"
                  />
                  <span className="font-['Inter:Regular',sans-serif] text-[10px] text-[#cba35d]">
                    Breakthrough
                  </span>
                </span>
              )}
            </div>
            <h4 className="font-['Inter:Medium',sans-serif] text-[16px] text-neutral-200 mb-[4px]">
              {event.title}
            </h4>
            <p className="font-['Inter:Regular',sans-serif] text-[14px] text-[rgba(196,196,207,0.7)]">
              {event.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: string;
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  color,
}: MetricCardProps) {
  return (
    <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
      <div className="flex items-center gap-[12px] mb-[16px]">
        <div style={{ color }}>{icon}</div>
        <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)] tracking-[0.6px] uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-['EB_Garamond:Regular',sans-serif] text-[36px] leading-[40px] text-neutral-200">
          {value}
        </span>
        <span className="font-['Inter:Regular',sans-serif] text-[14px] text-[#4ed4a7] mb-[4px]">
          {trend}
        </span>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  title: string;
  count: number;
  description: string;
  color: string;
}

function ThemeCard({
  title,
  count,
  description,
  color,
}: ThemeCardProps) {
  return (
    <div className="bg-[rgba(11,11,13,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[20px]">
      <div className="flex items-center justify-between mb-[12px]">
        <h4 className="font-['Inter:Medium',sans-serif] text-[16px] text-neutral-200">
          {title}
        </h4>
        <div
          className="px-[12px] py-[4px] rounded-full text-black font-['Inter:Medium',sans-serif] text-[12px]"
          style={{ backgroundColor: color }}
        >
          {count}
        </div>
      </div>
      <p className="font-['Inter:Regular',sans-serif] text-[13px] leading-[20px] text-[rgba(196,196,207,0.6)]">
        {description}
      </p>
    </div>
  );
}

interface ActivityItemProps {
  action: string;
  time: string;
  icon: React.ReactNode;
}

function ActivityItem({
  action,
  time,
  icon,
}: ActivityItemProps) {
  return (
    <div className="flex items-center gap-[12px]">
      <div className="text-[rgba(203,163,93,0.6)]">{icon}</div>
      <div className="flex-1">
        <p className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
          {action}
        </p>
        <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[rgba(196,196,207,0.5)]">
          {time}
        </p>
      </div>
    </div>
  );
}

interface SovereigntyButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function SovereigntyButton({
  icon,
  label,
  description,
  onClick,
}: SovereigntyButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-[rgba(24,24,32,0.6)] border border-[rgba(48,48,58,0.3)] hover:border-[rgba(203,163,93,0.4)] rounded-[16px] p-[20px] text-left transition-all hover:bg-[rgba(24,24,32,0.8)] group"
    >
      <div className="text-[rgba(203,163,93,0.7)] group-hover:text-[#cba35d] mb-[12px] transition-colors">
        {icon}
      </div>
      <h4 className="font-['Inter:Medium',sans-serif] text-[14px] text-neutral-200 mb-[4px]">
        {label}
      </h4>
      <p className="font-['Inter:Regular',sans-serif] text-[11px] text-[rgba(196,196,207,0.6)]">
        {description}
      </p>
    </button>
  );
}