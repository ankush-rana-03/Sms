
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    CHANGE_PASSWORD: '/auth/change-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  CLASSES: '/classes',
  ATTENDANCE: '/attendance',
  HOMEWORK: '/homework',
  TESTS: '/tests',
  RESULTS: '/results'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student'
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme'
} as const;

export const APP_CONFIG = {
  NAME: 'School Management System',
  VERSION: '1.0.0',
  AUTHOR: 'SMS Team'
} as const;
