import {
  pageRegistry,
  PUBLIC_PAGES,
  RESTRICTED_PAGES,
  SENIORITY_ACTIONS,
  PermissionAction,
} from '@/data/permissionMatrix';
import { jobRoles, JobRole } from '@/data/jobRoles';

export interface AccessPermissionRecord {
  roleKey: string;
  interfaceKey: string;
  actionKey: PermissionAction;
  allowed: boolean;
}

export interface AccessPermissionSummary {
  roles: number;
  interfaces: number;
  permissions: number;
  allowed: number;
  denied: number;
}

/**
 * Résout une page pour un rôle en reproduisant volontairement
 * la logique de resolvePagePermissions(), mais sans :
 *
 * - localStorage
 * - matrix overrides locaux
 * - mode super-admin
 * - état de construction local
 *
 * Cette fonction représente donc uniquement la matrice métier
 * de référence qui doit être synchronisée vers Supabase.
 */
export const resolveCatalogPagePermissions = (
  pageId: string,
  role: JobRole,
): Record<PermissionAction, boolean> => {
  const page = pageRegistry.find(
    (candidate) => candidate.id === pageId,
  );

  const noAccess: Record<PermissionAction, boolean> = {
    read: false,
    create: false,
    update: false,
    delete: false,
    publish: false,
    validate: false,
    administer: false,
  };

  if (!page) {
    return noAccess;
  }

  // ------------------------------------------------------------
  // NIVEAU 1 — PÔLE
  // ------------------------------------------------------------

  const inScope =
    page.transversal ||
    role.poles.includes(page.scope);

  if (
    !inScope &&
    !PUBLIC_PAGES.has(pageId)
  ) {
    return noAccess;
  }

  // ------------------------------------------------------------
  // NIVEAU 2 — PAGE RESTREINTE
  // ------------------------------------------------------------

  const owners =
    RESTRICTED_PAGES[pageId];

  if (
    owners &&
    !owners.includes(role.id)
  ) {
    return noAccess;
  }

  // ------------------------------------------------------------
  // ADMINISTRATION
  // ------------------------------------------------------------

  if (
    page.scope === 'admin' &&
    !owners
  ) {
    return noAccess;
  }

  // ------------------------------------------------------------
  // PAGES PUBLIQUES
  // ------------------------------------------------------------

  if (
    PUBLIC_PAGES.has(pageId)
  ) {
    return {
      read: true,
      create: true,
      update: false,
      delete: false,
      publish: false,
      validate: false,
      administer: false,
    };
  }

  // ------------------------------------------------------------
  // COMPTES EXTERNES / LECTURE SEULE
  // ------------------------------------------------------------

  if (role.readOnly) {
    return {
      read: true,
      create: false,
      update: false,
      delete: false,
      publish: false,
      validate: false,
      administer: false,
    };
  }

  // ------------------------------------------------------------
  // NIVEAU 3 — SÉNIORITÉ
  // ------------------------------------------------------------

  return {
    ...(
      SENIORITY_ACTIONS[role.seniority] ??
      SENIORITY_ACTIONS.junior
    ),
  };
};

/**
 * Construit toute la matrice rôle × interface × action.
 *
 * Chaque combinaison existe explicitement dans le catalogue.
 * Cela permet à l'interface RH de voir aussi les accès refusés,
 * au lieu de considérer qu'une absence de ligne signifie
 * implicitement "autorisé".
 */
export const buildAccessPermissionCatalog = (): AccessPermissionRecord[] => {
  const records: AccessPermissionRecord[] = [];

  for (const role of jobRoles) {
    for (const page of pageRegistry) {
      const permissions =
        resolveCatalogPagePermissions(
          page.id,
          role,
        );

      for (const action of Object.keys(
        permissions,
      ) as PermissionAction[]) {
        records.push({
          roleKey: role.id,
          interfaceKey: page.id,
          actionKey: action,
          allowed: permissions[action],
        });
      }
    }
  }

  return records;
};

/**
 * Version compacte utilisée pour les synchronisations.
 */
export const buildAllowedPermissionCatalog =
  (): AccessPermissionRecord[] =>
    buildAccessPermissionCatalog().filter(
      (permission) => permission.allowed,
    );

/**
 * Retourne uniquement les permissions d'un rôle.
 */
export const permissionsForRole = (
  roleId: string,
): AccessPermissionRecord[] => {
  const role = jobRoles.find(
    (candidate) => candidate.id === roleId,
  );

  if (!role) {
    return [];
  }

  return pageRegistry.flatMap((page) => {
    const permissions =
      resolveCatalogPagePermissions(
        page.id,
        role,
      );

    return (
      Object.keys(
        permissions,
      ) as PermissionAction[]
    ).map((actionKey) => ({
      roleKey: role.id,
      interfaceKey: page.id,
      actionKey,
      allowed: permissions[actionKey],
    }));
  });
};

/**
 * Vérifie directement si une combinaison
 * rôle/interface/action est autorisée par
 * la matrice métier actuelle.
 */
export const catalogAllows = (
  roleId: string,
  interfaceKey: string,
  actionKey: PermissionAction,
): boolean => {
  const role = jobRoles.find(
    (candidate) => candidate.id === roleId,
  );

  if (!role) {
    return false;
  }

  const permissions =
    resolveCatalogPagePermissions(
      interfaceKey,
      role,
    );

  return permissions[actionKey] === true;
};

/**
 * Résumé utile pour la page RH / Permissions.
 */
export const getAccessPermissionSummary =
  (): AccessPermissionSummary => {
    const records =
      buildAccessPermissionCatalog();

    return {
      roles: jobRoles.length,
      interfaces: pageRegistry.length,
      permissions: records.length,
      allowed: records.filter(
        (record) => record.allowed,
      ).length,
      denied: records.filter(
        (record) => !record.allowed,
      ).length,
    };
  };

/**
 * Vérifie que toutes les interfaces du registre
 * sont représentées dans la matrice.
 */
export const validateAccessPermissionCatalog =
  () => {
    const errors: string[] = [];

    for (const role of jobRoles) {
      for (const page of pageRegistry) {
        const permissions =
          resolveCatalogPagePermissions(
            page.id,
            role,
          );

        for (const action of Object.keys(
          permissions,
        ) as PermissionAction[]) {
          if (
            typeof permissions[action] !==
            'boolean'
          ) {
            errors.push(
              `${role.id} → ${page.id} → ${action}`,
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };
