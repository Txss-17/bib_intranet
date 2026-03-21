export type PoleId = 
  | 'direction'
  | 'finance'
  | 'ops'
  | 'tech'
  | 'rh'
  | 'supplier'
  | 'audit'
  | 'compliance'
  | 'rse'
  | 'marketing'
  | 'risk'
  | 'lifecycle'
  | 'rd';

export interface Pole {
  id: PoleId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  poles: PoleId[];
  avatarUrl?: string;
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  joinedAt: string;
}

export type UserRole = 
  | 'admin'
  | 'executive'
  | 'manager'
  | 'analyst'
  | 'operator'
  | 'viewer';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  poleId?: PoleId;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  poleId: PoleId;
  assigneeId: string;
  dueDate: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  poleId?: PoleId;
  title: string;
  content: string;
  type: 'announcement' | 'update' | 'policy' | 'achievement';
  visibility: 'company' | 'pole' | 'restricted';
  createdAt: string;
  reactions: number;
  comments: number;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'policy' | 'report' | 'procedure' | 'template';
  poleId: PoleId;
  version: string;
  lastModified: string;
  modifiedBy: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  accessLevel: 'public' | 'restricted' | 'confidential';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  poleId?: PoleId;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface Metric {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  unit?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  poleId: PoleId;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}
