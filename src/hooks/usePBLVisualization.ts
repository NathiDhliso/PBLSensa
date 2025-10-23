/**
 * Hook for managing PBL visualizations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pblService } from '@/services/pblService';
import type { NodeUpdate, EdgeCreate, LayoutType } from '@/types/pbl';

export function usePBLVisualization(documentId: string, userId?: string) {
  return useQuery({
    queryKey: ['pbl-visualization', documentId, userId],
    queryFn: () => pblService.getVisualization(documentId, userId),
    enabled: !!documentId,
  });
}

export function useUpdateVisualization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visualizationId,
      nodes,
      edges,
      viewport,
    }: {
      visualizationId: string;
      nodes: any[];
      edges: any[];
      viewport?: any;
    }) => pblService.updateVisualization(visualizationId, nodes, edges, viewport),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['pbl-visualization'],
      });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visualizationId,
      nodeId,
      updates,
    }: {
      visualizationId: string;
      nodeId: string;
      updates: NodeUpdate;
    }) => pblService.updateNode(visualizationId, nodeId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
    },
  });
}

export function useCreateEdge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visualizationId,
      edge,
    }: {
      visualizationId: string;
      edge: EdgeCreate;
    }) => pblService.createEdge(visualizationId, edge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
    },
  });
}

export function useDeleteEdge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visualizationId,
      edgeId,
    }: {
      visualizationId: string;
      edgeId: string;
    }) => pblService.deleteEdge(visualizationId, edgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
    },
  });
}

export function useChangeLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      visualizationId,
      layoutType,
    }: {
      visualizationId: string;
      layoutType: LayoutType;
    }) => pblService.changeLayout(visualizationId, layoutType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pbl-visualization'] });
    },
  });
}

export function useExportVisualization() {
  return useMutation({
    mutationFn: ({
      visualizationId,
      format,
    }: {
      visualizationId: string;
      format: 'json' | 'png' | 'pdf';
    }) => pblService.exportVisualization(visualizationId, format),
  });
}
