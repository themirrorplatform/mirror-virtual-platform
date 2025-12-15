import React, { useState } from 'react';
import {
  Smile,
  Frown,
  Meh,
  Heart,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

/**
 * ToneVisualization - Emotional Tone Heatmap
 * 
 * Features:
 * - Heatmap visualization of emotional tone over time
 * - 5 tone categories: joyful, calm, anxious, sad, angry
 * - Daily/weekly/monthly aggregation
 * - Intensity color coding
 * - Hover to see details
 * - Filter by time range
 * - Identify patterns and shifts
 * - Compare with posture changes
 * 
 * Constitutional Note: Emotional data is private and sacred.
 * This visualization is for YOUR insight only, never shared.
 */

type ToneCategory = 'joyful' | 'calm' | 'anxious' | 'sad' | 'angry' | 'neutral';

interface ToneDataPoint {
  date: string;
  toneCategory: ToneCategory;
  intensity: number; // 0-1
  reflectionCount: number;
  dominantLens?: string;
}

interface ToneVisualizationProps {
  data: ToneDataPoint[];
  startDate: string;
  endDate: string;
  onDateClick?: (date: string) => void;
}

const toneCategoryConfig: Record<ToneCategory, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  joyful: { color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Joyful', icon: Smile },
  calm: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'Calm', icon: Heart },
  anxious: { color: 'text-orange-600', bg: 'bg-orange-500', label: 'Anxious', icon: AlertTriangle },
  sad: { color: 'text-purple-600', bg: 'bg-purple-500', label: 'Sad', icon: Frown },
  angry: { color: 'text-red-600', bg: 'bg-red-500', label: 'Angry', icon: TrendingUp },
  neutral: { color: 'text-gray-600', bg: 'bg-gray-500', label: 'Neutral', icon: Meh }
};

const getIntensityOpacity = (intensity: number): string => {
  if (intensity >= 0.8) return 'opacity-100';
  if (intensity >= 0.6) return 'opacity-75';
  if (intensity >= 0.4) return 'opacity-50';
  if (intensity >= 0.2) return 'opacity-25';
  return 'opacity-10';
};

