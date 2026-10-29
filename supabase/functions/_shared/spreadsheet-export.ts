import * as XLSX from 'npm:xlsx@0.18.5';
import { DriveError } from './intranet-drive.ts';
export function createStampedSpreadsheet(value: unknown, identity: string, timestamp: string, trace: string): Uint8Array {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DriveError('Tableau d’export invalide.');
 const table = value as { headers?: unknown; rows?: unknown };
 if (!Array.isArray(table.headers) || table.headers.length === 0 || table.headers.length > 50 || table.headers.some(h => typeof h !== 'string' || h.length > 255) || !Array.isArray(table.rows) || table.rows.length > 5000) throw new DriveError('Le tableau dépasse les limites d’export.');
 const cell = (v: unknown): string | number | boolean => {
  if (v == null) return '';
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'boolean') return v;
  if (typeof v !== 'string' || v.length > 10000) throw new DriveError('Cellule d’export invalide.');
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
 };
 const rows = table.rows.map(row => { if (!Array.isArray(row) || row.length !== (table.headers as unknown[]).length) throw new DriveError('Ligne d’export invalide.'); return row.map(cell); });
 const book = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([table.headers.map(cell), ...rows]), 'Données');
 XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['BIB — Traçabilité'], ['Compte', identity], ['Horodatage', timestamp], ['Référence', trace], ['Diffusion', 'Usage professionnel BIB']]), 'Traçabilité BIB');
 return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}
