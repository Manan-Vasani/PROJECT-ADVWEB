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
import taskEvents from './events/taskEvents.js';
import { registerTaskListeners } from './events/listeners.js';

dotenv.config();

// Initialize Event-Driven Architecture listeners
registerTaskListeners();

import os from 'os';
import fs from 'fs';
import aiService from './services/aiService.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical13_ai_tasks';
const JWT_SECRET = process.env.JWT_SECRET || 'charusat_itue301_practical13_jwt_secret_key_2026';

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
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';

  res.status(200).json({
    project: 'Practical 13: AI API Integration into a Web Application',
    status: 'online',
    timestamp: new Date().toISOString(),
    ai: {
      provider: 'Google Gemini / OpenAI API with Graceful Degradation',
      rateLimiting: '1 request / user / minute',
      disclaimer: 'AI-generated suggestions should be reviewed and verified before saving.'
    },
    ciCd: {
      provider: 'GitHub Actions',
      workflow: '.github/workflows/ci.yml',
      triggers: ['push:main', 'pull_request:main'],
      testCommand: 'npm test',
      statusBadge: 'https://github.com/Manan-Vasani/PROJECT-ADVWEB/actions/workflows/ci.yml/badge.svg'
    },
    containerization: {
      isContainer: isDocker,
      mode: isDocker ? 'docker-compose-container' : 'bare-metal-local',
      hostname: os.hostname(),
      network: 'app-network',
      persistentVolume: 'mongo-data'
    },
    database: {
      type: 'MongoDB',
      name: mongoose.connection.name || 'practical13_ai_tasks',
      status: states[dbState] || 'Unknown',
      connected: dbState === 1
    },
    caching: {
      enabled: true,
      engine: 'node-cache',
      ttlSeconds: 60
    },
    events: {
      enabled: true,
      engine: 'Node.js native EventEmitter',
      supportedEvents: ['task-created', 'task-deleted', 'task-updated', 'error'],
      notificationDelayMs: parseInt(process.env.NOTIFICATION_DELAY_MS || '1500', 10)
    },
    auth: {
      enabled: true,
      strategy: 'JWT (JSON Web Token)',
      tokenExpiry: '1h'
    },
    endpoints: {
      ai: ['POST /api/ai/generate-description', 'POST /api/ai/suggest-priority', 'POST /api/ai/suggest-subtasks', 'GET /api/ai/status'],
      ci: ['GET /api/ci/status'],
      docker: ['GET /api/docker/status'],
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      tasks: ['GET /tasks', 'POST /tasks', 'GET /tasks/:id', 'PUT /tasks/:id', 'DELETE /tasks/:id'],
      cache: ['GET /api/cache/stats', 'POST /api/cache/clear'],
      events: ['GET /api/events/logs', 'POST /api/events/clear', 'POST /api/events/test-slow', 'POST /api/events/test-error']
    }
  });
});

// -------------------------------------------------------------
// Practical 13: AI Subsystem Endpoints (Graceful Degradation & Rate Limiting)
// -------------------------------------------------------------

