import { createContext, useContext, useState, ReactNode } from 'react';

export type Tone = 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';

export interface ToneConfig {
  name: Tone;
  accentColor: string;
  tailwindColor: string;
  motion: 'slow' | 'snappy' | 'bouncy' | 'minimal' | 'ultra-slow' | 'sharp';
  density: 'roomy' | 'tight' | 'varied' | 'strict' | 'sparse' | 'bold';
  contrast: 'low' | 'medium' | 'high' | 'low-medium' | 'medium-high' | 'monochrome';
  animationSpeed: number; // multiplier for animation duration
}

export const toneConfigs: Record<Tone, ToneConfig> = {
  soft: {
    name: 'soft',
    accentColor: '#3a8bff',
    tailwindColor: 'mirror-soft',
    motion: 'slow',
    density: 'roomy',
    contrast: 'low-medium',
    animationSpeed: 1.5,
  },
  direct: {
    name: 'direct',
    accentColor: '#9c7c3c',
    tailwindColor: 'mirror-direct',
    motion: 'snappy',
    density: 'tight',
    contrast: 'medium-high',
    animationSpeed: 0.7,
  },
  playful: {
    name: 'playful',
    accentColor: '#ae55ff',
    tailwindColor: 'mirror-playful',
    motion: 'bouncy',
    density: 'varied',
    contrast: 'medium',
    animationSpeed: 0.9,
  },
  austere: {
    name: 'austere',
    accentColor: '#c4c4cf',
    tailwindColor: 'mirror-austere',
    motion: 'minimal',
    density: 'strict',
    contrast: 'monochrome',
    animationSpeed: 1.2,
  },
  silent: {
    name: 'silent',
    accentColor: 'rgba(203, 163, 93, 0.4)',
    tailwindColor: 'mirror-gold',
    motion: 'ultra-slow',
    density: 'sparse',
    contrast: 'low',
    animationSpeed: 2.0,
  },
  provocative: {
    name: 'provocative',
    accentColor: '#f06449',
    tailwindColor: 'mirror-provocative',
    motion: 'sharp',
    density: 'bold',
    contrast: 'high',
    animationSpeed: 0.5,
  },
};

interface ToneContextValue {
  tone: Tone;
  setTone: (tone: Tone) => void;
  config: ToneConfig;
}

const ToneContext = createContext<ToneContextValue | undefined>(undefined);

export function ToneProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<Tone>('direct');

  const value: ToneContextValue = {
    tone,
    setTone,
    config: toneConfigs[tone],
  };

  return <ToneContext.Provider value={value}>{children}</ToneContext.Provider>;
}

export function useTone() {
  const context = useContext(ToneContext);
  if (context === undefined) {
    throw new Error('useTone must be used within a ToneProvider');
  }
  return context;
}

// Utility to get tone-specific classes
export function getToneClasses(tone: Tone) {
  const config = toneConfigs[tone];
  return {
    accent: `text-${config.tailwindColor}`,
    border: `border-${config.tailwindColor}`,
    bg: `bg-${config.tailwindColor}/10`,
    glow: `shadow-[0_0_20px_${config.accentColor}40]`,
  };
}

// Utility to get tone-aware animation duration
export function getToneDuration(baseDuration: number, tone: Tone): number {
  return baseDuration * toneConfigs[tone].animationSpeed;
}
