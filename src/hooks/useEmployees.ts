```tsx
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type CollaboratorType =
  | 'internal'
  | 'external'
  | 'provider'
  | 'consultant'
  | 'apprentice'
  | 'intern'
  | 'other';

export type HrStatus =
  | 'active'
  | 'onboarding'
  | 'leave'
  | 'suspended'
  | 'leaving'
  | 'archived';

export type CollaboratorDirectoryType =
  | 'all'
  | 'internal'
  | 'external'
  | 'other';

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

  /**
   * Compte technique de test.
   *
   * Les comptes de test ne doivent jamais apparaître
   * dans les référentiels RH opérationnels.
   */
  test_account: boolean;

  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeFilters {
  search?: string;

  /**
   * Filtre précis par type de collaborateur.
   */
  collaboratorType?: CollaboratorType | 'all';

  /**
   * Filtre simplifié utilisé par le référentiel RH :
   *
   * internal = Interne
   * external = Externe
   * other = Autres
   */
  directoryType?: CollaboratorDirectoryType;

  hrStatus?: HrStatus | 'all';

  pole?: string | 'all';

  position?: string | 'all';
}

const from = (table: string) =>
  (supabase as any).from(table);

/**
 * Types regroupés dans la catégorie "Externe".
 */
const EXTERNAL_COLLABORATOR_TYPES: CollaboratorType[] = [
  'external',
  'provider',
  'consultant',
  'apprentice',
  'intern',
];

const isExternalCollaborator = (
  type: CollaboratorType,
) => EXTERNAL_COLLABORATOR_TYPES.includes(type);

/**
 * Détermine la catégorie affichée dans le référentiel RH.
 */
const matchesDirectoryType = (
  employee: Employee,
  directoryType: CollaboratorDirectoryType,
) => {
  if (directoryType === 'all') {
    return true;
  }

  if (directoryType === 'internal') {
    return employee.collaborator_type === 'internal';
  }

  if (directoryType === 'external') {
    return isExternalCollaborator(
      employee.collaborator_type,
    );
  }

  if (directoryType === 'other') {
    return employee.collaborator_type === 'other';
  }

  return true;
};

/**
 * Référentiel RH des collaborateurs.
 *
 * Règle fondamentale :
 * les comptes de test sont exclus directement
 * au niveau de la requête Supabase.
 */
export const useEmployees = (
  filters: EmployeeFilters = {},
) => {
  return useQuery({
    queryKey: [
      'rh-collaborators',
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

        /**
         * Aucun compte test dans le référentiel RH.
         */
        .eq('test_account', false)

        .order('first_name', {
          ascending: true,
        });

      /**
       * Filtre précis par type.
       */
      if (
        filters.collaboratorType &&
        filters.collaboratorType !== 'all'
      ) {
        query = query.eq(
          'collaborator_type',
          filters.collaboratorType,
        );
      }

      /**
       * Filtre par statut RH.
       */
      if (
        filters.hrStatus &&
        filters.hrStatus !== 'all'
      ) {
        query = query.eq(
          'hr_status',
          filters.hrStatus,
        );
      }

      /**
       * Filtre par poste.
       */
      if (
        filters.position &&
        filters.position !== 'all'
      ) {
        query = query.eq(
          'position',
          filters.position,
        );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw error;
      }

      let result = (
        data || []
      ) as Employee[];

      /**
       * Filtre Interne / Externe / Autres.
       *
       * Ce filtre est appliqué après récupération,
       * car plusieurs collaborator_type appartiennent
       * à la catégorie "Externe".
       */
      if (
        filters.directoryType &&
        filters.directoryType !== 'all'
      ) {
        result = result.filter(
          (employee) =>
            matchesDirectoryType(
              employee,
              filters.directoryType as CollaboratorDirectoryType,
            ),
        );
      }

      /**
       * Recherche textuelle.
       *
       * Recherche dans :
       * - prénom / nom
       * - e-mail
       * - poste
       * - pôles
       */
      if (filters.search?.trim()) {
        const term =
          filters.search
            .trim()
            .toLowerCase();

        result = result.filter(
          (employee) => {
            const name =
              `${employee.first_name ?? ''} ${
                employee.last_name ?? ''
              }`.toLowerCase();

            const email =
              employee.email
                ?.toLowerCase() ?? '';

            const position =
              employee.position
                ?.toLowerCase() ?? '';

            const poles =
              Array.isArray(
                employee.poles,
              )
                ? employee.poles
                    .join(' ')
                    .toLowerCase()
                : '';

            return (
              name.includes(term) ||
              email.includes(term) ||
              position.includes(term) ||
              poles.includes(term)
            );
          },
        );
      }

      /**
       * Filtre par pôle.
       */
      if (
        filters.pole &&
        filters.pole !== 'all'
      ) {
        result = result.filter(
          (employee) =>
            Array.isArray(
              employee.poles,
            )
              ? employee.poles.includes(
                  filters.pole as string,
                )
              : false,
        );
      }

      return result;
    },
  });
};

/**
 * Mise à jour d'un collaborateur.
 *
 * Une double protection est utilisée :
 *
 * 1. Vérification du compte avant modification.
 * 2. Condition test_account = false lors de l'UPDATE.
 */
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
      /**
       * Vérification préalable du compte.
       */
      const {
        data: existing,
        error: existingError,
      } = await from('profiles')
        .select(
          'id, test_account',
        )
        .eq('id', id)
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

      /**
       * Mise à jour.
       *
       * test_account = false empêche également
       * une modification accidentelle d'un compte test.
       */
      const {
        data,
        error,
      } = await from('profiles')
        .update(updates)
        .eq('id', id)
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

    onSuccess: () => {
      /**
       * Rafraîchit le référentiel RH.
       */
      queryClient.invalidateQueries({
        queryKey: [
          'rh-collaborators',
        ],
      });

      /**
       * Compatibilité avec les autres écrans
       * utilisant encore la clé employees.
       */
      queryClient.invalidateQueries({
        queryKey: [
          'employees',
        ],
      });
    },
  });
};
```
