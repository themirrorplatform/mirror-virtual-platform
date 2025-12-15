/**
 * Performance Monitor - System health monitoring
 * 
 * Features:
 * - Performance metrics
 * - Resource usage tracking
 * - Load time monitoring
 * - Memory usage
 * - Developer diagnostics
 * - Non-intrusive display
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  loadTime: number;
  renderTime: number;
  componentCount: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

export function PerformanceMonitor({
  enabled = false,
  position = 'bottom-right',
  compact = false,
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(enabled);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: { used: 0, total: 0, limit: 0 },
    loadTime: 0,
    renderTime: 0,
    componentCount: 0,
  });

  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);

  // FPS Monitoring
  useEffect(() => {
    if (!isVisible) return;

    let animationFrameId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastFrameTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }

        setMetrics(prev => ({
          ...prev,
          fps,
        }));

        frameCountRef.current = 0;
        lastFrameTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  // Memory Monitoring
  useEffect(() => {
    if (!isVisible) return;

    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
          },
        }));
      }
    };

    const interval = setInterval(measureMemory, 1000);
    measureMemory();

    return () => clearInterval(interval);
  }, [isVisible]);

  // Load Time
  useEffect(() => {
    if (!isVisible) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      setMetrics(prev => ({
        ...prev,
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
      }));
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed ${positionClasses[position]} z-50`}
    >
      <Card className="min-w-[200px]">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[var(--color-accent-blue)]" />
              <span className="text-sm font-medium">Performance</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Metrics */}
          {!compact && (
            <div className="space-y-2">
              <MetricRow
                icon={Zap}
                label="FPS"
                value={metrics.fps}
                suffix=""
                status={getPerformanceStatus(metrics.fps, 60, 30)}
              />

              {metrics.memory.limit > 0 && (
                <MetricRow
                  icon={Cpu}
                  label="Memory"
                  value={formatBytes(metrics.memory.used)}
                  suffix={`/ ${formatBytes(metrics.memory.limit)}`}
                  status={getPerformanceStatus(
                    (metrics.memory.used / metrics.memory.limit) * 100,
                    70,
                    90,
                    true
                  )}
                />
              )}

              {metrics.loadTime > 0 && (
                <MetricRow
                  icon={HardDrive}
                  label="Load"
                  value={formatMs(metrics.loadTime)}
                  suffix=""
                  status="good"
                />
              )}
            </div>
          )}

          {/* Compact View */}
          {compact && (
            <div className="flex items-center gap-3 text-xs">
              <span className={getStatusColor(getPerformanceStatus(metrics.fps, 60, 30))}>
                {metrics.fps} FPS
              </span>
              {metrics.memory.limit > 0 && (
                <span>{formatBytes(metrics.memory.used)}</span>
              )}
            </div>
          )}

          {/* FPS Graph */}
          {!compact && fpsHistoryRef.current.length > 0 && (
            <div className="h-12 flex items-end gap-px">
              {fpsHistoryRef.current.map((fps, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-t ${
                    fps >= 60
                      ? 'bg-[var(--color-accent-green)]'
                      : fps >= 30
                      ? 'bg-[var(--color-accent-yellow)]'
                      : 'bg-[var(--color-border-error)]'
                  }`}
                  style={{ height: `${(fps / 60) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Metric Row Component

interface MetricRowProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
  suffix?: string;
  status: 'good' | 'warning' | 'error';
}

function MetricRow({ icon: Icon, label, value, suffix, status }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <Icon size={12} className={getStatusColor(status)} />
        <span className="text-[var(--color-text-muted)]">{label}</span>
      </div>
      <span className={`font-mono ${getStatusColor(status)}`}>
        {value}
        {suffix && <span className="text-[var(--color-text-muted)] ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function getPerformanceStatus(
  value: number,
  goodThreshold: number,
  errorThreshold: number,
  inverted: boolean = false
): 'good' | 'warning' | 'error' {
  if (inverted) {
    if (value <= goodThreshold) return 'good';
    if (value <= errorThreshold) return 'warning';
    return 'error';
  } else {
    if (value >= goodThreshold) return 'good';
    if (value >= errorThreshold) return 'warning';
    return 'error';
  }
}

function getStatusColor(status: 'good' | 'warning' | 'error'): string {
  switch (status) {
    case 'good':
      return 'text-[var(--color-accent-green)]';
    case 'warning':
      return 'text-[var(--color-accent-yellow)]';
    case 'error':
      return 'text-[var(--color-border-error)]';
  }
}

/**
 * Performance Dashboard - Detailed view
 */
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: { used: 0, total: 0, limit: 0 },
    loadTime: 0,
    renderTime: 0,
    componentCount: 0,
  });

  const [resourceTimings, setResourceTimings] = useState<PerformanceResourceTiming[]>([]);

  useEffect(() => {
    const timings = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    setResourceTimings(timings.slice(-10)); // Last 10 resources
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Performance Overview</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Zap}
              label="Frame Rate"
              value={`${metrics.fps} FPS`}
              trend={metrics.fps >= 60 ? 'up' : 'down'}
            />
            <StatCard
              icon={Cpu}
              label="Memory Usage"
              value={formatBytes(metrics.memory.used)}
              trend="neutral"
            />
            <StatCard
              icon={HardDrive}
              label="Load Time"
              value={formatMs(metrics.loadTime)}
              trend="neutral"
            />
          </div>
        </div>
      </Card>

      {/* Resource Timings */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Recent Resource Loads</h3>
          <div className="space-y-2">
            {resourceTimings.map((timing, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded bg-[var(--color-surface-hover)] text-xs"
              >
                <span className="truncate flex-1">{timing.name.split('/').pop()}</span>
                <span className="font-mono text-[var(--color-text-muted)]">
                  {formatMs(timing.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Recommendations</h3>
          <div className="space-y-2">
            {metrics.fps < 30 && (
              <PerformanceWarning
                message="Low frame rate detected. Consider reducing animations or visual effects."
              />
            )}
            {metrics.memory.used / metrics.memory.limit > 0.9 && (
              <PerformanceWarning
                message="High memory usage. Consider clearing cache or optimizing data storage."
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-[var(--color-accent-blue)]" />
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-medium">{value}</span>
        {trend !== 'neutral' && (
          <div className={trend === 'up' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-border-error)]'}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceWarning({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 border-l-4 border-[var(--color-accent-yellow)]">
      <AlertTriangle size={16} className="text-[var(--color-accent-yellow)] mt-0.5 flex-shrink-0" />
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}

/**
 * usePerformance Hook - Track performance metrics
 */
export function usePerformance() {
  const [fps, setFps] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measure = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measure);
    };

    animationFrameId = requestAnimationFrame(measure);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const measureRender = (callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    setRenderTime(end - start);
  };

  return {
    fps,
    renderTime,
    measureRender,
  };
}

/**
 * Performance Toggle - Quick enable/disable
 */
export function PerformanceToggle({ onToggle }: { onToggle: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        enabled
          ? 'bg-[var(--color-accent-blue)] text-white'
          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
      }`}
    >
      <Activity size={16} />
      Performance Monitor
    </button>
  );
}

// Utility Functions

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export type { PerformanceMetrics, PerformanceMonitorProps };
