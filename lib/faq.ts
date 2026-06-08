import { API_ENDPOINTS, MAX_PAGE_LIMIT } from './constants';
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

export interface FaqCollectionDetailAnswer {
  id: string;
  content: string;
  status: AnswerStatus;
  applies_to_all_campuses: boolean;
  campus_ids: string[];
  campus_codes: string[];
  campus_names: string[];
  tags: string[];
  keywords: string[];
  synonyms: string[];
  version: number;
}

export interface FaqCollectionDetailQuestion {
  id: string;
  code: string;
  content: string;
  status: QuestionStatus;
  sort_order: number;
  answers: FaqCollectionDetailAnswer[];
}

export interface FaqCollectionDetailSubTopic {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  questions: FaqCollectionDetailQuestion[];
}

export interface FaqCollectionDetailTopic {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  sub_topics: FaqCollectionDetailSubTopic[];
}

export interface FaqCollectionDetail {
  id: string;
  name: string;
  description: string;
  admission_year: number;
  status: CollectionStatus;
  topics: FaqCollectionDetailTopic[];
}

export function extractCollectionItemsFromDetail(detail: FaqCollectionDetail): FaqCollectionItem[] {
  const items: FaqCollectionItem[] = [];
  let order = 0;
  for (const topic of detail.topics) {
    for (const st of topic.sub_topics) {
      for (const q of st.questions) {
        items.push({
          id: q.id,
          collection_id: detail.id,
          question_id: q.id,
          order_index: q.sort_order ?? order++,
          question: {
            id: q.id,
            code: q.code,
            sub_topic_id: st.id,
            content: q.content,
            status: q.status,
            sub_topic: {
              id: st.id,
              name: st.name,
              topic: { id: topic.id, name: topic.name },
            },
            created_at: '',
            updated_at: '',
          },
        });
      }
    }
  }
  return items;
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

function capLimit(limit?: number) {
  if (limit == null) return undefined;
  return Math.min(limit, MAX_PAGE_LIMIT);
}

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
    const msg =
      (typeof data?.error === 'object' && data?.error?.message) ||
      (typeof data?.message === 'string' && data.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export const faqTopicsService = {
  list(params?: { limit?: number; offset?: number; search?: string; is_active?: boolean; admission_year?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.search) q.set('search', params.search);
    if (params?.is_active != null) q.set('is_active', String(params.is_active));
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
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
  list(params?: { limit?: number; offset?: number; topic_id?: string; admission_year?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.topic_id) q.set('topic_id', params.topic_id);
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
    return request<PaginatedResponse<FaqSubTopic>>(`${API_ENDPOINTS.FAQ_SUB_TOPICS}?${q}`);
  },
  listByTopic(topicId: string, params?: { limit?: number; offset?: number; admission_year?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
    return request<PaginatedResponse<FaqSubTopic>>(
      `${API_ENDPOINTS.FAQ_TOPICS}/${topicId}/sub-topics?${q}`
    );
  },
  create(data: { topic_id: string; code: string; name: string; description?: string; is_active?: boolean; sort_order?: number }) {
    return request<{ data: FaqSubTopic }>(API_ENDPOINTS.FAQ_SUB_TOPICS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id: string, data: { topic_id?: string; code?: string; name?: string; description?: string; is_active?: boolean; sort_order?: number }) {
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
  list(params?: { limit?: number; offset?: number; sub_topic_id?: string; topic_id?: string; status?: string; content?: string; code?: string; admission_year?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.sub_topic_id) q.set('sub_topic_id', params.sub_topic_id);
    if (params?.topic_id) q.set('topic_id', params.topic_id);
    if (params?.status) q.set('status', params.status);
    if (params?.content) q.set('content', params.content);
    if (params?.code) q.set('code', params.code);
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
    return request<PaginatedResponse<FaqQuestion>>(`${API_ENDPOINTS.FAQ_QUESTIONS}?${q}`);
  },
  get(id: string) {
    return request<{ data: FaqQuestion }>(`${API_ENDPOINTS.FAQ_QUESTIONS}/${id}`);
  },
  listAnswers(questionId: string, params?: { limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const qs = q.toString();
    return request<PaginatedResponse<FaqAnswer>>(
      `${API_ENDPOINTS.FAQ_QUESTIONS}/${questionId}/answers${qs ? `?${qs}` : ''}`
    );
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
    admission_year?: number;
  }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.status) q.set('status', params.status);
    if (params?.campus_id) q.set('campus_id', params.campus_id);
    if (params?.question_id) q.set('question_id', params.question_id);
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
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

const FAQ_COLLECTION_EXCEL_EXPORT_ERROR =
  'Không thể xuất file Excel. Vui lòng thử lại.';

function getDownloadFileName(response: Response): string | null {
  const disposition = response.headers.get('Content-Disposition');
  if (!disposition) return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() ?? null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadFaqCollectionFile(blob: Blob, filename: string) {
  triggerBlobDownload(blob, filename);
}

export async function downloadFaqCollectionExcel(collectionId: string): Promise<void> {
  const token = authService.getToken();
  const res = await fetch(
    `${API_ENDPOINTS.FAQ_COLLECTIONS}/${collectionId}/export.xls`,
    {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!res.ok) {
    throw new Error(FAQ_COLLECTION_EXCEL_EXPORT_ERROR);
  }

  const blob = await res.blob();
  const filename = getDownloadFileName(res) ?? 'faq-collection.xls';
  triggerBlobDownload(blob, filename);
}

async function fetchCollectionMdExport(
  id: string
): Promise<{ blob: Blob; filename: string }> {
  const token = authService.getToken();
  const res = await fetch(`${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}/export.md`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error('Không thể xuất file Markdown. Vui lòng thử lại.');
  }
  return {
    blob: await res.blob(),
    filename: getDownloadFileName(res) ?? `faq-collection-${id}.md`,
  };
}

export const faqCollectionsService = {
  list(params?: { limit?: number; offset?: number; status?: string; admission_year?: number }) {
    const q = new URLSearchParams();
    const limit = capLimit(params?.limit);
    if (limit != null) q.set('limit', String(limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.status) q.set('status', params.status);
    if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
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
  getDetail(id: string) {
    return request<{ data: FaqCollectionDetail }>(
      `${API_ENDPOINTS.FAQ_COLLECTIONS}/${id}/detail`
    );
  },
  async exportMd(id: string) {
    return fetchCollectionMdExport(id);
  },
  addItems(collectionId: string, question_ids: string[]) {
    return request<{ message: string; inserted: number }>(
      `${API_ENDPOINTS.FAQ_COLLECTIONS}/${collectionId}/items`,
      { method: 'POST', body: JSON.stringify({ question_ids }) }
    );
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
