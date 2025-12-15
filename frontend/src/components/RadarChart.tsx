import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

/**
 * RadarChart - Tension Proxy Vector Visualization
 * 
 * Features:
 * - Multi-dimensional radar chart for TPV display
 * - Lens weights visualization (up to 8 dimensions)
 * - Ambiguity score indicator
 * - Interactive tooltips
 * - Multiple TPV comparison (current vs. suggested)
 * - Color-coded dimensions
 * - Percentage display
 * - Last computed timestamp
 * 
 * Constitutional Note: TPV calculations are transparent.
 * This visualization shows how Mirror understands your current tensions.
 */

export interface LensWeight {
  lens: string;
  weight: number; // 0-1
  label?: string;
  description?: string;
}

export interface TPVData {
  id: string;
  lensWeights: LensWeight[];
  ambiguityScore: number; // 0-1
  computedAt: string;
  posture?: string;
  label?: string; // For comparison (e.g., "Current", "Suggested")
}

interface RadarChartProps {
  tpvData: TPVData | TPVData[]; // Single or multiple for comparison
  showAmbiguity?: boolean;
  showLegend?: boolean;
  showTimestamp?: boolean;
  height?: number;
  variant?: 'default' | 'compact';
}

// Lens colors
const lensColors: Record<string, string> = {
  politics: '#EF4444',
  relationships: '#EC4899',
  identity: '#8B5CF6',
  work: '#3B82F6',
  health: '#10B981',
  spirituality: '#F59E0B',
  creativity: '#F97316',
  community: '#06B6D4'
};

// Get color for lens
const getLensColor = (lens: string): string => {
  return lensColors[lens.toLowerCase()] || '#6B7280';
};

// Ambiguity level interpretation
const getAmbiguityLevel = (score: number): { label: string; color: string; description: string } => {
  if (score < 0.3) return {
    label: 'Clear',
    color: 'bg-green-100 text-green-700',
    description: 'Tensions are well-defined'
  };
  if (score < 0.6) return {
    label: 'Moderate',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Some uncertainty in tensions'
  };
  return {
    label: 'High',
    color: 'bg-red-100 text-red-700',
    description: 'Significant uncertainty - may need more reflection'
  };
};

