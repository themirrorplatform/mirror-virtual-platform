/**
 * React Query hooks for Mirror Finder
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { finderApi, Posture, MistakeType, FinderConfig } from '../api/finder';

// ────────────────────────────────────────────────────────────────────────────
// POSTURE HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function usePosture() {
  return useQuery({
    queryKey: ['finder', 'posture'],
    queryFn: () => finderApi.getPosture(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdatePosture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (posture: Posture) => finderApi.updatePosture(posture),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finder', 'posture'] });
      queryClient.invalidateQueries({ queryKey: ['finder', 'doors'] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// LENS & TPV HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useTensionProxyVector() {
  return useQuery({
    queryKey: ['finder', 'tpv'],
    queryFn: () => finderApi.getTensionProxyVector(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useRecordLensUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lensId, weight }: { lensId: string; weight?: number }) =>
      finderApi.recordLensUsage(lensId, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finder', 'tpv'] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// DOORS HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useDoors(limit?: number) {
  return useQuery({
    queryKey: ['finder', 'doors', limit],
    queryFn: () => finderApi.getDoors(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRecordDoorView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nodeId: string) => finderApi.recordDoorView(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finder', 'doors'] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// IDENTITY GRAPH HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useIdentityGraph() {
  return useQuery({
    queryKey: ['finder', 'graph'],
    queryFn: () => finderApi.getIdentityGraph(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ────────────────────────────────────────────────────────────────────────────
// MISTAKE REPORTING HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useReportMistake() {
  return useMutation({
    mutationFn: ({
      nodeId,
      mistakeType,
      context,
    }: {
      nodeId: string;
      mistakeType: MistakeType;
      context?: string;
    }) => finderApi.reportMistake(nodeId, mistakeType, context),
  });
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURATION HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useFinderConfig() {
  return useQuery({
    queryKey: ['finder', 'config'],
    queryFn: () => finderApi.getConfig(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpdateFinderConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<FinderConfig>) => finderApi.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finder', 'config'] });
      queryClient.invalidateQueries({ queryKey: ['finder', 'doors'] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// ASYMMETRY HOOKS
// ────────────────────────────────────────────────────────────────────────────

export function useAsymmetryReport(nodeId: string | null) {
  return useQuery({
    queryKey: ['finder', 'asymmetry', nodeId],
    queryFn: () => finderApi.getAsymmetryReport(nodeId!),
    enabled: !!nodeId,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
