/**
 * TPVVisualizer Component
 * Displays Tension Proxy Vector with radar chart visualization
 */

import React from 'react';
import { useTensionProxyVector } from '@/lib/hooks/useFinder';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

export function TPVVisualizer() {
  const { data, isLoading, refetch, isFetching } = useTensionProxyVector();

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tpv = data?.vector || {};
  const ambiguityScore = data?.ambiguity_score ?? 1.0;
  const isManualOverride = data?.is_manual_override ?? false;
  const lastComputed = data?.last_computed;

  // Transform TPV data for radar chart
  const chartData = Object.entries(tpv).map(([lens, weight]) => ({
    lens: lens.charAt(0).toUpperCase() + lens.slice(1),
    weight: weight,
    fullMark: 1.0,
  }));

  const hasData = chartData.length > 0;
  const isHighAmbiguity = ambiguityScore > 0.7;

  return (
    <div className="w-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Tension Proxy Vector (TPV)
          </h2>
          <p className="text-sm text-gray-600">
            Computed from your explicit lens usage
          </p>
        </div>
        
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* High Ambiguity Warning */}
      {isHighAmbiguity && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 mb-1">
                High ambiguity score: {(ambiguityScore * 100).toFixed(0)}%
              </p>
              <p className="text-amber-700">
                Your TPV has low confidence due to limited lens usage data. Use more lenses to improve door recommendations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Override Badge */}
      {isManualOverride && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-medium">Manual Override Active</span>
            <span className="text-blue-700">— You've manually adjusted this TPV</span>
          </div>
        </div>
      )}

      {/* Chart or Empty State */}
      {hasData ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="lens" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 1]} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                name="Tension Weight"
                dataKey="weight"
                stroke="#1f2937"
                fill="#1f2937"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mb-6 p-12 bg-gray-50 rounded-lg text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No TPV Data Yet
          </h3>
          <p className="text-sm text-gray-600">
            Start using lenses to build your Tension Proxy Vector. This helps Mirror Finder understand what you're working through.
          </p>
        </div>
      )}

      {/* Lens Weights Table */}
      {hasData && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Lens Weights
          </h3>
          <div className="space-y-2">
            {chartData.sort((a, b) => b.weight - a.weight).map((item) => (
              <div key={item.lens} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-32">
                  {item.lens}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 transition-all"
                    style={{ width: `${item.weight * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {(item.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {lastComputed
              ? `Updated ${new Date(lastComputed).toLocaleString()}`
              : 'Not yet computed'}
          </span>
        </div>
        <div className="text-gray-600">
          Ambiguity: <span className="font-medium">{(ambiguityScore * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Constitutional Note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>Data Transparency:</strong> Your TPV is computed ONLY from explicit lens usage, never inferred from reflection content. This is a constitutional requirement ensuring you control what tensions are tracked.
        </p>
      </div>
    </div>
  );
}
