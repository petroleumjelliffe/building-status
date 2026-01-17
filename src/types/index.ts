// Core type definitions for Building Status application

export type SystemStatus = 'ok' | 'issue' | 'down';

export type IssueStatus = 'reported' | 'investigating' | 'resolved';

export type AnnouncementType = 'warning' | 'info' | 'alert';

export interface SystemStatusData {
  id: number;
  systemId: string;
  status: SystemStatus;
  count: string | null;
  note: string | null;
  updatedAt: Date;
}

export interface Issue {
  id: number;
  category: string;
  location: string;
  icon: string | null;
  status: IssueStatus;
  detail: string;
  reportedAt: Date;
  resolvedAt: Date | null;
}

export interface Maintenance {
  id: number;
  date: string;
  description: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Announcement {
  id: number;
  type: AnnouncementType;
  message: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface Contact {
  label: string;
  phone: string;
  hours: string;
}

export interface HelpfulLink {
  title: string;
  url: string;
  icon: string;
}

export interface GarbageSchedule {
  trash: {
    days: string[];
    time?: string;
  };
  recycling: {
    days: string[];
    time?: string;
  };
  notes: string;
}

export interface Building {
  name: string;
  units: string[];
  floors: number[];
}

export interface System {
  id: string;
  name: string;
  icon: string;
  label: string;
}

// Complete page data structure
export interface StatusPageData {
  systemStatus: SystemStatusData[];
  issues: Issue[];
  maintenance: Maintenance[];
  announcements: Announcement[];
  contacts: Contact[];
  helpfulLinks: HelpfulLink[];
  garbageSchedule: GarbageSchedule;
  buildings: Record<string, Building>;
  systems: System[];
  reportEmail: string;
  lastUpdated: Date;
}

// API request/response types
export interface UpdateSystemStatusRequest {
  systemId: string;
  status: SystemStatus;
  count?: string;
  note?: string;
}

export interface CreateAnnouncementRequest {
  type: AnnouncementType;
  message: string;
  expiresAt?: string; // ISO string
}

export interface UpdateAnnouncementRequest {
  id: number;
  type?: AnnouncementType;
  message?: string;
  expiresAt?: string | null;
}

export interface AuthRequest {
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

// Issue CRUD request types
export interface CreateIssueRequest {
  password: string;
  category: string;
  location: string;
  icon?: string;
  status: IssueStatus;
  detail: string;
}

export interface UpdateIssueRequest {
  password: string;
  id: number;
  category?: string;
  location?: string;
  icon?: string;
  status?: IssueStatus;
  detail?: string;
}

export interface ResolveIssueRequest {
  password: string;
  id: number;
}

// Maintenance CRUD request types
export interface CreateMaintenanceRequest {
  password: string;
  date: string;
  description: string;
}

export interface UpdateMaintenanceRequest {
  password: string;
  id: number;
  date?: string;
  description?: string;
}

export interface CompleteMaintenanceRequest {
  password: string;
  id: number;
}
