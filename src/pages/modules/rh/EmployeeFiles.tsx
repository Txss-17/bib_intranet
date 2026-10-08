import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  ExternalLink,
  Plus,
  Loader2,
  FolderOpen,
  ShieldCheck,
  Briefcase,
  Award,
  FileCheck,
  FileLock,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Users,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

import {
  type Employee,
  type CollaboratorType,
  type CollaboratorDirectoryType,
  type HrStatus,
  useEmployees,
} from '@/hooks/useEmployees';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';

import { ExportButtons } from '@/components/ExportButtons';


// ============================================================
// TYPES
// ============================================================

type DocumentType =
  | 'contract'
  | 'identity'
  | 'diploma'
  | 'administrative'
  | 'medical'
  | 'training'
  | 'evaluation'
  | 'disciplinary'
  | 'other';

type DocumentSource =
  | 'drive'
  | 'upload'
  | 'external'
  | 'other';

interface EmployeeDocument {
  id: string;
  employee_id: string;
  name: string;
  document_type: DocumentType;
  source: DocumentSource;
  document_url: string | null;
  description: string | null;
  document_date: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}


// ============================================================
// LABELS
// ============================================================

const documentTypeLabels: Record<DocumentType, string> = {
  contract: 'Contrat',
  identity: "Pièce d'identité",
  diploma: 'Diplôme',
  administrative: 'Administratif',
  medical: 'Médical',
  training: 'Formation',
  evaluation: 'Évaluation',
  disciplinary: 'Disciplinaire',
  other: 'Autre',
};

const documentSourceLabels: Record<DocumentSource, string> = {
  drive: 'Google Drive BIB',
  upload: 'Import BIB',
  external: 'Source externe',
  other: 'Autre',
};

const collaboratorTypeLabels: Record<CollaboratorType, string> = {
  internal: 'Interne',
  external: 'Externe',
  provider: 'Prestataire',
  consultant: 'Consultant',
  apprentice: 'Alternant',
  intern: 'Stagiaire',
  other: 'Autre',
};

const directoryTypeLabels: Record<
  CollaboratorDirectoryType,
  string
> = {
  all: 'Tous',
  internal: 'Interne',
  external: 'Externe',
  other: 'Autres',
};

const statusLabels: Record<HrStatus, string> = {
  active: 'Actif',
  onboarding: 'En onboarding',
  leave: 'En congé',
  suspended: 'Suspendu',
  leaving: 'Sortant',
  archived: 'Archivé',
};


// ============================================================
// DOCUMENT ICON
// ============================================================

function DocumentIcon({
  type,
}: {
  type: DocumentType;
}) {
  const iconClass = 'h-4 w-4';

  switch (type) {
    case 'contract':
      return <Briefcase className={iconClass} />;

    case 'identity':
      return <ShieldCheck className={iconClass} />;

    case 'diploma':
      return <Award className={iconClass} />;

    case 'medical':
      return <FileLock className={iconClass} />;

    case 'training':
      return <GraduationCap className={iconClass} />;

    case 'evaluation':
      return <ClipboardCheck className={iconClass} />;

    case 'disciplinary':
      return <AlertTriangle className={iconClass} />;

    case 'administrative':
      return <FileCheck className={iconClass} />;

    default:
      return <FileText className={iconClass} />;
  }
}


// ============================================================
// HELPERS
// ============================================================

function fullName(employee: Employee) {
  return (
    `${employee.first_name ?? ''} ${employee.last_name ?? ''}`
  ).trim();
}

function initials(employee: Employee) {
  return (
    `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`
  ).toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('fr-FR');
}

function isExpired(value: string | null) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() < Date.now();
}


// ============================================================
// PAGE
// ============================================================

