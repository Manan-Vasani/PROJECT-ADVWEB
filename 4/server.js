import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Built-in and Third-Party Middlewares
app.use(cors());
app.use(express.json());

// 2. Request Logging Middleware (Applied Globally)
// Logs HTTP method, URL endpoint, and timestamp for every incoming request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 3. In-Memory Task Data Store (Temporary Storage)
let tasks = [
  {
    id: 1,
    title: 'Set up Node.js & Express Server',
    description: 'Initialize project structure, install dependencies, and configure Express app.',
    completed: true,
    createdAt: '2026-08-10T09:00:00.000Z'
  },
  {
    id: 2,
    title: 'Configure Logging & Error Middlewares',
    description: 'Implement global request logger and 4-argument error handling middleware.',
    completed: true,
    createdAt: '2026-08-10T09:30:00.000Z'
  },
  {
    id: 3,
    title: 'Implement CRUD Endpoints for Tasks',
    description: 'Build GET /tasks, POST /tasks, PUT /tasks/:id, and DELETE /tasks/:id with proper status codes.',
    completed: false,
    createdAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 4,
    title: 'Verify Endpoints with Postman / Test Suite',
    description: 'Test all HTTP status codes (200, 201, 400, 404, 500) and request pipelines.',
    completed: false,
    createdAt: '2026-08-10T10:30:00.000Z'
  }
];

// Helper to generate next unique ID
const getNextId = () => (tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1);

// ==========================================
// 4. API Endpoints & Routes
// ==========================================

// Root welcome / health route
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🚀 Task Management RESTful API is running (Practical 4)',
    endpoints: {
      'GET /tasks': 'Retrieve all tasks (supports ?completed=true/false)',
      'GET /tasks/:id': 'Retrieve a single task by ID',
      'POST /tasks': 'Create a new task (body: { title, description, completed })',
      'PUT /tasks/:id': 'Update task by ID (body: { title, description, completed })',
      'DELETE /tasks/:id': 'Delete task by ID',
      'GET /error-test': 'Simulate 500 server error to verify global error handler'
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Route 1: GET /tasks - Read all tasks (200 OK)
app.get('/tasks', (req, res) => {
  const { completed } = req.query;

  if (completed !== undefined) {
    const isCompleted = completed === 'true';
    const filteredTasks = tasks.filter((t) => t.completed === isCompleted);
    return res.status(200).json(filteredTasks);
  }

  res.status(200).json(tasks);
});

// Route 2: GET /tasks/:id - Read single task by ID (200 OK or 404 Not Found)
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid task ID. ID must be a number.' });
  }

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: `Task with ID ${id} not found.` });
  }

  res.status(200).json(task);
});

// Route 3: POST /tasks - Create a new task (201 Created or 400 Bad Request)
app.post('/tasks', (req, res) => {
  const { title, description, completed } = req.body;

  // Validation: title is required
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Validation failed: "title" is required and cannot be empty.'
    });
  }

  const newTask = {
    id: getNextId(),
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: Boolean(completed),
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Route 4: PUT /tasks/:id - Update an existing task (200 OK or 404 Not Found)
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid task ID. ID must be a number.' });
  }

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with ID ${id} not found.` });
  }

  const { title, description, completed } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
    tasks[taskIndex].title = title.trim();
  }

  if (description !== undefined) {
    tasks[taskIndex].description = typeof description === 'string' ? description.trim() : '';
  }

  if (completed !== undefined) {
    tasks[taskIndex].completed = Boolean(completed);
  }

  tasks[taskIndex].updatedAt = new Date().toISOString();

  res.status(200).json(tasks[taskIndex]);
});

// Route 5: DELETE /tasks/:id - Delete a task by ID (200 OK or 404 Not Found)
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid task ID. ID must be a number.' });
  }

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: `Task with ID ${id} not found.` });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({
    message: `Task "${deletedTask.title}" (ID: ${id}) was successfully deleted.`,
    deletedTask
  });
});

// Route 6: Error Simulation Endpoint (Triggers Global Error Handler for testing)
app.get('/error-test', (req, res, next) => {
  const simulatedError = new Error(
    'Simulated 500 Internal Server Error: Global error handler pipeline tested successfully.'
  );
  next(simulatedError);
});

// 404 Handler for Unmatched Endpoints
app.use((req, res, next) => {
  res.status(404).json({
    error: `Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`
  });
});

// 5. Global Error Handling Middleware (Applied as the final middleware)
// Express recognizes 4 arguments as an error-handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]:', err.stack);
  res.status(500).json({
    error: 'Something went wrong',
    details: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Task Manager API Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📝 Live logging enabled for all incoming requests`);
  console.log(`==================================================\n`);
});

export default app;
