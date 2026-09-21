import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  SandboxDomain,
  SandboxRecord,
  domainsForSpace,
  generateSpaceDatasets,
} from '@/data/sandboxSeed';

/**
 * Séparation stricte Production / Sandbox.
 *
 * Règle fondamentale :
 * AUCUNE donnée de simulation n'est écrite dans le backend
 * de production.
 *
 * Tout l'état Sandbox vit exclusivement dans l'état local
 * du navigateur et est persisté sous une clé dédiée.
 *
 * La Sandbox ne doit jamais être synchronisée avec les données
 * de Production.
 */

const STORAGE_KEY = 'bib_sandbox_state_v1';

export type SandboxSpaceId =
  | 'finance'
  | 'audit'
  | 'data'
  | 'rh'
  | 'supplier'
  | 'product'
  | 'security'
  | 'marketplace';

export interface SandboxSpace {
  id: SandboxSpaceId;
  name: string;
  desc: string;
}

export const SANDBOX_SPACES: SandboxSpace[] = [
  {
    id: 'finance',
    name: 'Finance Test',
    desc: 'Fausses factures, paiements, remboursements',
  },
  {
    id: 'audit',
    name: 'Audit Test',
    desc: 'Faux audits, fournisseurs, non-conformités',
  },
  {
    id: 'data',
    name: 'Data Test',
    desc: 'Faux KPI, publications, rapports BI',
  },
  {
    id: 'rh',
    name: 'RH Test',
    desc: 'Faux collaborateurs, congés, déplacements',
  },
  {
    id: 'supplier',
    name: 'Supplier Test',
    desc: 'Faux fournisseurs, catalogues, réassorts',
  },
  {
    id: 'product',
    name: 'Product & Engineering Test',
    desc: 'Faux logs, déploiements et données Engineering',
  },
  {
    id: 'security',
    name: 'Security & IT Test',
    desc: 'Fausses alertes de sécurité et événements IT',
  },
  {
    id: 'marketplace',
    name: 'Marketplace Test',
    desc: 'Fausses commandes, clients, livraisons',
  },
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
  demoCompany?: {
    name: string;
    createdAt: string;
  } | null;
  /** Jeux de données fictifs, par domaine — jamais envoyés au backend. */
  datasets: Record<string, SandboxRecord[]>;
}

const emptySpaces = (): Record<
  string,
  SandboxSpaceState
> =>
  Object.fromEntries(
    SANDBOX_SPACES.map((space) => [
      space.id,
      {
        seeded: false,
        records: 0,
      },
    ]),
  );

const initialState: SandboxState = {
  enabled: false,
  spaces: emptySpaces(),
  events: [],
  demoCompany: null,
  datasets: {},
};

function load(): SandboxState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return initialState;
    }

    const parsed = JSON.parse(raw) as SandboxState;

    return {
      ...initialState,
      ...parsed,
      spaces: {
        ...emptySpaces(),
        ...(parsed.spaces ?? {}),
      },
      datasets: parsed.datasets ?? {},
    };
  } catch {
    return initialState;
  }
}

interface SandboxContextValue extends SandboxState {
  /** true = l'interface pointe sur des données fictives */
  isSandbox: boolean;

  setEnabled: (value: boolean) => void;

  seedSpace: (id: SandboxSpaceId) => void;

  cleanSpace: (id: SandboxSpaceId) => void;

  seedAll: () => void;

  resetAll: () => void;

  createDemoCompany: (name?: string) => void;

  /** Enregistrements fictifs d'un domaine. Vide en Production. */
  dataset: (
    domain: SandboxDomain,
  ) => SandboxRecord[];

  logEvent: (
    label: string,
    detail?: string,
    space?: SandboxSpaceId,
  ) => void;

  totalRecords: number;
}

const SandboxContext =
  createContext<SandboxContextValue | null>(null);

