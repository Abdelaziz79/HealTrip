export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'self_care';

export interface Specialty {
  id: number;
  name: string;
  name_ar: string;
  description: string | null;
}

export interface DoctorAvailability {
  days: string[];
  hours: string;
}

export interface Doctor {
  id: number;
  name: string;
  name_ar: string | null;
  specialty_id: number;
  hospital_id: number | null;
  experience_years: number;
  rating: number;
  languages: string[] | string;
  availability: DoctorAvailability | string;
  consultation_fee: number;
  bio: string | null;
  bio_ar: string | null;
  specialty_name?: string;
  specialty_name_ar?: string;
  hospital_name?: string | null;
  hospital_name_ar?: string | null;
  hospital_city?: string | null;
  hospital_country?: string | null;
}

export interface Hospital {
  id: number;
  name: string;
  name_ar: string | null;
  city: string;
  country: string;
  address: string | null;
  rating: number;
  phone: string | null;
  emergency_available: number | boolean;
  website: string | null;
  description: string | null;
  description_ar: string | null;
  specialties?: Specialty[];
}

export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolsUsed?: ToolCallResult[];
  urgencyLevel?: UrgencyLevel;
  error?: boolean;
  isStreaming?: boolean;
}

export interface AIHealthStatus {
  totalKeys: number;
  availableKeys: number;
  models: string[];
  keys: Array<{
    index: number;
    failureCount: number;
    inCooldown: boolean;
    cooldownRemainingMs: number | null;
  }>;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
}