export function ToneVisualization({
  data,
  startDate,
  endDate,
  onDateClick
}: ToneVisualizationProps) {
  const [selectedTone, setSelectedTone] = useState<ToneCategory | 'all'>('all');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'stream'>('calendar');

  // Generate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateRange: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateRange.push(new Date(d));
  }

  // Group data by date
  const dataByDate = data.reduce((acc, point) => {
    if (!acc[point.date]) acc[point.date] = [];
    acc[point.date].push(point);
    return acc;
  }, {} as Record<string, ToneDataPoint[]>);

  // Calculate tone distribution
  const toneDistribution = data.reduce((acc, point) => {
    acc[point.toneCategory] = (acc[point.toneCategory] || 0) + 1;
    return acc;
  }, {} as Record<ToneCategory, number>);

  const totalDataPoints = data.length;
  const avgIntensity = data.reduce((sum, p) => sum + p.intensity, 0) / (totalDataPoints || 1);

  // Filter data
  const filteredData = selectedTone === 'all' 
    ? data 
    : data.filter(d => d.toneCategory === selectedTone);

  // Get weeks for calendar view
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  dateRange.forEach((date, idx) => {
    currentWeek.push(date);
    if (date.getDay() === 6 || idx === dateRange.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="h-7 w-7 text-pink-600" />
          Emotional Tone Visualization
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pattern of emotional tones over time
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalDataPoints}</p>
              <p className="text-xs text-gray-500 mt-1">Total Reflections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {(avgIntensity * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg Intensity</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {dateRange.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Days Tracked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tone Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tone Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(toneCategoryConfig) as ToneCategory[]).map(tone => {
              const count = toneDistribution[tone] || 0;
              const percentage = totalDataPoints > 0 ? (count / totalDataPoints) * 100 : 0;
              const config = toneCategoryConfig[tone];
              const ToneIcon = config.icon;

              return (
                <div key={tone}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ToneIcon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">{tone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.bg} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTone('all')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedTone === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tones
            </button>
            {(Object.keys(toneCategoryConfig) as ToneCategory[]).map(tone => {
              const config = toneCategoryConfig[tone];
              return (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                    selectedTone === tone
                      ? config.color + ' bg-opacity-20 border border-current'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tone}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('stream')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              viewMode === 'stream'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stream
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tone Heatmap
            </CardTitle>
            <p className="text-sm text-gray-500">
              Hover over cells for details • Click to view reflections
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-xs text-center text-gray-500 font-medium">
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-1">
                  {week.map((date, dayIdx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayData = dataByDate[dateStr] || [];
                    const dayFilteredData = selectedTone === 'all' 
                      ? dayData 
                      : dayData.filter(d => d.toneCategory === selectedTone);
                    
                    const dominantTone = dayFilteredData.length > 0 
                      ? dayFilteredData.reduce((max, d) => d.intensity > max.intensity ? d : max, dayFilteredData[0])
                      : null;

                    const cellKey = `${weekIdx}-${dayIdx}`;
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <div key={dayIdx} className="relative">
                        <button
                          onClick={() => dayData.length > 0 && onDateClick?.(dateStr)}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-full aspect-square rounded border-2 transition-all ${
                            dominantTone 
                              ? `${toneCategoryConfig[dominantTone.toneCategory].bg} ${getIntensityOpacity(dominantTone.intensity)} hover:scale-110 cursor-pointer border-gray-300 hover:border-gray-900`
                              : 'bg-gray-100 border-gray-200'
                          } ${isHovered ? 'scale-110 z-10' : ''}`}
                          disabled={dayData.length === 0}
                        >
                          <span className="text-xs font-medium text-gray-700">
                            {date.getDate()}
                          </span>
                        </button>

                        {/* Hover tooltip */}
                        {isHovered && dayData.length > 0 && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-white border-2 border-gray-900 rounded-lg shadow-xl z-20 w-48">
                            <p className="text-xs font-bold text-gray-900 mb-2">
                              {date.toLocaleDateString()}
                            </p>
                            <div className="space-y-1">
                              {dayFilteredData.slice(0, 3).map((point, idx) => {
                                const config = toneCategoryConfig[point.toneCategory];
                                const ToneIcon = config.icon;
                                return (
                                  <div key={idx} className="flex items-center gap-2">
                                    <ToneIcon className={`h-3 w-3 ${config.color}`} />
                                    <span className="text-xs text-gray-700 capitalize">{point.toneCategory}</span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {(point.intensity * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                );
                              })}
                              {dayFilteredData.length > 3 && (
                                <p className="text-xs text-gray-500 italic">
                                  +{dayFilteredData.length - 3} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Intensity Legend:</p>
              <div className="flex items-center gap-4">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className={`w-6 h-6 rounded bg-purple-500 ${getIntensityOpacity(intensity)}`}
                    />
                    <span className="text-xs text-gray-600">
                      {(intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stream View */}
      {viewMode === 'stream' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tone Timeline</CardTitle>
            <p className="text-sm text-gray-500">
              Chronological view of emotional tones
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredData.length > 0 ? (
                filteredData
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((point, idx) => {
                    const config = toneCategoryConfig[point.toneCategory];
                    const ToneIcon = config.icon;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-l-4 ${config.bg} bg-opacity-10 border-opacity-100`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ToneIcon className={`h-4 w-4 ${config.color}`} />
                            <Badge className={`${config.color} bg-opacity-20 border-0 capitalize`}>
                              {point.toneCategory}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(point.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              {point.reflectionCount} reflection{point.reflectionCount > 1 ? 's' : ''}
                            </p>
                            {point.dominantLens && (
                              <p className="text-xs text-gray-500 capitalize">
                                Lens: {point.dominantLens}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {(point.intensity * 100).toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500">Intensity</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-gray-500 text-center italic py-4">
                  No data for selected tone
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Constitutional Note */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-900">
            <strong>Sacred Privacy:</strong> Emotional data is private and deeply personal.
            This visualization is for YOUR insight only - it's never shared with others or
            used to judge you. Use it to understand your emotional patterns over time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ToneVisualization
 *   data={[
 *     {
 *       date: '2024-01-15',
 *       toneCategory: 'joyful',
 *       intensity: 0.8,
 *       reflectionCount: 3,
 *       dominantLens: 'relationships'
 *     },
 *     {
 *       date: '2024-01-15',
 *       toneCategory: 'anxious',
 *       intensity: 0.6,
 *       reflectionCount: 2,
 *       dominantLens: 'work'
 *     }
 *   ]}
 *   startDate="2024-01-01"
 *   endDate="2024-01-31"
 *   onDateClick={(date) => console.log('View reflections for:', date)}
 * />
 */
