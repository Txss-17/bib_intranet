import {
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HrRecordsPage, HrRecordsConfig } from '@/components/rh/HrRecordsPage';

const needs: HrRecordsConfig = {
  table: 'hr_recruitment_needs',
  title: 'Besoins de recrutement',
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
    { key: 'recruiter_id', label: 'Responsable', type: 'employee' },
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
  title: 'Candidatures',
  itemLabel: 'Candidature',
  orderBy: 'created_at',
  searchKeys: ['full_name', 'email', 'position_key', 'source'],
  fields: [
    { key: 'full_name', label: 'Candidat', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'position_key', label: 'Poste', type: 'position', required: true },
    { key: 'source', label: 'Source', type: 'select', options: [
      { value: 'linkedin', label: 'LinkedIn' }, { value: 'referral', label: 'Cooptation' }, { value: 'website', label: 'Site BIB' },
      { value: 'school', label: 'École' }, { value: 'other', label: 'Autre' } ] },
    { key: 'owner_id', label: 'Responsable', type: 'employee' },
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
    <Tabs defaultValue="needs" className="space-y-4">
      <TabsList>
        <TabsTrigger value="needs">Besoins</TabsTrigger>
        <TabsTrigger value="candidates">Candidatures & pipeline</TabsTrigger>
      </TabsList>
      <TabsContent value="needs"><HrRecordsPage config={needs} /></TabsContent>
      <TabsContent value="candidates"><HrRecordsPage config={candidates} /></TabsContent>
    </Tabs>
  );
}
