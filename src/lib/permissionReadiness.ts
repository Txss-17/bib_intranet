import { supabase } from '@/integrations/supabase/client';
import type { ActionSet } from '@/data/permissionMatrix';

export type AccessState = 'loading' | 'ready' | 'error';
export function permissionQueryState(query: { data?: unknown; isError: boolean }): AccessState {
  if (query.isError) return 'error';
  return query.data == null ? 'loading' : 'ready';
}

// A successful HTTP response with a missing/malformed permission map is an
// availability error, not evidence that every existing account was revoked.
export function parseIntranetPermissions(data: unknown): Record<string, ActionSet> {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !('app.dashboard' in data))
    throw new Error('Droits indisponibles.');
  const actions = ['read', 'create', 'update', 'delete', 'publish', 'validate', 'administer'];
  for (const rights of Object.values(data)) {
    if (!rights || typeof rights !== 'object' || Array.isArray(rights)
      || actions.some(action => typeof (rights as Record<string, unknown>)[action] !== 'boolean'))
      throw new Error('Droits indisponibles.');
  }
  return data as Record<string, ActionSet>;
}

export async function readIntranetPermissions(signal: AbortSignal): Promise<Record<string, ActionSet>> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) abort();
  signal.addEventListener('abort', abort, { once: true });
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { abort(); reject(new Error('Droits indisponibles.')); }, 15_000);
  });
  try {
    const client = supabase as unknown as { rpc(name: string): { abortSignal(signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }> } };
    const { data, error } = await Promise.race([client.rpc('get_intranet_permissions').abortSignal(controller.signal), timeout]);
    if (error) throw new Error('Droits indisponibles.');
    return parseIntranetPermissions(data);
  } finally {
    clearTimeout(timer!);
    signal.removeEventListener('abort', abort);
  }
}
