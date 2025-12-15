import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink, Activity, Clock, Tag, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { GraphNode, NodeType } from './IdentityGraphView';

/**
 * GraphNodeCard - Individual Node Display Component
 * 
 * Features:
 * - Full node details (label, content, type, tags)
 * - Activation count and last activated timestamp
 * - Connected nodes preview (incoming/outgoing edges)
 * - Edit/delete actions
 * - Navigate to connected nodes
 * 
 * Constitutional Note: Nodes represent patterns, not truths.
 * You can edit, delete, or reframe any node at any time.
 */

interface ConnectedNode {
  id: string;
  label: string;
  nodeType: NodeType;
  edgeType: 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';
  direction: 'incoming' | 'outgoing';
}

interface GraphNodeCardProps {
  node: GraphNode;
  connectedNodes?: ConnectedNode[];
  onEdit?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onNavigateToNode?: (nodeId: string) => void;
  isExpanded?: boolean;
}

export function GraphNodeCard({
  node,
  connectedNodes = [],
  onEdit,
  onDelete,
  onNavigateToNode,
  isExpanded = false
}: GraphNodeCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Node type colors (matching IdentityGraphView)
  const nodeColors: Record<NodeType, { bg: string; border: string; text: string }> = {
    thought: { bg: 'bg-sky-50', border: 'border-sky-500', text: 'text-sky-700' },
    belief: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
    emotion: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700' },
    action: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' },
    experience: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
    consequence: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' }
  };

  const color = nodeColors[node.nodeType];

  // Format timestamp
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Group connected nodes by direction
  const incomingNodes = connectedNodes.filter(n => n.direction === 'incoming');
  const outgoingNodes = connectedNodes.filter(n => n.direction === 'outgoing');

  // Handle delete with confirmation
  const handleDelete = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    if (onDelete) {
      onDelete(node.id);
    }
  };

  return (
    <Card className={`border-l-4 ${color.border}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {node.label}
              <Badge className={`${color.bg} ${color.text} border-0`}>
                {node.nodeType}
              </Badge>
            </CardTitle>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(node.id)}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className={showDeleteConfirm ? 'text-red-600 hover:text-red-700' : ''}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-2">
              Delete this node? This will also remove all connected edges.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Confirm Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <div>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {node.content}
          </p>
        </div>

        {/* Lens Tags */}
        {node.lensTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Lens Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {node.lensTags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Activations:</span>
            <span className="font-medium">{node.activationCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Last:</span>
            <span className="font-medium">{formatTimestamp(node.lastActivated)}</span>
          </div>
        </div>

        {/* Connected Nodes */}
        {connectedNodes.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 mb-3"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              <span className="font-medium">
                Connected Nodes ({connectedNodes.length})
              </span>
            </Button>

            {expanded && (
              <div className="space-y-4 pl-4">
                {/* Incoming Connections */}
                {incomingNodes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">
                      Incoming ({incomingNodes.length})
                    </h4>
                    <div className="space-y-2">
                      {incomingNodes.map(conn => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => onNavigateToNode?.(conn.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${nodeColors[conn.nodeType].bg}`} />
                            <span className="text-sm font-medium">{conn.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {conn.edgeType.replace('_', ' ')}
                            </Badge>
                          </div>
                          {onNavigateToNode && (
                            <ExternalLink className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outgoing Connections */}
                {outgoingNodes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">
                      Outgoing ({outgoingNodes.length})
                    </h4>
                    <div className="space-y-2">
                      {outgoingNodes.map(conn => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => onNavigateToNode?.(conn.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${nodeColors[conn.nodeType].bg}`} />
                            <span className="text-sm font-medium">{conn.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {conn.edgeType.replace('_', ' ')}
                            </Badge>
                          </div>
                          {onNavigateToNode && (
                            <ExternalLink className="h-3 w-3 text-gray-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Constitutional Note */}
        {node.activationCount > 50 && (
          <div className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-3 py-2">
            High activation count suggests this pattern is significant to you. 
            That doesn't make it permanent—patterns can evolve.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * <GraphNodeCard
 *   node={{
 *     id: 'node_123',
 *     label: 'Fear of failure',
 *     content: 'Recurring thought pattern when starting new projects. Often triggered by past experiences of criticism.',
 *     nodeType: 'thought',
 *     lensTags: ['anxiety', 'work', 'self-perception'],
 *     activationCount: 42,
 *     lastActivated: '2024-01-15T10:00:00Z'
 *   }}
 *   connectedNodes={[
 *     {
 *       id: 'node_456',
 *       label: 'Perfectionism belief',
 *       nodeType: 'belief',
 *       edgeType: 'reinforces',
 *       direction: 'incoming'
 *     },
 *     {
 *       id: 'node_789',
 *       label: 'Procrastination action',
 *       nodeType: 'action',
 *       edgeType: 'leads_to',
 *       direction: 'outgoing'
 *     }
 *   ]}
 *   onEdit={(id) => console.log('Edit node:', id)}
 *   onDelete={(id) => console.log('Delete node:', id)}
 *   onNavigateToNode={(id) => console.log('Navigate to:', id)}
 *   isExpanded={true}
 * />
 */
