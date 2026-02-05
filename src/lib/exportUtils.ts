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
 }
 
 export const exportToPDF = ({ filename, title, columns, data }: ExportOptions) => {
   const doc = new jsPDF();
   
   // Add title
   if (title) {
     doc.setFontSize(18);
     doc.text(title, 14, 22);
   }
   
   // Add date
   doc.setFontSize(10);
   doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, title ? 32 : 22);
   
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
     startY: title ? 40 : 30,
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