import React, { useState } from 'react';
import {
  GitBranch,
  FileText,
  ChevronRight,
  ExternalLink,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

/**
 * ForkRegistry - Legitimate Fork List
 * 
 * Features:
 * - List of all legitimate forks from this instance
 * - Fork metadata (creator, date, reason)
 * - Amendment diffs (what changed from parent)
 * - Fork status (active, merged, abandoned)
 * - Verification status
 * - Search and filter forks
 * - View fork constitution
 * 
 * Constitutional Note: Forks are a feature, not a bug. They enable
 * experimentation and diversity while maintaining accountability.
 */

type ForkStatus = 'active' | 'merged' | 'abandoned' | 'proposal';
type AmendmentType = 'add' | 'modify' | 'remove';

interface Amendment {
  id: string;
  section: string;
  type: AmendmentType;
  oldText?: string;
  newText?: string;
  rationale: string;
}

interface ForkData {
  id: string;
  name: string;
  url?: string;
  creatorInstanceId: string;
  creatorName: string;
  forkDate: string;
  status: ForkStatus;
  parentConstitutionVersion: string;
  forkedConstitutionVersion: string;
  amendments: Amendment[];
  description: string;
  activeMembers?: number;
  verified: boolean;
  mergedBack?: boolean;
}

interface ForkRegistryProps {
  forks: ForkData[];
  parentInstanceName?: string;
  onViewFork?: (forkId: string) => void;
  onViewAmendment?: (forkId: string, amendmentId: string) => void;
  onViewConstitution?: (forkId: string) => void;
}

const statusConfig: Record<ForkStatus, { color: string; label: string; icon: typeof CheckCircle }> = {
  active: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Active', icon: CheckCircle },
  merged: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Merged Back', icon: CheckCircle },
  abandoned: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Abandoned', icon: XCircle },
  proposal: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Proposal', icon: AlertCircle }
};

const amendmentTypeConfig: Record<AmendmentType, { color: string; label: string; symbol: string }> = {
  add: { color: 'text-green-600 bg-green-50', label: 'Addition', symbol: '+' },
  modify: { color: 'text-blue-600 bg-blue-50', label: 'Modification', symbol: '~' },
  remove: { color: 'text-red-600 bg-red-50', label: 'Removal', symbol: '-' }
};

export function ForkRegistry({
  forks,
  parentInstanceName,
  onViewFork,
  onViewAmendment,
  onViewConstitution
}: ForkRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ForkStatus | 'all'>('all');
  const [expandedFork, setExpandedFork] = useState<string | null>(null);

  const filteredForks = forks.filter(fork => {
    const matchesSearch = fork.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fork.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fork.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || fork.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeForks = forks.filter(f => f.status === 'active').length;
  const mergedForks = forks.filter(f => f.status === 'merged').length;
  const totalAmendments = forks.reduce((sum, f) => sum + f.amendments.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-600" />
                Fork Registry
              </CardTitle>
              {parentInstanceName && (
                <p className="text-sm text-gray-500 mt-1">
                  Forks from {parentInstanceName}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-700">{activeForks}</p>
              <p className="text-sm text-green-600">Active Forks</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{mergedForks}</p>
              <p className="text-sm text-blue-600">Merged Back</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">{totalAmendments}</p>
              <p className="text-sm text-purple-600">Total Amendments</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search forks by name, creator, or description..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as ForkStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="merged">Merged</option>
              <option value="abandoned">Abandoned</option>
              <option value="proposal">Proposal</option>
            </select>
          </div>

          {/* Constitutional Note */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
            <GitBranch className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-900">
              <strong>Forks are a feature:</strong> They enable experimentation and diversity while 
              maintaining accountability. Each fork maintains lineage to its parent.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fork List */}
      <div className="space-y-4">
        {filteredForks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No forks match your search criteria' 
                  : 'No forks registered yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredForks.map(fork => {
            const statusConf = statusConfig[fork.status];
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedFork === fork.id;

            return (
              <Card key={fork.id} className="border-2 hover:border-purple-300 transition-colors">
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <GitBranch className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{fork.name}</h3>
                          {fork.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" title="Verified fork" />
                          )}
                        </div>
                        {fork.url && (
                          <a 
                            href={fork.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            {fork.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge className={`${statusConf.color} border flex items-center gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConf.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{fork.description}</p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>by {fork.creatorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(fork.forkDate).toLocaleDateString()}</span>
                    </div>
                    {fork.activeMembers !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{fork.activeMembers} members</span>
                      </div>
                    )}
                  </div>

                  {/* Amendment Summary */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {fork.amendments.length} Amendment{fork.amendments.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setExpandedFork(isExpanded ? null : fork.id)}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide' : 'Show'} Details
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Amendment Type Badges */}
                    <div className="flex gap-2">
                      {(['add', 'modify', 'remove'] as AmendmentType[]).map(type => {
                        const count = fork.amendments.filter(a => a.type === type).length;
                        const conf = amendmentTypeConfig[type];
                        if (count === 0) return null;
                        return (
                          <Badge key={type} className={`${conf.color} border-0 text-xs`}>
                            {conf.symbol} {count} {conf.label}{count !== 1 ? 's' : ''}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Amendment Details */}
                  {isExpanded && fork.amendments.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      {fork.amendments.map(amendment => {
                        const conf = amendmentTypeConfig[amendment.type];
                        return (
                          <div key={amendment.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1">
                                <Badge className={`${conf.color} border-0 text-xs mt-0.5`}>
                                  {conf.symbol} {conf.label}
                                </Badge>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{amendment.section}</p>
                                </div>
                              </div>
                              {onViewAmendment && (
                                <button
                                  onClick={() => onViewAmendment(fork.id, amendment.id)}
                                  className="text-xs text-purple-600 hover:text-purple-800"
                                >
                                  View Full
                                </button>
                              )}
                            </div>

                            {/* Diff */}
                            {amendment.oldText && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs text-red-600 mb-1">- Old</p>
                                <p className="text-xs text-red-900 font-mono">{amendment.oldText}</p>
                              </div>
                            )}
                            {amendment.newText && (
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                                <p className="text-xs text-green-600 mb-1">+ New</p>
                                <p className="text-xs text-green-900 font-mono">{amendment.newText}</p>
                              </div>
                            )}

                            {/* Rationale */}
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-600 mb-1">Rationale</p>
                              <p className="text-xs text-blue-900">{amendment.rationale}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Constitution Versions */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>Parent: v{fork.parentConstitutionVersion}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Fork: v{fork.forkedConstitutionVersion}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {onViewFork && (
                      <button
                        onClick={() => onViewFork(fork.id)}
                        className="flex-1 py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        View Fork Instance
                      </button>
                    )}
                    {onViewConstitution && (
                      <button
                        onClick={() => onViewConstitution(fork.id)}
                        className="py-2 px-4 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Constitution
                      </button>
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
 * <ForkRegistry
 *   parentInstanceName="original.mirror"
 *   forks={[
 *     {
 *       id: 'fork_1',
 *       name: 'Mirror Experimental',
 *       url: 'https://experimental.mirror.network',
 *       creatorInstanceId: 'inst_alice',
 *       creatorName: 'alice.mirror',
 *       forkDate: '2024-01-15T10:00:00Z',
 *       status: 'active',
 *       parentConstitutionVersion: '1.2.0',
 *       forkedConstitutionVersion: '1.2.1-experimental',
 *       amendments: [
 *         {
 *           id: 'amd_1',
 *           section: 'Article IV: Guardianship',
 *           type: 'modify',
 *           oldText: 'Guardians serve for 90 days',
 *           newText: 'Guardians serve for 60 days',
 *           rationale: 'Shorter terms increase rotation and prevent power concentration'
 *         },
 *         {
 *           id: 'amd_2',
 *           section: 'Article VII: Privacy',
 *           type: 'add',
 *           newText: 'All data must be encrypted at rest',
 *           rationale: 'Additional privacy safeguard for sensitive data'
 *         }
 *       ],
 *       description: 'Testing shorter guardian terms and additional privacy features',
 *       activeMembers: 42,
 *       verified: true
 *     },
 *     {
 *       id: 'fork_2',
 *       name: 'Mirror Community Edition',
 *       creatorInstanceId: 'inst_bob',
 *       creatorName: 'bob.mirror',
 *       forkDate: '2024-01-10T14:00:00Z',
 *       status: 'merged',
 *       parentConstitutionVersion: '1.1.0',
 *       forkedConstitutionVersion: '1.1.1-community',
 *       amendments: [
 *         {
 *           id: 'amd_3',
 *           section: 'Article II: Doors',
 *           type: 'add',
 *           newText: 'Door metrics must include time-to-exit average',
 *           rationale: 'Better transparency for exit friction'
 *         }
 *       ],
 *       description: 'Added exit friction metrics - merged back to main',
 *       mergedBack: true,
 *       verified: true
 *     }
 *   ]}
 *   onViewFork={(id) => console.log('View fork:', id)}
 *   onViewAmendment={(forkId, amendmentId) => console.log('View amendment:', forkId, amendmentId)}
 *   onViewConstitution={(id) => console.log('View constitution:', id)}
 * />
 */



