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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical9_taskmanager';
const JWT_SECRET = process.env.JWT_SECRET || 'charusat_itue301_practical9_jwt_secret_key_2026';

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
    project: 'Practical 9: Task Manager API with In-Memory Caching (CommonJS)',
    status: 'online',
    caching: { enabled: true, engine: 'node-cache', ttlSeconds: 60 },
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

// Protected Task Routes with Caching & Invalidation
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

app.post('/tasks', authenticateToken, validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user.id });
    cacheService.invalidateUser(req.user.id);
    res.setHeader('X-Cache-Invalidated', 'true');
    res.status(201).json(task);
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

app.delete('/tasks/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });

    cacheService.invalidateUser(req.user.id);
    cacheService.del(`task_doc_${req.user.id}_${req.params.id}`);
    res.setHeader('X-Cache-Invalidated', 'true');
    res.status(200).json({ message: 'Task deleted successfully', deletedTask: deleted });
  } catch (err) { next(err); }
});

app.get('/error-test', (req, res, next) => {
  next(new Error('Simulated internal server crash'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', message: messages.join(', '), details: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID Format', message: `Invalid ObjectId format: "${err.value}"` });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate Key Error', message: 'Unique field constraint violated.' });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => console.log(`Task Manager API with In-Memory Caching running on port ${PORT}`));

module.exports = app;
