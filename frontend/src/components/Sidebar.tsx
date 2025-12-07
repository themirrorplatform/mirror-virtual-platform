import { Check, Circle } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="space-y-[24px]">
      <StartHereWidget />
      <PrinciplesWidget />
      <AIInsightsWidget />
    </div>
  );
}

function StartHereWidget() {
  const tasks = [
    { label: 'Complete your profile', completed: true },
    { label: 'Share your first reflection', completed: true },
    { label: 'Appreciate 3 reflections', completed: false },
    { label: 'Join a Reflection Circle', completed: false },
    { label: 'Add a wishlist item', completed: false },
  ];

  return (
    <div className="bg-[#0e0e0e] border border-[#232323] rounded-[14px] p-[25px]">
      <h3 className="font-['Inter:Medium',sans-serif] text-[18px] leading-[25.2px] text-white tracking-[-0.18px] mb-[16px]">
        Start Here
      </h3>
      <div className="space-y-[12px]">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-center gap-[12px]">
            <div className={task.completed ? 'text-[#d6af36]' : 'text-[#bdbdbd]'}>
              {task.completed ? <Check size={20} /> : <Circle size={20} />}
            </div>
            <span className={`font-['Inter:Regular',sans-serif] text-[12px] leading-[17.143px] ${
              task.completed ? 'text-[#bdbdbd] line-through' : 'text-white'
            }`}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrinciplesWidget() {
  const principles = [
    'Reflection before reaction.',
    'Curiosity over certainty.',
    'Contradiction ≠ conflict.',
    'Speak honestly. Read deeply.',
    'Every voice is a mirror.',
  ];

  return (
    <div className="bg-[#0e0e0e] border border-[#232323] rounded-[14px] p-[25px]">
      <h3 className="font-['Inter:Medium',sans-serif] text-[18px] leading-[25.2px] text-white tracking-[-0.18px] mb-[16px]">
        Principles of Reflection
      </h3>
      <div className="space-y-[12px]">
        {principles.map((principle, index) => (
          <div key={index} className="flex items-start gap-[12px]">
            <span className="font-['Inter:Regular',sans-serif] text-[14px] leading-[21px] text-[#d6af36]">
              {index + 1}.
            </span>
            <p className="font-['Times_New_Roman:Italic',sans-serif] italic text-[12px] leading-[17.143px] text-[#bdbdbd]">
              {principle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsWidget() {
  return (
    <div className="bg-gradient-to-b from-[#0e0e0e] to-[#000000] border border-[#232323] rounded-[14px] p-[25px] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[#d6af36] opacity-5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-[8px] mb-[12px]">
          <div className="w-[24px] h-[24px] bg-gradient-to-br from-[#d6af36] to-[#ffd700] rounded-full flex items-center justify-center">
            <span className="text-black text-[12px]">✨</span>
          </div>
          <h3 className="font-['Inter:Medium',sans-serif] text-[18px] leading-[25.2px] text-white tracking-[-0.18px]">
            MirrorX Insights
          </h3>
        </div>
        
        <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[17.143px] text-[#bdbdbd] mb-[12px]">
          Based on your recent activity, MirrorX suggests exploring:
        </p>

        <div className="space-y-[8px]">
          <div className="bg-[rgba(214,175,54,0.1)] border border-[rgba(214,175,54,0.2)] rounded-[8px] px-[12px] py-[8px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-white">
              "The Nature of Time" discussion
            </p>
          </div>
          <div className="bg-[rgba(214,175,54,0.1)] border border-[rgba(214,175,54,0.2)] rounded-[8px] px-[12px] py-[8px]">
            <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-white">
              Connect with @DrJamesFoster
            </p>
          </div>
        </div>

        <button className="w-full mt-[12px] py-[8px] border border-[#d6af36] rounded-[8px] text-[#d6af36] hover:bg-[rgba(214,175,54,0.1)] transition-colors">
          <span className="font-['Inter:Regular',sans-serif] text-[11px]">
            View All Insights
          </span>
        </button>
      </div>
    </div>
  );
}
