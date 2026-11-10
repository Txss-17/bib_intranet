// One invalidation signal per successful business mutation. The signal deliberately
// contains no record, user, entity, document or secret data. Every refetch remains
// subject to the server's current RLS and RPC permissions.
export const INTRANET_CHANGE_EVENT = 'bib:intranet-data-changed';
export const INTRANET_CHANGE_CHANNEL = 'bib:intranet-data-sync:v1';
const isBrowser = () => typeof window !== 'undefined';

export function publishIntranetChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(INTRANET_CHANGE_EVENT));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(INTRANET_CHANGE_CHANNEL);
    try { channel.postMessage({ type: 'invalidate', version: 1 }); }
    finally { channel.close(); }
  }
}

// Read RPCs never publish. A successful write triggers a same-tab and cross-tab
// refresh even when the caller does not use a TanStack mutation hook.
export function isIntranetWriteRpc(name: string): boolean {
  return /^(?:save|create|update|delete|remove|transition|submit|approve|reject|review|validate|archive|restore|assign|unassign|grant|revoke|mark|record|confirm|activate|suspend|close|reopen|resolve|complete|comment|add|set|upsert|attach|detach|import|link|unlink|send|request|advance|provision|finalize|acknowledge|register|bib_(?:save|create|update|delete|assign|grant|revoke|review|activate|suspend|advance))_/i.test(name);
}