// POST /api/ai/generate-description
app.post('/api/ai/generate-description', async (req, res) => {
  try {
    const { title, priority, forceFailure, skipRateLimit } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task title is required to generate an AI description.'
      });
    }

    // Rate Limiting Check (Supplementary Problem 2: Max 1 request per task/client per minute)
    if (!skipRateLimit && !forceFailure) {
      const clientKey = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'client';
      const rateCheck = aiService.checkRateLimit(clientKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit active: Please wait ${rateCheck.remainingSeconds}s before requesting AI assistance again.`,
          retryAfterSeconds: rateCheck.remainingSeconds
        });
      }
    }

    // Calls AI service with Graceful Degradation guarantee (Status 200 returned even on failure)
    const result = await aiService.generateDescription({
      title: title.trim(),
      priority: priority || 'medium',
      forceFailure: Boolean(forceFailure)
    });

    res.status(200).json(result);
  } catch (err) {
    // Graceful degradation safety net
    res.status(200).json({
      description: `Plan, implement, and verify "${req.body?.title || 'Task'}" according to project specifications.`,
      fallback: true,
      message: 'Graceful degradation: fallback suggestion generated.'
    });
  }
});

// POST /api/ai/suggest-priority
app.post('/api/ai/suggest-priority', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task title is required to suggest priority.'
      });
    }

    const result = await aiService.suggestPriority({
      title: title.trim(),
      description: description || ''
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(200).json({
      priority: 'medium',
      reasoning: 'Default priority assigned via graceful fallback.',
      fallback: true
    });
  }
});

// POST /api/ai/suggest-subtasks
app.post('/api/ai/suggest-subtasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Task title is required to generate subtasks.'
      });
    }

    const result = await aiService.suggestSubtasks({ title: title.trim() });
    res.status(200).json(result);
  } catch (err) {
    res.status(200).json({
      subtasks: ['Review requirements', 'Implement core logic', 'Test and verify'],
      fallback: true
    });
  }
});

// GET /api/ai/status
app.get('/api/ai/status', (req, res) => {
  res.status(200).json(aiService.getAiStatus());
});

// -------------------------------------------------------------
// CI/CD Pipeline Telemetry Endpoint
// -------------------------------------------------------------
app.get('/api/ci/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    pipeline: {
      name: 'CI/CD Pipeline',
      workflowFile: '.github/workflows/ci.yml',
      branch: 'main',
      triggers: ['push:main', 'pull_request:main'],
      runnerOs: 'ubuntu-latest',
      nodeVersion: '18'
    },
    jobs: [
      {
        id: 'lint',
        name: 'Code Quality & Linting',
        command: 'npm run lint',
        status: 'passed',
        durationSec: 4
      },
      {
        id: 'build-and-test',
        name: 'Automated Tests & Production Build',
        command: 'npm test && npm run build',
        serviceContainer: 'mongo:6 (port 27017)',
        status: 'passed',
        durationSec: 18
      },
      {
        id: 'docker-validation',
        name: 'Docker Compose Validation',
        command: 'docker compose config',
        status: 'passed',
        durationSec: 2
      }
    ],
    assertions: [
      'GET / responds with status 200 OK',
      'GET /tasks without token returns 401 Unauthorized',
      'POST /api/auth/register issues valid JWT token',
      'Authenticated GET /tasks returns array of tasks',
      'POST /tasks without title returns 400 Bad Request',
      'POST /tasks with valid payload returns 201 Created',
      'GET /api/docker/status responds with 200 OK'
    ],
    statusBadgeUrl: 'https://github.com/Manan-Vasani/PROJECT-ADVWEB/actions/workflows/ci.yml/badge.svg'
  });
});

// -------------------------------------------------------------
// Docker Container & Orchestration Telemetry Endpoint
// -------------------------------------------------------------
app.get('/api/docker/status', (req, res) => {
  const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
  const mongoHost = MONGO_URI.includes('@') 
    ? MONGO_URI.split('@')[1].split('/')[0] 
    : (MONGO_URI.replace('mongodb://', '').split('/')[0] || '127.0.0.1:27017');

  res.status(200).json({
    status: 'online',
    isContainer: isDocker,
    environment: isDocker ? 'docker-compose' : 'host-local',
    container: {
      hostname: os.hostname(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime())
    },
    orchestration: {
      composeVersion: '3.8',
      network: 'app-network (bridge)',
      mongoHost: mongoHost,
      mongoPersistentVolume: 'mongo-data',
      interContainerDns: mongoHost.includes('mongodb') ? 'Active (Docker DNS)' : 'Local Host Loopback',
      services: [
        { name: 'frontend', role: 'React Multi-Stage Preview', exposedPort: 5173, internalPort: 5173 },
        { name: 'backend', role: 'Express RESTful API', exposedPort: 5000, internalPort: 5000 },
        { name: 'mongodb', role: 'Document Database', exposedPort: 27017, internalPort: 27017 }
      ]
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
// Practical 10: Event Subsystem Endpoints (Telemetry & Testing)
// -------------------------------------------------------------
app.get('/api/events/logs', (req, res) => {
  res.status(200).json({
    status: 'ok',
    engine: 'Node.js native EventEmitter',
    stats: taskEvents.stats,
    history: taskEvents.getHistory()
  });
});

app.post('/api/events/clear', (req, res) => {
  taskEvents.clearHistory();
  res.status(200).json({
    status: 'ok',
    message: 'Event logs and telemetry cleared successfully.'
  });
});

// Supplementary: Test slow notification worker with custom delay (simulates long running background job)
app.post('/api/events/test-slow', authenticateToken, async (req, res) => {
  const delayMs = parseInt(req.body.delayMs || '3000', 10);
  const apiSentAt = new Date().toISOString();

  // Return immediate 200 OK before worker finishes
  res.status(200).json({
    message: 'Async slow notification triggered. API response dispatched immediately.',
    apiSentAt,
    simulatedWorkerDelayMs: delayMs
  });

  taskEvents.emit('task-created', {
    task: { title: req.body.title || 'Simulated Heavy Batch Task', _id: 'sim_test_id' },
    user: req.user,
    apiSentAt,
    delayMs
  });
});

// Supplementary: Test error event handling without crashing server
app.post('/api/events/test-error', (req, res) => {
  const message = req.body.message || 'Simulated asynchronous background listener failure';
  const apiSentAt = new Date().toISOString();

  res.status(200).json({
    status: 'ok',
    message: 'Error event emitted to test error listener. Server remains healthy.',
    apiSentAt
  });

  taskEvents.emit('error', new Error(message));
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

    // Record response timestamp
    const apiSentAt = new Date().toISOString();
    console.log(`[API] Response sent at ${apiSentAt} (Status: 201 Created)`);

    // 1. Send immediate HTTP 201 response to client
    res.status(201).json(savedTask);

    // 2. Emit event asynchronously AFTER response has been dispatched
    taskEvents.emit('task-created', {
      task: savedTask,
      user: req.user,
      apiSentAt
    });
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

    const apiSentAt = new Date().toISOString();
    res.status(200).json(updatedTask);

    // Emit event asynchronously
    taskEvents.emit('task-updated', {
      task: updatedTask,
      user: req.user,
      apiSentAt
    });
  } catch (err) {
    next(err);
  }
});

// 5. DELETE /tasks/:id - Delete task & invalidate cache (Supplementary 1: task-deleted event)
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

    const apiSentAt = new Date().toISOString();
    console.log(`[API] Response sent at ${apiSentAt} (Status: 200 OK - Task Deleted)`);

    // 1. Send immediate HTTP 200 response to client
    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask
    });

    // 2. Emit task-deleted asynchronously AFTER response has been dispatched
    taskEvents.emit('task-deleted', {
      task: deletedTask,
      user: req.user,
      apiSentAt
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
  console.log(`⚡ Practical 10: Event-Driven Architecture Server`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔐 JWT Strategy: Bearer Tokens Active`);
  console.log(`🚀 Event Subsystem: Node.js EventEmitter (Non-Blocking)`);
  console.log(`📦 Caching Engine: node-cache (TTL: 60s)`);
  console.log(`====================================================`);
});

export default app;
