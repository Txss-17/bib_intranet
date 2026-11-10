import { jsPDF } from 'jspdf';
import type { SupplierAuditCase } from '@/hooks/useSupplierAuditCases';

/**
 * Local evidentiary export, never an invoice, an audit certificate, or an archive.
 * Uses only fields already recorded in the audit case. No external uploads.
 */
export function downloadAuditEvidencePdf(c: SupplierAuditCase): void {
  if (!c.report || !c.invoice || !c.report_approved_by || !c.report.evidence_reference.trim()) {
    throw new Error('Facture rattachée et rapport approuvé avec preuve requis.');
  }
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const margin = 18;
  const right = 192;
  const width = right - margin;
  let y = 27;
  let page = 1;
  const header = () => {
    doc.setFillColor(21, 38, 64);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BRAND-IN-A-BOX  /  INTRABIB', margin, 10);
    doc.setTextColor(21, 38, 64);
    doc.setFontSize(8);
    doc.text('COPIE DE SUIVI INTERNE - NE CONSTITUE PAS UNE FACTURE', margin, 288);
    doc.text(String(page), right, 288, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };
  const newPage = () => { doc.addPage(); page += 1; y = 27; header(); };
  const paragraph = (title: string, value: string) => {
    const lines: string[] = doc.splitTextToSize(value || 'Non renseigné', width);
    if (y + 17 > 276) newPage();
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    for (const line of lines) {
      if (y + 5 > 276) newPage();
      doc.text(line, margin, y);
      y += 5;
    }
    y += 5;
  };
  header();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(c.kind === 'initial' ? 'Audit documentaire initial' : 'Contre-audit fournisseur', margin, y);
  y += 10;
  doc.setFontSize(10);
  paragraph('DOSSIER', c.id + ' / revision ' + c.revision);
  paragraph('FOURNISSEUR', c.supplier_name);
  paragraph('PRODUITS ET REFERENCES', c.scope.join(' ; '));
  paragraph('CONTRAT', c.contract_reference ?? 'Non renseigne');
  paragraph('FACTURE EMISE PAR CIRCUIT DISTINCT', c.invoice.reference + ' / ' + c.invoice.issue_date + ' / ' + c.invoice.document_reference);
  paragraph('RAPPORT APPROUVE - CONSTATATIONS', c.report.findings);
  paragraph('CONCLUSION DU RAPPORT', c.report.conclusion);
  paragraph('REFERENCE DES PREUVES', c.report.evidence_reference);
  paragraph('APPROBATEUR DU RAPPORT', c.report_approved_by);
  paragraph('DECISIONS PAR PRODUIT', (c.reference_decisions ?? []).map(d => d.reference + ' : ' + d.decision).join(' ; ') || 'Aucune decision enregistree');
  paragraph('LIMITES', 'Document de synthese pour controle interne uniquement. La facture legale reste le document source enregistre. Le rapport approuve et ses preuves restent des pieces distinctes. Aucun nouveau paiement, avis de conformite ou envoi fournisseur.');
  const safe = c.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save('BIB-dossier-audit-suivi-' + safe + '.pdf');
}
