// ─── Database Entities ────────────────────────────────────────────────────────

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
}

export interface DoctorWithDetails extends Doctor {
  specialty_name: string;
  specialty_name_ar: string;
  hospital_name: string | null;
  hospital_name_ar: string | null;
  hospital_city: string | null;
  hospital_country: string | null;
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
}

export interface HospitalWithSpecialties extends Hospital {
  specialties: Specialty[];
}

// ─── API Request / Response ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  language?: 'en' | 'ar';
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  toolsUsed: ToolCallResult[];
  urgencyLevel?: UrgencyLevel;
}

// ─── AI / Agent ───────────────────────────────────────────────────────────────

export interface GeminiKeyConfig {
  key: string;
  failureCount: number;
  lastFailure: number | null;
  cooldownUntil: number | null;
}

export interface GeminiModelConfig {
  name: string;
  priority: number; // lower = higher priority
  cooldownUntil?: number | null;
}

export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'self_care';

export interface UrgencyAssessment {
  level: UrgencyLevel;
  reasoning: string;
  recommended_action: string;
  recommended_action_ar: string;
}

export interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
  toolCalls?: ToolCallResult[];
  timestamp: number;
}

export interface Session {
  id: string;
  messages: ConversationMessage[];
  language: 'en' | 'ar';
  createdAt: number;
  lastActivity: number;
  urgencyLevel?: UrgencyLevel;
}

// ─── Search Filters ───────────────────────────────────────────────────────────

export interface DoctorSearchFilters {
  specialty?: string;
  city?: string;
  country?: string;
  language?: string;
  minRating?: number;
  maxFee?: number;
  limit?: number;
}

export interface HospitalSearchFilters {
  city?: string;
  country?: string;
  specialty?: string;
  emergencyOnly?: boolean;
  minRating?: number;
  limit?: number;
}
