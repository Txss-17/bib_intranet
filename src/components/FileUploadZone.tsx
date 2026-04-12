import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Film, Music, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploadZoneProps {
  bucket: string;
  folder: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  label?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-primary" />;
  if (type.startsWith('video/')) return <Film className="h-4 w-4 text-primary" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-primary" />;
  return <FileText className="h-4 w-4 text-primary" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUploadZone({
  bucket,
  folder,
  accept = '*',
  multiple = true,
  maxSizeMB = 20,
  files,
  onFilesChange,
  label = 'Glissez vos fichiers ici ou cliquez pour parcourir',
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFiles = async (fileList: FileList) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    const validFiles = Array.from(fileList).filter(f => {
      if (f.size > maxBytes) {
        toast({ title: 'Fichier trop volumineux', description: `${f.name} dépasse ${maxSizeMB} MB`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    if (!validFiles.length) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of validFiles) {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) {
        toast({ title: 'Erreur upload', description: error.message, variant: 'destructive' });
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      newFiles.push({ name: file.name, url: urlData.publicUrl, type: file.type, size: file.size });
    }

    onFilesChange([...files, ...newFiles]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Max {maxSizeMB} MB par fichier</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
