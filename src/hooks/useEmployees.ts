import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';


// ============================================================
// TYPES
// ============================================================

export type CollaboratorType =
  | 'internal'
  | 'external'
  | 'provider'
  | 'consultant'
  | 'apprentice'
  | 'intern'
  | 'other';

export type CollaboratorDirectoryType =
  | 'all'
  | 'internal'
  | 'external'
  | 'other';

export type HrStatus =
  | 'active'
  | 'onboarding'
  | 'leave'
  | 'suspended'
  | 'leaving'
  | 'archived';

export interface Employee {
  id: string;

  first_name: string;
  last_name: string;
  email: string;

  position: string | null;
  poles: string[] | null;

  seniority: string | null;
  work_mode: string | null;
  subsidiary: string | null;

  manager_id: string | null;

  collaborator_type: CollaboratorType;
  hr_status: HrStatus;

  test_account: boolean;

  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeFilters {
  search?: string;

  collaboratorType?:
    | CollaboratorType
    | 'all';

  directoryType?:
    | CollaboratorDirectoryType;

  hrStatus?:
    | HrStatus
    | 'all';

  pole?: string | 'all';

  position?: string | 'all';
}


// ============================================================
// CONSTANTES
// ============================================================

export const EMPLOYEES_QUERY_KEY =
  'rh-collaborators';

/**
 * Nombre maximal de collaborateurs récupérés
 * par le référentiel RH.
 *
 * Cela évite de charger inutilement tout public.profiles
 * à chaque ouverture de la page.
 */
const EMPLOYEES_PAGE_SIZE = 200;


// ============================================================
// SUPABASE
// ============================================================

const from = (table: string) =>
  (supabase as any).from(table);


// ============================================================
// TYPES EXTERNES
// ============================================================

const EXTERNAL_COLLABORATOR_TYPES:
  CollaboratorType[] = [
    'external',
    'provider',
    'consultant',
    'apprentice',
    'intern',
  ];


// ============================================================
// HELPERS
// ============================================================

function isExternalCollaborator(
  type: CollaboratorType,
) {
  return EXTERNAL_COLLABORATOR_TYPES.includes(
    type,
  );
}


function matchesDirectoryType(
  employee: Employee,
  directoryType: CollaboratorDirectoryType,
) {
  switch (directoryType) {
    case 'internal':
      return (
        employee.collaborator_type ===
        'internal'
      );

    case 'external':
      return isExternalCollaborator(
        employee.collaborator_type,
      );

    case 'other':
      return (
        employee.collaborator_type ===
        'other'
      );

    case 'all':
    default:
      return true;
  }
}


// ============================================================
// USE EMPLOYEES
// ============================================================

export const useEmployees = (
  filters: EmployeeFilters = {},
) => {
  return useQuery({
    queryKey: [
      EMPLOYEES_QUERY_KEY,
      filters,
    ],

    queryFn: async () => {
      let query = from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          poles,
          seniority,
          work_mode,
          subsidiary,
          manager_id,
          collaborator_type,
          hr_status,
          test_account,
          created_at,
          updated_at
        `)

        // ------------------------------------------------------
        // RÈGLE RH : EXCLURE LES COMPTES DE TEST
        // ------------------------------------------------------

        .eq(
          'test_account',
          false,
        );

      // --------------------------------------------------------
      // TYPE PRÉCIS
      // --------------------------------------------------------

      if (
        filters.collaboratorType &&
        filters.collaboratorType !== 'all'
      ) {
        query = query.eq(
          'collaborator_type',
          filters.collaboratorType,
        );
      }

      // --------------------------------------------------------
      // STATUT RH
      // --------------------------------------------------------

      if (
        filters.hrStatus &&
        filters.hrStatus !== 'all'
      ) {
        query = query.eq(
          'hr_status',
          filters.hrStatus,
        );
      }

      // --------------------------------------------------------
      // POSTE
      // --------------------------------------------------------

      if (
        filters.position &&
        filters.position !== 'all'
      ) {
        query = query.eq(
          'position',
          filters.position,
        );
      }

      // --------------------------------------------------------
      // PÔLE
      //
      // Les pôles sont stockés sous forme de tableau.
      // On utilise contains côté Supabase.
      // --------------------------------------------------------

      if (
        filters.pole &&
        filters.pole !== 'all'
      ) {
        query = query.contains(
          'poles',
          [filters.pole],
        );
      }

      // --------------------------------------------------------
      // RECHERCHE
      //
      // Recherche directement côté PostgreSQL.
      // Cela évite de télécharger tout le référentiel
      // lorsque l'utilisateur cherche une personne précise.
      // --------------------------------------------------------

      const search =
        filters.search?.trim();

      if (search) {
        const escapedSearch =
          search
            .replace(/\\/g, '\\\\')
            .replace(/%/g, '\\%')
            .replace(/_/g, '\\_');

        query = query.or(
          [
            `first_name.ilike.%${escapedSearch}%`,
            `last_name.ilike.%${escapedSearch}%`,
            `email.ilike.%${escapedSearch}%`,
            `position.ilike.%${escapedSearch}%`,
          ].join(','),
        );
      }

      // --------------------------------------------------------
      // TRI + LIMITE
      // --------------------------------------------------------

      query = query
        .order(
          'first_name',
          {
            ascending: true,
          },
        )
        .order(
          'last_name',
          {
            ascending: true,
          },
        )
        .limit(
          EMPLOYEES_PAGE_SIZE,
        );

      // --------------------------------------------------------
      // EXÉCUTION
      // --------------------------------------------------------

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw error;
      }

      let result =
        (data ?? []) as Employee[];

      // --------------------------------------------------------
      // CATÉGORIE RH
      //
      // Interne / Externe / Autres
      //
      // Le type "directoryType" est une vue métier
      // construite à partir du collaborator_type.
      // --------------------------------------------------------

      if (
        filters.directoryType &&
        filters.directoryType !== 'all'
      ) {
        result = result.filter(
          (employee) =>
            matchesDirectoryType(
              employee,
              filters.directoryType!,
            ),
        );
      }

      return result;
    },

    /**
     * Les données RH restent fraîches pendant 30 secondes.
     * Cela évite de refaire une requête Supabase
     * à chaque petit rendu du composant.
     */
    staleTime: 30_000,

    /**
     * Une erreur de réseau ne provoque pas
     * plusieurs requêtes longues successives.
     */
    retry: 1,

    /**
     * Le référentiel n'est pas considéré comme
     * "chargé" tant que la première requête n'est pas terminée.
     */
    refetchOnWindowFocus: false,
  });
};


// ============================================================
// UPDATE EMPLOYEE
// ============================================================

export const useUpdateEmployee = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Employee> & {
      id: string;
    }) => {

      // ------------------------------------------------------
      // VÉRIFICATION DU COMPTE
      // ------------------------------------------------------

      const {
        data: existing,
        error: existingError,
      } = await from('profiles')
        .select(`
          id,
          test_account
        `)
        .eq(
          'id',
          id,
        )
        .single();

      if (existingError) {
        throw existingError;
      }

      if (
        existing?.test_account === true
      ) {
        throw new Error(
          'Les comptes de test ne peuvent pas être modifiés depuis le référentiel RH.',
        );
      }

      // ------------------------------------------------------
      // UPDATE
      // ------------------------------------------------------

      const {
        data,
        error,
      } = await from('profiles')
        .update(updates)
        .eq(
          'id',
          id,
        )
        .eq(
          'test_account',
          false,
        )
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          poles,
          seniority,
          work_mode,
          subsidiary,
          manager_id,
          collaborator_type,
          hr_status,
          test_account,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw error;
      }

      return data as Employee;
    },

    // --------------------------------------------------------
    // INVALIDATION
    // --------------------------------------------------------

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          EMPLOYEES_QUERY_KEY,
        ],
      });

      /**
       * Compatibilité avec les anciens écrans
       * qui utilisent encore la clé "employees".
       */
      queryClient.invalidateQueries({
        queryKey: [
          'employees',
        ],
      });
    },
  });
};