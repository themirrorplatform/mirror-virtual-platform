/**
 * SystemStatusPanel Component
 * 
 * Displays comprehensive system status for all governance subsystems
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  Cpu, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { governance, type SystemStatus } from '@/lib/api';

export const SystemStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await governance.getSystemStatus();
      setStatus(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load system status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'Failed to load status'}</AlertDescription>
      </Alert>
    );
  }

  const getStatusIcon = (active: boolean) => {
    return active ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="system-status-panel space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Governance System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusItem
              icon={<Shield className="h-5 w-5" />}
              label="Evolution System"
              active={!status.evolution_frozen}
              detail={status.evolution_frozen ? 'Frozen' : 'Active'}
            />
            
            <StatusItem
              icon={status.commons_connected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              label="Commons Connection"
              active={status.commons_connected}
              detail={status.commons_connected ? 'Connected' : 'Disconnected'}
            />

            <StatusItem
              icon={<Lock className="h-5 w-5" />}
              label="Encryption"
              active={status.encryption.initialized && status.encryption.unlocked}
              detail={
                !status.encryption.initialized
                  ? 'Not Initialized'
                  : status.encryption.unlocked
                  ? 'Unlocked'
                  : 'Locked'
              }
            />

            <StatusItem
              icon={<Eye className="h-5 w-5" />}
              label="Guardian Status"
              active={status.is_guardian}
              detail={status.is_guardian ? 'Guardian' : 'Member'}
            />
          </div>

          {/* Detailed Stats */}
          <div className="pt-4 border-t space-y-3">
            <StatRow
              icon={<FileText className="h-4 w-4" />}
              label="Learning Exclusions"
              value={status.learning_exclusion.total_exclusions}
            />

            <StatRow
              icon={<Cpu className="h-4 w-4" />}
              label="Model Verifications"
              value={status.model_verification.total_usages}
            />

            <StatRow
              icon={<FileText className="h-4 w-4" />}
              label="Multimodal Processes"
              value={status.multimodal.longform_count + status.multimodal.voice_count}
            />
          </div>

          {/* Model Usage Breakdown */}
          {Object.keys(status.model_verification.by_model_type).length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Model Usage</h4>
              <div className="space-y-2">
                {Object.entries(status.model_verification.by_model_type).map(([model, stats]: [string, any]) => (
                  <div key={model} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize">{model}</span>
                    <Badge variant="outline">{stats.count} calls</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  detail?: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, label, active, detail }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex-shrink-0">
        {active ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-gray-400" />
        )}
      </div>
    </div>
  );
};

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
};

export default SystemStatusPanel;
