import React, { useState, useEffect } from 'react';
import { Tag, Clock, TrendingUp, Eye, EyeOff, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

/**
 * LensUsageTracker - Session-based Lens Recording
 * 
 * Features:
 * - Track which lenses are active in current session
 * - Visual feedback when lens is recording
 * - Session duration timer
 * - Quick toggle lenses on/off
 * - Usage history transparency
 * - Auto-save session data
 * 
 * Constitutional Note: You always know which lenses are active
 * and can turn them off at any time. Transparency is mandatory.
 */

interface Lens {
  id: string;
  label: string;
  category: 'politics' | 'relationships' | 'identity' | 'work' | 'health' | 'creativity' | 'spirituality' | 'learning';
  description: string;
  usageCount: number;
  lastUsed?: string;
}

interface SessionData {
  id: string;
  startTime: string;
  duration: number; // seconds
  activeLenses: string[];
  reflectionCount: number;
}

interface LensUsageTrackerProps {
  availableLenses: Lens[];
  currentSession?: SessionData;
  onToggleLens: (lensId: string, active: boolean) => void;
  onEndSession: () => void;
  showHistory?: boolean;
  recentSessions?: SessionData[];
}

// Category colors
const categoryColors = {
  politics: 'bg-red-100 text-red-700',
  relationships: 'bg-pink-100 text-pink-700',
  identity: 'bg-purple-100 text-purple-700',
  work: 'bg-blue-100 text-blue-700',
  health: 'bg-emerald-100 text-emerald-700',
  creativity: 'bg-amber-100 text-amber-700',
  spirituality: 'bg-indigo-100 text-indigo-700',
  learning: 'bg-cyan-100 text-cyan-700'
};

export function LensUsageTracker({
  availableLenses,
  currentSession,
  onToggleLens,
  onEndSession,
  showHistory = false,
  recentSessions = []
}: LensUsageTrackerProps) {
  const [sessionTime, setSessionTime] = useState(0);

  // Update session timer
  useEffect(() => {
    if (!currentSession) {
      setSessionTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - new Date(currentSession.startTime).getTime()) / 1000
      );
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const activeLensIds = currentSession?.activeLenses || [];
  const activeLenses = availableLenses.filter(l => activeLensIds.includes(l.id));

  return (
    <div className="space-y-6">
      {/* Session Status */}
      <Card className={currentSession ? 'border-l-4 border-l-blue-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {currentSession ? (
                <>
                  <Eye className="h-5 w-5 text-blue-600 animate-pulse" />
                  Session Active
                </>
              ) : (
                <>
                  <EyeOff className="h-5 w-5 text-gray-500" />
                  No Active Session
                </>
              )}
            </CardTitle>
            {currentSession && (
              <Button variant="outline" size="sm" onClick={onEndSession}>
                End Session
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentSession ? (
            <>
              {/* Session Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-700">Duration</p>
                  </div>
                  <p className="font-medium text-blue-900">{formatDuration(sessionTime)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-700">Active Lenses</p>
                  </div>
                  <p className="font-medium text-blue-900">{activeLensIds.length}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-700">Reflections</p>
                  </div>
                  <p className="font-medium text-blue-900">{currentSession.reflectionCount}</p>
                </div>
              </div>

              {/* Active Lenses Display */}
              {activeLenses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Recording Through:</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeLenses.map(lens => (
                      <Badge
                        key={lens.id}
                        className={`${categoryColors[lens.category]} border-0 flex items-center gap-1`}
                      >
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                        {lens.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Select lenses below to start a tracking session
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lens Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Lenses</CardTitle>
          <p className="text-sm text-gray-500">
            Toggle lenses on to include them in your reflection analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableLenses.map(lens => {
            const isActive = activeLensIds.includes(lens.id);
            return (
              <div
                key={lens.id}
                className={`p-4 border rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      id={`lens-${lens.id}`}
                      checked={isActive}
                      onCheckedChange={(checked: boolean) => onToggleLens(lens.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`lens-${lens.id}`}
                        className="flex items-center gap-2 cursor-pointer font-medium text-gray-900 mb-1"
                      >
                        {lens.label}
                        <Badge className={`${categoryColors[lens.category]} border-0 text-xs`}>
                          {lens.category}
                        </Badge>
                      </Label>
                      <p className="text-sm text-gray-600">{lens.description}</p>
                      {lens.lastUsed && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last used: {new Date(lens.lastUsed).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <Badge variant="outline" className="text-xs">
                      {lens.usageCount} uses
                    </Badge>
                    {isActive && (
                      <Badge className="bg-blue-600 text-white border-0 text-xs">
                        Recording
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Session History */}
      {showHistory && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <p className="text-sm text-gray-500">
              Transparency log of your lens usage
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const sessionLenses = availableLenses.filter(l =>
                  session.activeLenses.includes(l.id)
                );
                return (
                  <div
                    key={session.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {new Date(session.startTime).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-wrap gap-1">
                        {sessionLenses.map(lens => (
                          <Badge key={lens.id} variant="outline" className="text-xs">
                            {lens.label}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {session.reflectionCount} reflections
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-purple-900 font-medium mb-1">
                Transparency Principle
              </p>
              <p className="text-sm text-purple-800">
                You always know which lenses are active. This tracker exists to ensure complete 
                visibility into what data is being collected. You can turn any lens off at any time, 
                and session data is saved locally for your records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <LensUsageTracker
 *   availableLenses={[
 *     {
 *       id: 'lens_1',
 *       label: 'Relationships',
 *       category: 'relationships',
 *       description: 'Tracks patterns in interpersonal dynamics',
 *       usageCount: 45,
 *       lastUsed: '2024-01-15T10:00:00Z'
 *     },
 *     {
 *       id: 'lens_2',
 *       label: 'Work Dynamics',
 *       category: 'work',
 *       description: 'Analyzes professional situations and conflicts',
 *       usageCount: 23,
 *       lastUsed: '2024-01-14T14:00:00Z'
 *     }
 *   ]}
 *   currentSession={{
 *     id: 'session_123',
 *     startTime: '2024-01-15T10:00:00Z',
 *     duration: 3600,
 *     activeLenses: ['lens_1', 'lens_2'],
 *     reflectionCount: 3
 *   }}
 *   onToggleLens={(lensId, active) => console.log('Toggle lens:', lensId, active)}
 *   onEndSession={() => console.log('End session')}
 *   showHistory={true}
 *   recentSessions={[
 *     {
 *       id: 'session_122',
 *       startTime: '2024-01-14T10:00:00Z',
 *       duration: 2400,
 *       activeLenses: ['lens_1'],
 *       reflectionCount: 2
 *     }
 *   ]}
 * />
 */

