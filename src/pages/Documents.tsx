import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Plus,
  FileText,
  File,
  FolderOpen,
  Download,
  Eye,
  MoreHorizontal,
  Grid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { documents } from '@/data/mockData';
import { getPoleById } from '@/data/poles';
import { cn } from '@/lib/utils';

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return FileText;
      case 'report':
        return File;
      default:
        return FileText;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'review':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'text-success';
      case 'restricted':
        return 'text-warning';
      case 'confidential':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central document repository with version control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FolderOpen className="h-4 w-4 mr-2" />
            Browse Vaults
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents by name, type, or pole..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex border border-input rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Documents</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">1,247</p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
          <p className="mt-2 text-2xl font-semibold text-warning">23</p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Updated</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">48</p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Archived</p>
          <p className="mt-2 text-2xl font-semibold text-muted-foreground">312</p>
        </div>
      </div>

      {/* Documents List */}
      {viewMode === 'list' ? (
        <div className="enterprise-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Pole</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-2">Updated</div>
            <div className="col-span-1">Actions</div>
          </div>
          {documents.map((doc) => {
            const pole = getPoleById(doc.poleId);
            const Icon = getDocumentIcon(doc.type);
            return (
              <div
                key={doc.id}
                className="grid grid-cols-12 gap-4 p-4 data-row items-center"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className={cn('text-xs', getAccessLevelColor(doc.accessLevel))}>
                      {doc.accessLevel}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="capitalize">
                    {doc.type}
                  </Badge>
                </div>
                <div className="col-span-2">
                  {pole && (
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', pole.color)} />
                      <span className="text-sm text-muted-foreground">{pole.shortName}</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-muted-foreground">v{doc.version}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(doc.lastModified), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const pole = getPoleById(doc.poleId);
            const Icon = getDocumentIcon(doc.type);
            return (
              <div key={doc.id} className="enterprise-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                </div>
                <h3 className="mt-3 text-sm font-medium text-foreground line-clamp-2">
                  {doc.name}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {pole && (
                    <>
                      <span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} />
                      <span>{pole.shortName}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>v{doc.version}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {format(new Date(doc.lastModified), 'MMM d, yyyy')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
