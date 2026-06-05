import { API_ENDPOINTS } from './constants';
import { authService } from './auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaqTopic {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface FaqSubTopic {
  id: string;
  topic_id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  topic?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export type QuestionStatus =
  | 'new'
  | 'approved'
  | 'rejected'
  | 'deleted';

export interface FaqQuestion {
  id: string;
  code: string;
  sub_topic_id: string;
  content: string;
  status: QuestionStatus;
  rejection_reason?: string;
  sub_topic?: { id: string; name: string; topic?: { id: string; name: string } };
  created_at: string;
  updated_at: string;
}

export type AnswerStatus =
  | 'new'
  | 'approved'
  | 'rejected'
  | 'deleted';

export interface FaqAnswer {
  id: string;
  question_id: string;
  content: string;
  version: number;
  status: AnswerStatus;
  tags: string[];
  keywords: string[];
  synonyms: string[];
  campus_ids: string[];
  applies_to_all_campuses?: boolean;
  campuses?: { id: string; name: string; code: string }[];
  question?: { id: string; content: string };
  created_at: string;
  updated_at: string;
}

export type CollectionStatus = 'draft' | 'published' | 'archived';

export interface FaqCollectionItem {
  id: string;
  collection_id: string;
  question_id: string;
  order_index: number;
  question?: FaqQuestion;
}

export interface FaqCollection {
  id: string;
  name: string;
  description: string;
  admission_year: number;
  status: CollectionStatus;
  items?: FaqCollectionItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const QUESTION_STATUS_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  new: ['approved', 'rejected'],
  approved: ['deleted'],
  rejected: ['new'],
  deleted: [],
};

export const ANSWER_STATUS_TRANSITIONS: Record<AnswerStatus, AnswerStatus[]> = {
  new: ['approved', 'rejected'],
  approved: ['deleted'],
  rejected: ['new'],
  deleted: [],
};

export const COLLECTION_STATUS_TRANSITIONS: Record<CollectionStatus, CollectionStatus[]> = {
  draft: ['published'],
  published: ['archived'],
  archived: ['draft'],
};

export const STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  deleted: 'Đã xóa',
  published: 'Đã xuất bản',
  draft: 'Bản nháp',
  archived: 'Lưu trữ',
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  deleted: 'bg-gray-200 text-gray-500',
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-700',
  archived: 'bg-purple-100 text-purple-700',
};

// ─── Service ──────────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: getAuthHeaders(),
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export const faqTopicsService = {
  list(params?: { limit?: number; offset?: number; search?: string; is_active?: boolean }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.search) q.set('search', params.search);
    if (params?.is_active != null) q.set('is_active', String(params.is_active));
    return request<PaginatedResponse<FaqTopic>>(`${API_ENDPOINTS.FAQ_TOPICS}?${q}`);
  },
  create(data: { code: string; name: string; description?: string; sort_order?: number }) {
    return request<{ data: FaqTopic }>(API_ENDPOINTS.FAQ_TOPICS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: string, data: { code?: string; name?: string; description?: string; sort_order?: number; is_active?: boolean }) {
    return request<{ data: FaqTopic }>(`${API_ENDPOINTS.FAQ_TOPICS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<{ message: string }>(`${API_ENDPOINTS.FAQ_TOPICS}/${id}`, { method: 'DELETE' });
  },
};

// ─── Sub-Topics ───────────────────────────────────────────────────────────────

export const faqSubTopicsService = {
  list(params?: { limit?: number; offset?: number; topic_id?: string }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.topic_id) q.set('topic_id', params.topic_id);
    return request<PaginatedResponse<FaqSubTopic>>(`${API_ENDPOINTS.FAQ_SUB_TOPICS}?${q}`);
  },
  listByTopic(topicId: string, params?: { limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    return request<PaginatedResponse<FaqSubTopic>>(
      `${API_ENDPOINTS.FAQ_TOPICS}/${topicId}/sub-topics?${q}`
    );
  },
  create(data: { topic_id: string; name: string; description?: string; is_active?: boolean }) {
    return request<{ data: FaqSubTopic }>(API_ENDPOINTS.FAQ_SUB_TOPICS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: string, data: { topic_id?: string; name?: string; description?: string; is_active?: boolean }) {
    return request<{ data: FaqSubTopic }>(`${API_ENDPOINTS.FAQ_SUB_TOPICS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<{ message: string }>(`${API_ENDPOINTS.FAQ_SUB_TOPICS}/${id}`, { method: 'DELETE' });
  },
};

// ─── Questions ────────────────────────────────────────────────────────────────

export const faqQuestionsService = {
  list(params?: { limit?: number; offset?: number; sub_topic_id?: string; topic_id?: string; status?: string; content?: string; code?: string }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.sub_topic_id) q.set('sub_topic_id', params.sub_topic_id);
    if (params?.topic_id) q.set('topic_id', params.topic_id);
    if (params?.status) q.set('status', params.status);
    if (params?.content) q.set('content', params.content);
    if (params?.code) q.set('code', params.code);
    return request<PaginatedResponse<FaqQuestion>>(`${API_ENDPOINTS.FAQ_QUESTIONS}?${q}`);
  },
  get(id: string) {
    return request<{ data: FaqQuestion }>(`${API_ENDPOINTS.FAQ_QUESTIONS}/${id}`);
  },
  create(data: { sub_topic_id: string; content: string }) {
    return request<{ data: FaqQuestion }>(API_ENDPOINTS.FAQ_QUESTIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: string, data: { sub_topic_id?: string; content?: string }) {
    return request<{ data: FaqQuestion }>(`${API_ENDPOINTS.FAQ_QUESTIONS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<{ message: string }>(`${API_ENDPOINTS.FAQ_QUESTIONS}/${id}`, { method: 'DELETE' });
  },
  changeStatus(id: string, status: QuestionStatus, rejection_reason?: string) {
    return request<{ data: FaqQuestion }>(`${API_ENDPOINTS.FAQ_QUESTIONS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(rejection_reason ? { rejection_reason } : {}) }),
    });
  },
};

