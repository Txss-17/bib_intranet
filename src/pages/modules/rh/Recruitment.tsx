import {
  useMemo,
  useState,
} from 'react';
import { ExternalLink } from 'lucide-react';
import TalentPlatformInbox from '@/components/rh/TalentPlatformInbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HrRecordsPage, HrRecordsConfig } from '@/components/rh/HrRecordsPage';

const needs: HrRecordsConfig = {
  table: 'hr_recruitment_needs',
  title: 'Postes à pourvoir',
  itemLabel: 'Besoin de recrutement',
  orderBy: 'created_at',
  dateKey: 'desired_date',
  searchKeys: ['position_key', 'pole_id', 'contract_type'],
  fields: [
    { key: 'position_key', label: 'Poste', type: 'position', required: true },
    { key: 'pole_id', label: 'Pôle', type: 'pole', required: true },
    { key: 'contract_type', label: 'Contrat', type: 'select', options: [
      { value: 'cdi', label: 'CDI' }, { value: 'cdd', label: 'CDD' }, { value: 'freelance', label: 'Prestataire' },
      { value: 'alternance', label: 'Alternance' }, { value: 'stage', label: 'Stage' } ] },
    { key: 'priority', label: 'Priorité', type: 'select', defaultValue: 'medium', options: [
      { value: 'low', label: 'Basse' }, { value: 'medium', label: 'Moyenne' }, { value: 'high', label: 'Haute' }, { value: 'critical', label: 'Critique' } ] },
    { key: 'desired_date', label: 'Date souhaitée', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', inTable: false },
  ],
  statuses: [
    { value: 'open', label: 'Ouvert', tone: 'outline' },
    { value: 'in_progress', label: 'En cours', tone: 'secondary' },
    { value: 'filled', label: 'Pourvu', tone: 'default' },
    { value: 'cancelled', label: 'Annulé', tone: 'destructive' },
  ],
  transitions: { open: ['in_progress', 'cancelled'], in_progress: ['filled', 'cancelled'] },
};

const candidates: HrRecordsConfig = {
  table: 'hr_candidates',
  title: 'Candidats externes et candidatures',
  itemLabel: 'Candidature',
  orderBy: 'created_at',
  searchKeys: ['full_name', 'email', 'position_key', 'source'],
  fields: [
    { key: 'full_name', label: 'Nom complet du candidat (nouvelle personne)', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'position_key', label: 'Poste', type: 'position', required: true },
    { key: 'source', label: 'Source', type: 'select', options: [
      { value: 'bib_talent', label: 'Carrières BIB · import historique Platform' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'referral', label: 'Cooptation' }, { value: 'website', label: 'Site BIB' },
      { value: 'school', label: 'École' }, { value: 'other', label: 'Autre' } ] },
    { key: 'next_step', label: 'Prochaine étape', type: 'text' },
  ],
  statuses: [
    { value: 'new', label: 'Nouveau', tone: 'outline' },
    { value: 'screening', label: 'Présélection', tone: 'secondary' },
    { value: 'interview', label: 'Entretien', tone: 'secondary' },
    { value: 'validation', label: 'Validation', tone: 'secondary' },
    { value: 'offer', label: 'Proposition', tone: 'secondary' },
    { value: 'accepted', label: 'Accepté', tone: 'default' },
    { value: 'rejected', label: 'Refusé', tone: 'destructive' },
    { value: 'archived', label: 'Archivé', tone: 'outline' },
  ],
  transitions: {
    new: ['screening', 'rejected'], screening: ['interview', 'rejected'], interview: ['validation', 'rejected'],
    validation: ['offer', 'rejected'], offer: ['accepted', 'rejected'], accepted: ['archived'], rejected: ['archived'],
  },
};

export default function Recruitment() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Recrutement BIB — source officielle Platform</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Les nouvelles candidatures sont déposées sur la page Carrières de BIB Platform, et non sur l’ancienne page BIB Talent. Le registre « Réception Carrières BIB » reçoit les dossiers par un import sécurisé réservé aux RH habilités. Le nom technique historique de l’import reste inchangé.</p>
          <p>Parcours : dépôt sur la plateforme → import RH → examen et rapprochement → pipeline de recrutement → décision RH → onboarding sur invitation nominative uniquement.</p>
          <p className="text-muted-foreground">La synchronisation doit être configurée sur les deux serveurs. Un dossier non visible ne signifie pas nécessairement qu'aucune candidature n'a été reçue. Les anciens documents Drive sont des archives historiques, à traiter séparément.</p>
          <p className="text-muted-foreground">Aucun compte Intranet, contrat ni accès opérationnel n'est attribué automatiquement aux candidats. Le statut légal de toute collaboration doit être validé préalablement.</p>
          <Button variant="outline" asChild>
            <a href="https://bib-talent.lovable.app/carrieres" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Voir les offres Carrières</a>
          </Button>
        </CardContent>
      </Card>
      <TalentPlatformInbox />
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-semibold">Recruter une nouvelle personne</p>
          <p>Après l'examen d'un dossier Carrières, vérifiez les éventuels doublons par email avant de qualifier ou créer un candidat dans « Candidatures & pipeline ». Les dossiers reçus et le pipeline sont deux registres distincts tant qu'aucun rapprochement RH explicite n'a été validé.</p>
          <p className="text-muted-foreground">La sélection d'un collaborateur existant concerne uniquement l'attribution interne d'un dossier ou une mutation RH, pas l'inscription d'un candidat. Un compte intranet n'est créé qu'après acceptation et validation RH, depuis l'Onboarding.</p>
        </CardContent>
      </Card>
      <Tabs defaultValue="candidates" className="space-y-4">
      <TabsList>
        <TabsTrigger value="needs">Besoins</TabsTrigger>
        <TabsTrigger value="candidates">Candidatures & pipeline</TabsTrigger>
      </TabsList>
      <TabsContent value="needs"><HrRecordsPage config={needs} /></TabsContent>
      <TabsContent value="candidates"><HrRecordsPage config={candidates} /></TabsContent>
      </Tabs>
    </div>
  );
}
