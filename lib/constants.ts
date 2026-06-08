// API — chỉ cấu hình qua NEXT_PUBLIC_API_BASE_URL (docker/.env hoặc CI build-arg)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2222';

export const API_V1_URL = `${API_BASE_URL}/api/v1`;

// API Endpoints
export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,
  DASHBOARD_ANALYTICS: `${API_BASE_URL}/dashboard/analytics`,

  // Auth
  LOGIN: `${API_V1_URL}/auth/login`,
  LOGOUT: `${API_V1_URL}/auth/logout`,
  PROFILE: `${API_V1_URL}/auth/profile`,

  // Departments
  DEPARTMENTS: `${API_V1_URL}/departments`,

  // Programs
  PROGRAMS: `${API_V1_URL}/programs`,

  // Campuses
  CAMPUSES: `${API_V1_URL}/campuses`,

  // Tuition
  TUITION: `${API_V1_URL}/tuition`,

  // Scholarships
  SCHOLARSHIPS: `${API_V1_URL}/scholarships`,

  // Admission Methods
  ADMISSION_METHODS: `${API_V1_URL}/admission-methods`,

  // Admission Years
  ADMISSION_YEARS: `${API_V1_URL}/admission-years`,

  // Users
  USERS: `${API_V1_URL}/users`,

  // FAQ
  FAQ_TOPICS: `${API_V1_URL}/faq/topics`,
  FAQ_SUB_TOPICS: `${API_V1_URL}/faq/sub-topics`,
  FAQ_QUESTIONS: `${API_V1_URL}/faq/questions`,
  FAQ_ANSWERS: `${API_V1_URL}/faq/answers`,
  FAQ_COLLECTIONS: `${API_V1_URL}/faq/collections`,
} as const;

// Default pagination
export const DEFAULT_PAGINATION = {
  LIMIT: 10,
  OFFSET: 0,
} as const;

export const MAX_PAGE_LIMIT = 100;

// UI Constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ERROR_TOAST_DURATION: 6000,
  SUCCESS_TOAST_DURATION: 3000,
  WARNING_TOAST_DURATION: 4000,
  LOADING_TIMEOUT: 30000, // 30 seconds
} as const;

// Activity Types
export const ACTIVITY_TYPES = {
  DEPARTMENT_CREATED: 'department_created',
  DEPARTMENT_UPDATED: 'department_updated',
  DEPARTMENT_DELETED: 'department_deleted',
  PROGRAM_CREATED: 'program_created',
  PROGRAM_UPDATED: 'program_updated',
  PROGRAM_DELETED: 'program_deleted',
  CAMPUS_CREATED: 'campus_created',
  CAMPUS_EDITED: 'campus_edited',
  CAMPUS_DELETED: 'campus_deleted',
  TUITION_ADDED: 'tuition_added',
  TUITION_UPDATED: 'tuition_updated',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
} as const;

// Activity Colors
export const ACTIVITY_COLORS = {
  [ACTIVITY_TYPES.DEPARTMENT_CREATED]: 'bg-blue-600',
  [ACTIVITY_TYPES.DEPARTMENT_UPDATED]: 'bg-blue-500',
  [ACTIVITY_TYPES.DEPARTMENT_DELETED]: 'bg-red-600',
  [ACTIVITY_TYPES.PROGRAM_CREATED]: 'bg-green-600',
  [ACTIVITY_TYPES.PROGRAM_UPDATED]: 'bg-green-500',
  [ACTIVITY_TYPES.PROGRAM_DELETED]: 'bg-red-600',
  [ACTIVITY_TYPES.CAMPUS_CREATED]: 'bg-purple-600',
  [ACTIVITY_TYPES.CAMPUS_EDITED]: 'bg-purple-500',
  [ACTIVITY_TYPES.CAMPUS_DELETED]: 'bg-red-600',
  [ACTIVITY_TYPES.TUITION_ADDED]: 'bg-orange-600',
  [ACTIVITY_TYPES.TUITION_UPDATED]: 'bg-orange-500',
  [ACTIVITY_TYPES.USER_CREATED]: 'bg-cyan-600',
  [ACTIVITY_TYPES.USER_UPDATED]: 'bg-cyan-500',
} as const;

// Icon Names for Quick Actions
export const ICON_NAMES = {
  BUILDING2: 'Building2',
  GRADUATION_CAP: 'GraduationCap',
  MAP_PIN: 'MapPin',
  USERS: 'Users',
  DOLLAR_SIGN: 'DollarSign',
  ACTIVITY: 'Activity',
  TRENDING_UP: 'TrendingUp',
  BAR_CHART_3: 'BarChart3',
  MESSAGE_SQUARE: 'MessageSquare',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  YEARS: '/dashboard/years',
  DEPARTMENTS: '/dashboard/departments',
  PROGRAMS: '/dashboard/programs',
  CAMPUSES: '/dashboard/campuses',

  TUITION: '/dashboard/tuition',
  SCHOLARSHIPS: '/dashboard/scholarships',
  ADMISSION_METHODS: '/dashboard/admission-methods',
  USERS: '/dashboard/users',
  PROFILE: '/dashboard/profile',
  FAQ_TOPICS: '/dashboard/faq/topics',
  FAQ_SUB_TOPICS: '/dashboard/faq/sub-topics',
  FAQ_QUESTIONS: '/dashboard/faq/questions',
  FAQ_ANSWERS: '/dashboard/faq/answers',
  FAQ_COLLECTIONS: '/dashboard/faq/collections',
} as const;
