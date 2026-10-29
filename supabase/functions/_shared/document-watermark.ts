import { PDFDocument, StandardFonts, rgb, degrees, PDFName } from 'npm:pdf-lib@1.17.1';
import { DriveError } from './intranet-drive.ts';
export async function documentAsPdf(bytes: Uint8Array, mime: string): Promise<Uint8Array> {
 if (mime === 'application/pdf' && new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-') return bytes;
 if (!['image/png', 'image/jpeg'].includes(mime)) throw new DriveError('Importez un PDF, une image PNG/JPEG ou un document Google Workspace.');
 const doc = await PDFDocument.create(); const image = mime === 'image/png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
 const scale = Math.min(1, 550 / image.width, 780 / image.height); const page = doc.addPage([595, 842]); page.drawImage(image, { x: 22, y: 842 - image.height * scale - 25, width: image.width * scale, height: image.height * scale }); return doc.save();
}
export async function watermarkDocument(bytes: Uint8Array, identity: string, timestamp: string, trace: string, recipient?: string): Promise<Uint8Array> {
 const doc = await PDFDocument.load(bytes); if (doc.getPageCount() > 300) throw new DriveError('Ce document dépasse 300 pages.');
 doc.catalog.delete(PDFName.of('OpenAction')); doc.catalog.delete(PDFName.of('AA'));
 const font = await doc.embedFont(StandardFonts.Helvetica);
 const plain = (s: string) => s.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').slice(0, 180);
 const actor = plain(`BIB | ${recipient || identity} | ${timestamp}`); const reference = plain(`Trace ${trace} | ${identity}`);
 for (const page of doc.getPages()) {
  const { width, height } = page.getSize(); const size = Math.min(15, Math.max(7, (width - 60) / (actor.length * 0.5)));
  page.drawText(actor, { x: 25, y: height / 2, size, font, color: rgb(0.35, 0.35, 0.35), rotate: degrees(25), opacity: 0.24 });
  page.drawText(actor, { x: 15, y: 22, size: Math.min(8, size), font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(reference, { x: 15, y: 10, size: Math.min(6, size), font, color: rgb(0.4, 0.4, 0.4) });
 }
 return doc.save();
}
