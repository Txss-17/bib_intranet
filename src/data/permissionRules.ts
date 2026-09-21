// ---------------------------------------------------------------------------
// RÈGLES DE PERMISSIONS PAR PÔLE × NIVEAU HIÉRARCHIQUE
// ---------------------------------------------------------------------------
//
// Ces règles constituent le niveau "sensible" du RBAC.
//
// Architecture cible BIB :
// 1. Direction
// 2. Finance
// 3. Opérations & Logistique
// 4. Fournisseurs & Produits
// 5. Marketplace & Customer
// 6. Support & Customer Success
// 7. Marketing & Communication
// 8. RH
// 9. Qualité & Audit
// 10. Conformité & Juridique
// 11. RSE & Impact
// 12. Produit & Engineering
// 13. Data & BI
// 14. Security & IT
//
// Les anciens pôles tech / lifecycle / rd / risk ne sont plus utilisés ici.
// ---------------------------------------------------------------------------

export type Seniority =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'executive';

export interface PermissionRule {
  /** Accès aux données sensibles du périmètre */
  can_view_sensitive: boolean;

  /** Accès au journal d'audit complet */
  can_view_audit_log: boolean;

  /** Peut modifier la matrice de permissions */
  can_configure_permissions: boolean;
}

export const SENIORITY_ORDER: Seniority[] = [
  'junior',
  'mid',
  'senior',
  'lead',
  'executive',
];

// ---------------------------------------------------------------------------
// Pôles utilisés par la matrice RBAC
// ---------------------------------------------------------------------------

export const POLES_FOR_MATRIX = [
  'direction',
  'finance',
  'ops',
  'supplier',
  'marketplace',
  'support',
  'marketing',
  'rh',
  'audit',
  'compliance',
  'rse',
  'product',
  'data',
  'security',
] as const;

export type MatrixPole = (typeof POLES_FOR_MATRIX)[number];

// ---------------------------------------------------------------------------
// Règles par défaut
//
// Principe :
// - junior  : accès sensible limité
// - mid     : accès opérationnel
// - senior  : accès sensible selon le pôle
// - lead    : responsabilité du périmètre
// - executive : responsabilité globale du périmètre
//
// Les règles absentes utilisent EMPTY_RULE.
// ---------------------------------------------------------------------------

export const DEFAULT_RULES: Record<
  MatrixPole,
  Partial<Record<Seniority, PermissionRule>>
> = {
  // -------------------------------------------------------------------------
  // Direction
  // -------------------------------------------------------------------------
  direction: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: true,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: true,
    },
  },

  // -------------------------------------------------------------------------
  // Finance
  // -------------------------------------------------------------------------
  finance: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Opérations & Logistique
  // -------------------------------------------------------------------------
  ops: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Fournisseurs & Produits
  // -------------------------------------------------------------------------
  supplier: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Marketplace & Customer
  // -------------------------------------------------------------------------
  marketplace: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Support & Customer Success
  // -------------------------------------------------------------------------
  support: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Marketing & Communication
  // -------------------------------------------------------------------------
  marketing: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // RH
  // -------------------------------------------------------------------------
  rh: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: true,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: true,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Qualité & Audit
  // -------------------------------------------------------------------------
  audit: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Conformité & Juridique
  // -------------------------------------------------------------------------
  compliance: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // RSE & Impact
  // -------------------------------------------------------------------------
  rse: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Produit & Engineering
  // -------------------------------------------------------------------------
  product: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Data & BI
  // -------------------------------------------------------------------------
  data: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: false,
      can_configure_permissions: false,
    },
  },

  // -------------------------------------------------------------------------
  // Security & IT
  // -------------------------------------------------------------------------
  security: {
    executive: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    lead: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
    senior: {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: false,
    },
  },
};

// ---------------------------------------------------------------------------
// Persistance des personnalisations
// ---------------------------------------------------------------------------
//
// Les règles par défaut restent dans le code.
// Les modifications effectuées depuis l'interface d'administration sont
// persistées séparément et prennent priorité sur les règles par défaut.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bib.permission_rules.overrides.v1';

type OverrideMap = Record<
  string,
  Record<string, PermissionRule>
>;

export const loadOverrides = (): OverrideMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveOverrides = (map: OverrideMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('permission-rules-changed'));
};

// ---------------------------------------------------------------------------
// Règle vide
// ---------------------------------------------------------------------------

const EMPTY_RULE: PermissionRule = {
  can_view_sensitive: false,
  can_view_audit_log: false,
  can_configure_permissions: false,
};

// ---------------------------------------------------------------------------
// Résolution d'une règle
// ---------------------------------------------------------------------------

export const getRule = (
  pole: string | null | undefined,
  seniority: string | null | undefined,
  overrides?: OverrideMap,
): PermissionRule => {
  if (!pole || !seniority) {
    return EMPTY_RULE;
  }

  const ov = overrides ?? loadOverrides();

  const fromOverride = ov?.[pole]?.[seniority];

  if (fromOverride) {
    return fromOverride;
  }

  if (
    POLES_FOR_MATRIX.includes(
      pole as MatrixPole,
    )
  ) {
    const fromDefault =
      DEFAULT_RULES[pole as MatrixPole]?.[
        seniority as Seniority
      ];

    return fromDefault ?? EMPTY_RULE;
  }

  return EMPTY_RULE;
};

// ---------------------------------------------------------------------------
// Mode construction
// ---------------------------------------------------------------------------
//
// Lorsque le RBAC est désactivé depuis Administration → Rôles & Permissions,
// les règles sensibles sont temporairement ouvertes afin de permettre le
// développement et le test de l'intranet.
//
// Ce mode ne doit pas être considéré comme un mécanisme de sécurité
// production.
// ---------------------------------------------------------------------------

export const isBuildModeOpenRules = (): boolean => {
  try {
    return localStorage.getItem('bib.rbac_enforced.v1') === 'off';
  } catch {
    return false;
  }
};

export const mergeRulesForUser = (
  poles: string[],
  seniority: string | null | undefined,
): PermissionRule => {
  if (isBuildModeOpenRules()) {
    return {
      can_view_sensitive: true,
      can_view_audit_log: true,
      can_configure_permissions: true,
    };
  }

  const overrides = loadOverrides();

  const merged: PermissionRule = {
    ...EMPTY_RULE,
  };

  for (const pole of poles) {
    const rule = getRule(
      pole,
      seniority,
      overrides,
    );

    merged.can_view_sensitive ||=
      rule.can_view_sensitive;

    merged.can_view_audit_log ||=
      rule.can_view_audit_log;

    merged.can_configure_permissions ||=
      rule.can_configure_permissions;
  }

  return merged;
};
