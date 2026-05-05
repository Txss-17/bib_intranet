import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

export const exportToPDF = ({ filename, title, columns, data, poleName }: ExportOptions) => {
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
   
   doc.save(`${filename}.pdf`);
 };
 
 export const exportToExcel = ({ filename, title, columns, data }: ExportOptions) => {
   // Prepare data with headers
   const headers = columns.map(col => col.header);
   const rows = data.map(item => 
     columns.map(col => {
       const value = item[col.accessor];
       return value !== undefined && value !== null ? value : '';
     })
   );
   
   // Create worksheet
   const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
   
   // Set column widths
   const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));
   ws['!cols'] = colWidths;
   
   // Create workbook
   const wb = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb, ws, title || 'Données');
   
   // Save file
   XLSX.writeFile(wb, `${filename}.xlsx`);
 };
 
 export const exportToCSV = ({ filename, columns, data }: ExportOptions) => {
   const headers = columns.map(col => col.header).join(',');
   const rows = data.map(item => 
     columns.map(col => {
       const value = item[col.accessor];
       const stringValue = value !== undefined && value !== null ? String(value) : '';
       // Escape quotes and wrap in quotes if contains comma
       return stringValue.includes(',') || stringValue.includes('"') 
         ? `"${stringValue.replace(/"/g, '""')}"` 
         : stringValue;
     }).join(',')
   );
   
   const csv = [headers, ...rows].join('\n');
   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = `${filename}.csv`;
   link.click();
 };