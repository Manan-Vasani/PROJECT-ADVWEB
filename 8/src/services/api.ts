// Practical 7: Centralized API Service for React Frontend
// Encapsulates all HTTP communications, JWT Authentication, and Protected Task Routes

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Task {
  _id?: string;
  id?: string | number;
  user?: string | User;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

export interface HealthResponse {
  project?: string;
  status: string;
  timestamp?: string;
  database?: {
    type?: string;
    name?: string;
    status: string;
    connected: boolean;
  };
  auth?: {
    enabled: boolean;
    strategy: string;
    tokenExpiry: string;
  };
}

// Base URL configuration
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'itue301_p7_token';
const USER_KEY = 'itue301_p7_user';

/**
 * Token & User Storage Helpers
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const clearStoredUser = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
};

/**
 * Helper to build auth headers
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Custom API Error containing status code and server error details
 */
export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Helper to process fetch responses and throw structured ApiError on failure
 */
const handleResponse = async <T>(res: Response): Promise<T> => {
  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status === 401) {
    // If token expired or unauthorized, trigger auth expired event
    window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: json?.message } }));
  }

  if (!res.ok) {
    const errorMsg =
      json?.message ||
      json?.error ||
      (Array.isArray(json?.details) ? json.details.join(', ') : null) ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new ApiError(errorMsg, res.status, json?.details);
  }

  return json as T;
};

// ==========================================
// Authentication API Methods
// ==========================================

/**
 * Register a new user with password hashing on server
 */
export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<AuthResponse>(res);
  if (data.token) {
    setToken(data.token);
    setStoredUser(data.user);
  }
  return data;
};

/**
 * Login user and acquire JWT token
 */
export const loginUser = async (payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<AuthResponse>(res);
  if (data.token) {
    setToken(data.token);
    setStoredUser(data.user);
  }
  return data;
};

/**
 * Fetch authenticated user profile using token
 */
export const getCurrentUser = async (): Promise<{ user: User }> => {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders()
  });
  return handleResponse<{ user: User }>(res);
};

/**
 * Logout - clears client storage
 */
export const logoutUser = (): void => {
  clearToken();
  clearStoredUser();
};

// ==========================================
// Task Management API Methods (Protected)
// ==========================================

/**
 * Check backend server and MongoDB connection health
 */
export const checkServerHealth = async (): Promise<HealthResponse> => {
  const res = await fetch(`${BASE_URL}/`);
  return handleResponse<HealthResponse>(res);
};

/**
 * GET /tasks - Fetch tasks belonging to logged-in user
 */
export const getTasks = async (completed?: boolean): Promise<Task[]> => {
  const url =
    completed !== undefined
      ? `${BASE_URL}/tasks?completed=${completed}`
      : `${BASE_URL}/tasks`;
  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  return handleResponse<Task[]>(res);
};

/**
 * GET /tasks/:id - Fetch single task
 */
export const getTaskById = async (id: string): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    headers: getAuthHeaders()
  });
  return handleResponse<Task>(res);
};

/**
 * POST /tasks - Create a new task under authenticated user
 */
export const createTask = async (payload: CreateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

/**
 * PUT /tasks/:id - Update task properties
 */
export const updateTask = async (id: string, payload: UpdateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

/**
 * DELETE /tasks/:id - Delete task from MongoDB
 */
export const deleteTask = async (
  id: string
): Promise<{ message: string; deletedTask: Task }> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse<{ message: string; deletedTask: Task }>(res);
};

/**
 * GET /error-test - Test 500 error handler simulation
 */
export const triggerErrorSimulation = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/error-test`);
  return handleResponse<any>(res);
};

export { BASE_URL };
