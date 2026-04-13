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
  const handleExportPDF = () => {
    try {
      exportToPDF({ filename, title, columns, data, poleName });
      toast.success('Export PDF réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    }
  };
 
   const handleExportExcel = () => {
     try {
       exportToExcel({ filename, title, columns, data });
       toast.success('Export Excel réussi');
     } catch (error) {
       toast.error('Erreur lors de l\'export Excel');
     }
   };
 
   const handleExportCSV = () => {
     try {
       exportToCSV({ filename, columns, data });
       toast.success('Export CSV réussi');
     } catch (error) {
       toast.error('Erreur lors de l\'export CSV');
     }
   };
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant={variant} size={size}>
           <Download className="h-4 w-4 mr-2" />
           Exporter
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