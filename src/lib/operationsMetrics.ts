export async function readAllPages<T extends { id: string }>(fetchPage: (cursor?: string) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = []; let cursor: string | undefined;
  for (;;) {
    const { data, error } = await fetchPage(cursor);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
    cursor = data[data.length - 1].id;
  }
}

export function measuredAverage(values: (number | null | undefined)[]) {
  const known = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100);
  return { average: known.length ? known.reduce((sum, value) => sum + value, 0) / known.length : null, samples: known.length };
}

export function auditMetrics<T extends { status: string | null; score: number | null }>(audits: T[]) {
  const completed = audits.filter(audit => audit.status === 'completed');
  return { total: audits.length, scheduled: audits.filter(audit => audit.status === 'scheduled').length,
    inProgress: audits.filter(audit => audit.status === 'in_progress').length, completed: completed.length,
    ...measuredAverage(completed.map(audit => audit.score)) };
}

export const AUDIT_TYPES: Record<string, string> = {
  initial: 'Initial', continuous: 'Surveillance', periodic: 'Périodique', quality: 'Qualité',
  compliance: 'Conformité', rse: 'RSE', logistics: 'Logistique',
};
