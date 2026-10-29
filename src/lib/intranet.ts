import definitions from '@/data/intranetRegistry.json';
import aliases from '@/data/intranetRouteAliases.json';
import { supabase } from '@/integrations/supabase/client';
export type ModuleField = { key: string; label: string; type: string; required: boolean };
export type ModuleDefinition = { id: string; path: string; label: string; scope: string; transversal: boolean; approvalLevels: number; fields: ModuleField[]; permissionAliases?: string[]; public?: boolean; restrictedRoles?: string[] };
export const intranetModules = definitions as ModuleDefinition[];
export const moduleById = (id: string) => intranetModules.find(p => p.id === id || p.permissionAliases?.includes(id));
export const resolveIntranetPage = (pathname: string): ModuleDefinition | undefined => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const map = aliases as Record<string, string>;
  const exact = map[path] || intranetModules.find(p => p.path === path)?.id;
  if (exact) return moduleById(exact);
  const matches = Object.entries(map).filter(([pattern]) => pattern.includes(':') && new RegExp('^' + pattern.split('/').map(p => p.startsWith(':') ? '[^/]+' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '$').test(path));
  matches.sort((a, b) => b[0].split('/').filter(p => !p.startsWith(':')).length - a[0].split('/').filter(p => !p.startsWith(':')).length);
  return matches[0] ? moduleById(matches[0][1]) : undefined;
};
export type RecordStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'archived';
export const RECORD_STATUS: Record<RecordStatus, string> = { draft: 'Brouillon', submitted: 'À valider', reviewed: 'Première validation', approved: 'Validé', rejected: 'Refusé', archived: 'Archivé' };
export type ModuleRecord = { id: string; page_id: string; title: string; payload: Record<string, unknown>; status: RecordStatus; priority: string; owner_id: string | null; due_date: string | null; visibility: string; document_ids: string[]; created_by: string; revision: number; first_reviewer: string | null; approved_by: string | null; updated_at: string; created_at: string };
export type ModuleEvent = { id: string; actor_id: string; kind: string; note: string | null; before_state: ModuleRecord | null; after_state: ModuleRecord | null; created_at: string };
export type ModuleList = { rows: ModuleRecord[]; stats: { total: number; draft: number; submitted: number; approved: number }; has_more: boolean };
export type Person = { id: string; name: string };
export async function intranetRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const client = supabase as unknown as { rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }> };
  const { data, error } = await client.rpc(name, args);
  if (error) {
    const message = error.code === '40001' ? 'Ce dossier a changé. Actualisez avant de reprendre votre modification.'
      : error.code === '42501' ? 'Vos droits ne permettent pas cette opération ou une autre personne doit valider ce dossier.'
      : error.code === '55000' ? 'Ce dossier est verrouillé après soumission. Une réouverture motivée est nécessaire.'
      : error.code === '22023' ? 'Vérifiez les champs obligatoires, les valeurs et le motif de décision.' : 'L’opération n’a pas pu être enregistrée. Réessayez.';
    throw new Error(message);
  }
  return data as T;
}
export function normalizeModulePayload(fields: ModuleField[], values: Record<string, unknown>) {
  return Object.fromEntries(fields.map(f => [f.key, f.type === 'number' ? (values[f.key] === '' || values[f.key] == null ? null : Number(values[f.key])) : f.type === 'lines' ? values[f.key] || [] : values[f.key] || '']));
}
