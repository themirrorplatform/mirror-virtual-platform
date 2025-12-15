/**
 * Analytics Dashboard UI
 * Privacy-preserving system metrics visualization
 */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  Users,
  MessageSquare,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  total_instances: number;
  active_instances_24h: number;
  total_reflections: number;
  reflections_today: number;
  avg_reflections_per_user: number;
  constitutional_violations: number;
  violation_rate: number;
}

interface WorkerPerformance {
  worker_id: string;
  worker_name: string;
  total_executions: number;
  success_rate: number;
  avg_execution_time_ms: number;
  constitutional_violations: number;
}

interface GovernanceMetrics {
  total_proposals: number;
  active_proposals: number;
  approved_proposals: number;
  rejected_proposals: number;
  guardian_participation_rate: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [workers, setWorkers] = useState<WorkerPerformance[]>([]);
  const [governance, setGovernance] = useState<GovernanceMetrics | null>(null);
  const [usageTrends, setUsageTrends] = useState<any[]>([]);
  const [modalityDist, setModalityDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyEnabled, setPrivacyEnabled] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [privacyEnabled]);

  const loadDashboardData = async () => {
    try {
      // System metrics
      const metricsRes = await fetch(`/api/analytics/system?privacy=${privacyEnabled}`);
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      // Worker performance
      const workersRes = await fetch(`/api/analytics/workers?privacy=${privacyEnabled}`);
      const workersData = await workersRes.json();
      setWorkers(workersData);

      // Governance
      const govRes = await fetch(`/api/analytics/governance?privacy=${privacyEnabled}`);
      const govData = await govRes.json();
      setGovernance(govData);

      // Usage trends
      const trendsRes = await fetch(`/api/analytics/trends?days=30&privacy=${privacyEnabled}`);
      const trendsData = await trendsRes.json();
      setUsageTrends(trendsData);

      // Modality distribution
      const modalityRes = await fetch(`/api/analytics/modalities?privacy=${privacyEnabled}`);
      const modalityData = await modalityRes.json();
      const modalityArray = Object.entries(modalityData).map(([name, value]) => ({
        name,
        value
      }));
      setModalityDist(modalityArray);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  if (loading || !metrics) {
    return <div className="p-8">Loading analytics...</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge variant={privacyEnabled ? "default" : "secondary"}>
            <Shield className="h-3 w-3 mr-1" />
            {privacyEnabled ? "Privacy Enabled" : "Privacy Disabled"}
          </Badge>
          <button
            onClick={() => setPrivacyEnabled(!privacyEnabled)}
            className="text-sm text-blue-600 hover:underline"
          >
            Toggle
          </button>
        </div>
      </div>

      {privacyEnabled && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All metrics use differential privacy to protect individual user data.
            Counts may be slightly noisy to preserve privacy guarantees.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Users</div>
                <div className="text-2xl font-bold">{metrics.total_instances.toLocaleString()}</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {metrics.active_instances_24h.toLocaleString()} active today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Reflections</div>
                <div className="text-2xl font-bold">{metrics.total_reflections.toLocaleString()}</div>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {metrics.reflections_today.toLocaleString()} today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Avg Reflections/User</div>
                <div className="text-2xl font-bold">
                  {metrics.avg_reflections_per_user.toFixed(1)}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Compliance Rate</div>
                <div className="text-2xl font-bold">
                  {((1 - metrics.violation_rate) * 100).toFixed(1)}%
                </div>
              </div>
              {metrics.violation_rate < 0.05 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {metrics.constitutional_violations} violations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Usage Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageTrends.reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="reflections"
                stroke="#8884d8"
                name="Reflections"
              />
              <Line
                type="monotone"
                dataKey="active_users"
                stroke="#82ca9d"
                name="Active Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Worker Performance & Modality Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Worker Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workers.map(worker => (
                <div key={worker.worker_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{worker.worker_name}</span>
                    <Badge variant={worker.success_rate > 0.95 ? "default" : "secondary"}>
                      {(worker.success_rate * 100).toFixed(1)}% success
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{worker.total_executions.toLocaleString()} executions</span>
                    <span>•</span>
                    <span>{worker.avg_execution_time_ms.toFixed(0)}ms avg</span>
                    {worker.constitutional_violations > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-red-600">
                          {worker.constitutional_violations} violations
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${worker.success_rate * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reflection Modalities</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modalityDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modalityDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Governance Metrics */}
      {governance && (
        <Card>
          <CardHeader>
            <CardTitle>Guardian Council Governance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Total Proposals</div>
                <div className="text-2xl font-bold">{governance.total_proposals}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Active Voting</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {governance.active_proposals}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Approval Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {((governance.approved_proposals / governance.total_proposals) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Guardian Participation</div>
                <div className="text-2xl font-bold">
                  {(governance.guardian_participation_rate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Mechanisms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Differential Privacy:</strong> All aggregate queries add calibrated Laplacian noise
            to protect individual user privacy. This means counts and averages may be slightly inaccurate,
            but privacy is mathematically guaranteed.
          </p>
          <p>
            <strong>Privacy Budget (ε):</strong> Set to 0.1, providing strong privacy protection.
            Lower values = more noise, stronger privacy.
          </p>
          <p>
            <strong>No Individual Data:</strong> This dashboard only shows aggregate statistics.
            Individual user data is never accessed or displayed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
