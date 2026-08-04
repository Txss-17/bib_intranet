import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Séparation stricte Production / Sandbox.
 *
 * Règle fondamentale : AUCUNE donnée de simulation n'est écrite dans le backend
 * de production. Tout l'état sandbox vit exclusivement dans cet état local
 * (persisté sous une clé dédiée), il n'est jamais synchronisé ni envoyé.
 */

const STORAGE_KEY = 'bib_sandbox_state_v1';

export type SandboxSpaceId = 'finance' | 'audit' | 'data' | 'rh' | 'supplier' | 'tech' | 'marketplace';

export interface SandboxSpace {
  id: SandboxSpaceId;
  name: string;
  desc: string;
}

export const SANDBOX_SPACES: SandboxSpace[] = [
  { id: 'finance', name: 'Finance Test', desc: 'Fausses factures, paiements, remboursements' },
  { id: 'audit', name: 'Audit Test', desc: 'Faux audits, fournisseurs, non-conformités' },
  { id: 'data', name: 'Data Test', desc: 'Faux KPI, publications, rapports BI' },
  { id: 'rh', name: 'RH Test', desc: 'Faux collaborateurs, congés, déplacements' },
  { id: 'supplier', name: 'Supplier Test', desc: 'Faux fournisseurs, catalogues, réassorts' },
  { id: 'tech', name: 'Tech Test', desc: 'Faux logs, déploiements, alertes sécurité' },
  { id: 'marketplace', name: 'Marketplace Test', desc: 'Fausses commandes, clients, livraisons' },
];

export interface SandboxEvent {
  id: string;
  at: string;
  label: string;
  detail?: string;
  space?: SandboxSpaceId;
}

export interface SandboxSpaceState {
  seeded: boolean;
  records: number;
  seededAt?: string;
}

interface SandboxState {
  enabled: boolean;
  spaces: Record<string, SandboxSpaceState>;
  events: SandboxEvent[];
  demoCompany?: { name: string; createdAt: string } | null;
}

const emptySpaces = (): Record<string, SandboxSpaceState> =>
  Object.fromEntries(SANDBOX_SPACES.map((s) => [s.id, { seeded: false, records: 0 }]));

const initialState: SandboxState = { enabled: false, spaces: emptySpaces(), events: [], demoCompany: null };

function load(): SandboxState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as SandboxState;
    return { ...initialState, ...parsed, spaces: { ...emptySpaces(), ...(parsed.spaces ?? {}) } };
  } catch {
    return initialState;
  }
}

interface SandboxContextValue extends SandboxState {
  /** true = l'interface pointe sur des données fictives */
  isSandbox: boolean;
  setEnabled: (v: boolean) => void;
  seedSpace: (id: SandboxSpaceId) => void;
  cleanSpace: (id: SandboxSpaceId) => void;
  seedAll: () => void;
  resetAll: () => void;
  createDemoCompany: (name?: string) => void;
  logEvent: (label: string, detail?: string, space?: SandboxSpaceId) => void;
  totalRecords: number;
}

const SandboxContext = createContext<SandboxContextValue | null>(null);

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SandboxState>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* stockage indisponible : la sandbox reste en mémoire */
    }
  }, [state]);

  const push = useCallback((s: SandboxState, label: string, detail?: string, space?: SandboxSpaceId): SandboxState => ({
    ...s,
    events: [
      { id: crypto.randomUUID(), at: new Date().toISOString(), label, detail, space },
      ...s.events,
    ].slice(0, 100),
  }), []);

  const logEvent = useCallback(
    (label: string, detail?: string, space?: SandboxSpaceId) => setState((s) => push(s, label, detail, space)),
    [push]
  );

  const setEnabled = useCallback(
    (v: boolean) =>
      setState((s) =>
        push({ ...s, enabled: v }, v ? 'Mode Sandbox activé' : 'Retour en Production', v
          ? 'Toutes les données affichées sont fictives.'
          : 'Les données de simulation ne sont plus affichées.')
      ),
    [push]
  );

  const seedSpace = useCallback(
    (id: SandboxSpaceId) =>
      setState((s) => {
        const records = 20 + Math.floor(Math.random() * 60);
        const next: SandboxState = {
          ...s,
          spaces: { ...s.spaces, [id]: { seeded: true, records, seededAt: new Date().toISOString() } },
        };
        return push(next, `Données fictives générées — ${id}`, `${records} enregistrements simulés`, id);
      }),
    [push]
  );

  const cleanSpace = useCallback(
    (id: SandboxSpaceId) =>
      setState((s) =>
        push({ ...s, spaces: { ...s.spaces, [id]: { seeded: false, records: 0 } } },
          `Espace nettoyé — ${id}`, 'Données de simulation supprimées', id)
      ),
    [push]
  );

  const seedAll = useCallback(
    () =>
      setState((s) => {
        const spaces = Object.fromEntries(
          SANDBOX_SPACES.map((sp) => {
            const records = 20 + Math.floor(Math.random() * 60);
            return [sp.id, { seeded: true, records, seededAt: new Date().toISOString() }];
          })
        );
        return push({ ...s, spaces }, 'Jeu de démonstration complet chargé', 'Tous les espaces sont alimentés');
      }),
    [push]
  );

  const resetAll = useCallback(
    () =>
      setState((s) =>
        push({ ...s, spaces: emptySpaces(), demoCompany: null }, 'Sandbox réinitialisée', 'État initial restauré')
      ),
    [push]
  );

  const createDemoCompany = useCallback(
    (name = 'Demo Corp SARL') =>
      setState((s) =>
        push({ ...s, demoCompany: { name, createdAt: new Date().toISOString() } },
          'Entreprise de démonstration créée', name)
      ),
    [push]
  );

  const totalRecords = useMemo(
    () => Object.values(state.spaces).reduce((acc, sp) => acc + (sp?.records ?? 0), 0),
    [state.spaces]
  );

  const value: SandboxContextValue = {
    ...state,
    isSandbox: state.enabled,
    setEnabled,
    seedSpace,
    cleanSpace,
    seedAll,
    resetAll,
    createDemoCompany,
    logEvent,
    totalRecords,
  };

  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

export function useSandbox() {
  const ctx = useContext(SandboxContext);
  if (!ctx) throw new Error('useSandbox doit être utilisé dans SandboxProvider');
  return ctx;
}
