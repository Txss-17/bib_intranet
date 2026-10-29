import { supabase } from '@/integrations/supabase/client';
import { resolveIntranetPage } from '@/lib/intranet';
export type DriveDocument = { id: string; name: string; mime_type: string; size_bytes: number; classification: string; page_id?: string; owner_id?: string; created_at?: string; url?: string; drive_url?: string };
export type DriveSource = { id: string; name: string; mimeType: string; size?: string };
export async function driveAction<T>(body: Record<string, unknown>): Promise<T> {
 const { data, error } = await supabase.functions.invoke('intranet-drive', { body });
 if (error) { let message = 'Google Drive BIB est indisponible. Votre demande n’est pas confirmée.'; try { const result = await error.context?.json(); if (typeof result?.error === 'string') message = result.error; } catch { /* Keep the safe failure message. */ } throw new Error(message); }
 if (data?.error) throw new Error(String(data.error)); return data as T;
}
export const currentDocumentPage = () => resolveIntranetPage(window.location.pathname)?.id || 'app.documents';
export function managedDocumentId(value: string | null | undefined) {
 if (!value) return null;
 try { const url = new URL(value, window.location.origin); if (url.origin !== window.location.origin || url.pathname !== '/documents') return null; return url.searchParams.get('document'); } catch { return null; }
}
export function openManagedDocument(value: string | null | undefined) {
 const id = managedDocumentId(value); if (!id) throw new Error('Ce document doit être importé dans Drive BIB avant consultation.');
 window.open(`/documents?document=${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
}
export function documentBase64(bytes: Uint8Array) { let result = ''; for (let i = 0; i < bytes.length; i += 32768) result += String.fromCharCode(...bytes.subarray(i, i + 32768)); return btoa(result); }
export async function exportDocumentToDrive(name: string, mime: string, bytes: Uint8Array, key: string, table?: { headers: string[]; rows: unknown[][] }) {
 return driveAction<DriveDocument>({ action: 'export', request_key: key, page_id: currentDocumentPage(), name, mime_type: mime, content: mime.includes('spreadsheetml') ? undefined : documentBase64(bytes), table, classification: 'confidential' });
}
