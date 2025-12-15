import React, { useState } from 'react';
import { Info, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';

/**
 * Heatmap - Time-Series Intensity Visualization
 * 
 * Features:
 * - Calendar-style heatmap
 * - Color intensity by value
 * - Lens usage tracking over time
 * - Activity patterns visualization
 * - Interactive cell tooltips
 * - Weekly/monthly views
 * - Day labels
 * - Legend with intensity scale
 * - Missing data handling
 * 
 * Use cases:
 * - Lens usage frequency over time
 * - Reflection activity patterns
 * - Posture change frequency
 * - Engagement trends
 */

export interface HeatmapCell {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
  label?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface HeatmapProps {
  data: HeatmapCell[];
  title?: string;
  subtitle?: string;
  weeks?: number; // Number of weeks to show (default 12)
  colorScale?: {
    min: string;
    mid: string;
    max: string;
  };
  showLegend?: boolean;
  showMonthLabels?: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
  variant?: 'default' | 'compact';
}

// Default color scale
const defaultColorScale = {
  min: '#DBEAFE',  // blue-100
  mid: '#3B82F6',  // blue-500
  max: '#1E3A8A'   // blue-900
};

// Get color for value
const getColor = (value: number, maxValue: number, colorScale: typeof defaultColorScale): string => {
  if (value === 0) return '#F3F4F6'; // gray-100 for no activity

  const intensity = value / maxValue;
  
  if (intensity < 0.33) return colorScale.min;
  if (intensity < 0.66) return colorScale.mid;
  return colorScale.max;
};

// Get last N weeks
const getWeeks = (numWeeks: number): Date[][] => {
  const weeks: Date[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (numWeeks * 7));

  for (let week = 0; week < numWeeks; week++) {
    const weekDates: Date[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (week * 7) + day);
      weekDates.push(date);
    }
    weeks.push(weekDates);
  }

  return weeks;
};

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export function Heatmap({
  data,
  title,
  subtitle,
  weeks = 12,
  colorScale = defaultColorScale,
  showLegend = true,
  showMonthLabels = true,
  onCellClick,
  variant = 'default'
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);

  // Build data map for quick lookup
  const dataMap = new Map<string, HeatmapCell>();
  data.forEach(cell => {
    dataMap.set(cell.date, cell);
  });

  // Calculate max value for color scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // Get weeks grid
  const weeksGrid = getWeeks(weeks);

  // Get month labels
  const monthLabels: { label: string; offset: number }[] = [];
  if (showMonthLabels) {
    let currentMonth = '';
    weeksGrid.forEach((week, weekIdx) => {
      const firstDay = week[0];
      const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'short' });
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        monthLabels.push({ label: monthLabel, offset: weekIdx });
      }
    });
  }

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate stats
  const totalCells = weeksGrid.length * 7;
  const activeCells = data.filter(d => d.value > 0).length;
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const avgValue = activeCells > 0 ? totalValue / activeCells : 0;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        {title && <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>}
        
        <div className="space-y-1">
          {[...Array(7)].map((_, dayIdx) => (
            <div key={dayIdx} className="flex gap-1">
              {weeksGrid.map((week, weekIdx) => {
                const date = week[dayIdx];
                const dateStr = formatDate(date);
                const cellData = dataMap.get(dateStr);
                const value = cellData?.value || 0;
                const color = getColor(value, maxValue, colorScale);

                return (
                  <button
                    key={`${weekIdx}-${dayIdx}`}
                    onClick={() => cellData && onCellClick?.(cellData)}
                    className="w-3 h-3 rounded-sm hover:ring-2 hover:ring-purple-400 transition-all"
                    style={{ backgroundColor: color }}
                    title={`${dateStr}: ${value}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {showLegend && (
          <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F3F4F6' }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorScale.min }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorScale.mid }} />
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorScale.max }} />
            </div>
            <span>More</span>
          </div>
        )}
      </div>
    );
  }

  // Default full variant
  return (
    <Card>
      {(title || subtitle) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-0">
              Last {weeks} weeks
            </Badge>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Month labels */}
        {showMonthLabels && (
          <div className="flex mb-2" style={{ paddingLeft: '40px' }}>
            {monthLabels.map((month, idx) => (
              <div
                key={idx}
                className="text-xs text-gray-600 font-medium"
                style={{ marginLeft: `${month.offset * 16}px` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {dayLabels.map((day, idx) => (
              <div
                key={idx}
                className="h-4 flex items-center text-xs text-gray-600 font-medium"
                style={{ width: '32px' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-1 overflow-x-auto">
            {weeksGrid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((date, dayIdx) => {
                  const dateStr = formatDate(date);
                  const cellData = dataMap.get(dateStr);
                  const value = cellData?.value || 0;
                  const color = getColor(value, maxValue, colorScale);
                  const isFuture = date > new Date();

                  return (
                    <button
                      key={`${weekIdx}-${dayIdx}`}
                      onClick={() => cellData && onCellClick?.(cellData)}
                      onMouseEnter={(e) => {
                        if (cellData) {
                          setHoveredCell(cellData);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredPosition({ x: rect.left + rect.width / 2, y: rect.top });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCell(null);
                        setHoveredPosition(null);
                      }}
                      disabled={isFuture}
                      className={`w-4 h-4 rounded-sm transition-all ${
                        isFuture 
                          ? 'opacity-30 cursor-not-allowed' 
                          : 'hover:ring-2 hover:ring-purple-400 cursor-pointer'
                      }`}
                      style={{ 
                        backgroundColor: isFuture ? '#F3F4F6' : color
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-600">Less</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#F3F4F6' }} />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: colorScale.min }} />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: colorScale.mid }} />
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: colorScale.max }} />
            </div>
            <span className="text-xs text-gray-600">More</span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Days</p>
            <p className="text-lg font-bold text-gray-900">{totalCells}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600">Active Days</p>
            <p className="text-lg font-bold text-green-900">{activeCells}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Total</p>
            <p className="text-lg font-bold text-blue-900">{totalValue}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600">Avg/Day</p>
            <p className="text-lg font-bold text-purple-900">{avgValue.toFixed(1)}</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Hover over any cell to see details. Darker colors indicate higher activity.
            Click to explore specific days.
          </p>
        </div>

        {/* Tooltip */}
        {hoveredCell && hoveredPosition && (
          <div
            className="fixed z-50 bg-white p-3 border-2 border-purple-300 rounded-lg shadow-xl"
            style={{
              left: hoveredPosition.x,
              top: hoveredPosition.y - 10,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none'
            }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {new Date(hoveredCell.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-lg font-bold text-purple-600 mb-1">
              {hoveredCell.value} {hoveredCell.label || 'events'}
            </p>
            {hoveredCell.metadata && Object.keys(hoveredCell.metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                {Object.entries(hoveredCell.metadata).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-600">{key}:</span>{' '}
                    <span className="text-gray-900 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Usage Example:
 * 
 * // Lens usage over time
 * <Heatmap
 *   title="Relationships Lens Usage"
 *   subtitle="Last 12 weeks"
 *   data={[
 *     { date: '2024-01-15', value: 5, label: 'uses', metadata: { reflections: 3, doors: 2 } },
 *     { date: '2024-01-16', value: 8, label: 'uses', metadata: { reflections: 5, doors: 3 } },
 *     { date: '2024-01-17', value: 3, label: 'uses', metadata: { reflections: 2, doors: 1 } }
 *   ]}
 *   weeks={12}
 *   colorScale={{
 *     min: '#FDE68A',
 *     mid: '#F59E0B',
 *     max: '#B45309'
 *   }}
 *   showLegend
 *   showMonthLabels
 *   onCellClick={(cell) => console.log('Clicked:', cell)}
 * />
 * 
 * // Reflection activity
 * <Heatmap
 *   title="Daily Reflections"
 *   data={generateReflectionData()}
 *   weeks={26}
 *   colorScale={{
 *     min: '#DBEAFE',
 *     mid: '#3B82F6',
 *     max: '#1E3A8A'
 *   }}
 *   onCellClick={(cell) => router.push(`/reflections?date=${cell.date}`)}
 * />
 * 
 * // Compact variant
 * <Heatmap
 *   variant="compact"
 *   title="Activity Pattern"
 *   data={activityData}
 *   weeks={8}
 * />
 */