export default function EmployeeFiles() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedEmployeeId =
    searchParams.get('employee') || '';

  // ----------------------------------------------------------
  // EMPLOYEE FILTERS
  // ----------------------------------------------------------

  const [searchQuery, setSearchQuery] = useState('');

  const [directoryType, setDirectoryType] =
    useState<CollaboratorDirectoryType>('all');

  const [typeFilter, setTypeFilter] =
    useState<CollaboratorType | 'all'>('all');

  const [statusFilter, setStatusFilter] =
    useState<HrStatus | 'all'>('all');

  // ----------------------------------------------------------
  // DOCUMENT FILTERS
  // ----------------------------------------------------------

  const [documentFilter, setDocumentFilter] =
    useState<DocumentType | 'all'>('all');

  // ----------------------------------------------------------
  // DOCUMENT STATE
  // ----------------------------------------------------------

  const [documents, setDocuments] =
    useState<EmployeeDocument[]>([]);

  const [isLoadingDocuments, setIsLoadingDocuments] =
    useState(false);

  const [documentsError, setDocumentsError] =
    useState<string | null>(null);

  const [documentDialogOpen, setDocumentDialogOpen] =
    useState(false);

  const [selectedDocument, setSelectedDocument] =
    useState<EmployeeDocument | null>(null);

  const [form, setForm] = useState({
    name: '',
    document_type: 'contract' as DocumentType,
    source: 'drive' as DocumentSource,
    document_url: '',
    description: '',
    document_date: '',
    expires_at: '',
  });

  // ----------------------------------------------------------
  // EMPLOYEES
  // ----------------------------------------------------------

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    refetch: refetchEmployees,
  } = useEmployees({
    search: searchQuery || undefined,
    directoryType,
    collaboratorType: typeFilter,
    hrStatus: statusFilter,
  });

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.id === selectedEmployeeId,
      ) ?? null,
    [employees, selectedEmployeeId],
  );

  // ----------------------------------------------------------
  // LOAD DOCUMENTS
  // ----------------------------------------------------------

  const loadDocuments = async () => {
    if (!selectedEmployeeId) {
      setDocuments([]);
      setDocumentsError(null);
      return;
    }

    setIsLoadingDocuments(true);
    setDocumentsError(null);

    try {
      const { data, error } = await (supabase as any)
        .from('rh_employee_documents')
        .select(`
          id,
          employee_id,
          name,
          document_type,
          source,
          document_url,
          description,
          document_date,
          expires_at,
          created_by,
          created_at,
          updated_at
        `)
        .eq('employee_id', selectedEmployeeId)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setDocuments(
        (data ?? []) as EmployeeDocument[],
      );
    } catch (error: any) {
      const message =
        error?.message ||
        'Impossible de charger le dossier documentaire.';

      setDocuments([]);
      setDocumentsError(message);

      toast.error(message);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [selectedEmployeeId]);

  // ----------------------------------------------------------
  // DOCUMENT FILTER
  // ----------------------------------------------------------

  const visibleDocuments = useMemo(() => {
    if (documentFilter === 'all') {
      return documents;
    }

    return documents.filter(
      (document) =>
        document.document_type === documentFilter,
    );
  }, [documents, documentFilter]);

  // ----------------------------------------------------------
  // KPIs
  // ----------------------------------------------------------

  const expiredDocuments = documents.filter(
    (document) =>
      isExpired(document.expires_at),
  ).length;

  const documentsWithExpiry = documents.filter(
    (document) =>
      Boolean(document.expires_at),
  ).length;

  // ----------------------------------------------------------
  // EMPLOYEE SELECTION
  // ----------------------------------------------------------

  const selectEmployee = (employee: Employee) => {
    setSearchParams({
      employee: employee.id,
    });

    setDocumentFilter('all');
    setSelectedDocument(null);
  };

  const clearSelection = () => {
    setSearchParams({});
    setDocuments([]);
    setSelectedDocument(null);
    setDocumentFilter('all');
  };

  // ----------------------------------------------------------
  // REFRESH
  // ----------------------------------------------------------

  const refreshAll = async () => {
    await Promise.all([
      refetchEmployees(),
      selectedEmployeeId
        ? loadDocuments()
        : Promise.resolve(),
    ]);

    toast.success('Données RH actualisées.');
  };

  // ----------------------------------------------------------
  // NEW DOCUMENT
  // ----------------------------------------------------------

  const openNewDocument = () => {
    if (!selectedEmployee) {
      toast.error(
        'Sélectionnez d’abord un collaborateur.',
      );

      return;
    }

    setForm({
      name: '',
      document_type: 'contract',
      source: 'drive',
      document_url: '',
      description: '',
      document_date: '',
      expires_at: '',
    });

    setDocumentDialogOpen(true);
  };

  // ----------------------------------------------------------
  // SAVE DOCUMENT
  // ----------------------------------------------------------

  const saveDocument = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (!form.name.trim()) {
      toast.error(
        'Le nom du document est obligatoire.',
      );

      return;
    }

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from('rh_employee_documents')
        .insert({
          employee_id: selectedEmployee.id,
          name: form.name.trim(),
          document_type: form.document_type,
          source: form.source,
          document_url:
            form.document_url.trim() || null,
          description:
            form.description.trim() || null,
          document_date:
            form.document_date || null,
          expires_at:
            form.expires_at || null,
          created_by: user?.id ?? null,
        });

      if (error) {
        throw error;
      }

      toast.success(
        'Document ajouté au dossier RH.',
      );

      setDocumentDialogOpen(false);

      await loadDocuments();
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Impossible d’ajouter le document.',
      );
    }
  };

  // ----------------------------------------------------------
  // DELETE DOCUMENT
  // ----------------------------------------------------------

  const deleteDocument = async (
    document: EmployeeDocument,
  ) => {
    const confirmed = window.confirm(
      `Supprimer la référence « ${document.name} » du dossier RH ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('rh_employee_documents')
        .delete()
        .eq('id', document.id);

      if (error) {
        throw error;
      }

      toast.success(
        'Document retiré du registre RH.',
      );

      setSelectedDocument(null);

      await loadDocuments();
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Impossible de supprimer le document.',
      );
    }
  };

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (isLoadingEmployees) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />

            <h1 className="text-3xl font-bold">
              Dossiers collaborateurs
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Gestion documentaire RH rattachée au
            référentiel officiel des collaborateurs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={refreshAll}
            disabled={
              isLoadingEmployees ||
              isLoadingDocuments
            }
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isLoadingDocuments
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Actualiser
          </Button>

          <Button
            onClick={openNewDocument}
            disabled={!selectedEmployee}
          >
            <Plus className="mr-2 h-4 w-4" />

            Ajouter un document
          </Button>
        </div>
      </div>


      {/* ======================================================
          EMPLOYEE SELECTION
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />

            Sélection du collaborateur
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* SEARCH */}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-10"
              placeholder="Rechercher un collaborateur..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
            />
          </div>


          {/* DIRECTORY TYPE */}

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(
              Object.keys(
                directoryTypeLabels,
              ) as CollaboratorDirectoryType[]
            ).map((value) => (
              <Button
                key={value}
                type="button"
                variant={
                  directoryType === value
                    ? 'default'
                    : 'outline'
                }
                onClick={() =>
                  setDirectoryType(value)
                }
              >
                {directoryTypeLabels[value]}
              </Button>
            ))}
          </div>


          {/* PRECISE FILTERS */}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(
                  value as CollaboratorType | 'all',
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de collaborateur" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les types
                </SelectItem>

                {(
                  Object.entries(
                    collaboratorTypeLabels,
                  ) as [
                    CollaboratorType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value as HrStatus | 'all',
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut RH" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
                </SelectItem>

                {(
                  Object.entries(
                    statusLabels,
                  ) as [
                    HrStatus,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>


          {/* EMPLOYEE LIST */}

          <div className="max-h-72 overflow-y-auto rounded-lg border">

            {employees.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aucun collaborateur correspondant
                aux filtres.
              </div>
            ) : (
              <div className="divide-y">
                {employees.map((employee) => {
                  const selected =
                    employee.id ===
                    selectedEmployeeId;

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() =>
                        selectEmployee(employee)
                      }
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                        selected
                          ? 'bg-primary/5'
                          : ''
                      }`}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {initials(employee)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {fullName(employee)}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {employee.position ||
                            'Poste non renseigné'}
                          {' · '}
                          {Array.isArray(
                            employee.poles,
                          )
                            ? employee.poles.join(
                                ', ',
                              )
                            : 'Pôle non renseigné'}
                        </p>
                      </div>

                      <div className="hidden gap-2 sm:flex">
                        <Badge variant="outline">
                          {
                            collaboratorTypeLabels[
                              employee.collaborator_type
                            ]
                          }
                        </Badge>

                        <Badge
                          variant={
                            employee.hr_status ===
                            'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {
                            statusLabels[
                              employee.hr_status
                            ]
                          }
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          </div>

        </CardContent>
      </Card>


      {/* ======================================================
          SELECTED EMPLOYEE
          ====================================================== */}

      {selectedEmployee && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {initials(selectedEmployee)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">
                      {fullName(selectedEmployee)}
                    </h2>

                    <Badge variant="outline">
                      {
                        collaboratorTypeLabels[
                          selectedEmployee
                            .collaborator_type
                        ]
                      }
                    </Badge>

                    <Badge>
                      {
                        statusLabels[
                          selectedEmployee
                            .hr_status
                        ]
                      }
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.email}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.position ||
                      'Poste non renseigné'}
                    {' · '}
                    {Array.isArray(
                      selectedEmployee.poles,
                    )
                      ? selectedEmployee.poles.join(
                          ', ',
                        )
                      : 'Pôle non renseigné'}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={clearSelection}
              >
                <X className="mr-2 h-4 w-4" />

                Fermer le dossier
              </Button>

            </CardContent>
          </Card>


          {/* ==================================================
              DOCUMENT KPIs
              ================================================== */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Documents
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {documents.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Documents avec échéance
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {documentsWithExpiry}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Échéances dépassées
                </p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    expiredDocuments > 0
                      ? 'text-destructive'
                      : ''
                  }`}
                >
                  {expiredDocuments}
                </p>
              </CardContent>
            </Card>

          </div>


          {/* ==================================================
              DOCUMENTS
              ================================================== */}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                <CardTitle>
                  Documents du dossier
                </CardTitle>

                <Select
                  value={documentFilter}
                  onValueChange={(value) =>
                    setDocumentFilter(
                      value as DocumentType | 'all',
                    )
                  }
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Filtrer les documents" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      Tous les documents
                    </SelectItem>

                    {(
                      Object.entries(
                        documentTypeLabels,
                      ) as [
                        DocumentType,
                        string,
                      ][]
                    ).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

              </div>
            </CardHeader>

            <CardContent>

              {isLoadingDocuments ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : documentsError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
                  <p className="font-medium text-destructive">
                    Impossible de charger le dossier.
                  </p>

                  <p className="mt-1 text-muted-foreground">
                    {documentsError}
                  </p>

                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={loadDocuments}
                  >
                    Réessayer
                  </Button>
                </div>
              ) : visibleDocuments.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />

                  <p className="mt-3 font-medium">
                    Aucun document
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun document ne correspond
                    aux critères actuels.
                  </p>

                  <Button
                    className="mt-4"
                    onClick={openNewDocument}
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Ajouter un document
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          Document
                        </TableHead>

                        <TableHead>
                          Type
                        </TableHead>

                        <TableHead>
                          Source
                        </TableHead>

                        <TableHead>
                          Date
                        </TableHead>

                        <TableHead>
                          Échéance
                        </TableHead>

                        <TableHead className="text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {visibleDocuments.map(
                        (document) => {
                          const expired =
                            isExpired(
                              document.expires_at,
                            );

                          return (
                            <TableRow
                              key={document.id}
                            >
                              <TableCell>
                                <button
                                  type="button"
                                  className="flex items-center gap-3 text-left"
                                  onClick={() =>
                                    setSelectedDocument(
                                      document,
                                    )
                                  }
                                >
                                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                                    <DocumentIcon
                                      type={
                                        document.document_type
                                      }
                                    />
                                  </div>

                                  <div>
                                    <p className="font-medium hover:underline">
                                      {document.name}
                                    </p>

                                    {document.description && (
                                      <p className="max-w-xs truncate text-xs text-muted-foreground">
                                        {
                                          document.description
                                        }
                                      </p>
                                    )}
                                  </div>
                                </button>
                              </TableCell>

                              <TableCell>
                                {
                                  documentTypeLabels[
                                    document
                                      .document_type
                                  ]
                                }
                              </TableCell>

                              <TableCell>
                                {
                                  documentSourceLabels[
                                    document.source
                                  ]
                                }
                              </TableCell>

                              <TableCell>
                                {formatDate(
                                  document.document_date,
                                )}
                              </TableCell>

                              <TableCell>
                                <span
                                  className={
                                    expired
                                      ? 'font-medium text-destructive'
                                      : ''
                                  }
                                >
                                  {formatDate(
                                    document.expires_at,
                                  )}
                                </span>
                              </TableCell>

                              <TableCell>
                                <div className="flex justify-end gap-2">

                                  {document.document_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                    >
                                      <a
                                        href={
                                          document.document_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />

                                        Ouvrir
                                      </a>
                                    </Button>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedDocument(
                                        document,
                                      )
                                    }
                                  >
                                    Détails
                                  </Button>

                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

            </CardContent>
          </Card>


          {/* ==================================================
              EXPORT
              ================================================== */}

          <div className="flex justify-end">
            <ExportButtons
              filename={`dossier-rh-${selectedEmployee.last_name.toLowerCase()}`}
              title={`Dossier RH — ${fullName(selectedEmployee)}`}
              columns={[
                {
                  header: 'Document',
                  accessor: 'name',
                },
                {
                  header: 'Type',
                  accessor: 'type',
                },
                {
                  header: 'Source',
                  accessor: 'source',
                },
                {
                  header: 'Date',
                  accessor: 'date',
                },
                {
                  header: 'Échéance',
                  accessor: 'expires_at',
                },
              ]}
              data={visibleDocuments.map(
                (document) => ({
                  name: document.name,
                  type:
                    documentTypeLabels[
                      document.document_type
                    ],
                  source:
                    documentSourceLabels[
                      document.source
                    ],
                  date: formatDate(
                    document.document_date,
                  ),
                  expires_at: formatDate(
                    document.expires_at,
                  ),
                }),
              )}
            />
          </div>
        </>
      )}


      {/* ======================================================
          DOCUMENT DETAILS
          ====================================================== */}

      <Dialog
        open={Boolean(selectedDocument)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDocument(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Détails du document
            </DialogTitle>

            <DialogDescription>
              Métadonnées enregistrées dans le
              registre documentaire RH.
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-5">

              <div>
                <p className="text-xs text-muted-foreground">
                  Nom
                </p>

                <p className="font-medium">
                  {selectedDocument.name}
                </p>
              </div>


              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-muted-foreground">
                    Type
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      documentTypeLabels[
                        selectedDocument
                          .document_type
                      ]
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Source
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      documentSourceLabels[
                        selectedDocument.source
                      ]
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Date du document
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDate(
                      selectedDocument.document_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Échéance
                  </p>

                  <p
                    className={`mt-1 text-sm ${
                      isExpired(
                        selectedDocument.expires_at,
                      )
                        ? 'font-medium text-destructive'
                        : ''
                    }`}
                  >
                    {formatDate(
                      selectedDocument.expires_at,
                    )}
                  </p>
                </div>

              </div>


              {selectedDocument.description && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Description
                  </p>

                  <p className="mt-1 rounded-md bg-muted/50 p-3 text-sm">
                    {
                      selectedDocument.description
                    }
                  </p>
                </div>
              )}


              <div className="flex flex-wrap justify-between gap-2 pt-2">

                {selectedDocument.document_url && (
                  <Button asChild>
                    <a
                      href={
                        selectedDocument.document_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />

                      Ouvrir le document
                    </a>
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() =>
                    deleteDocument(
                      selectedDocument,
                    )
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />

                  Supprimer la référence
                </Button>

              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* ======================================================
          ADD DOCUMENT
          ====================================================== */}

      <Dialog
        open={documentDialogOpen}
        onOpenChange={
          setDocumentDialogOpen
        }
      >
        <DialogContent className="max-w-xl">

          <DialogHeader>
            <DialogTitle>
              Ajouter un document RH
            </DialogTitle>

            <DialogDescription>
              Document rattaché à{' '}
              {selectedEmployee
                ? fullName(selectedEmployee)
                : 'ce collaborateur'}.
              <br />
              Pour les documents BIB, privilégiez
              Google Drive BIB ou l’environnement
              documentaire professionnel plutôt qu’un
              téléchargement local.
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-4">

            {/* NAME */}

            <div>
              <Label>
                Nom du document
              </Label>

              <Input
                className="mt-1"
                placeholder="Ex. Contrat de travail — CDI"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />
            </div>


            {/* TYPE / SOURCE */}

            <div className="grid grid-cols-2 gap-3">

              <div>
                <Label>
                  Type
                </Label>

                <Select
                  value={form.document_type}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      document_type:
                        value as DocumentType,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(
                      Object.entries(
                        documentTypeLabels,
                      ) as [
                        DocumentType,
                        string,
                      ][]
                    ).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>


              <div>
                <Label>
                  Source
                </Label>

                <Select
                  value={form.source}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      source:
                        value as DocumentSource,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {(
                      Object.entries(
                        documentSourceLabels,
                      ) as [
                        DocumentSource,
                        string,
                      ][]
                    ).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>


            {/* DOCUMENT REFERENCE */}

            <div>
              <Label>
                Référence du document
              </Label>

              <Input
                className="mt-1"
                type="url"
                placeholder="Lien Google Drive BIB ou référence documentaire"
                value={form.document_url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    document_url:
                      event.target.value,
                  })
                }
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Le fichier lui-même n’est pas stocké
                dans cette table. Cette valeur référence
                son emplacement documentaire.
              </p>
            </div>


            {/* DATES */}

            <div className="grid grid-cols-2 gap-3">

              <div>
                <Label>
                  Date du document
                </Label>

                <Input
                  className="mt-1"
                  type="date"
                  value={form.document_date}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      document_date:
                        event.target.value,
                    })
                  }
                />
              </div>


              <div>
                <Label>
                  Date d’échéance
                </Label>

                <Input
                  className="mt-1"
                  type="date"
                  value={form.expires_at}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      expires_at:
                        event.target.value,
                    })
                  }
                />
              </div>

            </div>


            {/* DESCRIPTION */}

            <div>
              <Label>
                Description
              </Label>

              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Informations complémentaires..."
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
              />
            </div>

          </div>


          <DialogFooter>

            <Button
              variant="ghost"
              onClick={() =>
                setDocumentDialogOpen(false)
              }
            >
              Annuler
            </Button>

            <Button
              onClick={saveDocument}
              disabled={!form.name.trim()}
            >
              <FileCheck className="mr-2 h-4 w-4" />

              Enregistrer
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}