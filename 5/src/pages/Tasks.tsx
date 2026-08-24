import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/ErrorMessage';

export interface Task {
  _id?: string;
  id?: string | number;
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

interface ServerMetadata {
  database?: {
    status: string;
    provider: string;
    collection: string;
    uri?: string;
  };
  schema?: Record<string, string>;
}

const API_BASE_URL = 'http://localhost:5000';

export const Tasks: React.FC = () => {
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [serverMeta, setServerMeta] = useState<ServerMetadata | null>(null);

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

  // Check server health and fetch tasks from MongoDB
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Fetch metadata from root
      try {
        const metaRes = await fetch(`${API_BASE_URL}/`);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          setServerMeta(meta);
        }
      } catch {
        // Continue if meta fetch fails
      }

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

  // Helper to get task identifier
  const getTaskId = (task: Task): string => {
    return (task._id || task.id || '').toString();
  };

  // Create Task (POST /tasks) - Mongoose Schema Validation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormValidationMsg('Task title is required by Mongoose schema.');
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
        throw new Error(data.message || data.error || `HTTP ${res.status} Bad Request`);
      }

      logApiCall('POST', '/tasks', res.status, 'Created in MongoDB', duration, data);
      setTasks((prev) => [data, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      alert(`Schema Validation / Create Failed:\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completed (PUT /tasks/:id) - Status 200
  const handleToggleComplete = async (task: Task) => {
    const id = getTaskId(task);
    if (!id) return;

    const startTime = performance.now();
    try {
      const updatedPayload = { completed: !task.completed };
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update task');

      logApiCall('PUT', `/tasks/${id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? data : t)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      alert(`Update failed: ${msg}`);
    }
  };

  // Edit Task (PUT /tasks/:id) - Status 200
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const id = getTaskId(editingTask);
    if (!id) return;

    if (!editTitle.trim()) {
      alert('Task title cannot be empty (Mongoose Schema constraint).');
      return;
    }

    const startTime = performance.now();
    try {
      const updatedPayload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        completed: editCompleted
      };

      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update task');

      logApiCall('PUT', `/tasks/${id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.map((t) => (getTaskId(t) === id ? data : t)));
      setEditingTask(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      alert(`Update failed: ${msg}`);
    }
  };

  // Delete Task (DELETE /tasks/:id) - Status 200
  const handleDeleteTask = async (task: Task) => {
    const id = getTaskId(task);
    if (!id) return;

    if (!window.confirm(`Are you sure you want to delete task "${task.title}" from MongoDB?`)) {
      return;
    }

    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete task');

      logApiCall('DELETE', `/tasks/${id}`, res.status, 'OK', duration, data);
      setTasks((prev) => prev.filter((t) => getTaskId(t) !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting task';
      alert(`Delete failed: ${msg}`);
    }
  };

  // Test Schema Validation Error (POST /tasks with empty title -> Status 400)
  const handleTestValidationError = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Testing Mongoose required title validation' })
      });
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logApiCall('POST', '/tasks (no title)', res.status, 'Validation Error (400)', duration, data);
      alert(`✔ Mongoose Schema Validation Caught 400 Bad Request:\n${JSON.stringify(data, null, 2)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      logApiCall('POST', '/tasks (no title)', 0, 'Connection Failed', 0, { error: msg });
    }
  };

  // Test CastError Simulation (GET /tasks/invalid-id-xyz -> Status 400)
  const handleTestCastError = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/invalid-object-id-123`);
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logApiCall('GET', '/tasks/invalid-object-id-123', res.status, 'Invalid ID Format (400)', duration, data);
      alert(`✔ Mongoose CastError Handler Response (400 Bad Request):\n${JSON.stringify(data, null, 2)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      logApiCall('GET', '/tasks/invalid-object-id-123', 0, 'Connection Failed', 0, { error: msg });
    }
  };

  // Test 500 Error Simulation (GET /error-test)
  const handleTest500Error = async () => {
    const startTime = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/error-test`);
      const duration = Math.round(performance.now() - startTime);
      const data = await res.json();
      logApiCall('GET', '/error-test', res.status, 'Internal Server Error (500)', duration, data);
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
      logApiCall('GET', '/api/non-existent-route', res.status, 'Not Found (404)', duration, data);
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
          <span className="number">05.</span> MongoDB &amp; Mongoose Task Manager
        </h2>
        <div className="section-line"></div>
      </div>

      {/* Practical Header Card with Live Server Status */}
      <div className="practical-hero-card">
        <div className="hero-status-row">
          <div className="hero-badge-group">
            <span className="badge badge-tech">MongoDB + Mongoose ODM</span>
            <span className="badge badge-tech">Schema Validation</span>
            <span className="badge badge-tech">Express REST API</span>
          </div>

          <div className="server-status-pill">
            <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`}></span>
            <span className="status-text">
              {serverOnline === null
                ? 'Connecting to MongoDB...'
                : serverOnline
                  ? `Database: 🍃 MongoDB Connected (${serverMeta?.database?.collection || 'tasks'})`
                  : 'Backend Server: 🔴 Offline (Run `npm run dev`)'}
            </span>
          </div>
        </div>

        <p className="hero-description">
          Practical 5 transitions our REST backend to a persistent <strong>MongoDB</strong> database
          using <strong>Mongoose ODM</strong>. We enforce rigorous <strong>Schema Validation</strong> (required title,
          default completed state, automatic timestamping) and structured JSON error responses.
        </p>

        {/* Schema Validation Quick Summary */}
        <div className="schema-rules-banner">
          <span className="schema-tag">📋 <strong>Schema Rules:</strong></span>
          <span className="schema-rule-item"><code>title</code>: String (Required, Trimmed)</span>
          <span className="schema-rule-item"><code>description</code>: String (Default: "")</span>
          <span className="schema-rule-item"><code>completed</code>: Boolean (Default: false)</span>
          <span className="schema-rule-item"><code>createdAt</code>: Date (Default: Date.now)</span>
        </div>

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
            🧪 Schema &amp; Error Simulator
          </button>
          <button
            className={`view-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            📖 Mongoose API Spec &amp; cURL
          </button>
        </div>
      </div>

      {/* TAB 1: Task Management UI */}
      {activeTab === 'tasks' && (
        <div className="tasks-grid-layout">
          {/* Left Column: Create Task Form */}
          <div className="task-create-column">
            <div className="card task-form-card">
              <h3 className="card-title">➕ Create MongoDB Task</h3>
              <p className="card-subtitle">Enforces Mongoose Schema (<code>POST /tasks</code> -&gt; 201 Created)</p>

              <form onSubmit={handleCreateTask} className="task-form">
                <div className="form-group">
                  <label htmlFor="task-title" className="form-label">
                    Task Title <span className="required">*</span>
                  </label>
                  <input
                    id="task-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Design Mongoose Schema for Appointments"
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
                    placeholder="Task details persisted directly to MongoDB..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !serverOnline}
                  className="btn btn-primary btn-block"
                >
                  {isSubmitting ? 'Saving to MongoDB...' : 'Create Document 🍃'}
                </button>
              </form>
            </div>

            {/* Quick Metrics */}
            <div className="card metrics-card">
              <h4 className="metrics-title">📊 MongoDB Collection Metrics</h4>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-val">{tasks.length}</span>
                  <span className="metric-lbl">Total Documents</span>
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
                  title="Reload documents from MongoDB"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* State handling */}
              {loading ? (
                <Spinner label="Querying tasks collection from MongoDB (http://localhost:5000/tasks)..." />
              ) : error && !serverOnline ? (
                <ErrorMessage
                  title="MongoDB Backend Offline"
                  message={`Cannot connect to Express & MongoDB backend: ${error}. Make sure MongoDB is running and run 'npm run dev' to start.`}
                  onRetry={fetchTasks}
                />
              ) : filteredTasks.length === 0 ? (
                <div className="empty-tasks-placeholder">
                  <p className="empty-icon">🍃</p>
                  <p className="empty-text">No documents found matching current filter.</p>
                </div>
              ) : (
                <div className="task-items-container">
                  {filteredTasks.map((task) => {
                    const taskId = getTaskId(task);
                    return (
                      <div
                        key={taskId || task.title}
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
                              <span className="task-id-badge" title="MongoDB ObjectId">
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
                            title="Edit Document (PUT /tasks/:id)"
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
                            title="Delete Document (DELETE /tasks/:id)"
                            onClick={() => handleDeleteTask(task)}
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

      {/* TAB 2: Schema & Error Simulator */}
      {activeTab === 'tester' && (
        <div className="tester-panel">
          <div className="card tester-card">
            <h3 className="card-title">🧪 Mongoose Schema &amp; Status Code Simulator</h3>
            <p className="card-subtitle">
              Verify schema validation rules, CastError format checking, and global error handling:
            </p>

            <div className="tester-btn-grid">
              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-200">200 OK</span>
                  <h4>GET /tasks</h4>
                </div>
                <p>Retrieves all task documents directly from MongoDB.</p>
                <button className="btn btn-secondary btn-block" onClick={fetchTasks}>
                  Trigger GET /tasks
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-404">400 Bad Request</span>
                  <h4>Schema Validation Error</h4>
                </div>
                <p>Sends POST request without required <code>title</code> to test Mongoose validation.</p>
                <button className="btn btn-secondary btn-block" onClick={handleTestValidationError}>
                  Test Missing Title (400)
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-404">400 CastError</span>
                  <h4>Invalid ObjectId</h4>
                </div>
                <p>Tests Mongoose CastError handling when querying with a malformed ObjectId.</p>
                <button className="btn btn-secondary btn-block" onClick={handleTestCastError}>
                  Test Invalid ObjectId (400)
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-404">404 Not Found</span>
                  <h4>Unmatched 404 Route</h4>
                </div>
                <p>Tests the 404 route handler for non-existent endpoints.</p>
                <button className="btn btn-secondary btn-block" onClick={handleTest404Error}>
                  Trigger 404 Route
                </button>
              </div>

              <div className="tester-action-box">
                <div className="box-header">
                  <span className="status-code-badge badge-500">500 Server Error</span>
                  <h4>Global Error Handler</h4>
                </div>
                <p>Triggers <code>GET /error-test</code> to test the 4-argument error interceptor.</p>
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
            <h3 className="card-title">📖 Practical 5: MongoDB Mongoose RESTful API Spec</h3>
            <p className="card-subtitle">
              Interactive endpoints and terminal cURL snippets for testing MongoDB operations:
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
                    <td>Retrieves all documents sorted by <code>createdAt</code></td>
                  </tr>
                  <tr>
                    <td><span className="method-badge get">GET</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200</span> / <span className="status-code-badge badge-404">404</span></td>
                    <td>Retrieves single document by MongoDB ObjectId</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge post">POST</span></td>
                    <td><code>/tasks</code></td>
                    <td><span className="status-code-badge badge-201">201 Created</span></td>
                    <td>Creates document with Mongoose Schema validation</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge put">PUT</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200 OK</span></td>
                    <td>Updates document by ObjectId with schema validation</td>
                  </tr>
                  <tr>
                    <td><span className="method-badge delete">DELETE</span></td>
                    <td><code>/tasks/:id</code></td>
                    <td><span className="status-code-badge badge-200">200 OK</span></td>
                    <td>Deletes document from MongoDB by ObjectId</td>
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
                {`# 1. Read All Tasks from MongoDB
curl -X GET http://localhost:5000/tasks

# 2. Create a Document with Schema Validation
curl -X POST http://localhost:5000/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Mongoose Schema Design", "description": "Practical 5", "completed": false}'

# 3. Test Validation Error (Missing Title -> 400 Bad Request)
curl -X POST http://localhost:5000/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"description": "Missing title"}'

# 4. Update Task by MongoDB ObjectId
curl -X PUT http://localhost:5000/tasks/<OBJECT_ID> \\
  -H "Content-Type: application/json" \\
  -d '{"completed": true}'

# 5. Delete Task by MongoDB ObjectId
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
              No requests recorded yet. Interact with the UI or tester above to view live HTTP and MongoDB traffic.
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

      {/* Modern Edit Task Modal */}
      {editingTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTask(null);
          }}
        >
          <div className="modal-content card">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Edit MongoDB Document</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingTask(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-id-row">
              <span className="modal-id-label">Document ObjectId:</span>
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
                  <span>Mark as Completed in MongoDB</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};