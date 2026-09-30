import {
  Doctor,
  Hospital,
  Specialty,
  ToolCallResult,
  UrgencyLevel,
  AIHealthStatus,
  HealthResponse,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export interface ChatApiRequest {
  message: string;
  sessionId?: string;
  language?: 'en' | 'ar';
}

export interface ChatApiResponse {
  sessionId: string;
  message: string;
  toolsUsed: ToolCallResult[];
  urgencyLevel?: UrgencyLevel;
}

export const api = {
  /** Send message to AI Agent */
  async sendMessage(data: ChatApiRequest): Promise<ChatApiResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to send message to AI assistant');
    }
    return json.data;
  },

  /** Check server health */
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  /** Check AI Pool & Gemini Models Health */
  async getAIHealth(): Promise<AIHealthStatus> {
    const res = await fetch(`${API_BASE}/chat/ai-health`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('AI health check failed');
    return json.data;
  },

  /** Search doctors */
  async getDoctors(filters: {
    specialty?: string;
    city?: string;
    country?: string;
    language?: string;
    minRating?: number;
    maxFee?: number;
  } = {}): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (filters.specialty) params.append('specialty', filters.specialty);
    if (filters.city) params.append('city', filters.city);
    if (filters.country) params.append('country', filters.country);
    if (filters.language) params.append('language', filters.language);
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
    if (filters.maxFee !== undefined) params.append('maxFee', filters.maxFee.toString());

    const url = `${API_BASE}/doctors${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Failed to fetch doctors');
    return json.data;
  },

  /** Search hospitals */
  async getHospitals(filters: {
    city?: string;
    country?: string;
    specialty?: string;
    emergencyOnly?: boolean;
    minRating?: number;
  } = {}): Promise<Hospital[]> {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    if (filters.country) params.append('country', filters.country);
    if (filters.specialty) params.append('specialty', filters.specialty);
    if (filters.emergencyOnly) params.append('emergencyOnly', 'true');
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());

    const url = `${API_BASE}/hospitals${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Failed to fetch hospitals');
    return json.data;
  },

  /** Get specialties list */
  async getSpecialties(): Promise<Specialty[]> {
    const res = await fetch(`${API_BASE}/specialties`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error('Failed to fetch specialties');
    return json.data;
  },

  /** Delete / Reset session */
  async deleteSession(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: 'DELETE' });
  },
};
