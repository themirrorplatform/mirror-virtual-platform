import React, { useState } from 'react';
import { Settings, Power, Zap, Target, Ban, Clock, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

/**
 * FinderSettings - Finder Configuration Component
 * 
 * Features:
 * - Mode selector: first_mirror, active, manual, random, off
 * - Bandwidth limit slider (1-10 doors)
 * - Blocked nodes list with unblock action
 * - Timing preferences (quiet hours, frequency)
 * 
 * Constitutional Note: User control over recommendation algorithms
 * is a core principle. No forced engagement, no hidden overrides.
 */

type FinderMode = 'first_mirror' | 'active' | 'manual' | 'random' | 'off';

interface BlockedNode {
  id: string;
  label: string;
  nodeType: 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
  blockedAt: string;
}

interface FinderSettingsProps {
  currentConfig: {
    mode: FinderMode;
    bandwidthLimit: number;
    blockedNodes: BlockedNode[];
    quietHoursEnabled: boolean;
    quietHoursStart?: string; // "22:00"
    quietHoursEnd?: string; // "08:00"
    deliveryFrequency: 'realtime' | 'daily' | 'weekly';
  };
  onSave: (config: {
    mode: FinderMode;
    bandwidthLimit: number;
    quietHoursEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    deliveryFrequency: 'realtime' | 'daily' | 'weekly';
  }) => Promise<void>;
  onUnblockNode?: (nodeId: string) => void;
}

export function FinderSettings({
  currentConfig,
  onSave,
  onUnblockNode
}: FinderSettingsProps) {
  const [mode, setMode] = useState<FinderMode>(currentConfig.mode);
  const [bandwidthLimit, setBandwidthLimit] = useState(currentConfig.bandwidthLimit);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(currentConfig.quietHoursEnabled);
  const [quietHoursStart, setQuietHoursStart] = useState(currentConfig.quietHoursStart || '22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState(currentConfig.quietHoursEnd || '08:00');
  const [deliveryFrequency, setDeliveryFrequency] = useState(currentConfig.deliveryFrequency);
  const [isSaving, setIsSaving] = useState(false);

  // Mode descriptions
  const modeInfo: Record<FinderMode, { description: string; icon: typeof Power }> = {
    first_mirror: {
      description: 'Recommended for new users. Finder suggests only when you first reflect.',
      icon: Target
    },
    active: {
      description: 'Finder actively suggests doors based on your posture and tensions.',
      icon: Zap
    },
    manual: {
      description: 'You control when Finder runs. No automatic suggestions.',
      icon: Power
    },
    random: {
      description: 'Random doors from your graph. No algorithmic curation.',
      icon: Target
    },
    off: {
      description: 'Finder is completely disabled. You explore manually.',
      icon: Ban
    }
  };

  // Check if there are unsaved changes
  const hasChanges =
    mode !== currentConfig.mode ||
    bandwidthLimit !== currentConfig.bandwidthLimit ||
    quietHoursEnabled !== currentConfig.quietHoursEnabled ||
    quietHoursStart !== (currentConfig.quietHoursStart || '22:00') ||
    quietHoursEnd !== (currentConfig.quietHoursEnd || '08:00') ||
    deliveryFrequency !== currentConfig.deliveryFrequency;

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mode,
        bandwidthLimit,
        quietHoursEnabled,
        quietHoursStart: quietHoursEnabled ? quietHoursStart : undefined,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : undefined,
        deliveryFrequency
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" />
          Finder Settings
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Control how Finder surfaces recommendations
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Finder Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(modeInfo) as FinderMode[]).map((modeKey) => {
            const info = modeInfo[modeKey];
            const Icon = info.icon;
            return (
              <button
                key={modeKey}
                onClick={() => setMode(modeKey)}
                className={`w-full p-4 border-2 rounded-lg flex items-start gap-4 transition-colors text-left ${
                  mode === modeKey
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-5 w-5 mt-0.5 ${
                  mode === modeKey ? 'text-purple-600' : 'text-gray-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {modeKey.replace('_', ' ')}
                    </span>
                    {mode === modeKey && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Bandwidth Limit */}
      {mode !== 'off' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bandwidth Limit</CardTitle>
            <p className="text-sm text-gray-600">
              Maximum number of doors to show at once
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Doors per session:</span>
              <Badge variant="outline" className="text-lg px-3">
                {bandwidthLimit}
              </Badge>
            </div>
            <Slider
              value={[bandwidthLimit]}
              onValueChange={(values) => setBandwidthLimit(values[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (minimal)</span>
              <span>5 (balanced)</span>
              <span>10 (maximum)</span>
            </div>
            <p className="text-xs text-gray-600 italic">
              Lower bandwidth = more focused. Higher bandwidth = more options.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quiet Hours */}
      {mode === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
            <p className="text-sm text-gray-600">
              Pause Finder during specific hours
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="quietHours"
                checked={quietHoursEnabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuietHoursEnabled(e.target.checked)}
                className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="quietHours" className="text-sm font-medium">
                Enable quiet hours
              </label>
            </div>

            {quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Start time</label>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuietHoursStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">End time</label>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuietHoursEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delivery Frequency */}
      {mode === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Frequency</CardTitle>
            <p className="text-sm text-gray-600">
              How often Finder updates recommendations
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['realtime', 'daily', 'weekly'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setDeliveryFrequency(freq)}
                className={`w-full p-3 border-2 rounded-lg flex items-center justify-between transition-colors ${
                  deliveryFrequency === freq
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium capitalize">{freq}</span>
                {deliveryFrequency === freq && (
                  <Badge variant="default" className="text-xs">Active</Badge>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Blocked Nodes */}
      {currentConfig.blockedNodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Blocked Nodes ({currentConfig.blockedNodes.length})
            </CardTitle>
            <p className="text-sm text-gray-600">
              These nodes won't appear in doors
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentConfig.blockedNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <span className="font-medium">{node.label}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {node.nodeType}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Blocked {new Date(node.blockedAt).toLocaleDateString()}
                  </p>
                </div>
                {onUnblockNode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnblockNode(node.id)}
                  >
                    Unblock
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
        <strong>Your Finder, your rules:</strong> These settings give you complete control 
        over recommendation timing and delivery. Turning Finder off doesn't delete any data—
        your identity graph remains intact and accessible at any time.
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {hasChanges && (
        <p className="text-xs text-amber-600 text-center">
          You have unsaved changes
        </p>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <FinderSettings
 *   currentConfig={{
 *     mode: 'active',
 *     bandwidthLimit: 3,
 *     blockedNodes: [
 *       {
 *         id: 'node_123',
 *         label: 'Self-criticism pattern',
 *         nodeType: 'thought',
 *         blockedAt: '2024-01-10T10:00:00Z'
 *       }
 *     ],
 *     quietHoursEnabled: true,
 *     quietHoursStart: '22:00',
 *     quietHoursEnd: '08:00',
 *     deliveryFrequency: 'daily'
 *   }}
 *   onSave={async (config) => {
 *     await updateFinderConfig(config);
 *     console.log('Settings saved!');
 *   }}
 *   onUnblockNode={(nodeId) => console.log('Unblock node:', nodeId)}
 * />
 */


