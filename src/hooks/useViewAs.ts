import { useEffect, useState } from 'react';
import { getJobRole, JobRole } from '@/data/jobRoles';

const STORAGE_KEY = 'bib.view_as_role.v1';
const EVENT = 'view-as-changed';

export const getViewAsRoleId = (): string | null => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};

export const setViewAsRole = (roleId: string | null) => {
  try {
    if (roleId) localStorage.setItem(STORAGE_KEY, roleId);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
};

export const useViewAs = (): { roleId: string | null; role: JobRole | undefined; setRole: (id: string | null) => void } => {
  const [roleId, setRoleId] = useState<string | null>(getViewAsRoleId());

  useEffect(() => {
    const handler = () => setRoleId(getViewAsRoleId());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { roleId, role: getJobRole(roleId), setRole: setViewAsRole };
};
