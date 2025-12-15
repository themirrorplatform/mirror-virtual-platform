import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';

/**
 * BarChart - Horizontal/Vertical Bar Chart Component
 * 
 * Features:
 * - Voting results visualization (yes/no/abstain)
 * - Metrics comparison (multiple data series)
 * - Color-coded bars
 * - Interactive tooltips
 * - Percentage or absolute values
 * - Threshold lines
 * - Stacked or grouped bars
 * - Responsive design
 * - Export chart data
 * 
 * Use cases:
 * - Proposal voting results
 * - User engagement metrics
 * - Lens usage statistics
 * - Performance comparisons
 */

export interface BarDataPoint {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface BarChartData {
  category: string;
  [key: string]: string | number; // Dynamic keys for multiple series
}

interface BarChartProps {
  data: BarChartData[];
  dataKeys: { key: string; label: string; color: string }[];
  title?: string;
  subtitle?: string;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showPercentage?: boolean;
  height?: number;
  variant?: 'default' | 'voting' | 'comparison';
  threshold?: { value: number; label: string; color?: string };
}

// Voting colors
const votingColors = {
  approve: '#10B981',
  yes: '#10B981',
  reject: '#EF4444',
  no: '#EF4444',
  abstain: '#6B7280',
  neutral: '#F59E0B'
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label, showPercentage }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{entry.name}:</span>
          </div>
          <span className="font-semibold text-gray-900">
            {showPercentage && entry.value <= 100 ? `${entry.value}%` : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export function BarChart({
  data,
  dataKeys,
  title,
  subtitle,
  orientation = 'vertical',
  stacked = false,
  showLegend = true,
  showGrid = true,
  showPercentage = false,
  height = 300,
  variant = 'default',
  threshold
}: BarChartProps) {
  // Calculate totals and trends
  const totals = dataKeys.map(key => ({
    key: key.key,
    label: key.label,
    total: data.reduce((sum, item) => sum + (Number(item[key.key]) || 0), 0)
  }));

  const maxValue = Math.max(...data.flatMap(item => 
    dataKeys.map(key => Number(item[key.key]) || 0)
  ));

  // Voting variant (special layout)
  if (variant === 'voting' && data.length > 0) {
    const votingData = data[0];
    const total = dataKeys.reduce((sum, key) => sum + (Number(votingData[key.key]) || 0), 0);

    return (
      <Card>
        {(title || subtitle) && (
          <CardHeader>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent>
          {/* Voting bars */}
          <div className="space-y-4">
            {dataKeys.map(key => {
              const value = Number(votingData[key.key]) || 0;
              const percentage = total > 0 ? (value / total) * 100 : 0;
              const Icon = 
                key.key.includes('yes') || key.key.includes('approve') ? TrendingUp :
                key.key.includes('no') || key.key.includes('reject') ? TrendingDown :
                Minus;

              return (
                <div key={key.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: key.color }} />
                      <span className="text-sm font-medium text-gray-700">{key.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
                      <Badge 
                        className="border-0 text-xs"
                        style={{ backgroundColor: key.color + '20', color: key.color }}
                      >
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full flex items-center px-3 transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: key.color
                      }}
                    >
                      {percentage > 15 && (
                        <span className="text-white text-sm font-medium">
                          {value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Votes</span>
              <span className="text-lg font-bold text-gray-900">{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Threshold indicator */}
          {threshold && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-900">Required: {threshold.label}</span>
                {dataKeys[0] && (
                  <Badge className={
                    ((Number(votingData[dataKeys[0].key]) || 0) / total * 100) >= threshold.value
                      ? 'bg-green-100 text-green-700 border-0'
                      : 'bg-red-100 text-red-700 border-0'
                  }>
                    {((Number(votingData[dataKeys[0].key]) || 0) / total * 100).toFixed(1)}% / {threshold.value}%
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant (Recharts)
  return (
    <Card>
      {(title || subtitle) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {variant === 'comparison' && totals.length > 0 && (
              <div className="flex gap-2">
                {totals.map(total => (
                  <div key={total.key} className="text-right">
                    <p className="text-xs text-gray-500">{total.label}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {total.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            
            {orientation === 'vertical' ? (
              <>
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => showPercentage ? `${value}%` : value.toLocaleString()}
                />
              </>
            ) : (
              <>
                <XAxis 
                  type="number"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => showPercentage ? `${value}%` : value.toLocaleString()}
                />
                <YAxis 
                  type="category"
                  dataKey="category"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
              </>
            )}

            <Tooltip content={<CustomTooltip showPercentage={showPercentage} />} />
            
            {showLegend && dataKeys.length > 1 && (
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
            )}

            {dataKeys.map(key => (
              <Bar
                key={key.key}
                dataKey={key.key}
                name={key.label}
                fill={key.color}
                stackId={stacked ? 'stack' : undefined}
                radius={stacked ? undefined : [4, 4, 0, 0]}
              />
            ))}

            {/* Threshold line */}
            {threshold && orientation === 'vertical' && (
              <Bar dataKey={() => threshold.value} fill="none" stroke={threshold.color || '#3B82F6'} strokeWidth={2} strokeDasharray="5 5" />
            )}
          </RechartsBarChart>
        </ResponsiveContainer>

        {/* Stats summary */}
        {variant === 'comparison' && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Categories</p>
              <p className="text-lg font-bold text-gray-900">{data.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Highest</p>
              <p className="text-lg font-bold text-blue-900">{maxValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600">Series</p>
              <p className="text-lg font-bold text-purple-900">{dataKeys.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * // Voting results
 * <BarChart
 *   variant="voting"
 *   title="Proposal Voting Results"
 *   subtitle="Article V Amendment"
 *   data={[
 *     { category: 'Votes', approve: 234, reject: 45, abstain: 23 }
 *   ]}
 *   dataKeys={[
 *     { key: 'approve', label: 'Approve', color: '#10B981' },
 *     { key: 'reject', label: 'Reject', color: '#EF4444' },
 *     { key: 'abstain', label: 'Abstain', color: '#6B7280' }
 *   ]}
 *   threshold={{ value: 67, label: '2/3 Supermajority' }}
 *   showPercentage
 * />
 * 
 * // Metrics comparison
 * <BarChart
 *   variant="comparison"
 *   title="Lens Usage Statistics"
 *   subtitle="Last 30 days"
 *   data={[
 *     { category: 'Week 1', relationships: 45, identity: 32, work: 18 },
 *     { category: 'Week 2', relationships: 52, identity: 38, work: 24 },
 *     { category: 'Week 3', relationships: 48, identity: 41, work: 28 },
 *     { category: 'Week 4', relationships: 55, identity: 36, work: 22 }
 *   ]}
 *   dataKeys={[
 *     { key: 'relationships', label: 'Relationships', color: '#EC4899' },
 *     { key: 'identity', label: 'Identity', color: '#8B5CF6' },
 *     { key: 'work', label: 'Work', color: '#3B82F6' }
 *   ]}
 *   showLegend
 *   showGrid
 *   height={400}
 * />
 * 
 * // Stacked bars
 * <BarChart
 *   title="User Activity"
 *   data={[
 *     { category: 'Mon', reflections: 12, replies: 8, signals: 5 },
 *     { category: 'Tue', reflections: 15, replies: 10, signals: 7 },
 *     { category: 'Wed', reflections: 10, replies: 6, signals: 4 }
 *   ]}
 *   dataKeys={[
 *     { key: 'reflections', label: 'Reflections', color: '#3B82F6' },
 *     { key: 'replies', label: 'Replies', color: '#10B981' },
 *     { key: 'signals', label: 'Signals', color: '#F59E0B' }
 *   ]}
 *   stacked
 *   showLegend
 * />
 * 
 * // Horizontal orientation
 * <BarChart
 *   orientation="horizontal"
 *   title="Top Contributors"
 *   data={[
 *     { category: 'Alice', contributions: 45 },
 *     { category: 'Bob', contributions: 38 },
 *     { category: 'Carol', contributions: 32 }
 *   ]}
 *   dataKeys={[
 *     { key: 'contributions', label: 'Contributions', color: '#8B5CF6' }
 *   ]}
 *   height={250}
 * />
 */
