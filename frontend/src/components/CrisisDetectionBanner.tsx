/**
 * Crisis Detection Banner
 * Appears when concerning patterns are detected
 * Constitutional: Gentle, never coercive, always dismissible
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Phone, MessageCircle, ExternalLink } from 'lucide-react';

interface CrisisResource {
  name: string;
  phone: string;
  available: string;
  description: string;
}

const crisisResources: CrisisResource[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    available: '24/7',
    description: 'Free and confidential support',
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    available: '24/7',
    description: 'Text-based crisis support',
  },
  {
    name: 'International Association for Suicide Prevention',
    phone: 'Visit iasp.info',
    available: 'Global directory',
    description: 'Find local resources worldwide',
  },
];

interface CrisisDetectionBannerProps {
  isVisible: boolean;
  onDismiss: () => void;
  severity?: 'concern' | 'urgent';
}

export function CrisisDetectionBanner({ 
  isVisible, 
  onDismiss,
  severity = 'concern'
}: CrisisDetectionBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-full max-w-2xl px-4"
        >
          <div 
            className={`
              bg-gradient-to-r backdrop-blur-xl rounded-xl shadow-2xl border-2
              ${severity === 'urgent' 
                ? 'from-red-500/20 to-orange-500/20 border-red-500/50' 
                : 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
              }
            `}
          >
            {/* Main Banner */}
            <div className="p-4 flex items-start gap-4">
              <div className={`p-2 rounded-full ${severity === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                <AlertCircle size={24} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">
                  {severity === 'urgent' ? 'Immediate Support Available' : 'Support Resources Available'}
                </h3>
                <p className="text-sm text-white/90 mb-3">
                  {severity === 'urgent' 
                    ? 'If you\'re in crisis, please reach out. You don\'t have to face this alone.'
                    : 'It seems like you might be going through a difficult time. Help is available.'
                  }
                </p>
                
                {!isExpanded && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all flex items-center gap-2"
                    >
                      <Phone size={16} />
                      View Resources
                    </button>
                    <button
                      onClick={onDismiss}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onDismiss}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Expanded Resources */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                    {crisisResources.map((resource) => (
                      <div
                        key={resource.name}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-white">{resource.name}</h4>
                            <p className="text-sm text-white/80">{resource.description}</p>
                          </div>
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                            {resource.available}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Phone size={16} />
                          <span className="font-mono font-medium">{resource.phone}</span>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-white/90">
                        <strong>Note:</strong> The Mirror never shares your reflections without your explicit consent. 
                        These resources are shown based on pattern detection, not data sharing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
