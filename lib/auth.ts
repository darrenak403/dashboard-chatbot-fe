import { API_ENDPOINTS } from './constants';

const API_BASE_URL = 'https://core-tuyensinh-production.up.railway.app/api/v1';



export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'student' | 'admin' | 'staff' | 'super_admin';
}

export interface RegisterResponse {
  data: User;
}

export interface ProfileResponse {
  data: User;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
}

export interface DepartmentsResponse {
  data: Department[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  name_en?: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  code?: string;
  name?: string;
  name_en?: string;
  description?: string;
  is_active?: boolean;
}

export interface DepartmentResponse {
  data: Department;
}

export interface DeleteDepartmentResponse {
  message: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  name_en: string;
  department_id: string;
  duration_years: number;
  department: {
    id: string;
    code: string;
    name: string;
    name_en: string;
  };
}

export interface ProgramsResponse {
  data: Program[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreateProgramRequest {
  code: string;
  name: string;
  name_en?: string;
  department_id: string;
  duration_years: number;
}

export interface UpdateProgramRequest {
  code?: string;
  name?: string;
  name_en?: string;
  department_id?: string;
  duration_years?: number;
  is_active?: boolean;
}

export interface ProgramResponse {
  data: Program;
}

export interface DeleteProgramResponse {
  message: string;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  discount_percentage: number;
  preparation_fees: {
    year: number;
    orientation: {
      fee: number;
      is_mandatory: boolean;
      max_periods: number;
      description: string;
    };
    english_prep: {
      fee: number;
      is_mandatory: boolean;
      max_periods: number;
      description: string;
    };
  };
  available_programs: {
    count: number;
    codes: string[];
  };
}

export interface CampusesResponse {
  data: Campus[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreateCampusRequest {
  code: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  discount_percentage?: number;
}

export interface UpdateCampusRequest {
  code?: string;
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  discount_percentage?: number;
  is_active?: boolean;
}

export interface CampusResponse {
  data: Campus;
}

export interface DeleteCampusResponse {
  message: string;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'An error occurred');
    }

    return data;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...userData,
        role: userData.role || 'student',
      }),
    });
  }

  async getProfile(): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/auth/profile', {
      method: 'GET',
    });
  }

  async getDepartments(limit: number = 100, offset: number = 0): Promise<DepartmentsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.makeRequest<DepartmentsResponse>(`/departments?${params}`, {
      method: 'GET',
    });
  }

  async createDepartment(departmentData: CreateDepartmentRequest): Promise<DepartmentResponse> {
    return this.makeRequest<DepartmentResponse>('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id: string, departmentData: UpdateDepartmentRequest): Promise<DepartmentResponse> {
    return this.makeRequest<DepartmentResponse>(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id: string): Promise<DeleteDepartmentResponse> {
    return this.makeRequest<DeleteDepartmentResponse>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getPrograms(
    limit: number = 100,
    offset: number = 0,
    departmentCode?: string
  ): Promise<ProgramsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (departmentCode) {
      params.append('department_code', departmentCode);
    }

    return this.makeRequest<ProgramsResponse>(`/programs?${params}`, {
      method: 'GET',
    });
  }

  async createProgram(programData: CreateProgramRequest): Promise<ProgramResponse> {
    return this.makeRequest<ProgramResponse>('/programs', {
      method: 'POST',
      body: JSON.stringify(programData),
    });
  }

  async updateProgram(id: string, programData: UpdateProgramRequest): Promise<ProgramResponse> {
    return this.makeRequest<ProgramResponse>(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(programData),
    });
  }

  async deleteProgram(id: string): Promise<DeleteProgramResponse> {
    return this.makeRequest<DeleteProgramResponse>(`/programs/${id}`, {
      method: 'DELETE',
    });
  }

  async getCampuses(
    limit: number = 100,
    offset: number = 0,
    year: number = 2025
  ): Promise<CampusesResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      year: year.toString(),
    });

    return this.makeRequest<CampusesResponse>(`/campuses?${params}`, {
      method: 'GET',
    });
  }

  async createCampus(campusData: CreateCampusRequest): Promise<CampusResponse> {
    return this.makeRequest<CampusResponse>('/campuses', {
      method: 'POST',
      body: JSON.stringify(campusData),
    });
  }

  async updateCampus(id: string, campusData: UpdateCampusRequest): Promise<CampusResponse> {
    return this.makeRequest<CampusResponse>(`/campuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campusData),
    });
  }

  async deleteCampus(id: string): Promise<DeleteCampusResponse> {
    return this.makeRequest<DeleteCampusResponse>(`/campuses/${id}`, {
      method: 'DELETE',
    });
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('isAuthenticated');
  }

  // User data management
  setUserData(user: User): void {
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
  }

  getUserData(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = localStorage.getItem('isAuthenticated');
    return !!(token && isAuth === 'true');
  }

  isAdmin(): boolean {
    const user = this.getUserData();
    return user?.role === 'admin' || user?.role === 'super_admin';
  }

  logout(): void {
    this.removeToken();
  }

  // Knowledge API methods
  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(API_ENDPOINTS.KNOWLEDGE_UPLOAD, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Tải lên tài liệu thất bại`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getDocuments(): Promise<KnowledgeDocument[]> {
    const response = await fetch(API_ENDPOINTS.KNOWLEDGE_DOCUMENTS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Không thể tải danh sách tài liệu`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // API trả về string hoặc array, cần xử lý phù hợp
    if (typeof data === 'string') {
      try {
        // Nếu là string JSON, parse nó
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed.map(this.mapDocumentData) : [];
      } catch {
        // Nếu không parse được, trả về empty array
        return [];
      }
    }

    // Nếu đã là array, map data và trả về
    return Array.isArray(data) ? data.map(this.mapDocumentData) : [];
  }

  private mapDocumentData(doc: any): KnowledgeDocument {
    return {
      path: doc.filename || doc.path, // API trả về filename, fallback to path
      exists: doc.exists,
      size: doc.size,
      filename: doc.filename || doc.path, // API field
      modified: doc.modified, // API field
    };
  }

  async deleteDocument(filename: string): Promise<{ message: string }> {
    const response = await fetch(`${API_ENDPOINTS.KNOWLEDGE_DOCUMENTS}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Xóa tài liệu thất bại`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getKnowledgeStatus(): Promise<KnowledgeStatus> {
    const response = await fetch(API_ENDPOINTS.KNOWLEDGE_STATUS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Không thể tải trạng thái kiến thức`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Tuition API methods
  async getTuitionFees(params?: {
    program_code?: string;
    campus_code?: string;
    year?: number;
    limit?: number;
    offset?: number;
  }): Promise<TuitionResponse> {
    const searchParams = new URLSearchParams();
    if (params?.program_code) searchParams.append('program_code', params.program_code);
    if (params?.campus_code) searchParams.append('campus_code', params.campus_code);
    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${API_BASE_URL}/tuition?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Không thể tải học phí`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getTuitionComparison(params?: {
    program_code?: string;
    year?: number;
  }): Promise<{ data: TuitionComparison[] }> {
    const searchParams = new URLSearchParams();
    if (params?.program_code) searchParams.append('program_code', params.program_code);
    if (params?.year) searchParams.append('year', params.year.toString());

    const response = await fetch(`${API_BASE_URL}/tuition/comparison?${searchParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: Không thể tải so sánh học phí`;
      throw new Error(errorMessage);
    }

    return response.json();
  }





  // Create tuition record
  async createTuitionRecord(data: {
    program_id: string;
    campus_id: string;
    year: number;
    semester_group_1_3_fee: number;
    semester_group_4_6_fee: number;
    semester_group_7_9_fee: number;
  }): Promise<{ data: TuitionFee }> {
    const response = await fetch(`${API_BASE_URL}/tuition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Update tuition record
  async updateTuitionRecord(id: string, data: {
    program_id?: string;
    campus_id?: string;
    year?: number;
    semester_group_1_3_fee?: number;
    semester_group_4_6_fee?: number;
    semester_group_7_9_fee?: number;
    is_active?: boolean;
  }): Promise<{ data: TuitionFee }> {
    const response = await fetch(`${API_BASE_URL}/tuition/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Delete tuition record
  async deleteTuitionRecord(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/tuition/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Scholarship methods
  async getScholarships(params?: {
    year?: number;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ScholarshipResponse> {
    const searchParams = new URLSearchParams();

    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const url = `${API_ENDPOINTS.SCHOLARSHIPS}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const token = this.getToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập danh sách học bổng.');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch scholarships`);
    }

    return await response.json();
  }

  async getScholarshipById(id: string): Promise<{ data: Scholarship }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.SCHOLARSHIPS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập thông tin học bổng này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy học bổng');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch scholarship`);
    }

    return await response.json();
  }

  async createScholarship(data: {
    code: string;
    name: string;
    type: string;
    recipients: number;
    percentage?: number | null;
    requirements?: string;
    year: number;
    notes?: string;
  }): Promise<{ data: Scholarship }> {
    const token = this.getToken();
    const response = await fetch(API_ENDPOINTS.SCHOLARSHIPS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      if (response.status === 409) {
        throw new Error('Học bổng với mã này đã tồn tại trong năm này');
      }
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to create scholarship`);
    }

    return await response.json();
  }

  async updateScholarship(id: string, data: {
    code?: string;
    name?: string;
    type?: string;
    recipients?: number;
    percentage?: number | null;
    requirements?: string;
    year?: number;
    notes?: string;
    is_active?: boolean;
  }): Promise<{ data: Scholarship }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.SCHOLARSHIPS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy học bổng');
      }
      if (response.status === 409) {
        throw new Error('Học bổng với mã này đã tồn tại trong năm này');
      }
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to update scholarship`);
    }

    return await response.json();
  }

  async deleteScholarship(id: string): Promise<{ message: string }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.SCHOLARSHIPS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy học bổng');
      }
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to delete scholarship`);
    }

    return await response.json();
  }

  // Admission Methods
  async getAdmissionMethods(params?: {
    year?: number;
    limit?: number;
    offset?: number;
  }): Promise<AdmissionMethodResponse> {
    const searchParams = new URLSearchParams();

    if (params?.year) searchParams.append('year', params.year.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const url = `${API_ENDPOINTS.ADMISSION_METHODS}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const token = this.getToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập danh sách phương thức tuyển sinh.');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch admission methods`);
    }

    return await response.json();
  }

  async getAdmissionMethodById(id: string): Promise<{ data: AdmissionMethod }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.ADMISSION_METHODS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập thông tin phương thức tuyển sinh này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy phương thức tuyển sinh');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch admission method`);
    }

    return await response.json();
  }

  async createAdmissionMethod(data: {
    method_code: string;
    name: string;
    requirements?: string;
    notes?: string;
    year: number;
  }): Promise<{ data: AdmissionMethod }> {
    const token = this.getToken();
    const response = await fetch(API_ENDPOINTS.ADMISSION_METHODS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền tạo phương thức tuyển sinh mới.');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Dữ liệu không hợp lệ');
      }
      if (response.status === 409) {
        throw new Error('Mã phương thức này đã tồn tại trong năm được chọn');
      }
      throw new Error(`HTTP ${response.status}: Failed to create admission method`);
    }

    return await response.json();
  }

  async updateAdmissionMethod(id: string, data: {
    method_code?: string;
    name?: string;
    requirements?: string;
    notes?: string;
    year?: number;
    is_active?: boolean;
  }): Promise<{ data: AdmissionMethod }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.ADMISSION_METHODS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền cập nhật phương thức tuyển sinh này.');
      }
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Dữ liệu không hợp lệ');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy phương thức tuyển sinh');
      }
      if (response.status === 409) {
        throw new Error('Mã phương thức này đã tồn tại trong năm được chọn');
      }
      throw new Error(`HTTP ${response.status}: Failed to update admission method`);
    }

    return await response.json();
  }

  async deleteAdmissionMethod(id: string): Promise<{ message: string }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.ADMISSION_METHODS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền xóa phương thức tuyển sinh này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy phương thức tuyển sinh');
      }
      throw new Error(`HTTP ${response.status}: Failed to delete admission method`);
    }

    return await response.json();
  }

  // Users
  async getUsers(params?: {
    role?: 'student' | 'admin' | 'staff' | 'super_admin';
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<UserResponse> {
    const searchParams = new URLSearchParams();

    if (params?.role) searchParams.append('role', params.role);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());

    const url = `${API_ENDPOINTS.USERS}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const token = this.getToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập danh sách người dùng.');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch users`);
    }

    return await response.json();
  }

  async getUserById(id: string): Promise<SingleUserResponse> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập thông tin người dùng này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy người dùng.');
      }
      throw new Error(`HTTP ${response.status}: Failed to fetch user`);
    }

    return await response.json();
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: 'student' | 'admin' | 'staff' | 'super_admin';
  }): Promise<SingleUserResponse> {
    const token = this.getToken();
    const response = await fetch(API_ENDPOINTS.USERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        role: data.role || 'staff',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền tạo người dùng mới.');
      }
      if (response.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      }
      if (response.status === 409) {
        throw new Error('Tên đăng nhập hoặc email đã tồn tại.');
      }
      throw new Error(`HTTP ${response.status}: Failed to create user`);
    }

    return await response.json();
  }

  async updateUser(id: string, data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'student' | 'admin' | 'staff' | 'super_admin';
    is_active?: boolean;
  }): Promise<SingleUserResponse> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền cập nhật người dùng này.');
      }
      if (response.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy người dùng.');
      }
      throw new Error(`HTTP ${response.status}: Failed to update user`);
    }

    return await response.json();
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const token = this.getToken();
    const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      if (response.status === 403) {
        throw new Error('Bạn không có quyền xóa người dùng này.');
      }
      if (response.status === 404) {
        throw new Error('Không tìm thấy người dùng.');
      }
      throw new Error(`HTTP ${response.status}: Failed to delete user`);
    }

    return await response.json();
  }
}

