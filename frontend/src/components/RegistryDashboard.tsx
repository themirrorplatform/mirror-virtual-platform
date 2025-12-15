import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  GitBranch,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

/**
 * RegistryDashboard - Instance Recognition Registry
 * 
 * Features:
 * - Instance ID display with copy
 * - Genesis hash verification
 * - Status indicator (pending/verified/challenged/revoked)
 * - Verification count display
 * - Challenge count and details
 * - Fork lineage visualization
 * - Search other instances
 * 
 * Constitutional Note: The registry enables decentralized trust
 * without centralized control. Verification is peer-based.
 */

export type RegistryStatus = 'pending' | 'verified' | 'challenged' | 'revoked' | 'unregistered';

interface InstanceData {
  id: string;
  genesisHash: string;
  status: RegistryStatus;
  verificationCount: number;
  challengeCount: number;
  registeredAt?: string;
  lastVerified?: string;
  parentInstanceId?: string; // If this is a fork
  constitutionVersion: string;
}

interface Verification {
  id: string;
  verifierInstanceId: string;
  verifierName: string;
  signature: string;
  timestamp: string;
  trustChain: number; // Degrees of separation
}

interface Challenge {
  id: string;
  challengerInstanceId: string;
  challengerName: string;
  claimType: 'false_identity' | 'constitution_violation' | 'malicious_behavior' | 'impersonation';
  evidence: string;
  status: 'open' | 'resolved' | 'dismissed';
  timestamp: string;
}

interface OtherInstance {
  id: string;
  name: string;
  status: RegistryStatus;
  verificationCount: number;
  url: string;
}

interface RegistryDashboardProps {
  currentInstance: InstanceData;
  verifications: Verification[];
  challenges: Challenge[];
  onRequestVerification?: () => void;
  onViewVerification?: (verificationId: string) => void;
  onViewChallenge?: (challengeId: string) => void;
  onSearchInstances?: (query: string) => Promise<OtherInstance[]>;
}

// Status styles
const statusStyles = {
  pending: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-500',
    icon: Clock,
    label: 'Pending'
  },
  verified: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    border: 'border-emerald-500',
    icon: CheckCircle,
    label: 'Verified'
  },
  challenged: {
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    icon: AlertTriangle,
    label: 'Challenged'
  },
  revoked: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-500',
    icon: XCircle,
    label: 'Revoked'
  },
  unregistered: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-500',
    icon: Shield,
    label: 'Unregistered'
  }
};

