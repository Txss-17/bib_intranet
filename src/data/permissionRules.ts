// Permission rules per pole × seniority for sensitive Settings sections.
// HR / Direction can override these at /permissions. Defaults below are
// applied when no override exists. Overrides are persisted in localStorage
// (until a server-side migration is added).

export type Seniority = 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

export interface PermissionRule {
  can_view_sensitive: boolean;      // salaries, performance evaluations, full budget
  can_view_audit_log: boolean;      // full audit log (vs personal activity)
  can_configure_permissions: boolean; // can edit this matrix
}

export const SENIORITY_ORDER: Seniority[] = ['junior', 'mid', 'senior', 'lead', 'executive'];

export const POLES_FOR_MATRIX = [
  'direction', 'finance', 'rh', 'ops', 'tech', 'supplier',
  'audit', 'compliance', 'rse', 'marketing', 'risk', 'lifecycle', 'data',
] as const;


export const DEFAULT_RULES: Record<string, Partial<Record<Seniority, PermissionRule>>> = {
  rh:        { executive: { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: true  },
               lead:      { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: true  },
               senior:    { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: false } },
  direction: { executive: { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: true  },
               lead:      { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: true  } },
  finance:   { executive: { can_view_sensitive: true,  can_view_audit_log: true,  can_configure_permissions: false },
               lead:      { can_view_sensitive: true,  can_view_audit_log: false, can_configure_permissions: false } },
};

const STORAGE_KEY = 'linksy.permission_rules.overrides.v1';

type OverrideMap = Record<string, Record<string, PermissionRule>>;

export const loadOverrides = (): OverrideMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

export const saveOverrides = (map: OverrideMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('permission-rules-changed'));
};

const EMPTY_RULE: PermissionRule = {
  can_view_sensitive: false,
  can_view_audit_log: false,
  can_configure_permissions: false,
};

export const getRule = (
  pole: string | null | undefined,
  seniority: string | null | undefined,
  overrides?: OverrideMap,
): PermissionRule => {
  if (!pole || !seniority) return EMPTY_RULE;
  const ov = overrides ?? loadOverrides();
  const fromOverride = ov?.[pole]?.[seniority];
  if (fromOverride) return fromOverride;
  const fromDefault = DEFAULT_RULES[pole]?.[seniority as Seniority];
  return fromDefault ?? EMPTY_RULE;
};

export const mergeRulesForUser = (
  poles: string[],
  seniority: string | null | undefined,
): PermissionRule => {
  const overrides = loadOverrides();
  const merged: PermissionRule = { ...EMPTY_RULE };
  for (const p of poles) {
    const r = getRule(p, seniority, overrides);
    merged.can_view_sensitive ||= r.can_view_sensitive;
    merged.can_view_audit_log ||= r.can_view_audit_log;
    merged.can_configure_permissions ||= r.can_configure_permissions;
  }
  return merged;
};
