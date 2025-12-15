/**
 * Pattern Detection Panel
 * 
 * Constitutional Principles:
 * - User must explicitly enable
 * - User must explicitly summon patterns
 * - Never automatic analysis
 * - Results offered, not imposed
 */

import { useState, useEffect } from 'react';
import { Zap, AlertCircle, TrendingUp } from 'lucide-react';
import { patternDetectionService, Pattern } from '../services/patternDetection';
import { useAppState } from '../hooks/useAppState';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';

export function PatternDetectionPanel() {
  const { reflections } = useAppState();
  const [isEnabled, setIsEnabled] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showEnableModal, setShowEnableModal] = useState(false);

  useEffect(() => {
    setIsEnabled(patternDetectionService.isEnabled());
  }, []);

  const handleEnable = () => {
    patternDetectionService.enable();
    setIsEnabled(true);
    setShowEnableModal(false);
  };

  const handleDisable = () => {
    patternDetectionService.disable();
    setIsEnabled(false);
    setPatterns([]);
  };

  const handleDetectPatterns = async () => {
    if (!isEnabled) {
      setShowEnableModal(true);
      return;
    }

    setIsDetecting(true);
    try {
      const detected = await patternDetectionService.detectPatterns(reflections);
      setPatterns(detected);
    } catch (error) {
      console.error('Pattern detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            isEnabled 
              ? 'bg-[var(--color-accent-blue)]/10' 
              : 'bg-[var(--color-text-muted)]/10'
          }`}>
            <Zap size={24} className={
              isEnabled 
                ? 'text-[var(--color-accent-blue)]' 
                : 'text-[var(--color-text-muted)]'
            } />
          </div>

          <div className="flex-1">
            <h3 className="mb-1">
              Pattern Detection {isEnabled ? 'Enabled' : 'Disabled'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isEnabled 
                ? 'You can now detect patterns in your reflections' 
                : 'Pattern detection is disabled'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      {!isEnabled && (
        <Card variant="emphasis">
          <h4 className="mb-2">What pattern detection does</h4>
          <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>• Finds recurring themes across your reflections</li>
            <li>• Identifies temporal patterns (when you reflect)</li>
            <li>• Detects contradictions and evolution over time</li>
            <li>• Analysis only runs when you explicitly request it</li>
            <li>• You must enable this feature to use it</li>
          </ul>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!isEnabled && (
          <Button
            variant="default"
            onClick={() => setShowEnableModal(true)}
          >
            <Zap size={16} />
            Enable Pattern Detection
          </Button>
        )}

        {isEnabled && (
          <>
            <Button
              variant="default"
              onClick={handleDetectPatterns}
              disabled={isDetecting}
            >
              <TrendingUp size={16} />
              {isDetecting ? 'Detecting...' : 'Detect Patterns'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleDisable}
            >
              Disable Pattern Detection
            </Button>
          </>
        )}
      </div>

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-3">
          <h4>Patterns Found ({patterns.length})</h4>
          
          {patterns.map((pattern) => (
            <Card key={pattern.id} variant="emphasis">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${
                    pattern.confidence > 0.7 
                      ? 'bg-[var(--color-accent-green)]' 
                      : 'bg-[var(--color-accent-gold)]'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{pattern.description}</p>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {pattern.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {pattern.occurrences} occurrences
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>
                      First: {pattern.firstSeen.toLocaleDateString()}
                    </span>
                    <span>
                      Last: {pattern.lastSeen.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No patterns */}
      {isEnabled && patterns.length === 0 && !isDetecting && (
        <Card variant="emphasis">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No patterns detected yet. Try detecting patterns after you have more reflections.
          </p>
        </Card>
      )}

      {/* Enable Modal */}
      <Modal
        isOpen={showEnableModal}
        onClose={() => setShowEnableModal(false)}
        title="Enable Pattern Detection"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-accent-blue)]/10 rounded-lg">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pattern detection analyzes your reflections to find recurring themes, 
              temporal patterns, and evolution over time.
            </p>
          </div>

          <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
            <p><strong>Constitutional promise:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Analysis only runs when you explicitly request it</li>
              <li>• Never automatic or in the background</li>
              <li>• You can disable this anytime</li>
              <li>• Results are offered, not imposed</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleEnable}
            >
              Enable
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowEnableModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
