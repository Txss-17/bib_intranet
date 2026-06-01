import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { mergeRulesForUser, loadOverrides, PermissionRule } from '@/data/permissionRules';

export const usePermissionRules = (): PermissionRule & { loading: boolean } => {
  const { profile } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener('permission-rules-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('permission-rules-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const poles = profile?.poles || [];
  const merged = mergeRulesForUser(poles, profile?.seniority);
  return { ...merged, loading: !profile };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  void tick;
};

export const useOverridesSnapshot = () => {
  const [overrides, setOverrides] = useState(loadOverrides());
  useEffect(() => {
    const handler = () => setOverrides(loadOverrides());
    window.addEventListener('permission-rules-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('permission-rules-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return overrides;
};
