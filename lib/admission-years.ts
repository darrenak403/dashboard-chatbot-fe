import { API_ENDPOINTS } from './constants';
import { authService } from './auth';

export interface AdmissionYear {
  year: number;
  label: string;
  is_active: boolean;
  created_at: string;
}

function getAuthHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseError(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.message === 'string') return data.message;
  if (data.error && typeof data.error === 'object' && data.error !== null) {
    const err = data.error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
  }
  return fallback;
}

export const admissionYearsService = {
  async list(): Promise<{ data: AdmissionYear[] }> {
    const res = await fetch(API_ENDPOINTS.ADMISSION_YEARS, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(parseError(data, `HTTP ${res.status}`));
    return data;
  },

  async create(body: { year: number; label?: string; is_active?: boolean }): Promise<{ data: AdmissionYear }> {
    const res = await fetch(API_ENDPOINTS.ADMISSION_YEARS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseError(data, `HTTP ${res.status}`));
    return data;
  },

  async update(year: number, body: { label?: string; is_active?: boolean }): Promise<{ data: AdmissionYear }> {
    const res = await fetch(`${API_ENDPOINTS.ADMISSION_YEARS}/${year}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseError(data, `HTTP ${res.status}`));
    return data;
  },

  async remove(year: number): Promise<{ message: string }> {
    const res = await fetch(`${API_ENDPOINTS.ADMISSION_YEARS}/${year}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseError(data, `HTTP ${res.status}`));
    return data;
  },
};
