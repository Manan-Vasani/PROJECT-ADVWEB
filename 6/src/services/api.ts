// Practical 6: Centralized API Service for React Frontend
// Encapsulates all HTTP communications with the Express/MongoDB Backend

export interface Task {
  _id?: string;
  id?: string | number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

export interface HealthResponse {
  message: string;
  database?: {
    status: string;
    provider: string;
    collection: string;
    uri?: string;
  };
  endpoints?: Record<string, string>;
  version?: string;
}

// Configurable API base URL with fallback to local Express port 5000
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

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
// Centralized API Methods
// ==========================================

/**
 * Check backend server and MongoDB connection health
 */
export const checkServerHealth = async (): Promise<HealthResponse> => {
  const res = await fetch(`${BASE_URL}/`);
  return handleResponse<HealthResponse>(res);
};

/**
 * GET /tasks - Fetch all tasks from MongoDB (supports ?completed=true/false)
 */
export const getTasks = async (completed?: boolean): Promise<Task[]> => {
  const url =
    completed !== undefined
      ? `${BASE_URL}/tasks?completed=${completed}`
      : `${BASE_URL}/tasks`;
  const res = await fetch(url);
  return handleResponse<Task[]>(res);
};

/**
 * GET /tasks/:id - Fetch single task by MongoDB ObjectId
 */
export const getTaskById = async (id: string): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`);
  return handleResponse<Task>(res);
};

/**
 * POST /tasks - Create a new task in MongoDB with Mongoose validation
 */
export const createTask = async (payload: CreateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

/**
 * PUT /tasks/:id - Update task properties by MongoDB ObjectId
 */
export const updateTask = async (id: string, payload: UpdateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse<Task>(res);
};

/**
 * DELETE /tasks/:id - Delete task from MongoDB by ObjectId
 */
export const deleteTask = async (
  id: string
): Promise<{ message: string; deletedTask: Task }> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
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
