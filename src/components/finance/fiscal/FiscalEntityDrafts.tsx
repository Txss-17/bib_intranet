import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type EntityAssignment = {record_id:string;entity_id:string|null};
type EntityDraft = {
  id:string; legal_name:string;country_code:string;legal_form:string;
  status:'project';notes:string;created_at:string;
};

// The RPC performs a canonical CEO assignment check. UI visibility is not an authorization boundary.
export default function FiscalEntityDrafts(){
  const {user,profile}=useAuth();
  const qc=useQueryClient();
  const show=Boolean(user&&profile?.position==='ceo'&&profile?.test_account===false);
  const [legalName,setLegalName]=useState('');
  const [country,setCountry]=useState('FR');
  const [legalForm,setLegalForm]=useState('');
  const [notes,setNotes]=useState('');
  const [selectedRecord,setSelectedRecord]=useState('');
  const [selectedEntity,setSelectedEntity]=useState('');
  const key=['fiscal-legal-entity-drafts',user?.id];
  const drafts=useQuery({
    queryKey:key,enabled:show,staleTime:30_000,
    queryFn:async():Promise<EntityDraft[]>=>{
      const {data,error}=await supabase.rpc('list_bib_fiscal_legal_entities' as never);
      if(error)throw error;
      if(!Array.isArray(data))throw new Error('Registre des entités indisponible.');
      return data as EntityDraft[];
    }
  });
  const assignments=useQuery({
    queryKey:['fiscal-entity-assignments',user?.id],enabled:show,
    queryFn:async():Promise<EntityAssignment[]>=>{
      const {data,error}=await supabase.rpc('list_bib_fiscal_entity_assignments' as never);
      if(error)throw error;
      if(!Array.isArray(data))throw new Error('Attributions fiscales indisponibles.');
      return data as EntityAssignment[];
    }
  });
  const assign=useMutation({
    mutationFn:async()=>{
      const {error}=await supabase.rpc('bib_assign_fiscal_record_entity' as never,{
        p_record_id:selectedRecord,p_entity_id:selectedEntity,p_test:false
      } as never);
      if(error)throw error;
    },
    onSuccess:()=>{
      setSelectedRecord('');setSelectedEntity('');
      void qc.invalidateQueries({queryKey:['fiscal-entity-assignments',user?.id]});
    }
  });
  const create=useMutation({
    mutationFn:async()=>{
      const {error}=await supabase.rpc('create_bib_fiscal_legal_entity' as never,{
        p_legal_name:legalName.trim(),p_country_code:country.trim().toUpperCase(),
        p_legal_form:legalForm.trim(),p_notes:notes.trim()
      } as never);
      if(error)throw error;
    },
    onSuccess:()=>{
      setLegalName('');setLegalForm('');setNotes('');
      void qc.invalidateQueries({queryKey:key});
    }
  });
  if(!show)return null;
  return <Card className="mb-5 border-pole-finance/30">
    <CardHeader><CardTitle className="text-base">Direction · Registre des entités en projet</CardTitle>
      <p className="text-sm text-muted-foreground">Réservé au CEO habilité. Ajouter une entité prépare son dossier ; cela ne crée ni société, ni obligation fiscale, ni accès pour un autre pôle. Une activation juridique et un rattachement des flux nécessiteront une validation distincte.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {drafts.isError&&<p role="alert" className="text-sm text-destructive">Registre indisponible ou accès refusé. Vérifier la migration 0098 et l'affectation CEO canonique.</p>}
      {drafts.isLoading&&<p role="status" className="text-sm text-muted-foreground">Chargement des entités en projet…</p>}
      {drafts.isSuccess&&<div className="space-y-2">
        {drafts.data.length===0?<p className="text-sm text-muted-foreground">Aucune nouvelle entité en projet.</p>:
        drafts.data.map(e=><div key={e.id} className="rounded-md border bg-muted/30 p-3 text-sm">
          <strong>{e.legal_name}</strong> · {e.country_code} · {e.legal_form}
          <p className="text-xs text-muted-foreground">Projet uniquement · aucune déclaration activée</p>
          {e.notes&&<p className="mt-1 whitespace-pre-wrap text-xs">{e.notes}</p>}
        </div>)}
      </div>}
      {drafts.isSuccess&&<form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(!create.isPending)create.mutate();}}>
        <label className="grid gap-1 text-sm">Dénomination / projet d'entité
          <Input required minLength={3} maxLength={200} value={legalName} onChange={e=>setLegalName(e.target.value)} placeholder="Nom prévu ou identité légale"/>
        </label>
        <label className="grid gap-1 text-sm">Forme juridique envisagée
          <Input required minLength={2} maxLength={80} value={legalForm} onChange={e=>setLegalForm(e.target.value)} placeholder="EI, SASU, autre…"/>
        </label>
        <label className="grid gap-1 text-sm">Pays (ISO à deux lettres)
          <Input required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" value={country} onChange={e=>setCountry(e.target.value.toUpperCase())}/>
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">Observations
          <Textarea maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Objet du projet, vérifications juridiques et fiscales restantes"/>
        </label>
        {create.isError&&<p role="alert" className="text-sm text-destructive sm:col-span-2">Enregistrement refusé : {(create.error as Error).message}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={create.isPending||legalName.trim().length<3||legalForm.trim().length<2||!/^[A-Z]{2}$/.test(country)}>{create.isPending?'Enregistrement…':"Créer un dossier d'entité en projet"}</Button></div>
      </form>}
      <section className="border-t pt-4 space-y-3">
        <h3 className="font-medium text-sm">Rattachement juridique des dossiers fiscaux</h3>
        <p className="text-xs text-muted-foreground">Aucun rattachement ne se fait automatiquement selon les libellés EI, SASU ou Intermédiation. Vérifiez l'émetteur et la propriété juridique avant d'attribuer chaque dossier ; un projet n'autorise aucune déclaration ni délégation.</p>
        {assignments.isError&&<p role="alert" className="text-sm text-destructive">Attributions indisponibles : migration 0099 ou habilitation CEO à vérifier.</p>}
        {assignments.isSuccess&&<>
          <p className="text-xs text-muted-foreground">{assignments.data.filter(a=>a.entity_id).length} dossiers rattachés sur {assignments.data.length}. Les dossiers non rattachés restent réservés au CEO.</p>
          {drafts.isSuccess&&drafts.data.length>0&&assignments.data.some(a=>!a.entity_id)&&
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(!assign.isPending)assign.mutate();}}>
            <label className="grid gap-1 text-sm">Dossier à rattacher
              <select className="h-10 rounded-md border border-input bg-background px-3" value={selectedRecord} onChange={e=>setSelectedRecord(e.target.value)} required>
                <option value="">Sélectionner une référence</option>
                {assignments.data.filter(a=>!a.entity_id).map(a=><option value={a.record_id} key={a.record_id}>{a.record_id}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">Entité de rattachement
              <select className="h-10 rounded-md border border-input bg-background px-3" value={selectedEntity} onChange={e=>setSelectedEntity(e.target.value)} required>
                <option value="">Sélectionner l'entité réelle ou en projet</option>
                {drafts.data.map(e=><option value={e.id} key={e.id}>{e.legal_name} — {e.status}</option>)}
              </select>
            </label>
            {assign.isError&&<p role="alert" className="sm:col-span-2 text-sm text-destructive">Attribution non enregistrée : {(assign.error as Error).message}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={assign.isPending||!selectedEntity||!selectedRecord}>{assign.isPending?'Attribution…':'Rattacher ce dossier (sans activation)'}</Button></div>
          </form>}
        </>}
      </section>
    </CardContent>
  </Card>;
}