export function SandboxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] =
    useState<SandboxState>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state),
      );
    } catch {
      /*
       * Si le stockage local est indisponible,
       * la Sandbox reste fonctionnelle uniquement en mémoire.
       */
    }
  }, [state]);

  const push = useCallback(
    (
      currentState: SandboxState,
      label: string,
      detail?: string,
      space?: SandboxSpaceId,
    ): SandboxState => ({
      ...currentState,
      events: [
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          label,
          detail,
          space,
        },
        ...currentState.events,
      ].slice(0, 100),
    }),
    [],
  );

  const logEvent = useCallback(
    (
      label: string,
      detail?: string,
      space?: SandboxSpaceId,
    ) => {
      setState((currentState) =>
        push(
          currentState,
          label,
          detail,
          space,
        ),
      );
    },
    [push],
  );

  const setEnabled = useCallback(
    (value: boolean) => {
      setState((currentState) =>
        push(
          {
            ...currentState,
            enabled: value,
          },
          value
            ? 'Mode Sandbox activé'
            : 'Retour en Production',
          value
            ? 'Toutes les données affichées sont fictives.'
            : 'Les données de simulation ne sont plus affichées.',
        ),
      );
    },
    [push],
  );

  const seedSpace = useCallback(
    (id: SandboxSpaceId) => {
      setState((currentState) => {
        const datasets =
          generateSpaceDatasets(id);

        const records = Object.values(
          datasets,
        ).reduce(
          (total, recordsForDomain) =>
            total + recordsForDomain.length,
          0,
        );

        const nextState: SandboxState = {
          ...currentState,

          datasets: {
            ...currentState.datasets,
            ...datasets,
          },

          spaces: {
            ...currentState.spaces,

            [id]: {
              seeded: true,
              records,
              seededAt:
                new Date().toISOString(),
            },
          },
        };

        return push(
          nextState,
          `Données fictives générées — ${id}`,
          `${records} enregistrements simulés`,
          id,
        );
      });
    },
    [push],
  );

  const cleanSpace = useCallback(
    (id: SandboxSpaceId) => {
      setState((currentState) => {
        const datasets = {
          ...currentState.datasets,
        };

        domainsForSpace(id).forEach(
          (domain) => {
            delete datasets[domain];
          },
        );

        return push(
          {
            ...currentState,

            datasets,

            spaces: {
              ...currentState.spaces,

              [id]: {
                seeded: false,
                records: 0,
              },
            },
          },
          `Espace nettoyé — ${id}`,
          'Données de simulation supprimées',
          id,
        );
      });
    },
    [push],
  );

  const seedAll = useCallback(
    () => {
      setState((currentState) => {
        const datasets: Record<
          string,
          SandboxRecord[]
        > = {
          ...currentState.datasets,
        };

        const spaces = Object.fromEntries(
          SANDBOX_SPACES.map((space) => {
            const generated =
              generateSpaceDatasets(space.id);

            Object.assign(
              datasets,
              generated,
            );

            const records =
              Object.values(
                generated,
              ).reduce(
                (total, recordsForDomain) =>
                  total +
                  recordsForDomain.length,
                0,
              );

            return [
              space.id,
              {
                seeded: true,
                records,
                seededAt:
                  new Date().toISOString(),
              },
            ];
          }),
        );

        return push(
          {
            ...currentState,
            spaces,
            datasets,
          },
          'Jeu de démonstration complet chargé',
          'Tous les espaces sont alimentés',
        );
      });
    },
    [push],
  );

  const resetAll = useCallback(
    () => {
      setState((currentState) =>
        push(
          {
            ...currentState,
            spaces: emptySpaces(),
            demoCompany: null,
            datasets: {},
          },
          'Sandbox réinitialisée',
          'État initial restauré',
        ),
      );
    },
    [push],
  );

  const createDemoCompany = useCallback(
    (name = 'Demo Corp SARL') => {
      setState((currentState) =>
        push(
          {
            ...currentState,

            demoCompany: {
              name,
              createdAt:
                new Date().toISOString(),
            },
          },
          'Entreprise de démonstration créée',
          name,
        ),
      );
    },
    [push],
  );

  const totalRecords = useMemo(
    () =>
      Object.values(
        state.spaces,
      ).reduce(
        (total, space) =>
          total + (space?.records ?? 0),
        0,
      ),
    [state.spaces],
  );

  const dataset = useCallback(
    (
      domain: SandboxDomain,
    ): SandboxRecord[] =>
      state.enabled
        ? state.datasets[domain] ?? []
        : [],
    [
      state.enabled,
      state.datasets,
    ],
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
    dataset,
    logEvent,
    totalRecords,
  };

  return (
    <SandboxContext.Provider value={value}>
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandbox() {
  const context =
    useContext(SandboxContext);

  if (!context) {
    throw new Error(
      'useSandbox doit être utilisé dans SandboxProvider',
    );
  }

  return context;
}
