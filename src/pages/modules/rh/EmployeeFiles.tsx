import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  Calendar,
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
  User,
  Users,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

import {
  type Employee,
  type CollaboratorType,
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
  return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
}

function initials(employee: Employee) {
  return `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`
    .toUpperCase();
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

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<CollaboratorType | 'all'>('all');
  const [statusFilter, setStatusFilter] =
    useState<HrStatus | 'all'>('all');
  const [documentFilter, setDocumentFilter] =
    useState<DocumentType | 'all'>('all');

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] =
    useState(false);

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

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
  } = useEmployees({
    search: searchQuery || undefined,
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


  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  const loadDocuments = async () => {
    if (!selectedEmployeeId) {
      setDocuments([]);
      return;
    }

    setIsLoadingDocuments(true);

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
      toast.error(
        error?.message ||
          'Impossible de charger le dossier documentaire.',
      );

      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };


  useEffect(() => {
    void loadDocuments();
  }, [selectedEmployeeId]);


  // ==========================================================
  // EMPLOYEE FILTER
  // ==========================================================

  const visibleEmployees = employees;

  // ==========================================================
  // DOCUMENT FILTER
  // ==========================================================

  const visibleDocuments = useMemo(() => {
    if (documentFilter === 'all') {
      return documents;
    }

    return documents.filter(
      (document) =>
        document.document_type === documentFilter,
    );
  }, [documents, documentFilter]);


  // ==========================================================
  // KPI
  // ==========================================================

  const expiredDocuments = documents.filter(
    (document) =>
      isExpired(document.expires_at),
  ).length;

  const documentsWithExpiry = documents.filter(
    (document) =>
      Boolean(document.expires_at),
  ).length;


  // ==========================================================
  // SELECT EMPLOYEE
  // ==========================================================

  const selectEmployee = (employee: Employee) => {
    setSearchParams({
      employee: employee.id,
    });

    setDocumentFilter('all');
  };


  const clearSelection = () => {
    setSearchParams({});
    setDocuments([]);
    setSelectedDocument(null);
  };


  // ==========================================================
  // NEW DOCUMENT
  // ==========================================================

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


  // ==========================================================
  // SAVE DOCUMENT
  // ==========================================================

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


  // ==========================================================
  // DELETE DOCUMENT
  // ==========================================================

  const deleteDocument = async (
    document: EmployeeDocument,
  ) => {
    const confirmed = window.confirm(
      `Supprimer le document « ${document.name} » du dossier RH ?`,
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


  // ==========================================================
  // LOADING
  // ==========================================================

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
            Gestion documentaire RH rattachée au référentiel
            officiel des collaborateurs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={loadDocuments}
            disabled={!selectedEmployeeId || isLoadingDocuments}
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
          FILTERS
          ====================================================== */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />

            Sélection du collaborateur
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-10"
              placeholder="Rechercher un collaborateur..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
            />
          </div>

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

          <div className="max-h-64 overflow-y-auto rounded-lg border">
            {visibleEmployees.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aucun collaborateur correspondant aux filtres.
              </div>
            ) : (
              <div className="divide-y">
                {visibleEmployees.map((employee) => {
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
                          {employee.position || 'Poste non renseigné'}
                          {' · '}
                          {Array.isArray(employee.poles)
                            ? employee.poles.join(', ')
                            : 'Pôle non renseigné'}
                        </p>
                      </div>

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
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {!selectedEmployee && (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />

            <h2 className="mt-4 text-lg font-semibold">
              Aucun dossier sélectionné
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Sélectionnez un collaborateur dans le référentiel
              ci-dessus pour accéder à son dossier RH documentaire.
            </p>
          </CardContent>
        </Card>
      )}


      {/* ======================================================
          SELECTED EMPLOYEE
          ====================================================== */}

      {selectedEmployee && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {initials(selectedEmployee)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">
                        {fullName(selectedEmployee)}
                      </h2>

                      <Badge>
                        {
                          statusLabels[
                            selectedEmployee.hr_status
                          ]
                        }
                      </Badge>

                      <Badge variant="outline">
                        {
                          collaboratorTypeLabels[
                            selectedEmployee
                              .collaborator_type
                          ]
                        }
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedEmployee.position ||
                        'Poste non renseigné'}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedEmployee.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={clearSelection}
                  >
                    Changer de collaborateur
                  </Button>

                  <Button
                    onClick={openNewDocument}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un document
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Pôle(s)
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {Array.isArray(selectedEmployee.poles)
                      ? selectedEmployee.poles.join(', ')
                      : '—'}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Niveau
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedEmployee.seniority || '—'}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Mode
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {selectedEmployee.work_mode || '—'}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Documents
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {documents.length}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Expirations
                  </p>

                  <p
                    className={`mt-1 text-sm font-medium ${
                      expiredDocuments > 0
                        ? 'text-destructive'
                        : ''
                    }`}
                  >
                    {expiredDocuments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* ==================================================
              DOCUMENTS
              ================================================== */}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>
                    Documents RH
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Registre documentaire du collaborateur.
                    Les documents BIB sont référencés depuis leur
                    environnement documentaire professionnel.
                  </p>
                </div>

                <Select
                  value={documentFilter}
                  onValueChange={(value) =>
                    setDocumentFilter(
                      value as DocumentType | 'all',
                    )
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
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
            </CardHeader>

            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : visibleDocuments.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />

                  <p className="mt-3 font-medium">
                    Aucun document enregistré
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajoutez une référence documentaire pour ce
                    collaborateur.
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
                <div className="overflow-x-auto">
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
                          Action
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
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <DocumentIcon
                                      type={
                                        document.document_type
                                      }
                                    />
                                  </div>

                                  <div>
                                    <p className="font-medium">
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
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge variant="outline">
                                  {
                                    documentTypeLabels[
                                      document
                                        .document_type
                                    ]
                                  }
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">
                                  {
                                    documentSourceLabels[
                                      document.source
                                    ]
                                  }
                                </span>
                              </TableCell>

                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(
                                  document.document_date,
                                )}
                              </TableCell>

                              <TableCell>
                                {document.expires_at ? (
                                  <span
                                    className={`flex items-center gap-1 text-sm ${
                                      expired
                                        ? 'text-destructive'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Clock className="h-3.5 w-3.5" />

                                    {formatDate(
                                      document.expires_at,
                                    )}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {document.document_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                    >
                                      <a
                                        href={
                                          document.document_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                        Ouvrir
                                      </a>
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="ghost"
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
              data={documents.map(
                (document) => ({
                  name: document.name,
                  type:
                    documentTypeLabels[
                      document.document_type
                    ],
                  source:
                    documentSourceLabels[
                      document.source
