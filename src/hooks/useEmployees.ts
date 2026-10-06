import {
  useQuery,
  useMutation,
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

  created_at: string | null;
  updated_at: string | null;
}

const from = (table: string) => (supabase as any).from(table);

export interface EmployeeFilters {
  search?: string;
  collaboratorType?: CollaboratorType | 'all';
  hrStatus?: HrStatus | 'all';
  pole?: string | 'all';
  position?: string | 'all';
}

export const useEmployees = (
  filters: EmployeeFilters = {},
) => {
  return useQuery({
    queryKey: ['rh-collaborators', filters],

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
          created_at,
          updated_at
        `)
        .order('first_name', {
          ascending: true,
        });

      if (filters.collaboratorType && filters.collaboratorType !== 'all') {
        query = query.eq(
          'collaborator_type',
          filters.collaboratorType,
        );
      }

      if (filters.hrStatus && filters.hrStatus !== 'all') {
        query = query.eq(
          'hr_status',
          filters.hrStatus,
        );
      }

      if (filters.position && filters.position !== 'all') {
        query = query.eq(
          'position',
          filters.position,
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let result = (data || []) as Employee[];

      if (filters.search?.trim()) {
        const term = filters.search.trim().toLowerCase();

        result = result.filter((employee) => {
          const name = `${employee.first_name} ${employee.last_name}`
            .toLowerCase();

          const email = employee.email?.toLowerCase() ?? '';

          const position =
            employee.position?.toLowerCase() ?? '';

          const poles =
            Array.isArray(employee.poles)
              ? employee.poles.join(' ').toLowerCase()
              : '';

          return (
            name.includes(term) ||
            email.includes(term) ||
            position.includes(term) ||
            poles.includes(term)
          );
        });
      }

      if (filters.pole && filters.pole !== 'all') {
        result = result.filter((employee) =>
          Array.isArray(employee.poles)
            ? employee.poles.includes(filters.pole as string)
            : false,
        );
      }

      return result;
    },
  });
};


export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Employee> & { id: string }) => {
      const { data, error } = await from('profiles')
        .update(updates)
        .eq('id', id)
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
      queryClient.invalidateQueries({
        queryKey: ['rh-collaborators'],
      });

      queryClient.invalidateQueries({
        queryKey: ['employees'],
      });
    },
  });
};
