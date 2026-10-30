/**
 * Hierarchical BIB data scope (policy specification).
 *
 * AND across dimensions: subsidiary ∧ pole ∧ region ∧ portfolio ∧ ownership.
 * OR within selected values of a dimension.
 *
 * A null dimension means "all values in the already constrained parent", NOT
 * unrestricted access to the whole organisation. The policy specification is
 * not an authorization decision; server RLS must enforce it per resource.
 */
export interface HierarchicalScope {
  subsidiaries: string[];
  poles: string[];
  regions: string[];
  portfolios: string[];
  ownRecords: boolean;
}

export const emptyHierarchicalScope = (): HierarchicalScope => ({
  subsidiaries: [],
  poles: [],
  regions: [],
  portfolios: [],
  ownRecords: false,
});

export type ScopedRecord = {
  subsidiary?: string | null;
  pole?: string | null;
  region?: string | null;
  portfolio?: string | null;
  ownerId?: string | null;
};

/** Canonical, deterministic values; never interpret missing record metadata as a match. */
export function matchesHierarchicalScope(
  scope: HierarchicalScope,
  record: ScopedRecord,
  employeeId: string,
): boolean {
  if (!scope.subsidiaries.length) return false; // require an explicit organisational boundary
  if (!record.subsidiary || !scope.subsidiaries.includes(record.subsidiary)) return false;
  if (scope.poles.length && (!record.pole || !scope.poles.includes(record.pole))) return false;
  if (scope.regions.length && (!record.region || !scope.regions.includes(record.region))) return false;
  if (scope.portfolios.length && (!record.portfolio || !scope.portfolios.includes(record.portfolio))) return false;
  if (scope.ownRecords && (!employeeId || record.ownerId !== employeeId)) return false;
  return true;
}

/** An empty nested list = global inside the preceding selected parent. */
export function describeHierarchicalScope(scope: HierarchicalScope): string {
  if (!scope.subsidiaries.length) return 'Aucune entité BIB sélectionnée — accès non défini';
  const chunks = [
    scope.subsidiaries.join(' OU '),
    scope.poles.length ? `pôle(s) ${scope.poles.join(' OU ')}` : 'tous les pôles de cette entité',
    scope.regions.length ? `région(s) ${scope.regions.join(' OU ')}` : 'toutes les régions du périmètre',
    scope.portfolios.length ? `portefeuille(s) ${scope.portfolios.join(' OU ')}` : 'tous les portefeuilles du périmètre',
    scope.ownRecords ? 'uniquement les dossiers du collaborateur' : 'tous les dossiers autorisés dans ce périmètre',
  ];
  return chunks.join(' → ');
}
