import { useEffect, useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { getJobRole, JobRole } from '@/data/jobRoles';

const EVENT = 'view-as-changed';
// Role preview never writes to browser storage and never changes backend permissions.
let previewRole: string | null = null;
export const getViewAsRoleId = () => previewRole;
export const setViewAsRole = (roleId: string | null) => {
  previewRole = roleId;
  window.dispatchEvent(new Event(EVENT));
};
export const useViewAs = (): { roleId: string | null; role: JobRole | undefined; setRole: (id: string | null) => void } => {
  const { isAdmin } = useUserRole();
  const [roleId,setRoleId] = useState<string | null>(getViewAsRoleId());
  useEffect(() => {
    const sync = () => setRoleId(getViewAsRoleId());
    window.addEventListener(EVENT,sync);
    return () => window.removeEventListener(EVENT,sync);
  }, []);
  return {
    roleId: isAdmin ? roleId : null,
    role: isAdmin ? getJobRole(roleId) : undefined,
    setRole: id => { if (isAdmin) setViewAsRole(id); },
  };
};
