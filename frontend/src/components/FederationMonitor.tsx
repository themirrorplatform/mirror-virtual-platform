import React, { useState } from 'react';
import {
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Globe,
  Users,
  Database,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * FederationMonitor - Network Health Dashboard
 * 
 * Features:
 * - Federation network health status
 * - Connected instances count
 * - Network latency metrics
 * - Bandwidth usage
 * - Instance uptime
 * - Protocol version compatibility
 * - Recent federation events
 * - Network topology view
 * - Alert system for issues
 * 
 * Constitutional Note: Federation health transparency ensures
 * trust in the decentralized network.
 */

type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'offline';
type EventType = 'connection' | 'disconnection' | 'error' | 'sync' | 'discovery';

interface NetworkMetrics {
  connectedInstances: number;
  totalKnownInstances: number;
  avgLatency: number;
  bandwidthUsed: number; // bytes
  uptime: number; // percentage
  protocolVersion: string;
  syncStatus: 'synced' | 'syncing' | 'behind' | 'error';
}

interface FederationEvent {
  id: string;
  type: EventType;
  timestamp: string;
  instanceName: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

interface InstanceStats {
  region: string;
  count: number;
  avgLatency: number;
  status: HealthStatus;
}

interface FederationMonitorProps {
  metrics: NetworkMetrics;
  health: HealthStatus;
  recentEvents: FederationEvent[];
  instancesByRegion?: InstanceStats[];
  onRefresh?: () => Promise<void>;
}

const healthConfig: Record<HealthStatus, { color: string; label: string; icon: typeof CheckCircle }> = {
  healthy: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Healthy', icon: CheckCircle },
  degraded: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Degraded', icon: AlertTriangle },
  critical: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Critical', icon: XCircle },
  offline: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Offline', icon: XCircle }
};

const eventTypeConfig: Record<EventType, { color: string; label: string }> = {
  connection: { color: 'text-green-600', label: 'Connected' },
  disconnection: { color: 'text-gray-600', label: 'Disconnected' },
  error: { color: 'text-red-600', label: 'Error' },
  sync: { color: 'text-blue-600', label: 'Sync' },
  discovery: { color: 'text-purple-600', label: 'Discovery' }
};

const severityConfig = {
  info: { color: 'bg-blue-100 text-blue-700', icon: Activity },
  warning: { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  error: { color: 'bg-red-100 text-red-700', icon: XCircle }
};

export function FederationMonitor({
  metrics,
  health,
  recentEvents,
  instancesByRegion = [],
  onRefresh
}: FederationMonitorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const healthConf = healthConfig[health];
  const HealthIcon = healthConf.icon;

  const displayedEvents = showAllEvents ? recentEvents : recentEvents.slice(0, 5);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLatencyColor = (latency: number): string => {
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSyncStatusConfig = (status: string): { color: string; label: string } => {
    switch (status) {
      case 'synced': return { color: 'bg-green-100 text-green-700', label: 'Synced' };
      case 'syncing': return { color: 'bg-blue-100 text-blue-700', label: 'Syncing...' };
      case 'behind': return { color: 'bg-yellow-100 text-yellow-700', label: 'Behind' };
      case 'error': return { color: 'bg-red-100 text-red-700', label: 'Sync Error' };
      default: return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
    }
  };

  const syncConf = getSyncStatusConfig(metrics.syncStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Federation Monitor
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Decentralized network health
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${healthConf.color} border flex items-center gap-1`}>
                <HealthIcon className="h-3 w-3" />
                {healthConf.label}
              </Badge>
              {onRefresh && (
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Connected Instances */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">Connected</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{metrics.connectedInstances}</p>
              <p className="text-xs text-blue-600 mt-1">of {metrics.totalKnownInstances} known</p>
            </div>

            {/* Average Latency */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-purple-600 font-medium">Avg Latency</p>
              </div>
              <p className={`text-2xl font-bold ${getLatencyColor(metrics.avgLatency)}`}>
                {metrics.avgLatency}ms
              </p>
              <p className="text-xs text-purple-600 mt-1">network speed</p>
            </div>

            {/* Bandwidth */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-600 font-medium">Bandwidth</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatBytes(metrics.bandwidthUsed)}</p>
              <p className="text-xs text-green-600 mt-1">data transferred</p>
            </div>

            {/* Uptime */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <p className="text-xs text-emerald-600 font-medium">Uptime</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{metrics.uptime.toFixed(1)}%</p>
              <p className="text-xs text-emerald-600 mt-1">availability</p>
            </div>
          </div>

          {/* Protocol & Sync Status */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Protocol Version</p>
              <p className="text-lg font-semibold text-gray-900">{metrics.protocolVersion}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Sync Status</p>
              <Badge className={`${syncConf.color} border-0`}>
                {syncConf.label}
              </Badge>
            </div>
          </div>

          {/* Constitutional Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Federation Transparency:</strong> All network health metrics are visible to ensure 
              trust in the decentralized infrastructure. No hidden bottlenecks or failures.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      {instancesByRegion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {instancesByRegion.map((region, idx) => {
                const regionHealthConf = healthConfig[region.status];
                const RegionHealthIcon = regionHealthConf.icon;

                return (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{region.region}</p>
                        <Badge className={`${regionHealthConf.color} border-0 text-xs flex items-center gap-1`}>
                          <RegionHealthIcon className="h-3 w-3" />
                          {regionHealthConf.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{region.count}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getLatencyColor(region.avgLatency)}`}>
                          <Zap className="h-4 w-4" />
                          <span>{region.avgLatency}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Events
            </CardTitle>
            {recentEvents.length > 5 && (
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAllEvents ? 'Show Less' : `Show All (${recentEvents.length})`}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayedEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent federation events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedEvents.map(event => {
                const eventConf = eventTypeConfig[event.type];
                const severityConf = severityConfig[event.severity];
                const SeverityIcon = severityConf.icon;

                return (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded ${severityConf.color}`}>
                          <SeverityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${eventConf.color}`}>
                              {eventConf.label}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-600">{event.instanceName}</span>
                          </div>
                          <p className="text-sm text-gray-700">{event.message}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <FederationMonitor
 *   health="healthy"
 *   metrics={{
 *     connectedInstances: 42,
 *     totalKnownInstances: 67,
 *     avgLatency: 125,
 *     bandwidthUsed: 524288000, // ~500 MB
 *     uptime: 99.7,
 *     protocolVersion: '1.2.0',
 *     syncStatus: 'synced'
 *   }}
 *   instancesByRegion={[
 *     { region: 'North America', count: 18, avgLatency: 95, status: 'healthy' },
 *     { region: 'Europe', count: 15, avgLatency: 110, status: 'healthy' },
 *     { region: 'Asia Pacific', count: 9, avgLatency: 185, status: 'degraded' }
 *   ]}
 *   recentEvents={[
 *     {
 *       id: 'evt_1',
 *       type: 'connection',
 *       timestamp: '2024-01-15T14:30:00Z',
 *       instanceName: 'alice.mirror',
 *       message: 'Successfully connected to peer instance',
 *       severity: 'info'
 *     },
 *     {
 *       id: 'evt_2',
 *       type: 'sync',
 *       timestamp: '2024-01-15T14:25:00Z',
 *       instanceName: 'bob.mirror',
 *       message: 'Synchronized 42 reflections',
 *       severity: 'info'
 *     },
 *     {
 *       id: 'evt_3',
 *       type: 'error',
 *       timestamp: '2024-01-15T14:20:00Z',
 *       instanceName: 'charlie.mirror',
 *       message: 'Connection timeout - retrying',
 *       severity: 'warning'
 *     },
 *     {
 *       id: 'evt_4',
 *       type: 'discovery',
 *       timestamp: '2024-01-15T14:15:00Z',
 *       instanceName: 'diana.mirror',
 *       message: 'Discovered new peer through commons',
 *       severity: 'info'
 *     }
 *   ]}
 *   onRefresh={async () => {
 *     console.log('Refreshing federation status...');
 *     await api.refreshFederationStatus();
 *   }}
 * />
 */
