/**
 * Finder Demo Page
 * Test the Mirror Finder components
 */

import React, { useState } from 'react';
import { PostureSelector } from '@/components/PostureSelector';
import { DoorsPanel } from '@/components/DoorsPanel';
import { TPVVisualizer } from '@/components/TPVVisualizer';
import { AsymmetryReport } from '@/components/AsymmetryReport';
import { MistakeReporter } from '@/components/MistakeReporter';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function FinderDemo() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [asymmetryNodeId, setAsymmetryNodeId] = useState<string | null>(null);
  const [mistakeNodeId, setMistakeNodeId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleDoorOpen = (nodeId: string) => {
    console.log('Opening door:', nodeId);
    setSelectedNodeId(nodeId);
    // In production: Navigate to door or show modal
  };

  const handleViewAsymmetry = (nodeId: string) => {
    console.log('Viewing asymmetry for:', nodeId);
    setAsymmetryNodeId(nodeId);
  };

  const handleReportMistake = (nodeId: string) => {
    console.log('Reporting mistake for:', nodeId);
    setMistakeNodeId(nodeId);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    // In production: Show settings modal
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🪞 Mirror Finder
          </h1>
          <p className="text-lg text-gray-600">
            Constitutional routing intelligence for reflective conditions
          </p>
        </div>

        {/* Posture Selector */}
        <div className="mb-12">
          <PostureSelector />
        </div>

        {/* TPV Visualizer */}
        <div className="mb-12">
          <TPVVisualizer />
        </div>

        {/* Doors Panel */}
        <div className="mb-12">
          <DoorsPanel
            onDoorOpen={handleDoorOpen}
            onViewAsymmetry={handleViewAsymmetry}
            onOpenSettings={handleOpenSettings}
          />
        </div>

        {/* Modal: Asymmetry Report */}
        {asymmetryNodeId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <AsymmetryReport
              nodeId={asymmetryNodeId}
              onClose={() => setAsymmetryNodeId(null)}
            />
          </div>
        )}

        {/* Modal: Mistake Reporter */}
        {mistakeNodeId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <MistakeReporter
              nodeId={mistakeNodeId}
              doorTitle="Sample Door"
              onClose={() => setMistakeNodeId(null)}
              onSuccess={() => console.log('Mistake reported successfully')}
            />
          </div>
        )}

        {/* Test Buttons */}
        <div className="mb-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test Components
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAsymmetryNodeId('test-node-1')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Asymmetry Report
            </button>
            <button
              onClick={() => setMistakeNodeId('test-node-1')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Report Mistake
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Debug Info
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Selected Node: {selectedNodeId || 'None'}</p>
            <p>Asymmetry Node: {asymmetryNodeId || 'None'}</p>
            <p>Mistake Node: {mistakeNodeId || 'None'}</p>
            <p>Settings Open: {showSettings ? 'Yes' : 'No'}</p>
            <p>API Endpoint: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prevent static generation
export async function getServerSideProps() {
  return { props: {} };
}
