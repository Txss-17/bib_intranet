// Shared employee data & types for RH module

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'contrat' | 'identite' | 'diplome' | 'medical' | 'administratif' | 'autre';
  uploadDate: string;
  expiryDate?: string;
  size: string;
  uploadedBy: string;
}

export interface EmployeeNote {
  id: string;
  date: string;
  author: string;
  type: 'general' | 'performance' | 'disciplinary' | 'medical' | 'formation';
  content: string;
}

export interface EmployeeEvent {
  id: string;
  date: string;
  type: 'contract' | 'evaluation' | 'absence' | 'formation' | 'promotion' | 'warning' | 'document';
  label: string;
}

export interface EmployeeFile {
  id: string;
  name: string;
  email: string;
  phone: string;
  pole: string;
  position: string;
  status: 'active' | 'leave' | 'probation' | 'suspended';
  startDate: string;
  contractType: 'CDI' | 'CDD' | 'Stage' | 'Alternance';
  contractEnd?: string;
  manager: string;
  evaluationScore?: number;
  lastEvaluation?: string;
  absenceDays: number;
  warnings: number;
  documents: number;
  employeeDocuments: EmployeeDocument[];
  notes: EmployeeNote[];
  events: EmployeeEvent[];
}

export const initialEmployees: EmployeeFile[] = [
  {
    id: '1', name: 'Sophie Martin', email: 'sophie.martin@linksy-group.com', phone: '+33 6 12 34 56 78',
    pole: 'Finance', position: 'Finance Manager', status: 'active', startDate: '2022-03-15',
    contractType: 'CDI', manager: 'Alexandre Dupont', evaluationScore: 4.2, lastEvaluation: '2025-12-01',
    absenceDays: 3, warnings: 0, documents: 12,
    employeeDocuments: [
      { id: 'd1', name: 'CDI_Sophie_Martin.pdf', type: 'contrat', uploadDate: '2022-03-15', size: '245 Ko', uploadedBy: 'RH' },
      { id: 'd2', name: 'CNI_Sophie_Martin.pdf', type: 'identite', uploadDate: '2022-03-10', expiryDate: '2026-04-05', size: '1.2 Mo', uploadedBy: 'RH' },
      { id: 'd3', name: 'Diplome_Master_Finance.pdf', type: 'diplome', uploadDate: '2022-03-10', size: '890 Ko', uploadedBy: 'RH' },
      { id: 'd4', name: 'Avenant_promotion_2024.pdf', type: 'contrat', uploadDate: '2024-06-01', size: '180 Ko', uploadedBy: 'RH' },
      { id: 'd5', name: 'Attestation_SS.pdf', type: 'administratif', uploadDate: '2022-03-10', size: '320 Ko', uploadedBy: 'Sophie Martin' },
      { id: 'd5b', name: 'Visite_medicale_2025.pdf', type: 'medical', uploadDate: '2025-03-20', expiryDate: '2026-03-25', size: '150 Ko', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n1', date: '2026-02-15', author: 'RH', type: 'performance', content: 'Excellente gestion du closing Q4. Propose pour prime exceptionnelle.' },
      { id: 'n2', date: '2025-12-01', author: 'Alexandre Dupont', type: 'general', content: 'Entretien annuel positif. Objectifs 2026 validés.' },
    ],
    events: [
      { id: 'e1', date: '2026-02-15', type: 'evaluation', label: 'Revue mi-parcours Q1' },
      { id: 'e2', date: '2025-12-01', type: 'evaluation', label: 'Entretien annuel 2025' },
      { id: 'e3', date: '2025-09-10', type: 'formation', label: 'Formation IFRS 17' },
      { id: 'e4', date: '2022-03-15', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '2', name: 'Lucas Bernard', email: 'lucas.bernard@linksy-group.com', phone: '+33 6 23 45 67 89',
    pole: 'Tech', position: 'Développeur Senior', status: 'active', startDate: '2021-09-01',
    contractType: 'CDI', manager: 'Julien Moreau', evaluationScore: 3.8, lastEvaluation: '2025-12-05',
    absenceDays: 7, warnings: 0, documents: 9,
    employeeDocuments: [
      { id: 'd6', name: 'CDI_Lucas_Bernard.pdf', type: 'contrat', uploadDate: '2021-09-01', size: '230 Ko', uploadedBy: 'RH' },
      { id: 'd7', name: 'Passeport_Lucas_Bernard.pdf', type: 'identite', uploadDate: '2021-08-25', expiryDate: '2028-11-10', size: '1.5 Mo', uploadedBy: 'RH' },
      { id: 'd8', name: 'Certification_AWS.pdf', type: 'diplome', uploadDate: '2025-11-15', size: '450 Ko', uploadedBy: 'Lucas Bernard' },
    ],
    notes: [
      { id: 'n3', date: '2026-01-20', author: 'Julien Moreau', type: 'performance', content: 'Contribution majeure au projet de migration API. Très bonne autonomie.' },
    ],
    events: [
      { id: 'e5', date: '2026-01-20', type: 'evaluation', label: 'Point projet migration' },
      { id: 'e6', date: '2025-11-15', type: 'formation', label: 'Certification AWS Solutions Architect' },
      { id: 'e7', date: '2025-06-01', type: 'promotion', label: 'Promotion Développeur Senior' },
      { id: 'e8', date: '2021-09-01', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '3', name: 'Émilie Rousseau', email: 'emilie.rousseau@linksy-group.com', phone: '+33 6 34 56 78 90',
    pole: 'Ops', position: 'Responsable Logistique', status: 'active', startDate: '2023-01-10',
    contractType: 'CDI', manager: 'Nadia Benzema', evaluationScore: 3.5, lastEvaluation: '2025-11-20',
    absenceDays: 12, warnings: 1, documents: 15,
    employeeDocuments: [
      { id: 'd9', name: 'CDI_Emilie_Rousseau.pdf', type: 'contrat', uploadDate: '2023-01-10', size: '240 Ko', uploadedBy: 'RH' },
      { id: 'd10', name: 'CNI_Emilie_Rousseau.pdf', type: 'identite', uploadDate: '2023-01-05', expiryDate: '2026-04-15', size: '1.1 Mo', uploadedBy: 'RH' },
      { id: 'd11', name: 'Certificat_medical_aptitude.pdf', type: 'medical', uploadDate: '2025-08-01', expiryDate: '2026-08-01', size: '150 Ko', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n4', date: '2026-03-01', author: 'RH', type: 'disciplinary', content: 'Avertissement écrit suite à 3 retards consécutifs en février.' },
      { id: 'n5', date: '2025-11-20', author: 'Nadia Benzema', type: 'performance', content: 'Bonne gestion du pic de Noël. Points à améliorer sur le reporting.' },
    ],
    events: [
      { id: 'e9', date: '2026-03-01', type: 'warning', label: 'Avertissement retards' },
      { id: 'e10', date: '2025-11-20', type: 'evaluation', label: 'Entretien annuel 2025' },
      { id: 'e11', date: '2025-08-01', type: 'absence', label: 'Congé maladie (5j)' },
      { id: 'e12', date: '2023-01-10', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '4', name: 'Karim Hadj', email: 'karim.hadj@linksy-group.com', phone: '+33 6 45 67 89 01',
    pole: 'Marketing', position: 'Chargé de communication', status: 'probation', startDate: '2025-11-01',
    contractType: 'CDD', contractEnd: '2026-04-30', manager: 'Claire Fontaine', evaluationScore: undefined,
    lastEvaluation: undefined, absenceDays: 1, warnings: 0, documents: 5,
    employeeDocuments: [
      { id: 'd12', name: 'CDD_Karim_Hadj.pdf', type: 'contrat', uploadDate: '2025-11-01', size: '210 Ko', uploadedBy: 'RH' },
      { id: 'd13', name: 'CNI_Karim_Hadj.pdf', type: 'identite', uploadDate: '2025-10-28', expiryDate: '2031-07-12', size: '1.3 Mo', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n6', date: '2026-02-01', author: 'Claire Fontaine', type: 'general', content: 'Fin de période d\'essai prévue le 01/05. Bilan intermédiaire positif.' },
    ],
    events: [
      { id: 'e13', date: '2026-02-01', type: 'evaluation', label: 'Bilan mi-période essai' },
      { id: 'e14', date: '2025-11-01', type: 'contract', label: 'Signature CDD 6 mois' },
    ],
  },
  {
    id: '5', name: 'Julie Petit', email: 'julie.petit@linksy-group.com', phone: '+33 6 56 78 90 12',
    pole: 'RH', position: 'Chargée de recrutement', status: 'leave', startDate: '2020-06-15',
    contractType: 'CDI', manager: 'Marc Lefèvre', evaluationScore: 4.0, lastEvaluation: '2025-12-10',
    absenceDays: 45, warnings: 0, documents: 18,
    employeeDocuments: [
      { id: 'd14', name: 'CDI_Julie_Petit.pdf', type: 'contrat', uploadDate: '2020-06-15', size: '220 Ko', uploadedBy: 'RH' },
      { id: 'd15', name: 'Passeport_Julie_Petit.pdf', type: 'identite', uploadDate: '2020-06-10', expiryDate: '2026-05-10', size: '1.4 Mo', uploadedBy: 'RH' },
      { id: 'd16', name: 'Certificat_grossesse.pdf', type: 'medical', uploadDate: '2025-12-20', expiryDate: '2026-06-20', size: '180 Ko', uploadedBy: 'Julie Petit' },
      { id: 'd17', name: 'Avenant_promotion_senior.pdf', type: 'contrat', uploadDate: '2023-06-15', size: '195 Ko', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n7', date: '2026-01-15', author: 'RH', type: 'medical', content: 'Congé maternité du 15/01 au 15/07/2026. Remplacement assuré par intérim.' },
    ],
    events: [
      { id: 'e15', date: '2026-01-15', type: 'absence', label: 'Début congé maternité' },
      { id: 'e16', date: '2025-12-10', type: 'evaluation', label: 'Entretien annuel 2025' },
      { id: 'e17', date: '2025-03-01', type: 'formation', label: 'Formation droit social 2025' },
      { id: 'e18', date: '2023-06-15', type: 'promotion', label: 'Promotion Chargée Senior' },
      { id: 'e19', date: '2020-06-15', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '6', name: 'Thomas Girard', email: 'thomas.girard@linksy-group.com', phone: '+33 6 67 89 01 23',
    pole: 'Supplier', position: 'Acheteur', status: 'active', startDate: '2024-02-01',
    contractType: 'CDI', manager: 'Marie Dubois', evaluationScore: 3.2, lastEvaluation: '2025-12-08',
    absenceDays: 5, warnings: 0, documents: 8,
    employeeDocuments: [
      { id: 'd18', name: 'CDI_Thomas_Girard.pdf', type: 'contrat', uploadDate: '2024-02-01', size: '235 Ko', uploadedBy: 'RH' },
      { id: 'd19', name: 'CNI_Thomas_Girard.pdf', type: 'identite', uploadDate: '2024-01-28', expiryDate: '2032-01-15', size: '1.2 Mo', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n8', date: '2025-12-08', author: 'Marie Dubois', type: 'performance', content: 'Progrès notables sur la négociation fournisseurs. Formation recommandée en analyse financière.' },
    ],
    events: [
      { id: 'e20', date: '2025-12-08', type: 'evaluation', label: 'Entretien annuel 2025' },
      { id: 'e21', date: '2025-04-15', type: 'formation', label: 'Formation sourcing international' },
      { id: 'e22', date: '2024-02-01', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '7', name: 'Amira Belkacem', email: 'amira.belkacem@linksy-group.com', phone: '+33 6 78 90 12 34',
    pole: 'Compliance', position: 'Juriste', status: 'active', startDate: '2023-09-01',
    contractType: 'CDI', manager: 'Philippe Renard', evaluationScore: 4.5, lastEvaluation: '2025-12-12',
    absenceDays: 2, warnings: 0, documents: 22,
    employeeDocuments: [
      { id: 'd20', name: 'CDI_Amira_Belkacem.pdf', type: 'contrat', uploadDate: '2023-09-01', size: '240 Ko', uploadedBy: 'RH' },
      { id: 'd21', name: 'Passeport_Amira_Belkacem.pdf', type: 'identite', uploadDate: '2023-08-28', expiryDate: '2029-06-20', size: '1.5 Mo', uploadedBy: 'RH' },
      { id: 'd22', name: 'Certification_DPO.pdf', type: 'diplome', uploadDate: '2025-05-20', size: '520 Ko', uploadedBy: 'Amira Belkacem' },
      { id: 'd23', name: 'Master_Droit_International.pdf', type: 'diplome', uploadDate: '2023-08-28', size: '780 Ko', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n9', date: '2026-03-10', author: 'Philippe Renard', type: 'performance', content: 'Pilotage exemplaire du dossier RGPD. Candidate pour le poste de Responsable Compliance adjoint.' },
    ],
    events: [
      { id: 'e23', date: '2026-03-10', type: 'evaluation', label: 'Revue trimestrielle Q1' },
      { id: 'e24', date: '2025-12-12', type: 'evaluation', label: 'Entretien annuel 2025' },
      { id: 'e25', date: '2025-05-20', type: 'formation', label: 'Certification DPO' },
      { id: 'e26', date: '2023-09-01', type: 'contract', label: 'Signature CDI' },
    ],
  },
  {
    id: '8', name: 'Nicolas Faure', email: 'nicolas.faure@linksy-group.com', phone: '+33 6 89 01 23 45',
    pole: 'Tech', position: 'Stagiaire Développeur', status: 'active', startDate: '2026-01-15',
    contractType: 'Stage', contractEnd: '2026-07-15', manager: 'Julien Moreau', evaluationScore: undefined,
    lastEvaluation: undefined, absenceDays: 0, warnings: 0, documents: 3,
    employeeDocuments: [
      { id: 'd24', name: 'Convention_stage_Nicolas_Faure.pdf', type: 'contrat', uploadDate: '2026-01-15', size: '310 Ko', uploadedBy: 'RH' },
      { id: 'd25', name: 'CNI_Nicolas_Faure.pdf', type: 'identite', uploadDate: '2026-01-10', expiryDate: '2033-04-08', size: '1.1 Mo', uploadedBy: 'RH' },
    ],
    notes: [
      { id: 'n10', date: '2026-03-15', author: 'Julien Moreau', type: 'general', content: 'Bonne intégration. Montée en compétence rapide sur React et TypeScript.' },
    ],
    events: [
      { id: 'e27', date: '2026-03-15', type: 'evaluation', label: 'Point mi-stage' },
      { id: 'e28', date: '2026-01-15', type: 'contract', label: 'Début convention de stage' },
    ],
  },
];
