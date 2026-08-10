import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

const API_BASE_URL = 'http://localhost:5000';

export const Tasks: React.FC = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  
  // Form states
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formValidationMsg, setFormValidationMsg] = useState<string | null>(null);

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCompleted, setEditCompleted] = useState<boolean>(false);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Interactive Live Request Logger
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'tester' | 'docs'>('tasks');

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

  // Check server health and fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const res = await fetch(`${API_BASE_URL}/tasks`);
      const duration = Math.round(performance.now() - startTime);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const data: Task[] = await res.json();
      setTasks(data);
      setServerOnline(true);
      logApiCall('GET', '/tasks', res.status, res.statusText || 'OK', duration, data);
    } catch (err: unknown) {
      setServerOnline(false);
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to API server.';
      setError(errMsg);
      logApiCall('GET', '/tasks', 0, 'Connection Failed', 0, { error: errMsg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create Task (POST /tasks) - Status 201
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormValidationMsg('Task title is required.');
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

      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status} Bad Request`);
      }

      logApiCall('POST', '/tasks', res.status, 'Created', duration, data);
      setTasks((prev) => [...prev, data]);
      setNewTitle('');
      setNewDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      alert(`Failed to create task: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completed (PUT /tasks/:id) - Status 200
  const handleToggleComplete = async (task: Task) => {
    const startTime = performance.now();
    try {
      const updatedPayload = { completed: !task.completed };
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      logApiCall('PUT', `/tasks/${task.id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      alert(`Update failed: ${msg}`);
    }
  };

  // Edit Task (PUT /tasks/:id) - Status 200
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    const startTime = performance.now();
    try {
      const updatedPayload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        completed: editCompleted
      };

      const res = await fetch(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      logApiCall('PUT', `/tasks/${editingTask.id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? data : t)));
      setEditingTask(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      alert(`Update failed: ${msg}`);
    }
  };

  // Delete Task (DELETE /tasks/:id) - Status 200
  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete task');

      logApiCall('DELETE', `/tasks/${id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting task';
      alert(`Delete failed: ${msg}`);
    }
  };

  // Test Error Simulation (GET /error-test) - Status 500
  const handleTest500Error = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/error-test`);
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logApiCall('GET', '/error-test', res.status, 'Internal Server Error', duration, data);
      alert(`✔ Global Error Handler Caught 500 Error:\n${JSON.stringify(data, null, 2)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      logApiCall('GET', '/error-test', 0, 'Connection Failed', 0, { error: msg });
    }
  };

  // Test 404 Route - Status 404
  const handleTest404Error = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/api/non-existent-route`);
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logApiCall('GET', '/api/non-existent-route', res.status, 'Not Found', duration, data);
      alert(`✔ 404 Route Handler Response:\n${JSON.stringify(data, null, 2)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      logApiCall('GET', '/api/non-existent-route', 0, 'Connection Failed', 0, { error: msg });
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
      <div className="section-header">
        <h2 className="section-title">
          <span className="number">04.</span> Task Manager RESTful API
        </h2>
        <div className="section-line"></div>
      </div>

      {/* Practical Header Card with Live Server Status */}
      <div className="practical-hero-card">
        <div className="hero-status-row">
          <div className="hero-badge-group">
            <span className="badge badge-tech">Node.js + Express</span>
            <span className="badge badge-tech">RESTful Middleware</span>
            <span className="badge badge-tech">CRUD Architecture</span>
          </div>

          <div className="server-status-pill">
            <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">
              {serverOnline === null
                ? 'Connecting to Server...'
                : serverOnline
                ? 'Backend Server: 🟢 Online (Port 5000)'
                : 'Backend Server: 🔴 Offline (Run `npm run server`)'}
            </span>
          </div>
        </div>

        <p className="hero-description">
          Practical 4 implements a full-fledged RESTful backend with an Express middleware pipeline
          (<strong>Request Logging</strong> &amp; <strong>Global 500 Error Handler</strong>) and
          complete CRUD operations managing tasks in memory.
        </p>

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Task Management UI
          </button>
          <button
            className={`view-tab ${activeTab === 'tester' ? 'active' : ''}`}
            onClick={() => setActiveTab('tester')}
          >
            🧪 Middleware &amp; Status Tester
          </button>
          <button
            className={`view-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            📖 API Spec &amp; cURL Snippets
          </button>
        </div>
      </div>

      {/* TAB 1: Task Management UI */}
      {activeTab === 'tasks' && (
        <div className="tasks-grid-layout">
          {/* Left Column: Create Task Form */}
          <div className="task-create-column">
            <div className="card task-form-card">
              <h3 className="card-title">➕ Create New Task</h3>
              <p className="card-subtitle">Triggers <code>POST /tasks</code> (HTTP 201 Created)</p>

              <form onSubmit={handleCreateTask} className="task-form">
                <div className="form-group">
                  <label htmlFor="task-title" className="form-label">
                    Task Title <span className="required">*</span>
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Implement Request Logger Middleware"
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
                    placeholder="Provide details about the task requirements..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !serverOnline}
                  className="btn btn-primary btn-block"
                >
                  {isSubmitting ? 'Creating Task...' : 'Create Task 🚀'}
                </button>
              </form>
            </div>

            {/* Quick Metrics */}
            <div className="card metrics-card">
              <h4 className="metrics-title">📊 Task Pipeline Overview</h4>
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
                  onClick={fetchTasks}
                  title="Reload tasks from Express server"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* State handling */}
              {loading ? (
                <Spinner label="Loading tasks from Express API (http://localhost:5000/tasks)..." />
              ) : error && !serverOnline ? (
                <ErrorMessage
                  message={`Cannot connect to Express backend server: ${error}. Make sure to run 'npm run server' in directory '4' to start the Node.js API.`}
                  onRetry={fetchTasks}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="empty-tasks-placeholder">
                  <p className="empty-icon">📝</p>
                  <p className="empty-text">No tasks found matching current filter.</p>
                </div>
              ) : (
                <div className="task-items-container">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`task-item-card ${task.completed ? 'is-completed' : ''}`}
                    >
                      <div className="task-left">
                        <input
                          type="checkbox"
                          className="task-checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleComplete(task)}
                          title="Click to toggle status (Triggers PUT /tasks/:id)"
                        />
                        <div className="task-info">
                          <div className="task-title-row">
                            <span className="task-id-badge">#{task.id}</span>
                            <h4 className="task-title-text">{task.title}</h4>
                            <span
                              className={`task-status-tag ${
                                task.completed ? 'tag-done' : 'tag-pending'
                              }`}
                            >
                              {task.completed ? 'Completed (200 OK)' : 'Pending'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="task-desc-text">{task.description}</p>
                          )}
                          {task.createdAt && (
                            <span className="task-timestamp">
                              Created: {new Date(task.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          className="btn-icon edit-btn"
                          title="Edit Task (PUT /tasks/:id)"
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
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Middleware & Status Code Tester */}
      {activeTab === 'tester' && (
        <div className="tester-panel">
          <div className="card tester-card">
            <h3 className="card-title">🧪 Express Middleware &amp; Status Code Simulator</h3>
            <p className="card-subtitle">
              Verify proper status code responses and middleware handling directly:
            </p>

            <div className="tester-btn-grid">
              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-200">200 OK</span>
                  <h4>GET /tasks</h4>
                </div>
                <p>Retrieves all task resources from the in-memory array store.</p>
                <button className="btn btn-secondary btn-block" onClick={fetchTasks}>
                  Trigger GET /tasks
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-201">201 Created</span>
                  <h4>POST /tasks</h4>
                </div>
                <p>Sends a payload to create a new task with generated ID.</p>
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setNewTitle(`Sample Task ${Date.now().toString().slice(-4)}`);
                    setActiveTab('tasks');
                  }}
                >
                  Open Create Form
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-404">404 Not Found</span>
                  <h4>Unmatched Routes</h4>
                </div>
                <p>Tests the 404 handler for invalid routes or non-existent task IDs.</p>
                <button className="btn btn-secondary btn-block" onClick={handleTest404Error}>
                  Trigger 404 Route
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-500">500 Server Error</span>
                  <h4>Global Error Handler</h4>
                </div>
                <p>Triggers <code>GET /error-test</code> to verify the 4-arg error middleware.</p>
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
            <h3 className="card-title">📖 Practical 4 RESTful API Specification</h3>
            <p className="card-subtitle">
              Ready-to-use cURL commands for testing with Terminal, Postman, or Thunder Client:
            </p>

            <div className="api-spec-table-container">
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/tasks</code></td>
                    <td><span className="status-code-badge badge-200">200 OK</span></td>
                    <td>Returns array of all tasks in memory</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200</span> / <span className="status-code-badge badge-404">404</span></td>
                    <td>Returns single task by ID or 404 if not found</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge post">POST</span></td>
                    <td><code>/tasks</code></td>
                    <td><span className="status-code-badge badge-201">201 Created</span></td>
                    <td>Creates task with JSON body: <code>{`{ "title": "..." }`}</code></td>
                  </tr>
                  <tr>
                    <td><span className="method-badge put">PUT</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200 OK</span></td>
                    <td>Updates task properties by ID</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge delete">DELETE</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200 OK</span></td>
                    <td>Deletes task from array by ID</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/error-test</code></td>
                    <td><span className="status-code-badge badge-500">500 Server Error</span></td>
                    <td>Simulates unhandled error for Global Error Handler</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="docs-subheading">💻 Terminal cURL Commands</h4>
            <div className="curl-box">
              <pre>
{`# 1. Read All Tasks
curl -X GET http://localhost:5000/tasks

# 2. Create a New Task
curl -X POST http://localhost:5000/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Study Express Middleware", "description": "Practical 4"}'

# 3. Update a Task
curl -X PUT http://localhost:5000/tasks/1 \\
  -H "Content-Type: application/json" \\
  -d '{"completed": true}'

# 4. Delete a Task
curl -X DELETE http://localhost:5000/tasks/1

# 5. Test 500 Global Error Handler
curl -X GET http://localhost:5000/error-test`}
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
            <h4 className="log-title">🖥️ Express Request / Response Live Monitor</h4>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Edit Task Modal */}
      {editingTask && (
        <div 
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTask(null);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-card">
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-header-brand">
                  <div className="modal-icon-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="modal-title-row">
                      <h3 className="modal-title">Edit Task</h3>
                      <span className="modal-id-chip">#{editingTask.id}</span>
                    </div>
                    <div className="modal-meta-row">
                      <span className="method-badge put">PUT</span>
                      <code className="modal-endpoint-pill">/tasks/{editingTask.id}</code>
                      <span className="status-code-badge badge-200">200 OK</span>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setEditingTask(null)}
                  title="Close modal (Esc)"
                  aria-label="Close modal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEdit} className="modal-form">
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-edit-title">
                      Task Title <span className="required">*</span>
                    </label>
                    <input
                      id="modal-edit-title"
                      type="text"
                      className="form-input modal-input"
                      placeholder="Enter task title..."
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-edit-desc">
                      Description <span className="label-optional">(Optional)</span>
                    </label>
                    <textarea
                      id="modal-edit-desc"
                      className="form-input form-textarea modal-textarea"
                      rows={4}
                      placeholder="Provide detailed context or checklist for this task..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Interactive Status Toggle Card */}
                  <div className="modal-status-toggle-card">
                    <label className="status-checkbox-label" htmlFor="modal-edit-status">
                      <input
                        id="modal-edit-status"
                        type="checkbox"
                        className="task-checkbox modal-checkbox"
                        checked={editCompleted}
                        onChange={(e) => setEditCompleted(e.target.checked)}
                      />
                      <div className="status-toggle-text">
                        <span className="status-toggle-heading">Completion Status</span>
                        <span className="status-toggle-sub">
                          {editCompleted ? 'Marked as Completed & Resolved' : 'Marked as Incomplete / In Progress'}
                        </span>
                      </div>
                    </label>

                    <span className={`task-status-tag ${editCompleted ? 'tag-done' : 'tag-pending'}`}>
                      {editCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary modal-btn-cancel"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary modal-btn-save">
                    Save Changes 💾
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
