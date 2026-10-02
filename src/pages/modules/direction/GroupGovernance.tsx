import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Building, Users, FileText, Heart, Briefcase, Upload, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  openGovernanceDoc, useGovernanceDocActions, useGovernanceDocs, useIsLeadership,
} from '@/hooks/useDirectionContent';

const governanceEntities = [
  { id: 'bib-sas', name: 'BIB SAS', type: 'Société Opérationnelle', description: 'Entité principale - marketplace Brand-in-a-box', capital: '50,000€', status: 'active' },
  { id: 'bib-foundation', name: 'Fondation BIB', type: 'Fondation', description: 'Actions RSE, éducation, impact social', capital: 'Dotation initiale', status: 'planned' },
];

const boardMembers = [
  { id: '1', name: 'Fondatrice', role: 'Présidente', entity: 'BIB SAS' },
  { id: '2', name: 'Investisseur Lead', role: 'Administrateur', entity: 'BIB SAS' },
  { id: '3', name: 'Expert Industrie', role: 'Conseiller', entity: 'BIB SAS' },
];

const formatSize = (n: number | null) => (!n ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);

const GroupGovernance = () => {
  const { data: isLeader = false } = useIsLeadership();
  const { data: docs = [], isLoading } = useGovernanceDocs(isLeader);
  const { upload, remove } = useGovernanceDocActions();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setOpen(false); setFile(null); setName(''); setVersion(''); };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          Gouvernance Groupe
        </h1>
        <p className="text-muted-foreground mt-1">Structure juridique et gouvernance BIB</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {governanceEntities.map((entity) => (
          <Card key={entity.id} className={entity.status === 'active' ? 'border-primary' : 'border-dashed'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {entity.type === 'Fondation' ? <Heart className="h-5 w-5 text-primary" /> : <Building className="h-5 w-5 text-primary" />}
                  {entity.name}
                </CardTitle>
                <Badge variant={entity.status === 'active' ? 'default' : 'outline'}>{entity.status === 'active' ? 'Actif' : 'Planifié'}</Badge>
              </div>
              <CardDescription>{entity.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{entity.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Capital</span>
                <span className="font-medium">{entity.capital}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Conseil d'Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boardMembers.map((m) => (
              <div key={m.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><Briefcase className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <Badge variant="outline">{m.entity}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Documents Juridiques</CardTitle>
          {isLeader && <Button size="sm" onClick={() => setOpen(true)}><Upload className="mr-1 h-4 w-4" />Ajouter un document</Button>}
        </CardHeader>
        <CardContent>
          {!isLeader ? (
            <p className="text-sm text-muted-foreground">Documents réservés à la Direction.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun document. Ajoutez les statuts, le pacte d'actionnaires, le règlement intérieur…</p>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Ajouté le {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })} {formatSize(doc.file_size) && `· ${formatSize(doc.file_size)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {doc.version && <Badge variant="outline">{doc.version}</Badge>}
                    <Button size="sm" variant="outline" onClick={() => openGovernanceDoc(doc)}><Eye className="mr-1 h-4 w-4" />Lire</Button>
                    <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => confirm(`Supprimer « ${doc.name} » ?`) && remove.mutate(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => !o && reset()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un document juridique</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Fichier (20 Mo max)</Label>
              <Input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''));
              }} />
            </div>
            <div><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Statuts BIB SAS" /></div>
            <div><Label>Version</Label><Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.0" /></div>
          </div>
          <DialogFooter>
            <Button disabled={!file || upload.isPending} onClick={() => file && upload.mutate({ file, name, version }, { onSuccess: reset })}>
              {upload.isPending ? 'Envoi…' : 'Téléverser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupGovernance;
