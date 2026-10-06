const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Task = require('./models/Task');
const { authenticateToken } = require('./middleware/auth');
const { validateRegister, validateLogin, validateTask } = require('./middleware/validate');
const cacheService = require('./services/cache');
const taskEvents = require('./events');
const registerTaskListeners = require('./listeners');

dotenv.config();

// Initialize Event-Driven Architecture listeners
registerTaskListeners();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical10_taskmanager';
const JWT_SECRET = process.env.JWT_SECRET || 'charusat_itue301_practical10_jwt_secret_key_2026';

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// Connect MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// Health Route
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'Practical 10: Task Manager API with Event-Driven Architecture (CommonJS)',
    status: 'online',
    caching: { enabled: true, engine: 'node-cache', ttlSeconds: 60 },
    events: { enabled: true, engine: 'Node.js native EventEmitter', supportedEvents: ['task-created', 'task-deleted', 'error'] },
    auth: { strategy: 'JWT', tokenExpiry: '1h' }
  });
});

// Cache Stats Endpoints
app.get('/api/cache/stats', (req, res) => {
  res.status(200).json({ status: 'ok', stats: cacheService.getStats() });
});

app.post('/api/cache/clear', (req, res) => {
  cacheService.flush();
  res.status(200).json({ status: 'ok', message: 'Cache flushed successfully' });
});

// Event Telemetry Endpoints
app.get('/api/events/logs', (req, res) => {
  res.status(200).json({ status: 'ok', stats: taskEvents.stats, history: taskEvents.getHistory() });
});

app.post('/api/events/clear', (req, res) => {
  taskEvents.clearHistory();
  res.status(200).json({ status: 'ok', message: 'Event logs cleared successfully' });
});

app.post('/api/events/test-slow', authenticateToken, (req, res) => {
  const delayMs = parseInt(req.body.delayMs || '3000', 10);
  const apiSentAt = new Date().toISOString();
  res.status(200).json({ message: 'Async slow task triggered. API response dispatched immediately.', apiSentAt });
  taskEvents.emit('task-created', {
    task: { title: req.body.title || 'Simulated Heavy Batch Task', _id: 'sim_test_id' },
    user: req.user,
    apiSentAt,
    delayMs
  });
});

app.post('/api/events/test-error', (req, res) => {
  taskEvents.emit('error', new Error(req.body.message || 'Simulated background worker failure'));
  res.status(200).json({ status: 'ok', message: 'Error event emitted and safely caught by listener' });
});

// Auth Routes
app.post('/api/auth/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Validation Error', message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User registered successfully', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

app.post('/api/auth/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

app.get('/api/auth/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    res.status(200).json({ user });
  } catch (err) { next(err); }
});

// Task Routes with Caching and EventEmitter Background Processing
app.get('/tasks', authenticateToken, async (req, res, next) => {
  try {
    const { completed, no_cache } = req.query;
    const cacheKey = `tasks_user_${req.user.id}_filter_${completed !== undefined ? completed : 'all'}`;
    const bypass = no_cache === 'true' || req.headers['cache-control'] === 'no-cache';

    if (!bypass) {
      const { hit, data } = cacheService.get(cacheKey);
      if (hit) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(data);
      }
    }

    const filter = { user: req.user.id };
    if (completed !== undefined) filter.completed = completed === 'true';
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    if (!bypass) {
      cacheService.set(cacheKey, tasks);
    }

    res.setHeader('X-Cache', bypass ? 'BYPASS' : 'MISS');
    res.status(200).json(tasks);
  } catch (err) { next(err); }
});

app.get('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const { no_cache } = req.query;
    const cacheKey = `task_doc_${req.user.id}_${req.params.id}`;
    const bypass = no_cache === 'true' || req.headers['cache-control'] === 'no-cache';

    if (!bypass) {
      const { hit, data } = cacheService.get(cacheKey);
      if (hit) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(data);
      }
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });

    if (!bypass) {
      cacheService.set(cacheKey, task);
    }

    res.setHeader('X-Cache', bypass ? 'BYPASS' : 'MISS');
    res.status(200).json(task);
  } catch (err) { next(err); }
});

// POST /tasks - Save task, send immediate 201 response, emit task-created event asynchronously
app.post('/tasks', authenticateToken, validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    cacheService.invalidateUser(req.user.id);
    res.setHeader('X-Cache-Invalidated', 'true');

    // 1. Record timestamp and respond immediately
    const apiSentAt = new Date().toISOString();
    console.log(`[API] Response sent at ${apiSentAt} (Status: 201 Created)`);
    res.status(201).json(task);

    // 2. Emit event asynchronously AFTER response
    taskEvents.emit('task-created', { task, user: req.user, apiSentAt });
  } catch (err) { next(err); }
});

app.put('/tasks/:id', authenticateToken, validateTask, async (req, res, next) => {
  try {
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { returnDocument: 'after', runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });

    cacheService.invalidateUser(req.user.id);
    cacheService.del(`task_doc_${req.user.id}_${req.params.id}`);
    res.setHeader('X-Cache-Invalidated', 'true');
    res.status(200).json(updated);
  } catch (err) { next(err); }
});

// DELETE /tasks/:id - Delete task, send immediate 200 response, emit task-deleted event asynchronously
app.delete('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });

    cacheService.invalidateUser(req.user.id);
    cacheService.del(`task_doc_${req.user.id}_${req.params.id}`);
    res.setHeader('X-Cache-Invalidated', 'true');

    // 1. Record timestamp and respond immediately
    const apiSentAt = new Date().toISOString();
    console.log(`[API] Response sent at ${apiSentAt} (Status: 200 OK - Task Deleted)`);
    res.status(200).json({ message: 'Task deleted successfully', deletedTask: deleted });

    // 2. Emit event asynchronously AFTER response
    taskEvents.emit('task-deleted', { task: deleted, user: req.user, apiSentAt });
  } catch (err) { next(err); }
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', message: messages.join(', '), details: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID Format', message: `Invalid ObjectId: "${err.value}"` });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Practical 10: Event-Driven Architecture Server (CommonJS)`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔐 JWT Strategy: Bearer Tokens Active`);
  console.log(`🚀 Event Subsystem: Node.js EventEmitter (Non-Blocking)`);
  console.log(`📦 Caching Engine: node-cache (TTL: 60s)`);
  console.log(`====================================================`);
});

module.exports = app;
