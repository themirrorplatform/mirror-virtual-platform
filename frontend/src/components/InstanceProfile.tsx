import React, { useState } from 'react';
import {
  Server,
  Globe,
  Users,
  Calendar,
  Shield,
  GitBranch,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Lock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * InstanceProfile - Public Instance Information
 * 
 * Features:
 * - Instance display name and description
 * - Instance ID and genesis hash
 * - Constitution version
 * - Creation date and uptime
 * - Admin/guardian contact info
 * - Federation status (open/invite/closed)
 * - Connected peers count
 * - Fork lineage (if forked)
 * - Public stats (users, reflections, etc.)
 * - Instance URL and discovery info
 * - Copy instance ID/hash
 * 
 * Constitutional Note: Instance profiles provide transparency
 * about who runs each node and their governance model.
 */

type FederationPolicy = 'open' | 'invite_only' | 'closed';

interface InstanceProfileData {
  instanceId: string;
  displayName: string;
  description: string;
  url: string;
  genesisHash: string;
  constitutionVersion: string;
  createdAt: string;
  uptime: number; // percentage
  adminName: string;
  adminContact?: string;
  federationPolicy: FederationPolicy;
  connectedPeers: number;
  totalUsers: number;
  totalReflections: number;
  isForked: boolean;
  parentInstanceId?: string;
  parentInstanceName?: string;
  forkReason?: string;
  publicCommons: boolean;
  encryptionEnabled: boolean;
}

interface InstanceProfileProps {
  profile: InstanceProfileData;
  isOwnInstance?: boolean;
  onConnect?: () => void;
  onViewParent?: (parentId: string) => void;
  onEdit?: () => void;
}

const federationPolicyConfig: Record<FederationPolicy, { color: string; label: string; desc: string }> = {
  open: { 
    color: 'bg-green-100 text-green-700 border-green-300', 
    label: 'Open Federation', 
    desc: 'Anyone can connect to this instance' 
  },
  invite_only: { 
    color: 'bg-blue-100 text-blue-700 border-blue-300', 
    label: 'Invite Only', 
    desc: 'Requires invitation to connect' 
  },
  closed: { 
    color: 'bg-gray-100 text-gray-700 border-gray-300', 
    label: 'Closed', 
    desc: 'Not accepting new connections' 
  }
};

export function InstanceProfile({
  profile,
  isOwnInstance = false,
  onConnect,
  onViewParent,
  onEdit
}: InstanceProfileProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const copyToClipboard = (text: string, type: 'id' | 'hash') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const formatUptime = (uptime: number): string => {
    return `${uptime.toFixed(2)}%`;
  };

  const getUptimeColor = (uptime: number): string => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const policyConf = federationPolicyConfig[profile.federationPolicy];

  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Server className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
                <a 
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                >
                  {profile.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            {isOwnInstance && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <p className="text-gray-700">{profile.description}</p>

          {/* Federation Policy */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Federation Policy</p>
            <div className="flex items-start gap-3">
              <Badge className={`${policyConf.color} border`}>
                {policyConf.label}
              </Badge>
              <p className="text-sm text-gray-600">{policyConf.desc}</p>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-purple-600 font-medium">Users</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">{profile.totalUsers}</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">Reflections</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{profile.totalReflections}</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-600 font-medium">Peers</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{profile.connectedPeers}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-xs text-emerald-600 font-medium">Uptime</p>
              </div>
              <p className={`text-2xl font-bold ${getUptimeColor(profile.uptime)}`}>
                {formatUptime(profile.uptime)}
              </p>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Features</p>
            <div className="flex flex-wrap gap-2">
              {profile.encryptionEnabled && (
                <Badge className="bg-green-100 text-green-700 border-green-300 border flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  E2E Encryption
                </Badge>
              )}
              {profile.publicCommons && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-300 border flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Public Commons
                </Badge>
              )}
              {profile.isForked && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-300 border flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  Fork
                </Badge>
              )}
            </div>
          </div>

          {/* Fork Lineage */}
          {profile.isForked && profile.parentInstanceId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <GitBranch className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">Forked Instance</p>
                  <p className="text-sm text-amber-800 mb-2">
                    This is a legitimate fork from {profile.parentInstanceName || 'parent instance'}
                  </p>
                  {profile.forkReason && (
                    <p className="text-xs text-amber-700 italic mb-2">"{profile.forkReason}"</p>
                  )}
                  {onViewParent && (
                    <button
                      onClick={() => onViewParent(profile.parentInstanceId!)}
                      className="text-sm text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
                    >
                      View Parent Instance
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connect Button */}
          {!isOwnInstance && onConnect && (
            <Button
              onClick={onConnect}
              className="w-full"
              disabled={profile.federationPolicy === 'closed'}
            >
              <Globe className="h-4 w-4 mr-2" />
              {profile.federationPolicy === 'closed' ? 'Federation Closed' : 'Connect to This Instance'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Technical Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instance ID */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Instance ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-gray-900 p-2 bg-gray-50 rounded border border-gray-200 break-all">
                {profile.instanceId}
              </code>
              <button
                onClick={() => copyToClipboard(profile.instanceId, 'id')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy instance ID"
              >
                {copiedId ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Genesis Hash */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Genesis Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-gray-900 p-2 bg-gray-50 rounded border border-gray-200 break-all">
                {profile.genesisHash}
              </code>
              <button
                onClick={() => copyToClipboard(profile.genesisHash, 'hash')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy genesis hash"
              >
                {copiedHash ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verifies instance authenticity
            </p>
          </div>

          {/* Constitution Version */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Constitution Version</p>
            <p className="text-sm text-gray-900">{profile.constitutionVersion}</p>
          </div>

          {/* Created Date */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Instance Age</p>
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
              <span className="text-gray-500">({daysSinceCreation} days ago)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Administrator</p>
            <p className="text-sm text-gray-900">{profile.adminName}</p>
          </div>

          {profile.adminContact && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Contact</p>
              <p className="text-sm text-gray-900">{profile.adminContact}</p>
            </div>
          )}

          {/* Constitutional Note */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
            <Shield className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-900">
              <strong>Transparency:</strong> Instance profiles provide visibility into who runs each node,
              their governance model, and technical configuration. This builds trust in the federated network.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <InstanceProfile
 *   profile={{
 *     instanceId: 'inst_abc123xyz',
 *     displayName: 'Alice\'s Mirror',
 *     description: 'A personal Mirror instance focused on philosophical reflection and identity exploration.',
 *     url: 'https://alice.mirror.network',
 *     genesisHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
 *     constitutionVersion: '1.2.0',
 *     createdAt: '2023-06-15T10:00:00Z',
 *     uptime: 99.8,
 *     adminName: 'alice.mirror',
 *     adminContact: 'admin@alice.mirror.network',
 *     federationPolicy: 'open',
 *     connectedPeers: 42,
 *     totalUsers: 15,
 *     totalReflections: 3456,
 *     isForked: false,
 *     publicCommons: true,
 *     encryptionEnabled: true
 *   }}
 *   isOwnInstance={false}
 *   onConnect={() => console.log('Connecting to instance...')}
 * />
 * 
 * // Forked instance example
 * <InstanceProfile
 *   profile={{
 *     instanceId: 'inst_fork_xyz789',
 *     displayName: 'Mirror Experimental',
 *     description: 'Testing new features and governance models',
 *     url: 'https://experimental.mirror.network',
 *     genesisHash: 'f1e2d3c4b5a69788...',
 *     constitutionVersion: '1.2.1-experimental',
 *     createdAt: '2024-01-15T10:00:00Z',
 *     uptime: 97.5,
 *     adminName: 'bob.mirror',
 *     federationPolicy: 'invite_only',
 *     connectedPeers: 12,
 *     totalUsers: 8,
 *     totalReflections: 456,
 *     isForked: true,
 *     parentInstanceId: 'inst_original',
 *     parentInstanceName: 'Mirror Network',
 *     forkReason: 'Testing shorter guardian terms and additional privacy features',
 *     publicCommons: false,
 *     encryptionEnabled: true
 *   }}
 *   onConnect={() => console.log('Request to connect...')}
 *   onViewParent={(id) => console.log('View parent:', id)}
 * />
 */
