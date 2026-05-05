import { Pole } from '@/types';

export const poles: Pole[] = [
  {
    id: 'direction',
    name: 'Direction',
    shortName: 'DIR',
    description: 'Executive leadership and strategic oversight',
    icon: 'Crown',
    color: 'pole-direction',
  },
  {
    id: 'finance',
    name: 'Finance',
    shortName: 'FIN',
    description: 'Accounting, cashflow, payroll, and fundraising',
    icon: 'Wallet',
    color: 'pole-finance',
  },
  {
    id: 'ops',
    name: 'Operations',
    shortName: 'OPS',
    description: 'Logistics, partners, and incident management',
    icon: 'Cog',
    color: 'pole-ops',
  },
  {
    id: 'tech',
    name: 'Technology',
    shortName: 'TECH',
    description: 'Code, infrastructure, deployments, and AI agents',
    icon: 'Code',
    color: 'pole-tech',
  },
  {
    id: 'rh',
    name: 'Human Resources',
    shortName: 'RH',
    description: 'Recruitment, onboarding, and career development',
    icon: 'Users',
    color: 'pole-rh',
  },
  {
    id: 'supplier',
    name: 'Supplier & Product',
    shortName: 'SUP',
    description: 'Supplier management and product lifecycle',
    icon: 'Package',
    color: 'pole-supplier',
  },
  {
    id: 'audit',
    name: 'Audit',
    shortName: 'AUD',
    description: 'Field and internal auditing processes',
    icon: 'ClipboardCheck',
    color: 'pole-audit',
  },
  {
    id: 'compliance',
    name: 'Compliance & Legal',
    shortName: 'LEG',
    description: 'Legal affairs and regulatory compliance',
    icon: 'Scale',
    color: 'pole-compliance',
  },
  {
    id: 'rse',
    name: 'RSE',
    shortName: 'RSE',
    description: 'Sustainability, impact, and recycling initiatives',
    icon: 'Leaf',
    color: 'pole-rse',
  },
  {
    id: 'marketing',
    name: 'Marketing & Media',
    shortName: 'MKT',
    description: 'Brand, communications, and media relations',
    icon: 'Megaphone',
    color: 'pole-marketing',
  },
  {
    id: 'lifecycle',
    name: 'User & Supplier Lifecycle',
    shortName: 'LCY',
    description: 'Onboarding, monitoring, and support',
    icon: 'RefreshCw',
    color: 'pole-lifecycle',
  },
  {
    id: 'rd',
    name: 'R&D',
    shortName: 'R&D',
    description: 'Research, product analysis, and system optimization',
    icon: 'FlaskConical',
    color: 'pole-rd',
  },
];

export const getPoleById = (id: string): Pole | undefined => {
  return poles.find(pole => pole.id === id);
};

export const getPoleColor = (id: string): string => {
  const pole = getPoleById(id);
  return pole?.color || 'pole-direction';
};
