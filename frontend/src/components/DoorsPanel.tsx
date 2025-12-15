/**
 * DoorsPanel Component
 * Displays recommended doors with refresh and configuration
 */

import React from 'react';
import { useDoors, useRecordDoorView, useUpdateFinderConfig } from '@/lib/hooks/useFinder';
import { DoorCard } from './DoorCard';
import { RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoorsPanelProps {
  onDoorOpen?: (nodeId: string) => void;
  onViewAsymmetry?: (nodeId: string) => void;
  onOpenSettings?: () => void;
}

export function DoorsPanel({ onDoorOpen, onViewAsymmetry, onOpenSettings }: DoorsPanelProps) {
  const { data, isLoading, refetch, isFetching } = useDoors();
  const recordDoorView = useRecordDoorView();
  const updateConfig = useUpdateFinderConfig();

  const handleDoorOpen = (nodeId: string) => {
    recordDoorView.mutate(nodeId);
    onDoorOpen?.(nodeId);
  };

  const handleBlockDoor = (nodeId: string) => {
    // Add to blocked nodes
    updateConfig.mutate({
      blocked_nodes: [...(data?.doors.map(d => d.node_id) || []), nodeId].filter(id => id !== nodeId),
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="w-full p-8 bg-gray-50 rounded-lg">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const doors = data?.doors || [];
  const mode = data?.mode || 'off';
  const bandwidthLimit = data?.bandwidth_limit || 3;

  if (mode === 'off') {
    return (
      <div className="w-full p-12 bg-gray-50 rounded-lg text-center">
        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Finder is turned off
        </h3>
        <p className="text-gray-600 mb-6">
          Enable Mirror Finder in settings to see door recommendations.
        </p>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Open Settings
          </button>
        )}
      </div>
    );
  }

  if (doors.length === 0) {
    return (
      <div className="w-full p-12 bg-gray-50 rounded-lg text-center">
        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No doors available right now
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your posture or wait for new doors to appear.
        </p>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-5 h-5 inline mr-2', isFetching && 'animate-spin')} />
          Refresh Doors
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Doors for You
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {doors.length} {doors.length === 1 ? 'door' : 'doors'} found · Bandwidth: {bandwidthLimit}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh doors"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            <span className="text-sm font-medium">Refresh</span>
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Finder settings"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Why these doors?</p>
            <p className="text-blue-700">
              Doors are selected based on your declared posture, tension proxy vector (TPV), and
              lens usage patterns. They're designed to match your current reflective capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Doors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doors.map((door) => (
          <DoorCard
            key={door.node_id}
            door={door}
            onOpen={handleDoorOpen}
            onBlock={handleBlockDoor}
            onViewAsymmetry={onViewAsymmetry}
          />
        ))}
      </div>

      {/* Mode Indicator */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Finder mode: <span className="font-medium capitalize">{mode.replace('_', ' ')}</span>
      </div>
    </div>
  );
}
