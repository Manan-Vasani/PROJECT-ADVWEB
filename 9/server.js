import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from './models/User.js';
import Task from './models/Task.js';
import { authenticateToken } from './middleware/auth.js';
import { validateRegister, validateLogin, validateTask } from './middleware/validate.js';
import cacheService from './services/cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical9_taskmanager';
const JWT_SECRET = process.env.JWT_SECRET || 'charusat_itue301_practical9_jwt_secret_key_2026';

// 1. Core Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 2. Global Request Logger Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// 3. Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('🍃 Connected to MongoDB successfully!');
    console.log(`📦 Database URI: ${MONGO_URI}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// -------------------------------------------------------------
// Root Health & Metadata Endpoint
// -------------------------------------------------------------
app.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.status(200).json({
    project: 'Practical 9: In-Memory Caching and Query Optimization',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      name: mongoose.connection.name || 'practical9_taskmanager',
      status: states[dbState] || 'Unknown',
      connected: dbState === 1
    },
    caching: {
      enabled: true,
      engine: 'node-cache',
      ttlSeconds: 60
    },
    auth: {
      enabled: true,
      strategy: 'JWT (JSON Web Token)',
      tokenExpiry: '1h'
    },
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      tasks: ['GET /tasks', 'POST /tasks', 'GET /tasks/:id', 'PUT /tasks/:id', 'DELETE /tasks/:id']
    }
  });
});

// -------------------------------------------------------------
// Authentication Endpoints (Register, Login, Me)
// -------------------------------------------------------------

// POST /api/auth/register - Register new user with hashed password
app.post('/api/auth/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A user with this email address already exists.',
        details: ['Email is already registered']
      });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login - Authenticate user credentials and return JWT
app.post('/api/auth/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Protected route returning current user profile
app.get('/api/auth/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found.'
      });
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// Practical 9: Cache Statistics & Management Endpoints
// -------------------------------------------------------------
app.get('/api/cache/stats', (req, res) => {
  const stats = cacheService.getStats();
  res.status(200).json({
    status: 'ok',
    cachingEngine: 'node-cache (In-Memory)',
    stats
  });
});

app.post('/api/cache/clear', (req, res) => {
  cacheService.flush();
  res.status(200).json({
    status: 'ok',
    message: 'In-memory cache successfully flushed.'
  });
});

// -------------------------------------------------------------
// Protected Task Routes (With In-Memory Caching & Invalidation)
// -------------------------------------------------------------

// 1. GET /tasks - Read tasks with cache check (HIT/MISS)
app.get('/tasks', authenticateToken, async (req, res, next) => {
  try {
    const { completed, no_cache } = req.query;
    const filter = { user: req.user.id };

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    const cacheKey = `tasks_user_${req.user.id}_filter_${completed !== undefined ? completed : 'all'}`;
    const bypassCache = no_cache === 'true' || req.headers['cache-control'] === 'no-cache';

    // 1. Check in-memory cache first (node-cache)
    if (!bypassCache) {
      const { hit, data } = cacheService.get(cacheKey);
      if (hit) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.status(200).json(data);
      }
    }

    // 2. Cache MISS: Query MongoDB
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    // 3. Store result in cache
    if (!bypassCache) {
      cacheService.set(cacheKey, tasks);
    }

    res.setHeader('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// 2. GET /tasks/:id - Read single task with single-doc caching (Supplementary Problem 1)
app.get('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const { no_cache } = req.query;
    const cacheKey = `task_doc_${req.user.id}_${req.params.id}`;
    const bypassCache = no_cache === 'true' || req.headers['cache-control'] === 'no-cache';

    // 1. Check in-memory cache
    if (!bypassCache) {
      const { hit, data } = cacheService.get(cacheKey);
      if (hit) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.status(200).json(data);
      }
    }

    // 2. Query MongoDB
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id "${req.params.id}" not found.`
      });
    }

    // 3. Save to cache
    if (!bypassCache) {
      cacheService.set(cacheKey, task);
    }

    res.setHeader('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// 3. POST /tasks - Create task & invalidate cache
app.post('/tasks', authenticateToken, validateTask, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const newTask = new Task({
      user: req.user.id,
      title,
      description: description || '',
      completed: completed === true,
      priority: priority || 'medium'
    });

    const savedTask = await newTask.save();

    // Invalidate user's tasks cache after write operation
    cacheService.invalidateUser(req.user.id);
    res.setHeader('X-Cache-Invalidated', 'true');

    res.status(201).json(savedTask);
  } catch (err) {
    next(err);
  }
});

// 4. PUT /tasks/:id - Update task & invalidate cache
app.put('/tasks/:id', authenticateToken, validateTask, async (req, res, next) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id "${req.params.id}" not found.`
      });
    }

    // Invalidate user's tasks and specific task cache
    cacheService.invalidateUser(req.user.id);
    cacheService.del(`task_doc_${req.user.id}_${req.params.id}`);
    res.setHeader('X-Cache-Invalidated', 'true');

    res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /tasks/:id - Delete task & invalidate cache
app.delete('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deletedTask) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id "${req.params.id}" not found.`
      });
    }

    // Invalidate cache
    cacheService.invalidateUser(req.user.id);
    cacheService.del(`task_doc_${req.user.id}_${req.params.id}`);
    res.setHeader('X-Cache-Invalidated', 'true');

    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask
    });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// Supplementary / Error Simulation Endpoints
// -------------------------------------------------------------
app.get('/error-test', (req, res, next) => {
  const simError = new Error('Simulated internal server crash for testing 500 handler');
  next(simError);
});

// -------------------------------------------------------------
// 404 Route Not Found Handler
// -------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl || req.url}. Route not found.`
  });
});

// -------------------------------------------------------------
// Centralized Error-Handling Middleware
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  // Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: messages.join(', '),
      details: messages
    });
  }

  // Mongoose CastError (Malformed ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID Format',
      message: `Invalid ObjectId format: "${err.value}". Expected a 24-character hexadecimal string.`,
      field: err.path,
      value: err.value
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message
    });
  }

  // Duplicate Key Error (e.g., unique email)
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate Key Error',
      message: 'A document with this unique field already exists.',
      details: err.keyValue
    });
  }

  // Generic 500 Server Error
  console.error(`💥 Internal Server Error [${new Date().toISOString()}]:`, err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected internal error occurred on the server.',
    details: err.message
  });
});

// -------------------------------------------------------------
// Server Initialization
// -------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Practical 9: In-Memory Caching & Latency Server`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔐 JWT Strategy: Bearer Tokens Active`);
  console.log(`🚀 Caching Engine: node-cache (TTL: 60s)`);
  console.log(`====================================================`);
});

export default app;
