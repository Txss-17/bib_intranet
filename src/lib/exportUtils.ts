import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportDocumentToDrive, currentDocumentPage } from '@/lib/driveDocuments';

interface ExportColumn {
  header: string;
  accessor: string;
}

interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  poleName?: string;
  requestKey?: string;
}

type PreparedExport = { name: string; mime: string; bytes: Uint8Array; table?: {headers:string[];rows:unknown[][]}; key:string };
const pendingExports = new Map<string, PreparedExport>();
async function exportPrepared(format:string,options:ExportOptions,prepare:()=>Omit<PreparedExport,'key'>){
 const fingerprint=JSON.stringify([currentDocumentPage(),format,options]);
 let prepared=pendingExports.get(fingerprint);
 if(!prepared){prepared={...prepare(),key:options.requestKey||crypto.randomUUID()};pendingExports.set(fingerprint,prepared)}
 const result=await exportDocumentToDrive(prepared.name,prepared.mime,prepared.bytes,prepared.key,prepared.table);
 pendingExports.delete(fingerprint);return result;
}

const drawLinksyHeader = (doc: jsPDF, poleName?: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Draw "B.I.B" logo block - navy square with gold text
  doc.setFillColor(10, 16, 36);
  doc.roundedRect(14, 8, 22, 14, 2, 2, 'F');
  doc.setTextColor(201, 169, 97);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('B.I.B', 16.5, 18);

  // Draw "intranet" text
  doc.setTextColor(10, 16, 36);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('intranet', 39, 18);

  // Draw pole name after dash
  if (poleName) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`— ${poleName}`, 70, 18);
  }
  
  // Separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 25, pageWidth - 14, 25);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
};

export const exportToPDF = async (options: ExportOptions) => exportPrepared('pdf', options, () => {
  const {filename,title,columns,data,poleName}=options;
  const doc = new jsPDF();
  
  // Add Linksy branded header
  drawLinksyHeader(doc, poleName);
  
  let startY = 30;
  
  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, startY + 8);
    startY += 12;
  }
  
  // Add date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, startY + 6);
  doc.setTextColor(0, 0, 0);
   
   // Prepare table data
   const headers = columns.map(col => col.header);
   const rows = data.map(item => 
     columns.map(col => {
       const value = item[col.accessor];
       return value !== undefined && value !== null ? String(value) : '';
     })
   );
   
  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: startY + 10,
     styles: { 
       fontSize: 8,
       cellPadding: 2,
     },
     headStyles: { 
       fillColor: [59, 130, 246],
       textColor: 255,
       fontStyle: 'bold',
     },
     alternateRowStyles: {
       fillColor: [245, 247, 250],
     },
   });
   
   return {name:`${filename}.pdf`, mime:'application/pdf', bytes:new Uint8Array(doc.output('arraybuffer'))};
 });
 
 export const exportToExcel = async (options: ExportOptions) => exportPrepared('xlsx', options, () => {
   const {filename,columns,data}=options;
   const table = { headers: columns.map(c => c.header), rows: data.map(row => columns.map(c => {
     const v = row[c.accessor]; return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : v;
   })) };
   return {name:`${filename}.xlsx`,mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',bytes:new Uint8Array(),table};
 });

 export const exportToCSV = async (options: ExportOptions) => exportPrepared('csv', options, () => {
   const {filename,columns,data}=options;
   const headers = columns.map(col => col.header).join(',');
   const rows = data.map(item => 
     columns.map(col => {
       const value = item[col.accessor];
       let stringValue = value !== undefined && value !== null ? String(value) : '';
       // Neutralize spreadsheet formulas (CSV injection)
       if (/^[=+\-@\t\r]/.test(stringValue)) stringValue = `'${stringValue}`;
       // Escape quotes and wrap in quotes if contains comma
       return /[",\n\r]/.test(stringValue) 
         ? `"${stringValue.replace(/"/g, '""')}"` 
         : stringValue;
     }).join(',')
   );
   
   const csv = [headers, ...rows].join('\n');
   return {name:`${filename}.csv`,mime:'text/csv',bytes:new TextEncoder().encode(csv)};
 });
