import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ToastContainer } from '../components/Toast';
import type { ToastMessage, ToastType } from '../components/Toast';
import {
  getTasksWithMeta,
  createTask,
  updateTask,
  deleteTask,
  checkServerHealth,
  triggerErrorSimulation,
  getToken,
  ApiError,
  BASE_URL
} from '../services/api';
import type { Task, HealthResponse, User } from '../services/api';
import { CacheBenchmarkCard } from '../components/CacheBenchmarkCard';
import { EventNotificationCard } from '../components/EventNotificationCard';

interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  statusText: string;
  durationMs: number;
  authHeaderPresent: boolean;
  cacheStatus?: string;
  responsePreview: string;
}

// Practical 8 Supplementary: Heavy component lazy loaded on-demand
const TaskAnalyticsChart = React.lazy(() => import('../components/TaskAnalyticsChart'));

interface TasksProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Tasks: React.FC<TasksProps> = ({ currentUser, onOpenAuth }) => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMeta, setServerMeta] = useState<HealthResponse | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  // Granular Action Loading States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isModalSaving, setIsModalSaving] = useState<boolean>(false);

  // Form states
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formValidationMsg, setFormValidationMsg] = useState<string | null>(null);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editCompleted, setEditCompleted] = useState<boolean>(false);

  // Deletion confirm modal state
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Interactive Live Request Logger
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'tester' | 'docs'>('tasks');

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Dispatcher Helper
  const addToast = (type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to append to UI log
  const logApiCall = (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    status: number,
    statusText: string,
    durationMs: number,
    data: unknown,
    cacheStatus?: string
  ) => {
    const entry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      statusText,
      durationMs,
      authHeaderPresent: !!getToken(),
      cacheStatus,
      responsePreview: JSON.stringify(data, null, 2)
    };
    setApiLogs((prev) => [entry, ...prev.slice(0, 19)]);
  };

  const getTaskId = (task: Task): string => {
    return (task._id || task.id || '').toString();
  };

  // Initial Health Check
  useEffect(() => {
    checkServerHealth()
      .then((health) => {
        setServerMeta(health);
        setServerOnline(true);
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

  // 1. Fetch user tasks when logged in
  const fetchTasksList = useCallback(
    async (isManualRefresh = false) => {
      if (!currentUser) {
        setTasks([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { tasks: data, cacheStatus, latencyMs } = await getTasksWithMeta();

        setTasks(data);
        setServerOnline(true);
        logApiCall('GET', '/tasks', 200, 'OK', latencyMs, data, cacheStatus);

        if (isManualRefresh) {
          const cacheLabel = cacheStatus === 'HIT' ? '⚡ Memory Cache HIT' : '📦 MongoDB Query MISS';
          addToast('success', 'Tasks Synchronized', `Fetched ${data.length} tasks in ${latencyMs}ms (${cacheLabel}).`);
        }
      } catch (err: unknown) {
        const errMsg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to connect to backend server.';
        setError(errMsg);
        logApiCall('GET', '/tasks', 0, 'Connection Failed', 0, { error: errMsg });
        addToast('error', 'Fetch Failed', errMsg);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (currentUser) {
      fetchTasksList();
    }
  }, [currentUser, fetchTasksList]);

  // 2. Create Task (POST /tasks)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormValidationMsg('Task title is required by server-side validator.');
      addToast('warning', 'Validation Warning', 'Task title cannot be empty.');
      return;
    }

    setFormValidationMsg(null);
    setIsSubmitting(true);
    const startTime = performance.now();

    try {
      const created = await createTask({
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        completed: false
      });
      const duration = Math.round(performance.now() - startTime);

      setTasks((prev) => [created, ...prev]);
      logApiCall('POST', '/tasks', 201, 'Created', duration, created);

      addToast(
        'success',
        'Task Created',
        `"${created.title}" was saved to MongoDB under your account.`
      );

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const errMsg = err instanceof ApiError ? err.message : 'Failed to create task.';
      logApiCall('POST', '/tasks', err instanceof ApiError ? err.status : 500, 'Error', duration, {
        error: errMsg
      });
      addToast('error', 'Creation Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Toggle Completion (PUT /tasks/:id)
  const handleToggleCompleted = async (task: Task) => {
    const id = getTaskId(task);
    if (!id || actionLoadingId === id) return;

    setActionLoadingId(id);
    const newStatus = !task.completed;
    const startTime = performance.now();

    try {
      const updated = await updateTask(id, { completed: newStatus });
      const duration = Math.round(performance.now() - startTime);

      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? updated : t)));
      logApiCall('PUT', `/tasks/${id}`, 200, 'OK', duration, updated);

      addToast(
        'info',
        newStatus ? 'Task Completed' : 'Task Marked Active',
        `"${task.title}" updated successfully.`
      );
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const errMsg = err instanceof ApiError ? err.message : 'Failed to update task.';
      logApiCall('PUT', `/tasks/${id}`, err instanceof ApiError ? err.status : 500, 'Error', duration, {
        error: errMsg
      });
      addToast('error', 'Update Failed', errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'medium');
    setEditCompleted(task.completed);
  };

  // 5. Submit Edit Modal (PUT /tasks/:id)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const id = getTaskId(editingTask);
    if (!id || !editTitle.trim()) return;

    setIsModalSaving(true);
    const startTime = performance.now();

    try {
      const updated = await updateTask(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        completed: editCompleted
      });
      const duration = Math.round(performance.now() - startTime);

      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? updated : t)));
      logApiCall('PUT', `/tasks/${id}`, 200, 'OK', duration, updated);

      addToast('success', 'Changes Saved', `Task details successfully updated in MongoDB.`);
      setEditingTask(null);
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const errMsg = err instanceof ApiError ? err.message : 'Failed to save changes.';
      logApiCall('PUT', `/tasks/${id}`, err instanceof ApiError ? err.status : 500, 'Error', duration, {
        error: errMsg
      });
      addToast('error', 'Save Failed', errMsg);
    } finally {
      setIsModalSaving(false);
    }
  };

  // 6. Delete Task (DELETE /tasks/:id)
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    const id = getTaskId(deletingTask);
    if (!id) return;

    setActionLoadingId(id);
    const startTime = performance.now();
    const taskToDelete = deletingTask;
    setDeletingTask(null);

    try {
      const res = await deleteTask(id);
      const duration = Math.round(performance.now() - startTime);

      setTasks((prev) => prev.filter((t) => getTaskId(t) !== id));
      logApiCall('DELETE', `/tasks/${id}`, 200, 'OK', duration, res);

      addToast('warning', 'Task Deleted', `"${taskToDelete.title}" permanently removed.`);
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const errMsg = err instanceof ApiError ? err.message : 'Failed to delete task.';
      logApiCall('DELETE', `/tasks/${id}`, err instanceof ApiError ? err.status : 500, 'Error', duration, {
        error: errMsg
      });
      addToast('error', 'Delete Failed', errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Simulate 401 Token Expiry
  const handleSimulateTokenExpiry = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid_or_expired_jwt_token_sample_401'
        }
      });
      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);

      logApiCall('GET', '/tasks', res.status, res.statusText, duration, data);
      addToast('error', '401 Unauthorized Intercepted', data.message || 'Token expired.');

      // Dispatch auth expired event to trigger modal
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: data.message } }));
    } catch (err: unknown) {
      addToast('error', 'Simulation Error', String(err));
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return (
    <div className="tasks-page-container">
      {/* Toast Stack Component */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header Banner */}
      <header className="tasks-hero-section">
        <div className="tasks-hero-badge">
          <span className="hero-badge-dot">●</span>
          <span>PRACTICAL 07 • AUTHENTICATION & MIDDLEWARE</span>
        </div>
        <h1 className="tasks-hero-title">Secure Task Management</h1>
        <p className="tasks-hero-subtitle">
          Demonstrating <strong>JWT Bearer Token Authentication</strong>, password hashing with{' '}
          <strong>bcrypt (10 rounds)</strong>, server-side input validation middleware, and protected MongoDB routes.
        </p>

        {/* Server & DB Status Ribbon */}
        <div className="db-status-bar">
          <div className="db-status-pill">
            <span
              className="status-indicator"
              style={{
                backgroundColor: serverOnline ? '#34c759' : '#ff3b30'
              }}
            ></span>
            <span className="status-label">
              {serverOnline ? 'Express API Online (Port 5000)' : 'Express Backend Offline'}
            </span>
          </div>

          <div className="db-status-pill">
            <span className="status-indicator" style={{ backgroundColor: '#0071e3' }}></span>
            <span className="status-label">
              Database: <strong>{serverMeta?.database?.name || 'practical7_taskmanager'}</strong>
            </span>
          </div>

          <div className="db-status-pill">
            <span
              className="status-indicator"
              style={{ backgroundColor: currentUser ? '#34c759' : '#ff9500' }}
            ></span>
            <span className="status-label">
              Auth: <strong>{currentUser ? 'JWT Active (Bearer)' : 'Unauthenticated'}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="tabs-nav-bar">
        <button
          className={`tab-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span>📋</span>
          <span>Task Dashboard</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'tester' ? 'active' : ''}`}
          onClick={() => setActiveTab('tester')}
        >
          <span>🧪</span>
          <span>Middleware & Auth Inspector</span>
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <span>📖</span>
          <span>Lab Specifications</span>
        </button>
      </div>

      {/* TAB 1: Tasks Dashboard */}
      {activeTab === 'tasks' && (
        <div className="tab-pane">
          {/* If NOT Authenticated, show login/register call-to-action */}
          {!currentUser ? (
            <div className="auth-hero-card">
              <div className="auth-hero-icon">🔐</div>
              <h3 className="auth-hero-title">Authentication Required to Access Tasks</h3>
              <p className="auth-hero-desc">
                In Practical 7, all task endpoints (`GET /tasks`, `POST /tasks`, `PUT`, `DELETE`) are strictly protected
                by Express authentication middleware. Please sign in or create an account to obtain a valid JWT token.
              </p>
              <div className="auth-hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onOpenAuth('login')}
                  style={{ minWidth: '140px' }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenAuth('register')}
                  style={{ minWidth: '140px' }}
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Authenticated User Status Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 113, 227, 0.06)',
                  border: '1px solid rgba(0, 113, 227, 0.15)',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#86868b', textTransform: 'uppercase', fontWeight: 600 }}>
                    Authenticated Session
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d1d1f' }}>
                    Welcome back, {currentUser.name} ({currentUser.email})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={handleSimulateTokenExpiry}
                    title="Simulate sending an invalid/expired token to trigger 401"
                  >
                    Simulate 401 Token Expiry
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => fetchTasksList(true)}
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    className={`btn ${showAnalytics ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    {showAnalytics ? '📊 Hide Velocity Analytics' : '📊 View Velocity Analytics (Lazy Loaded)'}
                  </button>
                </div>
              </div>

              {/* Practical 8: Lazy Loaded Heavy Analytics Engine */}
              {showAnalytics && (
                <React.Suspense
                  fallback={
                    <div className="loading-state" style={{ margin: '16px 0', padding: '24px' }}>
                      <Spinner />
                      <p>Loading Velocity Analytics Engine chunk dynamically...</p>
                    </div>
                  }
                >
                  <TaskAnalyticsChart tasks={tasks} />
                </React.Suspense>
              )}

              {/* Practical 9: In-Memory Caching & Latency Benchmark Engine */}
              <CacheBenchmarkCard />

              {/* Practical 10: Asynchronous Processing with Event-Driven Architecture */}
              <EventNotificationCard
                onNotify={(msg, type) =>
                  addToast(type === 'error' ? 'error' : type === 'success' ? 'success' : 'info', 'Event Subsystem', msg)
                }
              />

              {/* Task Creation Form */}
              <div className="task-form-card">
                <h3 className="card-title">Add New Task</h3>
                <p className="card-subtitle">
                  Enforces server-side validation middleware and saves under your authenticated user ID.
                </p>

                <form onSubmit={handleCreateTask} className="task-input-form">
                  <div className="form-group">
                    <label htmlFor="task-title" className="form-label">
                      Title <span className="required">*</span>
                    </label>
                    <input
                      id="task-title"
                      type="text"
                      className={`form-input ${formValidationMsg ? 'input-error' : ''}`}
                      placeholder="e.g., Implement JWT Authentication Middleware"
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (formValidationMsg) setFormValidationMsg(null);
                      }}
                      disabled={isSubmitting}
                    />
                    {formValidationMsg && (
                      <span className="validation-error-text">⚠️ {formValidationMsg}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-desc" className="form-label">
                      Description <span className="optional">(optional)</span>
                    </label>
                    <input
                      id="task-desc"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Protect backend routes and handle 401 redirects"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="task-priority" className="form-label">
                      Priority Level
                    </label>
                    <select
                      id="task-priority"
                      className="form-input"
                      value={newPriority}
                      onChange={(e) =>
                        setNewPriority(e.target.value as 'low' | 'medium' | 'high')
                      }
                      disabled={isSubmitting}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{ minWidth: '140px' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Add Task'
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Tasks List Section */}
              <div className="tasks-list-wrapper">
                <div className="tasks-list-header">
                  <div>
                    <h3 className="card-title">Your Tasks</h3>
                    <p className="card-subtitle">
                      Showing {filteredTasks.length} of {totalCount} total tasks persisted in MongoDB.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="filter-group">
                    <button
                      className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                      onClick={() => setFilter('all')}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                      onClick={() => setFilter('active')}
                    >
                      Active ({activeCount})
                    </button>
                    <button
                      className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                      onClick={() => setFilter('completed')}
                    >
                      Completed ({completedCount})
                    </button>
                  </div>
                </div>

                {/* Loading indicator */}
                {loading && (
                  <div className="loading-state">
                    <Spinner />
                    <p>Fetching your personal tasks from MongoDB...</p>
                  </div>
                )}

                {/* Error Banner */}
                {error && !loading && <ErrorMessage message={error} onRetry={() => fetchTasksList(true)} />}

                {/* Tasks List */}
                {!loading && !error && filteredTasks.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h4>No tasks found</h4>
                    <p>Create your first authenticated task above!</p>
                  </div>
                )}

                {!loading && !error && filteredTasks.length > 0 && (
                  <div className="tasks-grid">
                    {filteredTasks.map((task) => {
                      const taskId = getTaskId(task);
                      const isItemLoading = actionLoadingId === taskId;

                      return (
                        <div
                          key={taskId}
                          className={`task-card ${task.completed ? 'completed' : ''}`}
                        >
                          <div className="task-card-header">
                            <label className="checkbox-container">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleCompleted(task)}
                                disabled={isItemLoading}
                              />
                              <span className="checkmark"></span>
                            </label>

                            <div className="task-title-group">
                              <h4 className="task-title">{task.title}</h4>
                              {task.description && (
                                <p className="task-desc">{task.description}</p>
                              )}
                            </div>

                            <span className={`priority-tag priority-${task.priority || 'medium'}`}>
                              {task.priority || 'medium'}
                            </span>
                          </div>

                          <div className="task-card-footer">
                            <span className="task-date">
                              📅 {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Today'}
                            </span>

                            <div className="task-actions">
                              <button
                                type="button"
                                className="action-btn edit"
                                onClick={() => openEditModal(task)}
                                disabled={isItemLoading}
                                title="Edit Task"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={() => setDeletingTask(task)}
                                disabled={isItemLoading}
                                title="Delete Task"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Live Request Logger Console */}
          <div className="console-wrapper" style={{ marginTop: '36px' }}>
            <div className="console-header">
              <span className="console-dot red"></span>
              <span className="console-dot yellow"></span>
              <span className="console-dot green"></span>
              <span className="console-title">Live API Request & Header Inspector</span>
            </div>
            <div className="console-body">
              {apiLogs.length === 0 ? (
                <div className="console-empty">
                  Ready. Perform operations to inspect live HTTP traffic and Bearer headers.
                </div>
              ) : (
                apiLogs.map((log) => (
                  <div key={log.id} className="console-row">
                    <span className="console-time">[{log.timestamp}]</span>
                    <span className={`console-method ${log.method.toLowerCase()}`}>
                      {log.method}
                    </span>
                    <span className="console-path">{log.endpoint}</span>
                    <span className="console-status">
                      {log.status} {log.statusText}
                    </span>
                    <span className="console-duration">({log.durationMs}ms)</span>
                    {log.cacheStatus && (
                      <span
                        style={{
                          background: log.cacheStatus === 'HIT' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(0, 113, 227, 0.15)',
                          color: log.cacheStatus === 'HIT' ? '#34c759' : '#0071e3',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          marginLeft: '6px',
                          fontWeight: 600
                        }}
                      >
                        {log.cacheStatus === 'HIT' ? '⚡ Cache HIT' : '📦 Cache MISS'}
                      </span>
                    )}
                    {log.authHeaderPresent && (
                      <span
                        style={{
                          background: '#34c75920',
                          color: '#34c759',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          marginLeft: '6px'
                        }}
                      >
                        Bearer Token
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Middleware & Auth Inspector */}
      {activeTab === 'tester' && (
        <div className="tab-pane">
          <div className="tester-grid">
            {/* Box 1: Register API Test */}
            <div className="tester-card">
              <h4>1. POST /api/auth/register</h4>
              <p>Hashes password using bcrypt (10 rounds) before MongoDB persistence.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenAuth('register')}
              >
                Open Register Dialog
              </button>
            </div>

            {/* Box 2: Login & JWT Test */}
            <div className="tester-card">
              <h4>2. POST /api/auth/login</h4>
              <p>Compares bcrypt hash and returns signed JWT (1h expiry).</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenAuth('login')}
              >
                Open Login Dialog
              </button>
            </div>

            {/* Box 3: Protected Route Rejection */}
            <div className="tester-card">
              <h4>3. Protected Route Security (401)</h4>
              <p>Attempts to query `/tasks` without a valid Bearer token.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSimulateTokenExpiry}
              >
                Test 401 Rejection
              </button>
            </div>

            {/* Box 4: Server 500 Simulation */}
            <div className="tester-card">
              <h4>4. Global 500 Error Handler</h4>
              <p>Simulates server exception to test structured JSON output.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await triggerErrorSimulation();
                  } catch (err: unknown) {
                    addToast('error', '500 Handler Verified', (err as Error).message);
                  }
                }}
              >
                Trigger 500 Crash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Academic Docs */}
      {activeTab === 'docs' && (
        <div className="tab-pane">
          <div className="docs-card">
            <h3>Practical 7: Authentication and Middleware Pipeline</h3>
            <p>
              <strong>Objective:</strong> To implement JWT-based authentication and input validation as part of the
              Express middleware pipeline.
            </p>
            <ul>
              <li><strong>Password Hashing:</strong> Salting and hashing with bcryptjs (10 rounds).</li>
              <li><strong>Token Strategy:</strong> JSON Web Tokens signed with secret and 1-hour expiration.</li>
              <li><strong>Protected Middleware:</strong> Rejects unauthenticated requests with 401 Unauthorized.</li>
              <li><strong>Input Validation:</strong> Server-side validation rejecting invalid data with 400 Bad Request.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingTask && (
        <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Task</h3>
              <button
                className="modal-close-btn"
                onClick={() => setEditingTask(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isModalSaving}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isModalSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as 'low' | 'medium' | 'high')
                  }
                  disabled={isModalSaving}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={editCompleted}
                    onChange={(e) => setEditCompleted(e.target.checked)}
                    disabled={isModalSaving}
                  />
                  <span>Mark task as completed</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTask(null)}
                  disabled={isModalSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isModalSaving}
                >
                  {isModalSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Safety Confirmation Modal */}
      {deletingTask && (
        <div className="modal-backdrop" onClick={() => setDeletingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title text-danger">Confirm Deletion</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDeletingTask(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to permanently delete this task?</p>
              <div className="delete-item-preview">
                <strong>{deletingTask.title}</strong>
                {deletingTask.description && <p>{deletingTask.description}</p>}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;