// Knowledge interfaces
export interface KnowledgeDocument {
  path: string;
  exists: boolean;
  size: number;
  filename?: string; // API field
  modified?: string; // API field - timestamp
}

export interface KnowledgeStatus {
  exists: boolean;
  type: string;
  path: string;
  document_count: number;
}

export interface UploadResponse {
  message: string;
  file_path: string;
  file_size: number;
  processing_status: string;
  agno_optimized: boolean;
}

// Scholarship interfaces
export interface Scholarship {
  id: string;
  code: string;
  name: string;
  type: string;
  recipients: number;
  percentage: number | null;
  requirements: string;
  year: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScholarshipResponse {
  data: Scholarship[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Admission Method interfaces
export interface AdmissionMethod {
  id: string;
  method_code: string;
  name: string;
  requirements: string;
  notes: string;
  year: number;
  is_active: boolean;
}

export interface AdmissionMethodResponse {
  data: AdmissionMethod[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// User interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'admin' | 'staff' | 'super_admin';
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  data: User[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface SingleUserResponse {
  data: User;
}

// Tuition interfaces
export interface TuitionFee {
  id: string;
  year: number;
  program_id: string;
  program_code: string;
  program_name: string;
  program_name_en: string;
  department_id: string;
  department_code: string;
  department_name: string;
  department_name_en: string;
  campus_id: string;
  campus_code: string;
  campus_name: string;
  campus_city: string;
  campus_discount: number | null;
  semester_group_1_3_fee: number;
  semester_group_4_6_fee: number;
  semester_group_7_9_fee: number;
  total_program_fee: number;
  min_semester_fee: number;
  max_semester_fee: number;
}

export interface TuitionResponse {
  data: TuitionFee[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CampusFee {
  campus_code: string;
  campus_name: string;
  city: string;
  discount_percentage: number | null;
  semester_1_3_fee: number;
  semester_4_6_fee: number;
  semester_7_9_fee: number;
  total_program_fee: number;
}

export interface TuitionComparison {
  program_code: string;
  program_name: string;
  department_name: string;
  year: number;
  campus_fees: CampusFee[];
  min_semester_fee: number;
  max_semester_fee: number;
  min_total_fee: number;
  max_total_fee: number;
}





export const authService = new AuthService();
