
// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users',
    DELETE: '/users',
  },
  STUDENTS: {
    LIST: '/students',
    CREATE: '/students',
    UPDATE: '/students',
    DELETE: '/students',
    SEARCH: '/students/search',
  },
  TEACHERS: {
    LIST: '/teachers',
    CREATE: '/teachers',
    UPDATE: '/teachers',
    DELETE: '/teachers',
    MANAGEMENT: '/teacher-management',
  },
  ATTENDANCE: {
    LIST: '/attendance',
    CREATE: '/attendance',
    UPDATE: '/attendance',
    REPORTS: '/attendance/reports',
  },
  CLASSES: {
    LIST: '/classes',
    CREATE: '/classes',
    UPDATE: '/classes',
    DELETE: '/classes',
  },
  HOMEWORK: {
    LIST: '/homework',
    CREATE: '/homework',
    UPDATE: '/homework',
    DELETE: '/homework',
  },
  TESTS: {
    LIST: '/tests',
    CREATE: '/tests',
    UPDATE: '/tests',
    DELETE: '/tests',
  },
  RESULTS: {
    LIST: '/results',
    CREATE: '/results',
    UPDATE: '/results',
    DELETE: '/results',
  },
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
} as const;

// Application Settings
export const APP_CONFIG = {
  NAME: 'School Management System',
  VERSION: '1.0.0',
  COMPANY: 'Your School',
  DEFAULT_PAGE_SIZE: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: false,
    REQUIRE_LOWERCASE: false,
    REQUIRE_NUMBERS: false,
    REQUIRE_SYMBOLS: false,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  DRAWER_WIDTH: 240,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in.',
  LOGOUT: 'Successfully logged out.',
  CREATE: 'Record created successfully.',
  UPDATE: 'Record updated successfully.',
  DELETE: 'Record deleted successfully.',
  SAVE: 'Changes saved successfully.',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type ApiEndpoint = typeof API_ENDPOINTS;
