# 🍃 Practical 5: MongoDB Integration and Schema Design with Mongoose

Welcome to **Practical 5**! This practical advances our backend systems architecture by replacing temporary in-memory storage with a persistent **MongoDB NoSQL Database** integrated using **Mongoose ODM (Object Data Modeling)**. We implement strict **Mongoose Schema Validation**, default fields, structured JSON error handling (`400 Bad Request`, `404 Not Found`, `500 Server Error`), and connect our React full-stack frontend with live MongoDB document persistence.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development (SEM-5) |
| **Practical No.** | **05** |
| **Topic** | MongoDB Integration and Schema Design with Mongoose |
| **CO / PO Mapping** | **CO2, CO3** / **PO3, PO5** |
| **Objective** | To connect a MongoDB database to an Express server and enforce data validation through Mongoose schema. |
| **Prerequisites** | Practical 4 completed working Express server with in-memory CRUD; Basic understanding of NoSQL/document-based data (vs relational tables). |
| **Coursera Reference** | Week 5 IBM: Node.js & MongoDB Developing Back-end Database Applications, Module 2 (data and databases intro, MongoDB CRUD operations, Mongoose schema design and validation). |

---

## 🏗️ Architecture & Database Flow

```text
 Client (Browser UI / Postman / Thunder Client / cURL)
                     │
                     ▼
          [1. Request Logging Middleware]
    Logs method, URL endpoint, and ISO timestamp
                     │
                     ▼
          [2. Mongoose Schema Validator]
   Enforces: title (required, trim), completed (default: false),
             createdAt (default: Date.now)
                     │
          ┌──────────┴──────────┐
          │ Passes Validation   │ Fails Validation
          ▼                     ▼
  [3. Express Router]    400 Bad Request (JSON)
  ┌───────┼───────┐
  ▼       ▼       ▼
Task.   Task.   Task.
find() create() findByIdAndUpdate()
  │       │       │
  └───────┼───────┘
          ▼
   Task.findByIdAndDelete()
          │
          ▼
[4. MongoDB Database (`tasks` collection)]
          │
          ▼
[5. Global Error Handling Middleware]
   Intercepts ValidationError, CastError, and 500
```

---

## 📋 Problem Definition & Objectives

1. **MongoDB Connection**: Connect Express to MongoDB using Mongoose with `dotenv` environment variables (`MONGO_URI`).
2. **Mongoose Schema Design**: Define a Task schema with at least 4 fields in `models/Task.js`:
   - `title`: `String` (Required, Trimmed, Minlength: 1)
   - `description`: `String` (Trimmed, Default: `""`)
   - `completed`: `Boolean` (Default: `false`)
   - `createdAt`: `Date` (Default: `Date.now`)
3. **Database Model Operations**: Replace in-memory array logic with real Mongoose model operations:
   - `Task.find()`
   - `Task.create()` / `new Task().save()`
   - `Task.findById()`
   - `Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })`
   - `Task.findByIdAndDelete(id)`
4. **Structured JSON Validation Error Responses**: Intercept Mongoose `ValidationError` and `CastError` to return clean `400 Bad Request` structured JSON objects instead of unformatted crash logs.
5. **Full-Stack Integration & Testing**: Connect the interactive React frontend to live MongoDB documents, provide automated test suite (`test-api.js`), and REST Client tests (`test.http`).

---

## 📂 Project Directory Structure

```text
5/
├── .env                      # Environment variables (PORT, MONGO_URI)
├── .env.example              # Template environment file
├── node_modules/             # Installed packages (Express, Mongoose, CORS, React, etc.)
├── models/                   # [NEW] Mongoose Data Models (ES Module)
│   └── Task.js               # Task Mongoose schema & model definition
├── public/                   # Static icons & favicons
├── src/                      # Source Code (React 19 + TypeScript)
│   ├── components/           # UI Components
│   │   ├── About.tsx         # About Me section layout (Practical 1)
│   │   ├── ErrorMessage.tsx  # Dynamic error alert component (Practical 3/4/5)
│   │   ├── Footer.tsx        # Portfolio footer section (Practical 1)
│   │   ├── Header.tsx        # Hero banner (Practical 1)
│   │   ├── NavBar.tsx        # [UPDATED] Navigation bar with MongoDB Task Manager tab
│   │   ├── RepoList.tsx      # GitHub repository list (Practical 3)
│   │   ├── Skills.tsx        # Technical skills chart (Practical 1)
│   │   └── Spinner.tsx       # Loading spinner indicator (Practical 3)
│   ├── pages/                # Routed Views
│   │   ├── Contact.tsx       # Controlled message form (Practical 2)
│   │   ├── Home.tsx          # Home page view (Practical 1)
│   │   ├── Projects.tsx      # Public GitHub REST API integration (Practical 3)
│   │   └── Tasks.tsx         # [UPDATED] Full-Stack MongoDB Task Manager & Schema Tester
│   ├── App.css               # [UPDATED] MongoDB & Schema validation styling
│   ├── App.tsx               # Route registration (<Route path="/tasks" />)
│   ├── index.css             # Global CSS variables & typography
│   └── main.tsx              # React DOM entry point wrapped in <BrowserRouter>
├── task-manager-api/         # [LAB SPEC] Standalone Express API folder (CommonJS)
│   ├── models/
│   │   └── Task.js           # CommonJS Task Mongoose Model
│   ├── .env                  # Sub-project environment variables
│   ├── package.json          # Sub-project dependencies (CommonJS)
│   └── server.js             # CommonJS Express + MongoDB server implementation
├── package.json              # Project scripts & dependencies (concurrently, mongoose)
├── server.js                 # [UPDATED] Express RESTful backend with MongoDB Mongoose
├── test-api.js               # [UPDATED] Automated 24-point MongoDB CRUD & Schema test suite
├── test.http                 # [UPDATED] VS Code REST Client MongoDB test requests
└── README.md                 # Practical 5 Documentation
```

