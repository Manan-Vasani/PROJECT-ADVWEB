import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/Task.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical5_taskmanager';

// 1. Built-in and Third-Party Middlewares
app.use(cors());
app.use(express.json());

// 2. Request Logging Middleware (Applied Globally)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 3. Connect to MongoDB Database via Mongoose
let isDbConnected = false;

const seedInitialTasks = async () => {
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial MongoDB tasks collection...');
      await Task.create([
        {
          title: 'Connect MongoDB to Express Server',
          description: 'Install mongoose and dotenv, configure database URI connection string.',
          completed: true
        },
        {
          title: 'Design Task Mongoose Schema',
          description: 'Enforce schema types, required title validation, and default timestamps.',
          completed: true
        },
        {
          title: 'Implement MongoDB CRUD Model Operations',
          description: 'Replace in-memory array with Task.find(), Task.create(), Task.findByIdAndUpdate(), Task.findByIdAndDelete().',
          completed: true
        },
        {
          title: 'Structured Validation & Error Handling',
          description: 'Capture Mongoose ValidationError & CastError returning clean 400/404 JSON responses.',
          completed: false
        }
      ]);
      console.log('✅ Seed tasks inserted successfully into MongoDB.');
    }
  } catch (err) {
    console.error('⚠️ Could not check/seed tasks:', err.message);
  }
};

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    isDbConnected = true;
    console.log(`\n==================================================`);
    console.log(`🍃 Connected to MongoDB successfully!`);
    console.log(`📦 Database URI: ${MONGO_URI}`);
    console.log(`==================================================\n`);
    await seedInitialTasks();
  })
  .catch((err) => {
    isDbConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ Running in fallback mode. Ensure MongoDB service is running.');
  });

// ==========================================
// 4. RESTful API Endpoints & Routes
// ==========================================

// Root welcome / health & schema metadata route
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🚀 Task Management RESTful API with MongoDB & Mongoose (Practical 5)',
    database: {
      status: isDbConnected ? 'Connected' : 'Disconnected',
      provider: 'MongoDB',
      collection: 'tasks',
      uri: MONGO_URI
    },
    schema: {
      title: 'String (required, trimmed)',
      description: 'String (trimmed, default: "")',
      completed: 'Boolean (default: false)',
      createdAt: 'Date (default: Date.now)'
    },
    endpoints: {
      'GET /tasks': 'Retrieve all tasks from MongoDB (supports ?completed=true/false)',
      'GET /tasks/:id': 'Retrieve a single task by MongoDB ObjectId',
      'POST /tasks': 'Create a new task in MongoDB with Mongoose schema validation',
      'PUT /tasks/:id': 'Update task by ObjectId with schema validation',
      'DELETE /tasks/:id': 'Delete task from MongoDB by ObjectId',
      'GET /error-test': 'Simulate 500 server error to verify global error handler'
    },
    version: '2.0.0',
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
        error: 'Task not found',
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
        error: 'Task not found',
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
        error: 'Task not found',
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

// Route 6: Error Simulation Endpoint (Triggers Global Error Handler)
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

  // Mongoose Invalid ObjectId Cast Error (400 Bad Request)
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
  console.log(`🍃 Database: MongoDB with Mongoose Schema Validation`);
  console.log(`==================================================\n`);
});

export default app;
