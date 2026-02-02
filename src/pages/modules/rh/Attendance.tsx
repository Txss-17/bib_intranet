import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Clock, Calendar, Users } from 'lucide-react';

const attendanceData = [
  { id: 1, name: 'Marie Dupont', checkIn: '08:45', checkOut: '17:30', status: 'present', hours: 8.75 },
  { id: 2, name: 'Jean Martin', checkIn: '09:00', checkOut: '18:00', status: 'present', hours: 9 },
  { id: 3, name: 'Sophie Bernard', checkIn: '08:30', checkOut: '-', status: 'present', hours: null },
  { id: 4, name: 'Pierre Durand', checkIn: '-', checkOut: '-', status: 'leave', hours: null },
  { id: 5, name: 'Claire Moreau', checkIn: '-', checkOut: '-', status: 'remote', hours: 8 },
  { id: 6, name: 'Thomas Petit', checkIn: '09:15', checkOut: '17:45', status: 'present', hours: 8.5 },
  { id: 7, name: 'Julie Lefebvre', checkIn: '-', checkOut: '-', status: 'absent', hours: null },
];

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredData = attendanceData.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-green-500/10 text-green-500">Présent</Badge>;
      case 'remote': return <Badge className="bg-blue-500/10 text-blue-500">Télétravail</Badge>;
      case 'leave': return <Badge className="bg-yellow-500/10 text-yellow-500">Congé</Badge>;
      case 'absent': return <Badge variant="destructive">Absent</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const presentCount = attendanceData.filter(a => a.status === 'present').length;
  const remoteCount = attendanceData.filter(a => a.status === 'remote').length;
  const absentCount = attendanceData.filter(a => a.status === 'absent' || a.status === 'leave').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pointage</h1>
        <p className="text-muted-foreground">Suivi des présences et heures travaillées</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{presentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Télétravail</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{remoteCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absents/Congés</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{absentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures moyennes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4h</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pointage du {new Date(selectedDate).toLocaleDateString('fr-FR')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Arrivée</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(record.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{record.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{record.checkIn}</TableCell>
                  <TableCell>{record.checkOut}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{record.hours ? `${record.hours}h` : '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Modifier</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
