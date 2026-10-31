import { useState, useRef } from 'react';
import { CloudDownload, X, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { driveAction, DriveDocument, DriveSource, currentDocumentPage } from '@/lib/driveDocuments';
import { toast } from 'sonner';
interface UploadedFile { name: string; url: string; type: string; size: number }
interface Props { bucket: string; folder: string; accept?: string; multiple?: boolean; maxSizeMB?: number; files: UploadedFile[]; onFilesChange: (files: UploadedFile[]) => void; label?: string }
export default function FileUploadZone({ folder, multiple = true, maxSizeMB = 20, files, onFilesChange }: Props) {
 const [open, setOpen] = useState(false); const [search, setSearch] = useState(''); const [source, setSource] = useState(''); const [results, setResults] = useState<DriveSource[]>([]); const [next, setNext] = useState<string>(); const [loading, setLoading] = useState(false); const [pending, setPending] = useState(false); const [failure, setFailure] = useState(''); const [key, setKey] = useState(() => crypto.randomUUID());
 const list = async (page?: string) => { setLoading(true); setFailure(''); try { const result = await driveAction<{ files: DriveSource[]; nextPageToken?: string }>({ action: 'list', search, page_token: page }); setResults(page ? [...results, ...result.files] : result.files); setNext(result.nextPageToken); } catch (e) { setFailure((e as Error).message); } finally { setLoading(false); } };
 const requestKeys = useRef(new Map<string, string>());
 const importSource = async (s?: DriveSource) => {
  if (!s && !source.trim()) return; if (s && Number(s.size || 0) > maxSizeMB * 1024 * 1024) { setFailure('Ce fichier dépasse la taille autorisée.'); return; }
  const operationKey = s ? (requestKeys.current.get(s.id) || crypto.randomUUID()) : key;
  if (s) requestKeys.current.set(s.id, operationKey);
  setPending(true); setFailure('');
  try { const result = await driveAction<DriveDocument>({ action: 'import', request_key: operationKey, source: s?.id || source, page_id: currentDocumentPage(), name: s?.name || 'Document BIB.pdf', classification: 'confidential', public_asset: folder === 'products' && !!s?.mimeType.startsWith('image/') });
   if (!result.url) throw new Error('Import Drive incomplet : aucun lien documentaire exploitable n’a été retourné.');
   const imported = { name: result.name, url: new URL(result.url, window.location.origin).href, type: result.mime_type, size: result.size_bytes };
   // Preserve existing catalogue attachments and avoid duplicate records on retries.
   const nextFiles = multiple ? (files.some(f => f.url === imported.url) ? files : [...files, imported]) : [imported];
   onFilesChange(nextFiles); if (s) requestKeys.current.delete(s.id); setKey(crypto.randomUUID()); setOpen(false); setSource(''); toast.success('Document importé depuis Drive BIB');
  } catch (e) { setFailure((e as Error).message); } finally { setPending(false); }
 };
 return <div className="space-y-3"><Button type="button" variant="outline" className="w-full" onClick={() => { setOpen(true); void list(); }}><CloudDownload className="mr-2 h-4 w-4" />Importer depuis Google Drive BIB</Button><p className="text-xs text-muted-foreground">Documents PDF, PNG/JPEG et documents Google Workspace. {folder === 'products' ? 'Les images de catalogue choisies sont destinées à la publication.' : 'Les documents restent dans l’espace professionnel BIB.'}</p>{files.map((f, i) => <div key={`${f.url}-${i}`} className="flex items-center justify-between rounded border p-2 text-sm"><span className="truncate">{f.name}</span><Button type="button" variant="ghost" size="icon" aria-label={`Retirer ${f.name}`} onClick={() => onFilesChange(files.filter((_, n) => i !== n))}><X className="h-4 w-4" /></Button></div>)}<Dialog open={open} onOpenChange={o => !pending && setOpen(o)}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Importer depuis votre Drive BIB</DialogTitle></DialogHeader><div className="flex gap-2"><Input placeholder="Rechercher un fichier…" value={search} onChange={e => setSearch(e.target.value)} /><Button type="button" variant="outline" disabled={loading || pending} onClick={() => void list()}><Search className="h-4 w-4" /></Button></div>{failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}{loading && <Loader2 className="h-5 w-5 animate-spin" />}<ul className="max-h-64 divide-y overflow-y-auto">{results.map(s => <li key={s.id}><button type="button" disabled={pending} className="w-full p-3 text-left hover:bg-muted" onClick={() => { void importSource(s); }}><span className="block text-sm font-medium">{s.name}</span><span className="text-xs text-muted-foreground">{s.mimeType}</span></button></li>)}</ul>{next && <Button type="button" variant="outline" disabled={loading || pending} onClick={() => void list(next)}>Afficher la suite</Button>}<div className="space-y-2 border-t pt-3"><Input value={source} disabled={pending} onChange={e => { setSource(e.target.value); setKey(crypto.randomUUID()); }} placeholder="Ou collez un lien Google Drive BIB" /><Button type="button" disabled={pending || !source.trim()} onClick={() => void importSource()}>{pending ? 'Import en cours…' : 'Importer ce lien'}</Button></div></DialogContent></Dialog></div>;
}
