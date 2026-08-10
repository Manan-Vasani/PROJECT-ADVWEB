// Practical 4: Building a RESTful API with Node.js and Express
// Task Manager API (task-manager-api)

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Built-in and Third-Party Middlewares
app.use(cors());
app.use(express.json());

// 2. Request Logging Middleware (Step 3)
// Logs method, URL, and timestamp for every incoming request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// 3. In-Memory Array for temporary task storage (Step 4)
let tasks = [
  { id: 1, title: 'Set up Node.js and Express', completed: true },
  { id: 2, title: 'Implement CRUD Endpoints', completed: true },
  { id: 3, title: 'Add Request Logging Middleware', completed: true },
  { id: 4, title: 'Add Global Error Handling Middleware', completed: false }
];

// Helper to generate new IDs
const getNextId = () => (tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1);

// ==========================================
// 4. CRUD Routes (Step 4)
// ==========================================

// GET /tasks - Get all tasks (200 OK)
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// GET /tasks/:id - Get task by ID (200 OK or 404 Not Found)
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(200).json(task);
});

// POST /tasks - Create a task (201 Created or 400 Bad Request)
app.post('/tasks', (req, res) => {
  const { title, description, completed } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
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

// PUT /tasks/:id - Update a task (200 OK or 404 Not Found)
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, completed } = req.body;
  if (title !== undefined) tasks[taskIndex].title = title.trim();
  if (description !== undefined) tasks[taskIndex].description = description.trim();
  if (completed !== undefined) tasks[taskIndex].completed = Boolean(completed);

  res.status(200).json(tasks[taskIndex]);
});

// DELETE /tasks/:id - Delete a task (200 OK or 404 Not Found)
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
});

// Test route to verify 500 error handling
app.get('/error-test', (req, res, next) => {
  const error = new Error('Test server error');
  next(error);
});

// 5. Global Error Handling Middleware (Step 5)
// Applied as the last middleware in the pipeline
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', message: err.message });
});

// Step 2: Listen on Port 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
