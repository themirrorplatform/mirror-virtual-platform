import React from 'react';
import {
  Brain,
  Zap,
  Target,
  TrendingDown,
  AlertTriangle,
  Activity,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * IdentitySnapshot - MirrorX Intelligence Dashboard
 * 
 * Features:
 * - Current posture status with visual indicator
 * - Active tensions (top 5 by energy)
 * - Active goals with progress tracking
 * - Recent regression alerts
 * - Bias detection alerts
 * - Quick actions to explore each area
 * 
 * Constitutional Note: This dashboard shows AI analysis of your patterns,
 * but you decide what (if anything) to do with this information.
 */

interface PostureStatus {
  current: 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';
  confidence: number;
  lastUpdated: string;
}

interface TensionItem {
  id: string;
  label: string;
  energy: number;
  duration: number; // days
}

interface Goal {
  id: string;
  label: string;
  progress: number; // 0-1
  dueDate?: string;
  status: 'active' | 'blocked' | 'completed';
}

interface RegressionAlert {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

interface BiasAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  context: string;
  detectedAt: string;
}

interface IdentitySnapshotData {
  posture: PostureStatus;
  tensions: TensionItem[];
  goals: Goal[];
  regressionAlerts: RegressionAlert[];
  biasAlerts: BiasAlert[];
  snapshotTime: string;
}

interface IdentitySnapshotProps {
  data: IdentitySnapshotData;
  onViewTension?: (tensionId: string) => void;
  onViewGoal?: (goalId: string) => void;
  onViewRegression?: (regressionId: string) => void;
  onViewBias?: (biasId: string) => void;
  onViewPosture?: () => void;
}

// Posture metadata
const postureStyles = {
  unknown: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Unknown' },
  overwhelmed: { color: 'text-red-600', bg: 'bg-red-100', label: 'Overwhelmed' },
  guarded: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Guarded' },
  grounded: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Grounded' },
  open: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Open' },
  exploratory: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Exploratory' }
};

// Severity colors
const severityColors = {
  low: 'text-yellow-600 bg-yellow-100',
  medium: 'text-orange-600 bg-orange-100',
  high: 'text-red-600 bg-red-100'
};

// Goal status colors
const goalStatusColors = {
  active: 'text-blue-600 bg-blue-100',
  blocked: 'text-red-600 bg-red-100',
  completed: 'text-emerald-600 bg-emerald-100'
};

export function IdentitySnapshot({
  data,
  onViewTension,
  onViewGoal,
  onViewRegression,
  onViewBias,
  onViewPosture
}: IdentitySnapshotProps) {
  const postureStyle = postureStyles[data.posture.current];
  const hasAlerts = data.regressionAlerts.length > 0 || data.biasAlerts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            Identity Snapshot
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Snapshot taken {new Date(data.snapshotTime).toLocaleString()}
          </p>
        </div>
        {hasAlerts && (
          <Badge className="bg-amber-100 text-amber-700 border-0 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {data.regressionAlerts.length + data.biasAlerts.length} Alerts
          </Badge>
        )}
      </div>

      {/* Posture Status */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Current Posture
            </CardTitle>
            {onViewPosture && (
              <Button variant="ghost" size="sm" onClick={onViewPosture}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge className={`${postureStyle.bg} ${postureStyle.color} border-0 text-lg px-4 py-2`}>
              {postureStyle.label}
            </Badge>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Confidence</span>
                <span className="font-medium">{(data.posture.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${data.posture.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Updated {new Date(data.posture.lastUpdated).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Active Tensions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Active Tensions
            <Badge variant="outline" className="ml-auto">
              {data.tensions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.tensions.length > 0 ? (
            data.tensions.slice(0, 5).map(tension => (
              <button
                key={tension.id}
                onClick={() => onViewTension?.(tension.id)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-left">{tension.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${tension.energy * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {(tension.energy * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {tension.duration}d
                  </span>
                  {onViewTension && (
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No active tensions detected</p>
          )}
        </CardContent>
      </Card>

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Active Goals
            <Badge variant="outline" className="ml-auto">
              {data.goals.filter(g => g.status === 'active').length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.goals.length > 0 ? (
            data.goals.map(goal => (
              <button
                key={goal.id}
                onClick={() => onViewGoal?.(goal.id)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-left">{goal.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${goalStatusColors[goal.status]} border-0 text-xs`}>
                      {goal.status}
                    </Badge>
                    {onViewGoal && (
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${goal.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                    {(goal.progress * 100).toFixed(0)}%
                  </span>
                </div>
                {goal.dueDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Due {new Date(goal.dueDate).toLocaleDateString()}
                  </div>
                )}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No active goals</p>
          )}
        </CardContent>
      </Card>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Regression Alerts */}
          {data.regressionAlerts.length > 0 && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Regression Alerts
                  <Badge variant="outline" className="ml-auto">
                    {data.regressionAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.regressionAlerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => onViewRegression?.(alert.id)}
                    className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors group text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{alert.pattern}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.detectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${severityColors[alert.severity]} border-0 text-xs`}>
                          {alert.severity}
                        </Badge>
                        {onViewRegression && (
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bias Alerts */}
          {data.biasAlerts.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Bias Alerts
                  <Badge variant="outline" className="ml-auto">
                    {data.biasAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.biasAlerts.map(alert => (
                  <button
                    key={alert.id}
                    onClick={() => onViewBias?.(alert.id)}
                    className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors group text-left"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-900">{alert.type}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`${severityColors[alert.severity]} border-0 text-xs`}>
                          {alert.severity}
                        </Badge>
                        {onViewBias && (
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{alert.context}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.detectedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>This is AI analysis, not diagnosis.</strong> MirrorX identifies patterns 
            in your reflections, but you decide what matters. Tensions, regressions, and biases 
            are information—not judgments. You're always in control of what to explore and when.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <IdentitySnapshot
 *   data={{
 *     posture: {
 *       current: 'grounded',
 *       confidence: 0.82,
 *       lastUpdated: '2024-01-15T10:00:00Z'
 *     },
 *     tensions: [
 *       {
 *         id: 't1',
 *         label: 'Want connection vs. fear vulnerability',
 *         energy: 0.78,
 *         duration: 45
 *       }
 *     ],
 *     goals: [
 *       {
 *         id: 'g1',
 *         label: 'Practice saying no to commitments',
 *         progress: 0.65,
 *         status: 'active',
 *         dueDate: '2024-02-01T00:00:00Z'
 *       }
 *     ],
 *     regressionAlerts: [
 *       {
 *         id: 'r1',
 *         pattern: 'Avoiding difficult conversations',
 *         severity: 'medium',
 *         detectedAt: '2024-01-14T00:00:00Z'
 *       }
 *     ],
 *     biasAlerts: [
 *       {
 *         id: 'b1',
 *         type: 'Confirmation Bias',
 *         severity: 'low',
 *         context: 'Seeking agreement rather than diverse perspectives',
 *         detectedAt: '2024-01-13T00:00:00Z'
 *       }
 *     ],
 *     snapshotTime: '2024-01-15T10:00:00Z'
 *   }}
 *   onViewTension={(id) => console.log('View tension:', id)}
 *   onViewGoal={(id) => console.log('View goal:', id)}
 *   onViewRegression={(id) => console.log('View regression:', id)}
 *   onViewBias={(id) => console.log('View bias:', id)}
 *   onViewPosture={() => console.log('View posture details')}
 * />
 */
