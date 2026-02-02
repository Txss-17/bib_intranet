import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Circle, Clock, User } from 'lucide-react';

const newEmployees = [
  { 
    id: 1, 
    name: 'Lucas Martin', 
    pole: 'Tech', 
    position: 'Développeur Frontend', 
    startDate: '2025-02-10',
    progress: 25,
    steps: [
      { name: 'Contrat signé', done: true },
      { name: 'Matériel préparé', done: true },
      { name: 'Accès IT créés', done: false },
      { name: 'Formation initiale', done: false },
      { name: 'Présentation équipe', done: false },
    ]
  },
  { 
    id: 2, 
    name: 'Emma Leroy', 
    pole: 'Finance', 
    position: 'Contrôleur de gestion', 
    startDate: '2025-02-15',
    progress: 40,
    steps: [
      { name: 'Contrat signé', done: true },
      { name: 'Matériel préparé', done: true },
      { name: 'Accès IT créés', done: true },
      { name: 'Formation initiale', done: false },
      { name: 'Présentation équipe', done: false },
    ]
  },
  { 
    id: 3, 
    name: 'Antoine Dubois', 
    pole: 'Ops', 
    position: 'Coordinateur Logistique', 
    startDate: '2025-02-03',
    progress: 80,
    steps: [
      { name: 'Contrat signé', done: true },
      { name: 'Matériel préparé', done: true },
      { name: 'Accès IT créés', done: true },
      { name: 'Formation initiale', done: true },
      { name: 'Présentation équipe', done: false },
    ]
  },
];

export default function Onboarding() {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">Suivi des nouveaux collaborateurs</p>
        </div>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Nouveau collaborateur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newEmployees.length}</div>
            <p className="text-xs text-muted-foreground">Onboardings actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Arrivées prévues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">12</div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {newEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{employee.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{employee.pole}</Badge>
                      <span className="text-sm text-muted-foreground">{employee.position}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Début : {new Date(employee.startDate).toLocaleDateString('fr-FR')}</p>
                  <p className="text-sm text-muted-foreground">{employee.progress}% complété</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={employee.progress} className="mb-4" />
              <div className="grid grid-cols-5 gap-4">
                {employee.steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    {step.done ? (
                      <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground mb-2" />
                    )}
                    <span className={`text-xs ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