// ─── Answers ──────────────────────────────────────────────────────────────────

export const faqAnswersService = {
  list(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    campus_id?: string;
    question_id?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.status) q.set('status', params.status);
    if (params?.campus_id) q.set('campus_id', params.campus_id);
    if (params?.question_id) q.set('question_id', params.question_id);
    return request<PaginatedResponse<FaqAnswer>>(`${API_ENDPOINTS.FAQ_ANSWERS}?${q}`);
  },
  create(data: {
    question_id: string;
    content: string;
    tags?: string[];
    keywords?: string[];
    synonyms?: string[];
  }) {
    return request<{ data: FaqAnswer }>(API_ENDPOINTS.FAQ_ANSWERS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(
    id: string,
    data: {
      question_id?: string;
      content?: string;
      tags?: string[];
      keywords?: string[];
      synonyms?: string[];
    }
  ) {
    return request<{ data: FaqAnswer }>(`${API_ENDPOINTS.FAQ_ANSWERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<{ message: string }>(`${API_ENDPOINTS.FAQ_ANSWERS}/${id}`, { method: 'DELETE' });
  },
  setCampuses(id: string, campus_ids: string[]) {
    return request<{ data: FaqAnswer }>(`${API_ENDPOINTS.FAQ_ANSWERS}/${id}/campuses`, {
      method: 'PUT',
      body: JSON.stringify({ campus_ids }),
    });
  },
  changeStatus(id: string, status: AnswerStatus, rejection_reason?: string) {
    return request<{ data: FaqAnswer }>(`${API_ENDPOINTS.FAQ_ANSWERS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(rejection_reason ? { rejection_reason } : {}) }),
    });
  },
};

// ─── Collections ──────────────────────────────────────────────────────────────

export const faqCollectionsService = {
  list(params?: { limit?: number; offset?: number; status?: string; admission_year?: number }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.status) q.set('status', params.status);
    if (params?.admission_year) q.set('admission_year', String(params.admission_year));
    return request<PaginatedResponse<FaqCollection>>(`${API_ENDPOINTS.FAQ_COLLECTIONS}?${q}`);
  },
  get(id: string) {
    return request<{ data: FaqCollection }>(`${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}`);
  },
  create(data: { name: string; description?: string; admission_year: number }) {
    return request<{ data: FaqCollection }>(API_ENDPOINTS.FAQ_COLLECTIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(
    id: string,
    data: { name?: string; description?: string; admission_year?: number }
  ) {
    return request<{ data: FaqCollection }>(`${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove(id: string) {
    return request<{ message: string }>(`${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}`, {
      method: 'DELETE',
    });
  },
  changeStatus(id: string, status: CollectionStatus) {
    return request<{ data: FaqCollection }>(`${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  addItem(collectionId: string, question_id: string) {
    return request<{ message: string; inserted: number }>(
      `${API_ENDPOINTS.FAQ_COLLECTIONS}/${collectionId}/items`,
      { method: 'POST', body: JSON.stringify({ question_ids: [question_id] }) }
    );
  },
  removeItem(collectionId: string, questionId: string) {
    return request<{ message: string }>(
      `${API_ENDPOINTS.FAQ_COLLECTIONS}/${collectionId}/items/${questionId}`,
      { method: 'DELETE' }
    );
  },
};
