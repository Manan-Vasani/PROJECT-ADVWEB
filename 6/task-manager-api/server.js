// Practical 5: MongoDB Integration and Schema Design with Mongoose
// Standalone CommonJS Express Server (task-manager-api)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical6_taskmanager';

// 1. Built-in and Third-Party Middlewares
app.use(cors());
app.use(express.json());

// 2. Request Logging Middleware (Step 3)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 3. Connect to MongoDB Database (Step 2)
let isDbConnected = false;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    isDbConnected = true;
    console.log(`\n==================================================`);
    console.log(`🍃 Connected to MongoDB successfully!`);
    console.log(`📦 Database URI: ${MONGO_URI}`);
    console.log(`==================================================\n`);
  })
  .catch((err) => {
    isDbConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
  });

// ==========================================
// 4. RESTful CRUD Routes (Step 4)
// ==========================================

// Health & Status route
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🚀 Practical 6: Task Management Full-Stack API with MongoDB & Mongoose',
    database: {
      status: isDbConnected ? 'Connected' : 'Disconnected',
      provider: 'MongoDB',
      collection: 'tasks'
    },
    schema: {
      title: 'String (required, trimmed)',
      description: 'String (trimmed)',
      completed: 'Boolean (default: false)',
      createdAt: 'Date (default: Date.now)'
    },
    endpoints: {
      'GET /tasks': 'Retrieve all tasks from MongoDB (supports ?completed=true/false)',
      'GET /tasks/:id': 'Retrieve a single task by MongoDB ObjectId',
      'POST /tasks': 'Create a new task in MongoDB with Mongoose validation',
      'PUT /tasks/:id': 'Update task by ObjectId with schema validation',
      'DELETE /tasks/:id': 'Delete task from MongoDB by ObjectId',
      'GET /error-test': 'Simulate 500 server error to verify global error handler'
    },
    timestamp: new Date().toISOString()
  });
});

// Route 1: GET /tasks - Read all tasks from MongoDB (200 OK)
app.get('/tasks', async (req, res, next) => {
  try {
    const { completed } = req.query;
    const filter = {};

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// Route 2: GET /tasks/:id - Read single task by MongoDB ObjectId (200 OK or 404 Not Found)
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: `Task not found`,
        message: `No task found with ID "${req.params.id}".`
      });
    }
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// Route 3: POST /tasks - Create a task in MongoDB (201 Created or 400 Bad Request)
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    const newTask = new Task({
      title,
      description,
      completed
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    next(err);
  }
});

// Route 4: PUT /tasks/:id - Update an existing task in MongoDB (200 OK or 404 Not Found)
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = Boolean(completed);

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: `Task not found`,
        message: `Cannot update task: Task with ID "${req.params.id}" not found.`
      });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// Route 5: DELETE /tasks/:id - Delete a task from MongoDB (200 OK or 404 Not Found)
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        error: `Task not found`,
        message: `Cannot delete task: Task with ID "${req.params.id}" not found.`
      });
    }

    res.status(200).json({
      message: `Task "${deletedTask.title}" was successfully deleted from MongoDB.`,
      deletedTask
    });
  } catch (err) {
    next(err);
  }
});

// Route 6: Error Simulation Endpoint (500)
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
// Handles Mongoose ValidationErrors and CastErrors cleanly as structured JSON
app.use((err, req, res, next) => {
  // Mongoose Schema Validation Error (400 Bad Request)
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: validationErrors.join(', ') || 'Invalid task input data.',
      details: validationErrors
    });
  }

  // Mongoose Invalid ObjectId Cast Error (400 or 404)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID Format',
      message: `The provided ID "${err.value}" is not a valid MongoDB ObjectId.`
    });
  }

  // Generic 500 Internal Server Error
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
  console.log(`🍃 Powered by Node.js, Express & MongoDB Mongoose`);
  console.log(`==================================================\n`);
});

module.exports = app;