---

## ⚡ Step-by-Step Implementation Breakdown

### Step 1: Install Dependencies
```bash
npm install mongoose dotenv
```

### Step 2: Configure Environment (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/practical5_taskmanager
```

### Step 3: Define Mongoose Schema (`models/Task.js`)
```javascript
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required and cannot be empty'],
    trim: true,
    minlength: [1, 'Task title must contain at least 1 character']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
```

### Step 4: Connect to MongoDB & Implement CRUD Routes (`server.js`)
```javascript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/Task.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical5_taskmanager';

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('🍃 Connected to MongoDB successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// 1. GET /tasks - Read all documents
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) { next(err); }
});

// 2. POST /tasks - Create document with Schema Validation
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;
    const newTask = new Task({ title, description, completed });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) { next(err); }
});

// 3. PUT /tasks/:id - Update document by ObjectId
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json(updated);
  } catch (err) { next(err); }
});

// 4. DELETE /tasks/:id - Delete document by ObjectId
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(200).json({ message: 'Task deleted successfully', deletedTask: deleted });
  } catch (err) { next(err); }
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation Error', message: messages.join(', '), details: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID Format', message: `Invalid ObjectId "${err.value}"` });
  }
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 🧪 Testing & Verification

### 1. Automated Test Suite (24 Test Cases)
Run the automated test runner:
```bash
node test-api.js
```

**Expected Output:**
```text
================================================================
🍃 Practical 5: MongoDB & Mongoose RESTful API Test Suite
Target Base URL: http://localhost:5000
================================================================

1. Testing Server Root (GET /)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Contains Database Metadata
  ✔ PASS - Database is MongoDB

2. Testing Read Tasks (GET /tasks)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Response is an Array
     Fetched 4 tasks from MongoDB collection.

3. Testing Create Task with Schema Validation (POST /tasks)
  ✔ PASS - Status is 201 Created
  ✔ PASS - Contains valid MongoDB _id or id
  ✔ PASS - Document title matches
  ✔ PASS - Default createdAt exists

4. Testing Mongoose Validation Rejection (POST /tasks without title)
  ✔ PASS - Status is 400 Bad Request
  ✔ PASS - Returns structured Validation Error

5. Testing Read Single Task (GET /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Fetched task ID matches created ID

6. Testing Update Task (PUT /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task completed is updated to true
  ✔ PASS - Task title is updated

7. Testing Delete Task (DELETE /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task successfully deleted message
  ✔ PASS - Deleted task yields 404 Not Found

8. Testing CastError for Malformed ObjectId (GET /tasks/invalid-id-xyz)
  ✔ PASS - Status is 400 Bad Request
  ✔ PASS - Returns structured Invalid ID Format

9. Testing 404 Handler (GET /api/non-existent-route)
  ✔ PASS - Status is 404 Not Found

10. Testing Global 500 Error Handler (GET /error-test)
  ✔ PASS - Status is 500 Internal Server Error
  ✔ PASS - Response contains structured error message

================================================================
Test Results Summary:
  Passed: 24
  Failed: 0
================================================================
```

### 2. Start Full-Stack App
```bash
npm run dev
```
Open `http://localhost:5173` and navigate to **Task Manager (MongoDB)** to interact with the database UI.

---

## 💻 Manual Testing with cURL

### 1. Create Document (`POST /tasks` -> 201 Created)
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Implement Schema Validation", "description": "Practical 5 MongoDB", "completed": false}'
```

### 2. Test Validation Failure (`POST /tasks` without title -> 400 Bad Request)
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{"description": "Missing title"}'
```

### 3. Get All Documents (`GET /tasks` -> 200 OK)
```bash
curl -X GET http://localhost:5000/tasks
```

### 4. Update Document by ObjectId (`PUT /tasks/:id` -> 200 OK)
```bash
curl -X PUT http://localhost:5000/tasks/<OBJECT_ID> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### 5. Delete Document (`DELETE /tasks/:id` -> 200 OK)
```bash
curl -X DELETE http://localhost:5000/tasks/<OBJECT_ID>
```

---

## 🎓 Viva Questions & Answers

**Q1: What is Mongoose and why do we use it with MongoDB?**  
> *Answer*: Mongoose is an Object Data Modeling (ODM) library for Node.js and MongoDB. It provides schema-based data modeling, type casting, validation, query building, and business logic hooks before data reaches the database.

**Q2: What is the purpose of Schema Validation in Mongoose?**  
> *Answer*: Although MongoDB is natively schema-less, Mongoose schemas enforce data integrity (e.g. required fields, types, default values, min/max lengths) at the application layer before documents are persisted.

**Q3: How are Mongoose validation errors caught and handled?**  
> *Answer*: Mongoose throws a `ValidationError` when document properties fail constraints. In our global error middleware, we check `err.name === 'ValidationError'`, extract the error messages, and return a clean `400 Bad Request` structured JSON object.

**Q4: What is a `CastError` in Mongoose?**  
> *Answer*: A `CastError` occurs when Mongoose fails to convert a provided parameter (e.g., an invalid string in `req.params.id`) into the expected data type, such as a 24-character hex `ObjectId`.
