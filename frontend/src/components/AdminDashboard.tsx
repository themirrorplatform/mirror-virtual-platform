import React from 'react';
import {
  Users,
  Activity,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  Clock,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * AdminDashboard - Platform Administration
 * 
 * Features:
 * - Platform stats (users, reflections, MirrorX requests)
 * - Recent signups with trends
 * - Active users tracking
 * - Safety events overview
 * - System health metrics
 * - Storage usage
 * - Performance trends
 * 
 * Constitutional Note: Admin tools exist for platform health,
 * not user surveillance. All actions are logged and auditable.
 */

interface PlatformStats {
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalReflections: number;
  totalMirrorbacks: number;
  totalProposals: number;
  totalVotes: number;
  storageUsedGB: number;
  storageCapacityGB: number;
}

interface RecentSignup {
  id: string;
  username: string;
  role: 'witness' | 'guide';
  signedUpAt: string;
}

interface SafetyEventSummary {
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface SystemHealth {
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  diskUsage: number; // percentage
  uptime: number; // seconds
  lastBackup?: string;
  databaseStatus: 'healthy' | 'degraded' | 'critical';
}

interface TrendData {
  date: string;
  signups: number;
  reflections: number;
  activeUsers: number;
}

interface AdminDashboardProps {
  stats: PlatformStats;
  recentSignups: RecentSignup[];
  safetyEvents: SafetyEventSummary[];
  systemHealth: SystemHealth;
  trends: TrendData[];
  onViewUser?: (userId: string) => void;
  onViewSafetyEvents?: () => void;
}

export function AdminDashboard({
  stats,
  recentSignups,
  safetyEvents,
  systemHealth,
  trends,
  onViewUser,
  onViewSafetyEvents
}: AdminDashboardProps) {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const storagePercentage = (stats.storageUsedGB / stats.storageCapacityGB) * 100;
  const highPrioritySafetyEvents = safetyEvents.filter(e => e.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-purple-600" />
          Platform Administration
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          System health and community metrics
        </p>
      </div>

      {/* System Health Alert */}
      {(systemHealth.databaseStatus !== 'healthy' || highPrioritySafetyEvents > 0) && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 mb-1">Attention Required</p>
                {systemHealth.databaseStatus !== 'healthy' && (
                  <p className="text-sm text-red-700">
                    Database status: {systemHealth.databaseStatus}
                  </p>
                )}
                {highPrioritySafetyEvents > 0 && (
                  <p className="text-sm text-red-700">
                    {highPrioritySafetyEvents} high-priority safety event{highPrioritySafetyEvents > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeUsers24h} active today
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reflections</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalReflections.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalMirrorbacks.toLocaleString()} MirrorBacks
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Governance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalProposals}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalVotes.toLocaleString()} votes cast
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Storage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.storageUsedGB.toFixed(1)} GB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {storagePercentage.toFixed(0)}% of {stats.storageCapacityGB} GB
                </p>
              </div>
              <Database className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resource Usage */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">CPU Usage</span>
                <span className="text-sm font-medium">{systemHealth.cpuUsage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    systemHealth.cpuUsage > 80
                      ? 'bg-red-500'
                      : systemHealth.cpuUsage > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${systemHealth.cpuUsage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Memory Usage</span>
                <span className="text-sm font-medium">{systemHealth.memoryUsage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    systemHealth.memoryUsage > 80
                      ? 'bg-red-500'
                      : systemHealth.memoryUsage > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${systemHealth.memoryUsage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Disk Usage</span>
                <span className="text-sm font-medium">{systemHealth.diskUsage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    systemHealth.diskUsage > 80
                      ? 'bg-red-500'
                      : systemHealth.diskUsage > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${systemHealth.diskUsage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Uptime</p>
              </div>
              <p className="font-medium text-gray-900">{formatUptime(systemHealth.uptime)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Database</p>
              </div>
              <Badge
                className={`${
                  systemHealth.databaseStatus === 'healthy'
                    ? 'bg-emerald-100 text-emerald-700'
                    : systemHealth.databaseStatus === 'degraded'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                } border-0`}
              >
                {systemHealth.databaseStatus}
              </Badge>
            </div>
            {systemHealth.lastBackup && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <p className="text-xs text-gray-500">Last Backup</p>
                </div>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(systemHealth.lastBackup).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Trends</CardTitle>
          <p className="text-sm text-gray-500">
            Platform activity over the last 7 days
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                style={{ fontSize: '12px' }}
              />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={2} name="Active Users" />
              <Line type="monotone" dataKey="reflections" stroke="#8b5cf6" strokeWidth={2} name="Reflections" />
              <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} name="Signups" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Signups</CardTitle>
            <p className="text-sm text-gray-500">
              New users in the last 24 hours
            </p>
          </CardHeader>
          <CardContent>
            {recentSignups.length > 0 ? (
              <div className="space-y-2">
                {recentSignups.map((signup) => (
                  <button
                    key={signup.id}
                    onClick={() => onViewUser?.(signup.id)}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group text-left"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{signup.username}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(signup.signedUpAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {signup.role}
                      </Badge>
                      {onViewUser && (
                        <Eye className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No recent signups
              </p>
            )}
          </CardContent>
        </Card>

        {/* Safety Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Safety Events</CardTitle>
                <p className="text-sm text-gray-500">Recent interventions</p>
              </div>
              {onViewSafetyEvents && (
                <button
                  onClick={onViewSafetyEvents}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View All
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {safetyEvents.length > 0 ? (
              <div className="space-y-2">
                {safetyEvents.map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      event.severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : event.severity === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.count} occurrence{event.count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          event.severity === 'high'
                            ? 'bg-red-200 text-red-700'
                            : event.severity === 'medium'
                            ? 'bg-amber-200 text-amber-700'
                            : 'bg-gray-200 text-gray-700'
                        } border-0`}
                      >
                        {event.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No safety events
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Admin Accountability:</strong> Administrative tools exist for platform health, 
            not user surveillance. All admin actions are logged and auditable. Users have the right 
            to request their data and see administrative decisions affecting them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <AdminDashboard
 *   stats={{
 *     totalUsers: 1543,
 *     activeUsers24h: 245,
 *     activeUsers7d: 892,
 *     totalReflections: 12389,
 *     totalMirrorbacks: 8234,
 *     totalProposals: 23,
 *     totalVotes: 456,
 *     storageUsedGB: 45.7,
 *     storageCapacityGB: 100
 *   }}
 *   recentSignups={[
 *     {
 *       id: 'user_123',
 *       username: 'new_user_1',
 *       role: 'witness',
 *       signedUpAt: '2024-01-15T10:00:00Z'
 *     }
 *   ]}
 *   safetyEvents={[
 *     {
 *       type: 'bias_warning_shown',
 *       count: 12,
 *       severity: 'medium'
 *     }
 *   ]}
 *   systemHealth={{
 *     cpuUsage: 45,
 *     memoryUsage: 62,
 *     diskUsage: 73,
 *     uptime: 864000,
 *     lastBackup: '2024-01-15T00:00:00Z',
 *     databaseStatus: 'healthy'
 *   }}
 *   trends={[
 *     { date: '2024-01-09', signups: 12, reflections: 145, activeUsers: 98 },
 *     { date: '2024-01-10', signups: 15, reflections: 167, activeUsers: 112 }
 *   ]}
 *   onViewUser={(id) => console.log('View user:', id)}
 *   onViewSafetyEvents={() => console.log('View all safety events')}
 * />
 */
