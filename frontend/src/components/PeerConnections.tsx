import React, { useState } from 'react';
import {
  Network,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

/**
 * PeerConnections - P2P Instance Network
 * 
 * Features:
 * - List of connected peer instances
 * - Connection status (online/offline/pending)
 * - Last seen timestamp
 * - Message count with peer
 * - Discovery method indicator
 * - Connection request form
 * - Ping/test connection
 * - Block/disconnect peer
 * - Search and filter peers
 * 
 * Constitutional Note: Mirror uses P2P federation, not centralized servers.
 * You control who you connect to and can disconnect at any time.
 */

type ConnectionStatus = 'online' | 'offline' | 'pending' | 'connecting' | 'error';
type DiscoveryMethod = 'manual' | 'commons' | 'friend_of_friend' | 'verified_network';

interface PeerConnection {
  id: string;
  instanceId: string;
  instanceName: string;
  instanceUrl: string;
  status: ConnectionStatus;
  lastSeen?: string;
  connectedSince?: string;
  messageCount: number;
  unreadCount: number;
  discoveryMethod: DiscoveryMethod;
  verified: boolean;
  latencyMs?: number;
  constitutionVersion?: string;
}

interface PeerConnectionsProps {
  connections: PeerConnection[];
  onConnect?: (instanceUrl: string) => Promise<void>;
  onDisconnect?: (connectionId: string) => Promise<void>;
  onMessage?: (connectionId: string) => void;
  onViewInstance?: (instanceId: string) => void;
  onRefresh?: () => Promise<void>;
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; icon: typeof CheckCircle }> = {
  online: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Online', icon: CheckCircle },
  offline: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Offline', icon: XCircle },
  pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Pending', icon: Clock },
  connecting: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Connecting...', icon: RefreshCw },
  error: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Error', icon: AlertCircle }
};

const discoveryConfig: Record<DiscoveryMethod, { label: string; color: string }> = {
  manual: { label: 'Manual', color: 'bg-gray-100 text-gray-700' },
  commons: { label: 'Commons', color: 'bg-purple-100 text-purple-700' },
  friend_of_friend: { label: 'Friend of Friend', color: 'bg-blue-100 text-blue-700' },
  verified_network: { label: 'Verified Network', color: 'bg-green-100 text-green-700' }
};

export function PeerConnections({
  connections,
  onConnect,
  onDisconnect,
  onMessage,
  onViewInstance,
  onRefresh
}: PeerConnectionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstanceUrl, setNewInstanceUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredConnections = connections.filter(conn => {
    const matchesSearch = conn.instanceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conn.instanceUrl.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedConnections = [...filteredConnections].sort((a, b) => {
    // Online first, then by last seen
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (b.status === 'online' && a.status !== 'online') return 1;
    if (a.lastSeen && b.lastSeen) {
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    }
    return 0;
  });

  const onlineCount = connections.filter(c => c.status === 'online').length;
  const totalMessages = connections.reduce((sum, c) => sum + c.messageCount, 0);
  const unreadMessages = connections.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleConnect = async () => {
    if (!newInstanceUrl.trim() || !onConnect) return;
    
    setIsConnecting(true);
    try {
      await onConnect(newInstanceUrl.trim());
      setNewInstanceUrl('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
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

  const getLatencyColor = (latencyMs?: number): string => {
    if (!latencyMs) return 'text-gray-500';
    if (latencyMs < 100) return 'text-green-600';
    if (latencyMs < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Peer Connections
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                P2P federated network
              </p>
            </div>
            <div className="flex gap-2">
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
              {onConnect && (
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Peer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{onlineCount}</p>
              </div>
              <p className="text-sm text-green-600">Online Now</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">{totalMessages}</p>
              </div>
              <p className="text-sm text-blue-600">Total Messages</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Network className="h-4 w-4 text-purple-600" />
                <p className="text-2xl font-bold text-purple-700">{connections.length}</p>
              </div>
              <p className="text-sm text-purple-600">Total Peers</p>
            </div>
          </div>

          {/* Add Connection Form */}
          {showAddForm && onConnect && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-3">Connect to Peer Instance</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newInstanceUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInstanceUrl(e.target.value)}
                  placeholder="https://peer.mirror.network"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm"
                  disabled={isConnecting}
                />
                <Button
                  onClick={handleConnect}
                  disabled={!newInstanceUrl.trim() || isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  disabled={isConnecting}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Enter the full URL of a Mirror instance you want to connect to
              </p>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search peers by name or URL..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as ConnectionStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Unread Messages Alert */}
          {unreadMessages > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-900">
                  You have {unreadMessages} unread message{unreadMessages !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Constitutional Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Network className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>P2P Federation:</strong> Mirror uses decentralized peer-to-peer connections, 
              not centralized servers. You control who you connect to and can disconnect at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connection List */}
      <div className="space-y-3">
        {sortedConnections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Network className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No peers match your search criteria' 
                  : 'No peer connections yet'}
              </p>
              {onConnect && !searchQuery && statusFilter === 'all' && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Peer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedConnections.map(conn => {
            const statusConf = statusConfig[conn.status];
            const StatusIcon = statusConf.icon;
            const discoveryConf = discoveryConfig[conn.discoveryMethod];

            return (
              <Card key={conn.id} className="border hover:border-blue-300 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    {/* Instance Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${conn.status === 'online' ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {conn.status === 'online' ? (
                          <Wifi className="h-5 w-5 text-green-600" />
                        ) : (
                          <WifiOff className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{conn.instanceName}</h3>
                          {conn.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" title="Verified instance" />
                          )}
                          {conn.unreadCount > 0 && (
                            <Badge className="bg-red-600 text-white border-0">
                              {conn.unreadCount} new
                            </Badge>
                          )}
                        </div>
                        <a 
                          href={conn.instanceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {conn.instanceUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge className={`${statusConf.color} border flex items-center gap-1`}>
                      <StatusIcon className={`h-3 w-3 ${conn.status === 'connecting' ? 'animate-spin' : ''}`} />
                      {statusConf.label}
                    </Badge>
                  </div>

                  {/* Connection Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    {/* Discovery Method */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Discovered via</p>
                      <Badge className={`${discoveryConf.color} border-0 text-xs`}>
                        {discoveryConf.label}
                      </Badge>
                    </div>

                    {/* Messages */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Messages</p>
                      <p className="text-sm font-medium text-gray-900">{conn.messageCount}</p>
                    </div>

                    {/* Latency */}
                    {conn.latencyMs !== undefined && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Latency</p>
                        <p className={`text-sm font-medium ${getLatencyColor(conn.latencyMs)}`}>
                          {conn.latencyMs}ms
                        </p>
                      </div>
                    )}

                    {/* Last Seen / Connected Since */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        {conn.status === 'online' ? 'Connected' : 'Last Seen'}
                      </p>
                      <p className="text-xs text-gray-900">
                        {conn.status === 'online' && conn.connectedSince
                          ? new Date(conn.connectedSince).toLocaleString()
                          : conn.lastSeen
                          ? new Date(conn.lastSeen).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Constitution Version */}
                  {conn.constitutionVersion && (
                    <div className="mb-4 text-xs text-gray-600">
                      Constitution v{conn.constitutionVersion}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {onMessage && (
                      <Button
                        onClick={() => onMessage(conn.id)}
                        disabled={conn.status === 'offline' || conn.status === 'error'}
                        className="flex-1"
                        variant={conn.unreadCount > 0 ? 'default' : 'outline'}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    )}
                    {onViewInstance && (
                      <Button
                        onClick={() => onViewInstance(conn.instanceId)}
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                    {onDisconnect && (
                      <Button
                        onClick={() => onDisconnect(conn.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Disconnect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <PeerConnections
 *   connections={[
 *     {
 *       id: 'conn_1',
 *       instanceId: 'inst_alice',
 *       instanceName: 'alice.mirror',
 *       instanceUrl: 'https://alice.mirror.network',
 *       status: 'online',
 *       lastSeen: '2024-01-15T14:30:00Z',
 *       connectedSince: '2024-01-15T10:00:00Z',
 *       messageCount: 42,
 *       unreadCount: 3,
 *       discoveryMethod: 'commons',
 *       verified: true,
 *       latencyMs: 85,
 *       constitutionVersion: '1.2.0'
 *     },
 *     {
 *       id: 'conn_2',
 *       instanceId: 'inst_bob',
 *       instanceName: 'bob.mirror',
 *       instanceUrl: 'https://bob.mirror.network',
 *       status: 'offline',
 *       lastSeen: '2024-01-14T20:15:00Z',
 *       messageCount: 15,
 *       unreadCount: 0,
 *       discoveryMethod: 'friend_of_friend',
 *       verified: false
 *     },
 *     {
 *       id: 'conn_3',
 *       instanceId: 'inst_charlie',
 *       instanceName: 'charlie.mirror',
 *       instanceUrl: 'https://charlie.mirror.network',
 *       status: 'pending',
 *       messageCount: 0,
 *       unreadCount: 0,
 *       discoveryMethod: 'manual',
 *       verified: false
 *     }
 *   ]}
 *   onConnect={async (url) => {
 *     console.log('Connecting to:', url);
 *     await api.connectToPeer(url);
 *   }}
 *   onDisconnect={async (id) => {
 *     console.log('Disconnecting:', id);
 *     await api.disconnectPeer(id);
 *   }}
 *   onMessage={(id) => console.log('Open messages with:', id)}
 *   onViewInstance={(id) => console.log('View instance:', id)}
 *   onRefresh={async () => {
 *     console.log('Refreshing connections...');
 *     await api.refreshPeerStatus();
 *   }}
 * />
 */



