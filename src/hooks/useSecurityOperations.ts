import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeploymentHistoryRow {
  id: string;
  environment: string;
  version: string;
  status: string | null;
  deployed_at: string | null;
  rollback_at: string | null;
  created_at: string | null;
  changelog: string | null;
}

export interface BridgeRun {
  id: string;
  direction: string;
  action: string;
  status: string;
  items_count: number;
  started_at: string;
  finished_at: string | null;
}

export interface FunctionObservation {
  id: string;
  function_name: string;
  app_origin: string | null;
  http_status: number | null;
  status: string;
  duration_ms: number | null;
  created_at: string;
  error_message: string | null;
}

/** Observed database records only. No calls to the hosting provider or live health checks. */
export function useSecurityDeployments() {
  return useQuery({
    queryKey: ['security', 'deployment-history'],
    queryFn: async (): Promise<DeploymentHistoryRow[]> => {
      const { data, error } = await supabase.from('deployments')
        .select('id, environment, version, status, deployed_at, rollback_at, created_at, changelog')
        .order('created_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSecurityBridgeRuns() {
  return useQuery({
    queryKey: ['security', 'bridge-runs'],
    queryFn: async (): Promise<BridgeRun[]> => {
      const { data, error } = await supabase.from('platform_sync_runs')
        .select('id, direction, action, status, items_count, started_at, finished_at')
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSecurityFunctionObservations() {
  return useQuery({
    queryKey: ['security', 'function-observations'],
    queryFn: async (): Promise<FunctionObservation[]> => {
      const { data, error } = await supabase.from('edge_function_logs')
        .select('id, function_name, app_origin, http_status, status, duration_ms, created_at, error_message')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export const isFunctionFailure = (row: FunctionObservation): boolean =>
  (row.http_status != null && row.http_status >= 400) ||
  ['error', 'failed', 'failure'].includes(row.status.toLowerCase());

export function readableDate(value: string | null | undefined): string {
  if (!value) return 'Non renseignée';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleString('fr-FR');
}

/** Record labels, not proof of an actually provisioned runtime environment. */
export function classifyEnvironment(value: string): 'dev' | 'stage' | 'prod' | 'unknown' {
  const name = value.trim().toLowerCase();
  if (['dev', 'development', 'développement'].includes(name)) return 'dev';
  if (['stage', 'staging', 'preprod', 'preproduction', 'préproduction', 'test'].includes(name)) return 'stage';
  if (['prod', 'production'].includes(name)) return 'prod';
  return 'unknown';
}