export function RegistryDashboard({
  currentInstance,
  verifications,
  challenges,
  onRequestVerification,
  onViewVerification,
  onViewChallenge,
  onSearchInstances
}: RegistryDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OtherInstance[]>([]);
  const [searching, setSearching] = useState(false);

  const styles = statusStyles[currentInstance.status];
  const StatusIcon = styles.icon;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSearch = async () => {
    if (!onSearchInstances || !searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const results = await onSearchInstances(searchQuery);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const openChallenges = challenges.filter(c => c.status === 'open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-blue-600" />
          Recognition Registry
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Decentralized identity verification for Mirror instances
        </p>
      </div>

      {/* Instance Status Card */}
      <Card className={`border-l-4 ${styles.border}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${styles.color}`} />
              Instance Status
            </CardTitle>
            <Badge className={`${styles.bg} ${styles.color} border-0`}>
              {styles.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instance ID */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Instance ID
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={currentInstance.id}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentInstance.id, 'id')}
              >
                {copiedField === 'id' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Genesis Hash */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Genesis Hash
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={currentInstance.genesisHash}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentInstance.genesisHash, 'hash')}
              >
                {copiedField === 'hash' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Constitution</p>
              <p className="font-medium text-gray-900">{currentInstance.constitutionVersion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Verifications</p>
              <p className="font-medium text-emerald-700">{currentInstance.verificationCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Challenges</p>
              <p className={`font-medium ${openChallenges.length > 0 ? 'text-orange-700' : 'text-gray-900'}`}>
                {currentInstance.challengeCount}
              </p>
            </div>
            {currentInstance.registeredAt && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Registered</p>
                <p className="font-medium text-gray-900">
                  {new Date(currentInstance.registeredAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Fork Info */}
          {currentInstance.parentInstanceId && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">This is a Fork</p>
              </div>
              <p className="text-sm text-purple-700">
                Parent Instance: <span className="font-mono text-xs">{currentInstance.parentInstanceId}</span>
              </p>
            </div>
          )}

          {/* Actions */}
          {currentInstance.status === 'unregistered' && onRequestVerification && (
            <Button onClick={onRequestVerification} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Request Verification
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="verifications">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verifications">
            Verifications ({verifications.length})
          </TabsTrigger>
          <TabsTrigger value="challenges">
            Challenges ({challenges.length})
          </TabsTrigger>
          <TabsTrigger value="search">
            Search Network
          </TabsTrigger>
        </TabsList>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Peer Verifications</CardTitle>
              <p className="text-sm text-gray-500">
                Other instances that have verified this instance's identity
              </p>
            </CardHeader>
            <CardContent>
              {verifications.length > 0 ? (
                <div className="space-y-3">
                  {verifications.map((verification) => (
                    <button
                      key={verification.id}
                      onClick={() => onViewVerification?.(verification.id)}
                      className="w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-gray-900">
                              {verification.verifierName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {verification.trustChain} degrees
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {new Date(verification.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs font-mono text-gray-600 truncate">
                            {verification.signature.substring(0, 40)}...
                          </p>
                        </div>
                        {onViewVerification && (
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  No verifications yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identity Challenges</CardTitle>
              <p className="text-sm text-gray-500">
                Claims against this instance's identity or behavior
              </p>
            </CardHeader>
            <CardContent>
              {challenges.length > 0 ? (
                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <button
                      key={challenge.id}
                      onClick={() => onViewChallenge?.(challenge.id)}
                      className={`w-full p-3 border rounded-lg transition-colors text-left group ${
                        challenge.status === 'open'
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${
                            challenge.status === 'open' ? 'text-orange-600' : 'text-gray-500'
                          }`} />
                          <span className="font-medium text-gray-900">
                            {challenge.claimType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant="outline" className={
                          challenge.status === 'open' ? 'bg-orange-100' : 'bg-gray-100'
                        }>
                          {challenge.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{challenge.evidence}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>By: {challenge.challengerName}</span>
                        <span>{new Date(challenge.timestamp).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  No challenges filed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Instances</CardTitle>
              <p className="text-sm text-gray-500">
                Find and verify other Mirror instances
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by instance name or ID..."
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((instance) => {
                    const instanceStyles = statusStyles[instance.status];
                    const InstanceIcon = instanceStyles.icon;
                    return (
                      <a
                        key={instance.id}
                        href={instance.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <InstanceIcon className={`h-5 w-5 ${instanceStyles.color}`} />
                            <div>
                              <p className="font-medium text-gray-900">{instance.name}</p>
                              <p className="text-xs font-mono text-gray-500">{instance.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${instanceStyles.bg} ${instanceStyles.color} border-0`}>
                              {instanceStyles.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {instance.verificationCount} verifications
                            </Badge>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Decentralized Trust:</strong> The Recognition Registry enables peer-based 
            identity verification without central authority. Verifications build trust chains, 
            and challenges ensure accountability. No single entity controls the registry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <RegistryDashboard
 *   currentInstance={{
 *     id: 'mirror_abc123',
 *     genesisHash: '0x1234567890abcdef...',
 *     status: 'verified',
 *     verificationCount: 12,
 *     challengeCount: 0,
 *     registeredAt: '2024-01-01T00:00:00Z',
 *     lastVerified: '2024-01-15T00:00:00Z',
 *     constitutionVersion: '1.0.0'
 *   }}
 *   verifications={[
 *     {
 *       id: 'ver_1',
 *       verifierInstanceId: 'mirror_xyz789',
 *       verifierName: 'Mirror Instance Beta',
 *       signature: '0xabcdef...',
 *       timestamp: '2024-01-10T00:00:00Z',
 *       trustChain: 1
 *     }
 *   ]}
 *   challenges={[]}
 *   onRequestVerification={() => console.log('Request verification')}
 *   onViewVerification={(id) => console.log('View verification:', id)}
 *   onSearchInstances={async (query) => {
 *     return [
 *       {
 *         id: 'mirror_other',
 *         name: 'Mirror Instance Gamma',
 *         status: 'verified',
 *         verificationCount: 8,
 *         url: 'https://mirror-gamma.example.com'
 *       }
 *     ];
 *   }}
 * />
 */

