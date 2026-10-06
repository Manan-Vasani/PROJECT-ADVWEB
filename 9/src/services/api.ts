// Practical 9: Centralized API Service for React Frontend
// Encapsulates HTTP communications, JWT Auth, Protected Task Routes, and In-Memory Caching (node-cache)

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

export interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRatio: string;
  keysCount: number;
  keys: string[];
  ttl: number;
}

export interface FetchTasksResult {
  tasks: Task[];
  cacheStatus: string;
  latencyMs: number;
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
  caching?: {
    enabled: boolean;
    engine: string;
    ttlSeconds: number;
  };
  auth?: {
    enabled: boolean;
    strategy: string;
    tokenExpiry: string;
  };
}

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'itue301_p9_token';
const USER_KEY = 'itue301_p9_user';

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

const handleResponse = async <T>(res: Response): Promise<T> => {
  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status === 401) {
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

export const getCurrentUser = async (): Promise<{ user: User }> => {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders()
  });
  return handleResponse<{ user: User }>(res);
};

export const logoutUser = (): void => {
  clearToken();
  clearStoredUser();
};

// ==========================================
// In-Memory Caching API Methods (Practical 9)
// ==========================================

export const getCacheStats = async (): Promise<{ status: string; stats: CacheStats }> => {
  const res = await fetch(`${BASE_URL}/api/cache/stats`);
  return handleResponse<{ status: string; stats: CacheStats }>(res);
};

export const clearServerCache = async (): Promise<{ status: string; message: string }> => {
  const res = await fetch(`${BASE_URL}/api/cache/clear`, { method: 'POST' });
  return handleResponse<{ status: string; message: string }>(res);
};

// ==========================================
// Task Management API Methods
// ==========================================

export const checkServerHealth = async (): Promise<HealthResponse> => {
  const res = await fetch(`${BASE_URL}/`);
  return handleResponse<HealthResponse>(res);
};

/**
 * GET /tasks with Cache Metadata and Latency tracking
 */
export const getTasksWithMeta = async (
  completed?: boolean,
  noCache = false
): Promise<FetchTasksResult> => {
  let url = `${BASE_URL}/tasks`;
  const params = new URLSearchParams();
  if (completed !== undefined) params.append('completed', String(completed));
  if (noCache) params.append('no_cache', 'true');
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const start = performance.now();
  const res = await fetch(url, { headers: getAuthHeaders() });
  const latencyMs = Math.round(performance.now() - start);
  const cacheStatus = res.headers.get('X-Cache') || (noCache ? 'BYPASS' : 'UNKNOWN');

  const tasks = await handleResponse<Task[]>(res);
  return { tasks, cacheStatus, latencyMs };
};

export const getTasks = async (completed?: boolean, noCache = false): Promise<Task[]> => {
  const result = await getTasksWithMeta(completed, noCache);
  return result.tasks;
};

export const getTaskById = async (id: string, noCache = false): Promise<Task> => {
  const url = noCache ? `${BASE_URL}/tasks/${id}?no_cache=true` : `${BASE_URL}/tasks/${id}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  return handleResponse<Task>(res);
};

export const createTask = async (payload: CreateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

export const updateTask = async (id: string, payload: UpdateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

export const deleteTask = async (
  id: string
): Promise<{ message: string; deletedTask: Task }> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse<{ message: string; deletedTask: Task }>(res);
};

export const triggerErrorSimulation = async (): Promise<any> => {
  const res = await fetch(`${BASE_URL}/error-test`);
  return handleResponse<any>(res);
};

export { BASE_URL };
