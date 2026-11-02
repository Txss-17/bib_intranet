import { createContext, useContext, type ReactNode } from 'react';

// Sandbox and all generated datasets are intentionally disabled.
// Nothing is persisted locally, and no fake data is ever returned.
export type SandboxSpaceId =
  | 'finance' | 'audit' | 'data' | 'rh' | 'supplier'
  | 'product' | 'security' | 'marketplace';
export type SandboxDomain =
  | 'orders' | 'suppliers' | 'products' | 'stocks' | 'shipments'
  | 'invoices' | 'payments' | 'salaries' | 'audits' | 'nonconformities'
  | 'kpis' | 'publications' | 'employees' | 'leaves' | 'trips'
  | 'logs' | 'deployments' | 'securityAlerts' | 'customers' | 'tickets';
export type SandboxRecord = { id: string; [key: string]: unknown };

export const SANDBOX_SPACES: ReadonlyArray<{ id: SandboxSpaceId; name: string; desc: string }> = [];
const NO_RECORDS: SandboxRecord[] = [];
const DISABLED = {
  enabled: false,
  isSandbox: false,
  spaces: {} as Record<string, { seeded: boolean; records: number; seededAt?: string }>,
  events: [] as { id: string; at: string; label: string; detail?: string; space?: SandboxSpaceId }[],
  demoCompany: null as {name: string; createdAt: string} | null,
  datasets: {} as Record<string, SandboxRecord[]>,
  totalRecords: 0,
  setEnabled: (_value: boolean) => {},
  seedSpace: (_space: SandboxSpaceId) => {},
  cleanSpace: (_space: SandboxSpaceId) => {},
  seedAll: () => {},
  resetAll: () => {},
  createDemoCompany: (_name?: string) => {},
  dataset: (_domain: SandboxDomain): SandboxRecord[] => NO_RECORDS,
  logEvent: (_label: string, _detail?: string, _space?: SandboxSpaceId) => {},
};
const SandboxContext = createContext(DISABLED);
export function SandboxProvider({ children }: { children: ReactNode }) {
  return <SandboxContext.Provider value={DISABLED}>{children}</SandboxContext.Provider>;
}
export function useSandbox() { return useContext(SandboxContext); }
