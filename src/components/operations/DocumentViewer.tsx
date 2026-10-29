import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type PDFDocumentLoadingTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
GlobalWorkerOptions.workerSrc = workerUrl;
export default function DocumentViewer({ documentId }: { documentId: string }) {
 const canvas = useRef<HTMLCanvasElement>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [page, setPage] = useState(1); const [driveView,setDriveView]=useState<{message:string;drive_url?:string}|null>(null);
 useEffect(() => {
  let active = true; const controller = new AbortController(); let resource: PDFDocumentLoadingTask | undefined;
  setLoading(true); setError(''); setPdf(null); setPage(1); setDriveView(null);
  const load = async () => {
   try {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error('Connexion requise.');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intranet-drive`, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview', document_id: documentId }) });
    if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.error || 'Aperçu documentaire indisponible.'); }
    if(response.headers.get('content-type')?.includes('application/json')){const data=await response.json();if(active)setDriveView(data);return;}
    resource = getDocument({ data: new Uint8Array(await response.arrayBuffer()), enableXfa: false });
    const loaded = await resource.promise;
    if (active) setPdf(loaded); else void resource.destroy();
   } catch (e) { if (active && !controller.signal.aborted) setError((e as Error).message); } finally { if (active) setLoading(false); }
  }; void load();
  return () => { active = false; controller.abort(); void resource?.destroy(); };
 }, [documentId]);
 useEffect(() => {
  if (!pdf || !canvas.current) return;
  let active = true; let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
  const draw = async () => { try {
   const resource = await pdf.getPage(page); if (!active || !canvas.current) return;
   const width = Math.min(950, canvas.current.parentElement?.clientWidth || 800); const viewport = resource.getViewport({ scale: width / resource.getViewport({ scale: 1 }).width });
   const target = canvas.current; target.width = viewport.width; target.height = viewport.height; const context = target.getContext('2d'); if (!context) throw new Error('Aperçu non pris en charge.');
   task = resource.render({ canvasContext: context, canvas: target, viewport }); await task.promise;
  } catch (e) { if (active) setError((e as Error).message); } }; void draw();
  return () => { active = false; task?.cancel(); };
 }, [pdf, page]);
 return <div className="bib-protected-document space-y-3 select-none" onContextMenu={e => e.preventDefault()}><style>{'@media print { .bib-protected-document { display: none !important; } }'}</style>{loading && <p role="status">Préparation de la consultation sécurisée…</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{driveView&&<div className="space-y-3 text-sm"><p>{driveView.message}</p>{driveView.drive_url&&<Button asChild variant="outline"><a href={driveView.drive_url} target="_blank" rel="noopener noreferrer">Ouvrir le tableau dans Drive BIB</a></Button>}</div>}{pdf && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button><span className="text-sm">Page {page} sur {pdf.numPages}</span><Button variant="outline" disabled={page >= pdf.numPages} onClick={() => setPage(page + 1)}>Suivant</Button></div>}<canvas ref={canvas} className="mx-auto max-w-full shadow" aria-label={`Page ${page} du document`} /></div>;
}
