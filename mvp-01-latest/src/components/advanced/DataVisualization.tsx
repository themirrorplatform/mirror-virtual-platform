/**
 * Data Visualization - Constitutional data display
 * 
 * Features:
 * - Time-based visualizations
 * - Reflection patterns (not metrics)
 * - Evolution over time
 * - No engagement tracking
 * - No gamification
 * - Simple, informative charts
 */

import { useMemo } from 'react';
import { Card } from '../Card';
import { 
  Calendar,
  TrendingUp,
  Circle,
  BarChart3,
  Activity
} from 'lucide-react';

interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface CategoryData {
  category: string;
  value: number;
  color?: string;
}

/**
 * Activity Calendar - GitHub-style contribution calendar
 */
interface ActivityCalendarProps {
  data: DataPoint[];
  startDate?: Date;
  endDate?: Date;
}

export function ActivityCalendar({ data, startDate, endDate }: ActivityCalendarProps) {
  const calendar = useMemo(() => {
    const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    
    const days: Array<{ date: Date; count: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      const dayData = data.find(
        d => d.date.toDateString() === current.toDateString()
      );
      days.push({
        date: new Date(current),
        count: dayData?.value || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [data, startDate, endDate]);

  const weeks = useMemo(() => {
    const result: Array<Array<{ date: Date; count: number }>> = [];
    let week: Array<{ date: Date; count: number }> = [];

    calendar.forEach((day, index) => {
      week.push(day);
      if (day.date.getDay() === 6 || index === calendar.length - 1) {
        result.push(week);
        week = [];
      }
    });

    return result;
  }, [calendar]);

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-[var(--color-surface-hover)]';
    if (count <= 2) return 'bg-[var(--color-accent-blue)]/20';
    if (count <= 5) return 'bg-[var(--color-accent-blue)]/40';
    if (count <= 10) return 'bg-[var(--color-accent-blue)]/60';
    return 'bg-[var(--color-accent-blue)]';
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[var(--color-accent-blue)]" />
          <h3 className="font-medium">Reflection Activity</h3>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getIntensity(day.count)}`}
                  title={`${day.date.toLocaleDateString()}: ${day.count} reflections`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-[var(--color-surface-hover)]" />
            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-blue)]/20" />
            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-blue)]/40" />
            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-blue)]/60" />
            <div className="w-3 h-3 rounded-sm bg-[var(--color-accent-blue)]" />
          </div>
          <span>More</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Timeline Chart - Reflection frequency over time
 */
interface TimelineChartProps {
  data: DataPoint[];
  title?: string;
}

export function TimelineChart({ data, title = 'Reflection Pattern' }: TimelineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-[var(--color-accent-blue)]" />
          <h3 className="font-medium">{title}</h3>
        </div>

        <div className="h-48 flex items-end gap-1">
          {data.map((point, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div
                className="w-full bg-[var(--color-accent-blue)]/20 hover:bg-[var(--color-accent-blue)]/40 transition-colors rounded-t relative"
                style={{ height: `${(point.value / maxValue) * 100}%` }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                    {point.label || point.date.toLocaleDateString()}: {point.value}
                  </div>
                </div>
              </div>
              {index % Math.ceil(data.length / 6) === 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  {point.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Distribution Chart - Category breakdown
 */
interface DistributionChartProps {
  data: CategoryData[];
  title?: string;
}

export function DistributionChart({ data, title = 'Reflection Distribution' }: DistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--color-accent-blue)]" />
          <h3 className="font-medium">{title}</h3>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

            return (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {item.category}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {item.value} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/**
 * Trend Indicator - Simple up/down/neutral trend
 */
interface TrendIndicatorProps {
  current: number;
  previous: number;
  label: string;
  hidePercentage?: boolean;
}

export function TrendIndicator({
  current,
  previous,
  label,
  hidePercentage = false,
}: TrendIndicatorProps) {
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  const trendConfig = {
    up: {
      color: 'text-[var(--color-accent-blue)]',
      bg: 'bg-[var(--color-accent-blue)]/10',
      icon: '↗',
    },
    down: {
      color: 'text-[var(--color-accent-purple)]',
      bg: 'bg-[var(--color-accent-purple)]/10',
      icon: '↘',
    },
    neutral: {
      color: 'text-[var(--color-text-muted)]',
      bg: 'bg-[var(--color-surface-hover)]',
      icon: '→',
    },
  };

  const config = trendConfig[trend];

  return (
    <Card variant="emphasis">
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-medium">{current}</span>
          {change !== 0 && !hidePercentage && (
            <span className={`text-sm ${config.color}`}>
              {config.icon} {Math.abs(percentChange).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          vs. previous period: {previous}
        </p>
      </div>
    </Card>
  );
}

/**
 * Stats Grid - Overview statistics
 */
interface Stat {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  color?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon || Circle;
        return (
          <Card key={index} variant="emphasis">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon
                  size={16}
                  className={stat.color || 'text-[var(--color-accent-blue)]'}
                />
                <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
              </div>
              <p className="text-2xl font-medium">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Sparkline - Tiny inline chart
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'var(--color-accent-blue)',
}: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Donut Chart - Simple category breakdown
 */
interface DonutChartProps {
  data: CategoryData[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ data, size = 200, thickness = 30 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = (size - thickness) / 2;

  let currentAngle = -90;
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? item.value / total : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;

    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      color,
      item,
      percentage: percentage * 100,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size}>
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            stroke={segment.color}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span>{segment.item.category}</span>
            <span className="text-[var(--color-text-muted)]">
              {segment.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty State - When no data exists
 */
export function EmptyDataState({ message = 'No data yet' }: { message?: string }) {
  return (
    <Card>
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </Card>
  );
}

export type {
  DataPoint,
  CategoryData,
  ActivityCalendarProps,
  TimelineChartProps,
  DistributionChartProps,
  TrendIndicatorProps,
  Stat,
  StatsGridProps,
};
