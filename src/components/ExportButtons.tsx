 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
 import { Download, FileSpreadsheet, FileText } from 'lucide-react';
 import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exportUtils';
 import { toast } from 'sonner';
 
 interface ExportColumn {
   header: string;
   accessor: string;
 }
 
interface ExportButtonsProps {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  poleName?: string;
}

export function ExportButtons({ filename, title, columns, data, variant = 'outline', size = 'default', poleName }: ExportButtonsProps) {
  const [pending, setPending] = useState(false);
  const handleExportPDF = async () => {
    setPending(true);
    try {
      await exportToPDF({ filename, title, columns, data, poleName });
      toast.success('PDF enregistré dans votre Drive BIB');
    } catch (error) {
      toast.error('Export Drive non confirmé. Réessayez.');
    } finally { setPending(false); }
  };
 
   const handleExportExcel = async () => {
     setPending(true);
     try {
       await exportToExcel({ filename, title, columns, data });
       toast.success('Excel enregistré dans votre Drive BIB');
     } catch (error) {
       toast.error('Export Drive non confirmé. Réessayez.');
     } finally { setPending(false); }
   };
 
   const handleExportCSV = async () => {
     setPending(true);
     try {
       await exportToCSV({ filename, columns, data });
       toast.success('CSV enregistré dans votre Drive BIB');
     } catch (error) {
       toast.error('Export Drive non confirmé. Réessayez.');
     } finally { setPending(false); }
   };
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant={variant} size={size} disabled={pending}>
           <Download className="h-4 w-4 mr-2" />
           Exporter → Drive BIB
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end">
         <DropdownMenuItem onClick={handleExportPDF}>
           <FileText className="h-4 w-4 mr-2" />
           Export PDF
         </DropdownMenuItem>
         <DropdownMenuItem onClick={handleExportExcel}>
           <FileSpreadsheet className="h-4 w-4 mr-2" />
           Export Excel
         </DropdownMenuItem>
         <DropdownMenuItem onClick={handleExportCSV}>
           <FileSpreadsheet className="h-4 w-4 mr-2" />
           Export CSV
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }