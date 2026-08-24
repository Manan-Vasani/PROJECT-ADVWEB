import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ToastContainer } from '../components/Toast';
import type { ToastMessage, ToastType } from '../components/Toast';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  checkServerHealth,
  triggerErrorSimulation,
  ApiError,
  BASE_URL
} from '../services/api';
import type { Task, HealthResponse } from '../services/api';

interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  statusText: string;
  durationMs: number;
  responsePreview: string;
}

export const Tasks: React.FC = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMeta, setServerMeta] = useState<HealthResponse | null>(null);

  // Granular Action Loading States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isModalSaving, setIsModalSaving] = useState<boolean>(false);

  // Form states
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [formValidationMsg, setFormValidationMsg] = useState<string | null>(null);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
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
    data: unknown
  ) => {
    const entry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      statusText,
      durationMs,
      responsePreview: JSON.stringify(data, null, 2)
    };
    setApiLogs((prev) => [entry, ...prev.slice(0, 19)]);
  };

  // Helper to extract string ID
  const getTaskId = (task: Task): string => {
    return (task._id || task.id || '').toString();
  };

  // 1. Initial & Refresh Data Fetch using central api.ts
  const fetchTasksList = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Fetch health metadata
      try {
        const health = await checkServerHealth();
        setServerMeta(health);
      } catch {
        // Fall through
      }

      const data = await getTasks();
      const duration = Math.round(performance.now() - startTime);

      setTasks(data);
      setServerOnline(true);
      logApiCall('GET', '/tasks', 200, 'OK', duration, data);

      if (isManualRefresh) {
        addToast('success', 'Tasks Synchronized', `Fetched ${data.length} tasks from MongoDB.`);
      }
    } catch (err: unknown) {
      setServerOnline(false);
      const errMsg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to connect to backend server.';
      setError(errMsg);
      logApiCall('GET', '/tasks', 0, 'Connection Failed', 0, { error: errMsg });
      addToast('error', 'Backend Disconnected', errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasksList();
  }, [fetchTasksList]);

  // 2. Create Task (POST /tasks)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormValidationMsg('Task title is required by Mongoose schema.');
      addToast('warning', 'Validation Warning', 'Task title cannot be empty.');
      return;
    }

    setFormValidationMsg(null);
    setIsSubmitting(true);
    const startTime = performance.now();

    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        completed: false
      };

      const created = await createTask(payload);
      const duration = Math.round(performance.now() - startTime);

      logApiCall('POST', '/tasks', 201, 'Created (MongoDB)', duration, created);
      setTasks((prev) => [created, ...prev]);
      setNewTitle('');
      setNewDescription('');
      addToast('success', 'Task Created 🚀', `"${created.title}" successfully saved in MongoDB.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      logApiCall('POST', '/tasks', 400, 'Bad Request', 0, { error: msg });
      addToast('error', 'Task Creation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Toggle Task Completion Status (PUT /tasks/:id)
  const handleToggleComplete = async (task: Task) => {
    const id = getTaskId(task);
    if (!id || actionLoadingId === id) return;

    setActionLoadingId(id);
    const startTime = performance.now();
    const newStatus = !task.completed;

    try {
      const updated = await updateTask(id, { completed: newStatus });
      const duration = Math.round(performance.now() - startTime);

      logApiCall('PUT', `/tasks/${id}`, 200, 'OK (Status Toggled)', duration, updated);
      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? updated : t)));
      addToast(
        'info',
        newStatus ? 'Task Completed ✅' : 'Task Marked Pending ⏳',
        `"${updated.title}" updated in MongoDB.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      logApiCall('PUT', `/tasks/${id}`, 400, 'Update Error', 0, { error: msg });
      addToast('error', 'Status Update Failed', msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Save Task Edit (PUT /tasks/:id)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const id = getTaskId(editingTask);
    if (!id) return;

    if (!editTitle.trim()) {
      addToast('warning', 'Validation Warning', 'Task title cannot be empty.');
      return;
    }

    setIsModalSaving(true);
    const startTime = performance.now();

    try {
      const updated = await updateTask(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        completed: editCompleted
      });

      const duration = Math.round(performance.now() - startTime);
      logApiCall('PUT', `/tasks/${id}`, 200, 'OK (Edited)', duration, updated);
      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? updated : t)));
      setEditingTask(null);
      addToast('success', 'Task Updated 💾', `Changes to "${updated.title}" persisted to MongoDB.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error editing task';
      logApiCall('PUT', `/tasks/${id}`, 400, 'Edit Error', 0, { error: msg });
      addToast('error', 'Edit Failed', msg);
    } finally {
      setIsModalSaving(false);
    }
  };

  // 5. Confirm & Execute Task Deletion (DELETE /tasks/:id)
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    const id = getTaskId(deletingTask);
    const taskTitle = deletingTask.title;
    if (!id) return;

    setActionLoadingId(id);
    const startTime = performance.now();

    try {
      const result = await deleteTask(id);
      const duration = Math.round(performance.now() - startTime);

      logApiCall('DELETE', `/tasks/${id}`, 200, 'OK (Deleted)', duration, result);
      setTasks((prev) => prev.filter((t) => getTaskId(t) !== id));
      setDeletingTask(null);
      addToast('success', 'Task Deleted 🗑️', `"${taskTitle}" removed from MongoDB.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting task';
      logApiCall('DELETE', `/tasks/${id}`, 400, 'Delete Error', 0, { error: msg });
      addToast('error', 'Deletion Failed', msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Test Actions for Tab 2
  const handleTestValidationError = async () => {
    try {
      await createTask({ title: '', description: 'Testing validation rejection' });
    } catch (err: any) {
      logApiCall('POST', '/tasks (empty title)', 400, 'Validation Error', 0, { error: err.message });
      addToast('warning', '400 Bad Request Caught', err.message);
    }
  };

  const handleTest500Error = async () => {
    try {
      await triggerErrorSimulation();
    } catch (err: any) {
      logApiCall('GET', '/error-test', 500, 'Internal Server Error', 0, { error: err.message });
      addToast('error', '500 Server Error Intercepted', err.message);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <section className="tasks-section">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="section-header">
        <h2 className="section-title">
          <span className="number">06.</span> Full Stack Integration (React + Node + MongoDB)
        </h2>
        <div className="section-line"></div>
      </div>

      {/* Practical Hero Card */}
      <div className="practical-hero-card">
        <div className="hero-status-row">
          <div className="hero-badge-group">
            <span className="badge badge-tech">React 19 Frontend</span>
            <span className="badge badge-tech">Express REST API</span>
            <span className="badge badge-tech">MongoDB Persistent Store</span>
            <span className="badge badge-tech">Toast Notifications</span>
          </div>

          <div className="server-status-pill">
            <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">
              {serverOnline === null
                ? 'Connecting to Full Stack API...'
                : serverOnline
                ? `Full Stack: 🟢 Connected (${serverMeta?.database?.collection || 'tasks'} @ ${BASE_URL})`
                : 'Backend Server: 🔴 Offline (Run `npm run dev`)'}
            </span>
          </div>
        </div>

        <p className="hero-description">
          Practical 6 unites our React frontend with the Node.js/Express and MongoDB backend through
          a centralized <code>api.ts</code> service layer. Features <strong>live CRUD state synchronization</strong>,
          <strong>animated Toast alerts</strong>, <strong>granular loading spinners</strong>, and
          <strong>persistent database storage</strong> that remains intact across page refreshes.
        </p>

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Full-Stack Task UI
          </button>
          <button
            className={`view-tab ${activeTab === 'tester' ? 'active' : ''}`}
            onClick={() => setActiveTab('tester')}
          >
            🧪 API &amp; Toast Simulator
          </button>
          <button
            className={`view-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            📖 Central API Architecture &amp; Spec
          </button>
        </div>
      </div>

      {/* TAB 1: Task Management UI */}
      {activeTab === 'tasks' && (
        <div className="tasks-grid-layout">
          {/* Left Column: Create Task Form */}
          <div className="task-create-column">
            <div className="card task-form-card">
              <h3 className="card-title">➕ Add New Task</h3>
              <p className="card-subtitle">
                POSTs via <code>api.createTask()</code> to MongoDB with instant UI sync
              </p>

              <form onSubmit={handleCreateTask} className="task-form">
                <div className="form-group">
                  <label htmlFor="task-title" className="form-label">
                    Task Title <span className="required">*</span>
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Implement full-stack toast notifications"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  {formValidationMsg && (
                    <span className="validation-error">{formValidationMsg}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="task-desc" className="form-label">
                    Description (Optional)
                  </label>
                  <textarea
                    id="task-desc"
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Provide details about requirements..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !serverOnline}
                  className="btn btn-primary btn-block"
                >
                  {isSubmitting ? (
                    <span className="btn-loading-content">
                      <span className="mini-spinner"></span> Saving to MongoDB...
                    </span>
                  ) : (
                    'Create Task 🚀'
                  )}
                </button>
              </form>
            </div>

            {/* Quick Metrics */}
            <div className="card metrics-card">
              <h4 className="metrics-title">📊 Full-Stack State Overview</h4>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-val">{tasks.length}</span>
                  <span className="metric-lbl">Total Tasks</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val text-pending">{pendingCount}</span>
                  <span className="metric-lbl">Pending</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val text-completed">{completedCount}</span>
                  <span className="metric-lbl">Completed</span>
                </div>
              </div>

              <div className="persistence-notice">
                <span className="persistence-icon">💾</span>
                <span className="persistence-text">
                  Data is persisted in MongoDB. Press <code>F5</code> to verify state remains!
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Task List & Controls */}
          <div className="task-list-column">
            <div className="card task-list-card">
              <div className="list-toolbar">
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    All ({tasks.length})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                  >
                    Completed ({completedCount})
                  </button>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => fetchTasksList(true)}
                  title="Reload live tasks from backend API"
                >
                  🔄 Re-fetch
                </button>
              </div>

              {/* State handling */}
              {loading ? (
                <Spinner label="Synchronizing tasks with Express backend & MongoDB..." />
              ) : error && !serverOnline ? (
                <ErrorMessage
                  title="Full Stack API Disconnected"
                  message={`Cannot connect to backend server: ${error}. Ensure 'npm run dev' is running in folder 6.`}
                  onRetry={() => fetchTasksList(true)}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="empty-tasks-placeholder">
                  <p className="empty-icon">📝</p>
                  <p className="empty-text">No tasks found matching current filter.</p>
                </div>
              ) : (
                <div className="task-items-container">
                  {filteredTasks.map((task) => {
                    const taskId = getTaskId(task);
                    const isItemLoading = actionLoadingId === taskId;

                    return (
                      <div
                        key={taskId || task.title}
                        className={`task-item-card ${task.completed ? 'is-completed' : ''} ${
                          isItemLoading ? 'is-mutating' : ''
                        }`}
                      >
                        <div className="task-left">
                          <label className="task-checkbox-wrapper">
                            <input
                              type="checkbox"
                              className="task-checkbox"
                              checked={task.completed}
                              disabled={isItemLoading}
                              onChange={() => handleToggleComplete(task)}
                              title="Toggle status in MongoDB"
                            />
                            {isItemLoading && <span className="item-mini-spinner"></span>}
                          </label>

                          <div className="task-info">
                            <div className="task-title-row">
                              <span className="task-id-badge" title="MongoDB Document ID">
                                #{taskId.length > 8 ? `${taskId.substring(0, 6)}...` : taskId}
                              </span>
                              <h4 className="task-title-text">{task.title}</h4>
                              <span
                                className={`task-status-tag ${
                                  task.completed ? 'tag-done' : 'tag-pending'
                                }`}
                              >
                                {task.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                            {task.description && (
                              <p className="task-desc-text">{task.description}</p>
                            )}
                            {task.createdAt && (
                              <span className="task-timestamp">
                                🕒 {new Date(task.createdAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-actions">
                          <button
                            className="btn-icon edit-btn"
                            title="Edit Task (PUT /tasks/:id)"
                            disabled={isItemLoading}
                            onClick={() => {
                              setEditingTask(task);
                              setEditTitle(task.title);
                              setEditDescription(task.description || '');
                              setEditCompleted(task.completed);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete-btn"
                            title="Delete Task (DELETE /tasks/:id)"
                            disabled={isItemLoading}
                            onClick={() => setDeletingTask(task)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Full-Stack Integration & Toast Simulator */}
      {activeTab === 'tester' && (
        <div className="tester-panel">
          <div className="card tester-card">
            <h3 className="card-title">🧪 Full-Stack Flow &amp; Toast Simulator</h3>
            <p className="card-subtitle">
              Test end-to-end integration flows, toast notifications, and edge-case error pipelines:
            </p>

            <div className="tester-btn-grid">
              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-200">200 OK</span>
                  <h4>Synchronize State</h4>
                </div>
                <p>Calls <code>api.getTasks()</code> and updates local React state array.</p>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => fetchTasksList(true)}
                >
                  Fetch All Tasks (GET)
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-201">Toast Test</span>
                  <h4>Trigger Success Toast</h4>
                </div>
                <p>Dispatches an animated notification toast with automatic timer dismiss.</p>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() =>
                    addToast(
                      'success',
                      'Full Stack Connected!',
                      'React and Express are communicating flawlessly.'
                    )
                  }
                >
                  Show Success Toast
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-404">400 Bad Request</span>
                  <h4>Mongoose Validation Test</h4>
                </div>
                <p>Sends an empty title payload to test structured 400 error handling.</p>
                <button className="btn btn-secondary btn-block" onClick={handleTestValidationError}>
                  Test Missing Title
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-500">500 Server Error</span>
                  <h4>Error Pipeline Test</h4>
                </div>
                <p>Triggers <code>GET /error-test</code> to verify central error interceptor.</p>
                <button className="btn btn-danger btn-block" onClick={handleTest500Error}>
                  Trigger 500 Error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API Documentation & cURL Snippets */}
      {activeTab === 'docs' && (
        <div className="docs-panel">
          <div className="card docs-card">
            <h3 className="card-title">📖 Practical 6: Central API Architecture &amp; Service Layer</h3>
            <p className="card-subtitle">
              All client-side HTTP calls are routed through <code>src/services/api.ts</code>:
            </p>

            <div className="api-spec-table-container">
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>API Service Call</th>
                    <th>Full-Stack Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/tasks</code></td>
                    <td><code>api.getTasks()</code></td>
                    <td>Queries MongoDB, loads tasks array into React state</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><code>api.getTaskById(id)</code></td>
                    <td>Fetches single task document by ObjectId</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge post">POST</span></td>
                    <td><code>/tasks</code></td>
                    <td><code>api.createTask(dto)</code></td>
                    <td>Validates schema, inserts to MongoDB, prepends to state</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge put">PUT</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><code>api.updateTask(id, dto)</code></td>
                    <td>Updates document in DB and updates item in React state</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge delete">DELETE</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><code>api.deleteTask(id)</code></td>
                    <td>Removes document from DB and filters item from state</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="docs-subheading">💻 Terminal cURL Commands</h4>
            <div className="curl-box">
              <pre>
                {`# 1. Fetch All Tasks
curl -X GET http://localhost:5000/tasks

# 2. Create Task with Validation
curl -X POST http://localhost:5000/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Full-Stack Integration", "description": "Practical 6", "completed": false}'

# 3. Update Task Status
curl -X PUT http://localhost:5000/tasks/<OBJECT_ID> \\
  -H "Content-Type: application/json" \\
  -d '{"completed": true}'

# 4. Delete Task
curl -X DELETE http://localhost:5000/tasks/<OBJECT_ID>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Live Request / Response Logger Box */}
      <div className="card log-console-card">
        <div className="log-header">
          <div className="log-title-group">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
            <h4 className="log-title">🖥️ Express + MongoDB Live Request Monitor</h4>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setApiLogs([])}>
            Clear Logs
          </button>
        </div>

        <div className="log-body">
          {apiLogs.length === 0 ? (
            <div className="empty-logs">
              No requests recorded yet. Interact with the UI or tester above to view live HTTP traffic.
            </div>
          ) : (
            <div className="log-entries-list">
              {apiLogs.map((log) => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className={`method-badge ${log.method.toLowerCase()}`}>{log.method}</span>
                  <span className="log-endpoint">{log.endpoint}</span>
                  <span
                    className={`status-code-badge badge-${
                      log.status >= 500
                        ? '500'
                        : log.status >= 400
                        ? '404'
                        : log.status === 201
                        ? '201'
                        : '200'
                    }`}
                  >
                    {log.status || 'ERR'} {log.statusText}
                  </span>
                  <span className="log-duration">{log.durationMs}ms</span>
                  <details className="log-details">
                    <summary className="log-summary">Payload Preview</summary>
                    <pre className="log-preview-code">{log.responsePreview}</pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isModalSaving) setEditingTask(null);
          }}
        >
          <div className="modal-content card">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit Task Document</h3>
              <button
                type="button"
                className="modal-close-btn"
                disabled={isModalSaving}
                onClick={() => setEditingTask(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-id-row">
              <span className="modal-id-label">Document ID:</span>
              <code className="modal-id-code">{getTaskId(editingTask)}</code>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  Task Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editCompleted}
                    onChange={(e) => setEditCompleted(e.target.checked)}
                  />
                  <span>Mark as Completed</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isModalSaving}
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isModalSaving}>
                  {isModalSaving ? 'Saving...' : 'Save Changes 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && actionLoadingId === null) setDeletingTask(null);
          }}
        >
          <div className="modal-content card delete-confirm-modal">
            <div className="modal-header">
              <h3 className="modal-title text-danger">⚠️ Confirm Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                disabled={actionLoadingId !== null}
                onClick={() => setDeletingTask(null)}
              >
                ✕
              </button>
            </div>

            <div className="delete-confirm-body">
              <p className="delete-warning-text">
                Are you sure you want to permanently delete this task from MongoDB?
              </p>
              <div className="delete-item-preview">
                <strong>{deletingTask.title}</strong>
                {deletingTask.description && <p>{deletingTask.description}</p>}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={actionLoadingId !== null}
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={actionLoadingId !== null}
                onClick={handleConfirmDelete}
              >
                {actionLoadingId !== null ? 'Deleting from DB...' : 'Yes, Delete Task 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};