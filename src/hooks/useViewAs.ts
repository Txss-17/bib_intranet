import type { JobRole } from '@/data/jobRoles';

// Production identities and permissions come exclusively from authenticated
// Supabase profiles and role assignments. Simulated role views are disabled.
export const getViewAsRoleId = (): string | null => null;
export const setViewAsRole = (_roleId: string | null) => {};
export const useViewAs = (): {
  roleId: string | null;
  role: JobRole | undefined;
  setRole: (id: string | null) => void;
} => ({
  roleId: null,
  role: undefined,
  setRole: () => {},
});
