/**
 * Layer Shifter - Switch between Sovereign/Commons/Builder contexts
 */

import { motion } from 'motion/react';
import { Layers, User, Users, Wrench } from 'lucide-react';

interface LayerShifterProps {
  currentLayer: 'sovereign' | 'commons' | 'builder';
  onLayerChange: (layer: 'sovereign' | 'commons' | 'builder') => void;
  commonsEnabled: boolean;
}

export function LayerShifter({ currentLayer, onLayerChange, commonsEnabled }: LayerShifterProps) {
  const layers = [
    {
      id: 'sovereign' as const,
      name: 'Sovereign',
      description: 'Personal reflection space',
      icon: User,
      color: 'rgba(203, 163, 93, 0.6)', // Gold
      available: true,
    },
    {
      id: 'commons' as const,
      name: 'Commons',
      description: 'Shared witnessing space',
      icon: Users,
      color: 'rgba(147, 112, 219, 0.6)', // Violet
      available: commonsEnabled,
    },
    {
      id: 'builder' as const,
      name: 'Builder',
      description: 'Constitutional development',
      icon: Wrench,
      color: 'rgba(64, 224, 208, 0.6)', // Cyan
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Layers size={18} />
          <span className="text-sm">Current context</span>
        </div>
        <h3 className="text-2xl text-[var(--color-text-primary)]">
          {layers.find(l => l.id === currentLayer)?.name}
        </h3>
        <p className="text-[var(--color-text-secondary)]">
          {layers.find(l => l.id === currentLayer)?.description}
        </p>
      </div>

      <div className="space-y-3">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = currentLayer === layer.id;
          const isAvailable = layer.available;

          return (
            <button
              key={layer.id}
              onClick={() => isAvailable && onLayerChange(layer.id)}
              disabled={!isAvailable}
              className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                !isAvailable
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${layer.color}20, ${layer.color}05)`
                  : 'rgba(255, 255, 255, 0.02)',
                borderColor: isActive ? layer.color : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isActive ? `0 0 30px ${layer.color}40` : 'none',
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="p-3 rounded-xl flex-shrink-0"
                  style={{
                    background: `${layer.color}20`,
                    color: layer.color,
                  }}
                >
                  <Icon size={24} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-[var(--color-text-primary)]">
                      {layer.name}
                    </span>
                    {isActive && (
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          background: `${layer.color}30`,
                          color: layer.color,
                        }}
                      >
                        active
                      </span>
                    )}
                    {!isAvailable && (
                      <span className="text-xs px-3 py-1 rounded-full bg-[var(--color-base-raised)] text-[var(--color-text-muted)]">
                        locked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {layer.description}
                  </p>

                  {!isAvailable && layer.id === 'commons' && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Enable Commons in settings to access
                    </p>
                  )}
                </div>
              </div>

              {isActive && (
                <motion.div
                  layoutId="layer-indicator"
                  className="mt-4 h-1 rounded-full"
                  style={{
                    background: layer.color,
                    boxShadow: `0 0 20px ${layer.color}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-[var(--color-base-raised)] rounded-xl text-sm text-[var(--color-text-muted)]">
        <p>
          Layers determine which instruments are available and how data flows. 
          Switch contexts to access different modes of reflection.
        </p>
      </div>
    </div>
  );
}