export function RadarChart({
  tpvData,
  showAmbiguity = true,
  showLegend = true,
  showTimestamp = true,
  height = 400,
  variant = 'default'
}: RadarChartProps) {
  // Normalize to array
  const tpvArray = Array.isArray(tpvData) ? tpvData : [tpvData];

  // Build chart data
  // Get all unique lenses across all TPVs
  const allLenses = Array.from(
    new Set(tpvArray.flatMap(tpv => tpv.lensWeights.map(lw => lw.lens)))
  );

  // Build data points for radar chart
  const chartData = allLenses.map(lens => {
    const dataPoint: any = { lens };
    
    tpvArray.forEach((tpv, idx) => {
      const lensWeight = tpv.lensWeights.find(lw => lw.lens === lens);
      const key = tpv.label || `TPV ${idx + 1}`;
      dataPoint[key] = lensWeight ? Math.round(lensWeight.weight * 100) : 0;
    });

    return dataPoint;
  });

  // Get keys for radar areas (TPV labels)
  const dataKeys = tpvArray.map((tpv, idx) => tpv.label || `TPV ${idx + 1}`);

  // Colors for multiple TPVs
  const radarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Tension Proxy Vector</h4>
          {showTimestamp && tpvArray[0] && (
            <p className="text-xs text-gray-500">
              Computed {new Date(tpvArray[0].computedAt).toLocaleString()}
            </p>
          )}
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <RechartsRadarChart data={chartData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="lens"
              tick={{ fill: '#6B7280', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            {dataKeys.map((key, idx) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={radarColors[idx % radarColors.length]}
                fill={radarColors[idx % radarColors.length]}
                fillOpacity={0.3}
              />
            ))}
            {showLegend && dataKeys.length > 1 && <Legend />}
            <Tooltip
              formatter={(value: number) => `${value}%`}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>

        {showAmbiguity && tpvArray[0] && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">Ambiguity Score:</span>
            <Badge className={getAmbiguityLevel(tpvArray[0].ambiguityScore).color + ' border-0'}>
              {getAmbiguityLevel(tpvArray[0].ambiguityScore).label}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Default full variant
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tension Proxy Vector</h3>
            {showTimestamp && tpvArray[0] && (
              <p className="text-sm text-gray-500 mt-1">
                Last computed: {new Date(tpvArray[0].computedAt).toLocaleString()}
              </p>
            )}
          </div>
          {tpvArray[0]?.posture && (
            <Badge className="bg-purple-100 text-purple-700 border-0">
              Posture: {tpvArray[0].posture}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <RechartsRadarChart data={chartData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="lens"
              tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#6B7280', fontSize: 11 }}
            />
            {dataKeys.map((key, idx) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={radarColors[idx % radarColors.length]}
                fill={radarColors[idx % radarColors.length]}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            ))}
            {showLegend && dataKeys.length > 1 && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            )}
            <Tooltip
              formatter={(value: number, name: string) => [`${value}%`, name]}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>

        {/* Lens Details */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Lens Weights</h4>
          {tpvArray[0] && tpvArray[0].lensWeights
            .sort((a, b) => b.weight - a.weight) // Sort by weight descending
            .map(lw => (
              <div key={lw.lens} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {lw.label || lw.lens}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(lw.weight * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${lw.weight * 100}%`,
                        backgroundColor: getLensColor(lw.lens)
                      }}
                    />
                  </div>
                  {lw.description && (
                    <p className="text-xs text-gray-500 mt-1">{lw.description}</p>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Ambiguity Score */}
        {showAmbiguity && tpvArray[0] && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Ambiguity Score</h4>
                  <Badge className={getAmbiguityLevel(tpvArray[0].ambiguityScore).color + ' border-0'}>
                    {getAmbiguityLevel(tpvArray[0].ambiguityScore).label}
                  </Badge>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                    style={{ width: `${tpvArray[0].ambiguityScore * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {getAmbiguityLevel(tpvArray[0].ambiguityScore).description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Info */}
        {dataKeys.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Comparing TPVs</h4>
                <p className="text-xs text-blue-700">
                  This chart compares {dataKeys.length} different tension states. Use this to understand
                  how your tensions shift across different contexts or time periods.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Constitutional Note */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-900">
              <strong>Transparent Calculations:</strong> Your Tension Proxy Vector is computed from your
              reflections and lens usage. It helps Mirror understand what you're working through. The
              algorithm is open-source and auditable. Learn more in our documentation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * // Single TPV
 * <RadarChart
 *   tpvData={{
 *     id: 'tpv_123',
 *     lensWeights: [
 *       { lens: 'relationships', weight: 0.8, label: 'Relationships', description: 'Connection tensions' },
 *       { lens: 'identity', weight: 0.6, label: 'Identity', description: 'Self-understanding' },
 *       { lens: 'work', weight: 0.4, label: 'Work', description: 'Career fulfillment' },
 *       { lens: 'health', weight: 0.3, label: 'Health', description: 'Physical wellbeing' },
 *       { lens: 'spirituality', weight: 0.5, label: 'Spirituality', description: 'Meaning-making' }
 *     ],
 *     ambiguityScore: 0.35,
 *     computedAt: '2024-01-15T10:00:00Z',
 *     posture: 'grounded'
 *   }}
 *   showAmbiguity
 *   showLegend
 *   showTimestamp
 * />
 * 
 * // Compare multiple TPVs
 * <RadarChart
 *   tpvData={[
 *     {
 *       id: 'tpv_current',
 *       label: 'Current',
 *       lensWeights: [
 *         { lens: 'relationships', weight: 0.8 },
 *         { lens: 'identity', weight: 0.6 },
 *         { lens: 'work', weight: 0.4 }
 *       ],
 *       ambiguityScore: 0.35,
 *       computedAt: '2024-01-15T10:00:00Z'
 *     },
 *     {
 *       id: 'tpv_suggested',
 *       label: 'Suggested',
 *       lensWeights: [
 *         { lens: 'relationships', weight: 0.7 },
 *         { lens: 'identity', weight: 0.8 },
 *         { lens: 'work', weight: 0.5 }
 *       ],
 *       ambiguityScore: 0.25,
 *       computedAt: '2024-01-15T10:00:00Z'
 *     }
 *   ]}
 *   showLegend
 *   height={500}
 * />
 * 
 * // Compact variant
 * <RadarChart
 *   variant="compact"
 *   tpvData={{
 *     id: 'tpv_123',
 *     lensWeights: [
 *       { lens: 'relationships', weight: 0.8 },
 *       { lens: 'identity', weight: 0.6 }
 *     ],
 *     ambiguityScore: 0.35,
 *     computedAt: '2024-01-15T10:00:00Z'
 *   }}
 *   height={300}
 * />
 */
