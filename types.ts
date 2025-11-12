
export enum UserRole {
  BASIC = 'Nivel Básico',
  STANDARD = 'Estándar',
  PRO = 'Nivel Pro',
  COLLABORATOR = 'Colaborador',
  ADMINISTRATOR = 'Administrador',
}

export enum TaskComplexity {
  SIMPLE = 'Simple',
  MEDIUM = 'Media',
  COMPLEX = 'Compleja',
}

export enum TaskPriority {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja',
}

export enum TaskCategory {
    HOME = 'Hogar',
    AUTOMOTIVE = 'Automoción',
    TECHNOLOGY = 'Tecnología',
    CRAFTS = 'Manualidades',
    OTHER = 'Otro',
}

export interface AuthUser {
  email: string;
  role: UserRole;
  remainingGenerations: number | typeof Infinity;
}

export interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string; 
  videoUrl?: string;
}

export interface OnlineResource {
  title: string;
  url: string;
}

export enum GuideStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobada',
  REJECTED = 'Rechazada',
}

export interface GroundingSource {
    title: string;
    url: string;
}

export interface GeneratedProcess {
  id: number;
  taskTitle: string;
  priority: TaskPriority;
  category: TaskCategory;
  safetyWarnings: string[];
  requiredTools: string[];
  steps: ProcessStep[];
  onlineResources: OnlineResource[];
  author?: 'IA' | 'Colaborador';
  authorEmail?: string;
  status?: GuideStatus;
  groundingSources?: GroundingSource[];
  moderatorFeedback?: string;
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}