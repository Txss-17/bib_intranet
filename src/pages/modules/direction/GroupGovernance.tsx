import React from 'react';
import { 
  Building, Users, Scale, FileText, Globe,
  Heart, Shield, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const governanceEntities = [
  {
    id: 'linksy-sas',
    name: 'LINKSY SAS',
    type: 'Société Opérationnelle',
    description: 'Entité principale - plateforme B2B cosmétiques',
    capital: '50,000€',
    status: 'active'
  },
  {
    id: 'linksy-foundation',
    name: 'Fondation LINKSY',
    type: 'Fondation',
    description: 'Actions RSE, éducation, impact social',
    capital: 'Dotation initiale',
    status: 'planned'
  },
];

const boardMembers = [
  { id: '1', name: 'Fondatrice', role: 'Présidente', entity: 'LINKSY SAS' },
  { id: '2', name: 'Investisseur Lead', role: 'Administrateur', entity: 'LINKSY SAS' },
  { id: '3', name: 'Expert Industrie', role: 'Conseiller', entity: 'LINKSY SAS' },
];

const legalDocuments = [
  { id: '1', name: 'Statuts LINKSY SAS', version: 'v2.1', lastUpdate: '2025-06-15' },
  { id: '2', name: 'Pacte d\'actionnaires', version: 'v1.0', lastUpdate: '2025-01-10' },
  { id: '3', name: 'Règlement intérieur', version: 'v1.2', lastUpdate: '2025-09-01' },
  { id: '4', name: 'Charte RSE', version: 'v1.0', lastUpdate: '2025-11-15' },
];

const GroupGovernance = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            Gouvernance Groupe
          </h1>
          <p className="text-muted-foreground mt-1">Structure juridique et gouvernance LINKSY</p>
        </div>
      </div>

      {/* Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {governanceEntities.map(entity => (
          <Card key={entity.id} className={entity.status === 'active' ? 'border-primary' : 'border-dashed'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {entity.type === 'Fondation' ? (
                    <Heart className="h-5 w-5 text-pink-500" />
                  ) : (
                    <Building className="h-5 w-5 text-primary" />
                  )}
                  {entity.name}
                </CardTitle>
                <Badge variant={entity.status === 'active' ? 'default' : 'outline'}>
                  {entity.status === 'active' ? 'Actif' : 'Planifié'}
                </Badge>
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

      {/* Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Conseil d'Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boardMembers.map(member => (
              <div key={member.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Badge variant="outline">{member.entity}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents Juridiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {legalDocuments.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">Mis à jour le {doc.lastUpdate}</p>
                  </div>
                </div>
                <Badge variant="outline">{doc.version}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupGovernance;
