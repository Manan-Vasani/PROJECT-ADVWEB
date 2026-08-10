# 🚀 Practical 4: Building a RESTful API with Node.js and Express

Welcome to **Practical 4**! This practical transitions our cumulative portfolio and web application suite into backend systems architecture. In this lab, we build a **RESTful Task Management Backend API** using **Node.js** and **Express**, configure an **Express Middleware Pipeline** (request logger & global error handler), and enforce standard **HTTP Status Codes** (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development (SEM-5) |
| **Practical No.** | **04** |
| **Topic** | Building a RESTful API with Node.js and Express |
| **CO / PO Mapping** | **CO2** / **PO3, PO5** |
| **Objective** | To design and implement a RESTful backend server with complete CRUD endpoints using an Express middleware pipeline. |
| **Prerequisites** | JavaScript fundamentals (functions, objects, arrays, async basics), HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), and HTTP status codes. |

---

## 🏗️ Architecture & Middleware Pipeline

```text
 Client (Browser UI / Postman / Thunder Client / cURL)
                     │
                     ▼
          [1. Request Logging Middleware]
   Logs method, URL endpoint, and ISO timestamp
                     │
                     ▼
             [2. Express Router]
  ┌──────────────────┼───────────────────┐
  ▼                  ▼                   ▼
GET /tasks       POST /tasks         PUT /tasks/:id
(getAllTasks)    (createTask)        (updateTask)
  │                  │                   │
  └──────────────────┴───────────────────┘
                     │
                     ▼
             DELETE /tasks/:id
               (deleteTask)
                     │
                     ▼
        [3. Global Error Handling Middleware]
   4-argument error interceptor returning 500 JSON
```

---

## 📋 Problem Definition & Objectives

1. **Task Management Backend**: Build a Node.js / Express backend service managing task entities.
2. **In-Memory Storage**: Store tasks dynamically in an in-memory array (`tasks`) without requiring an external database setup.
3. **Complete CRUD REST Endpoints**:
   - `GET /tasks` & `GET /tasks/:id` — Retrieve all tasks or single task by ID.
   - `POST /tasks` — Create a new task resource with unique ID generation.
   - `PUT /tasks/:id` — Update existing task properties by ID.
   - `DELETE /tasks/:id` — Remove task resource by ID.
4. **Request Logging Middleware**: Apply a global middleware logging `${req.method} ${req.url} - ${new Date().toISOString()}` for every incoming HTTP request.
5. **Global Error Handling Middleware**: Implement a 4-argument `(err, req, res, next)` error handling middleware at the end of the pipeline returning `500 Internal Server Error`.
6. **HTTP Status Codes**: Ensure strict compliance with REST standards (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

---

## 📂 Project Directory Structure

```text
4/
├── node_modules/             # Installed packages (Express, CORS, React, etc.)
├── public/                   # Static icons & favicons
├── src/                      # Source Code (React 19 + TypeScript)
│   ├── components/           # UI Components
│   │   ├── About.tsx         # About Me section layout (Practical 1)
│   │   ├── ErrorMessage.tsx  # Error alert component (Practical 3)
│   │   ├── Footer.tsx        # Portfolio footer section (Practical 1)
│   │   ├── Header.tsx        # Hero banner (Practical 1)
│   │   ├── NavBar.tsx        # [UPDATED] Navigation bar with Task Manager tab
│   │   ├── RepoList.tsx      # GitHub repository list (Practical 3)
│   │   ├── Skills.tsx        # Technical skills chart (Practical 1)
│   │   └── Spinner.tsx       # Loading spinner indicator (Practical 3)
│   ├── pages/                # Routed Views
│   │   ├── Contact.tsx       # Controlled message form (Practical 2)
│   │   ├── Home.tsx          # Home page view (Practical 1)
│   │   ├── Projects.tsx      # Public GitHub REST API integration (Practical 3)
│   │   └── Tasks.tsx         # [NEW] Full-Stack Task Manager & API Tester UI (Practical 4)
│   ├── App.css               # [UPDATED] Task Manager & Middleware monitor styles
│   ├── App.tsx               # [UPDATED] Route registration (<Route path="/tasks" />)
│   ├── index.css             # Global CSS variables & typography
│   └── main.tsx              # React DOM entry point wrapped in <BrowserRouter>
├── task-manager-api/         # [LAB SPEC] Standalone Express API folder
│   ├── package.json          # Sub-project dependencies (CommonJS)
│   └── server.js             # CommonJS Express server implementation
├── package.json              # Project scripts & dependencies
├── server.js                 # [NEW] Express RESTful backend server (ES Module)
├── test-api.js               # [NEW] Automated 17-point test runner for CRUD & Error states
├── test.http                 # [NEW] VS Code REST Client test request collection
└── README.md                 # Practical 4 Documentation
```

---

## ⚡ Step-by-Step Implementation Breakdown

### Step 1: Initialize Project & Install Express
```bash
npm install express cors
```

### Step 2: Express Server Setup (`server.js`)
```javascript
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
```

### Step 3: Global Request Logging Middleware
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});
```

### Step 4: In-Memory Data Store & CRUD Endpoints
```javascript
let tasks = [
  { id: 1, title: 'Set up Node.js and Express', completed: true },
  { id: 2, title: 'Implement CRUD Endpoints', completed: true }
];

// 1. GET /tasks (200 OK)
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// 2. POST /tasks (201 Created or 400 Bad Request)
app.post('/tasks', (req, res) => {
  const { title, description, completed } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    description: description || '',
    completed: Boolean(completed),
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// 3. PUT /tasks/:id (200 OK or 404 Not Found)
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

// 4. DELETE /tasks/:id (200 OK or 404 Not Found)
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
});
```

### Step 5: Global Error Handling Middleware
```javascript
// Global 4-argument error interceptor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', details: err.message });
});
```

---

## 📡 REST API Endpoint Specification

| HTTP Method | Endpoint | Success Status | Error Statuses | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `200 OK` | — | Server health check and API endpoint directory |
| `GET` | `/tasks` | `200 OK` | — | Retrieve all tasks (supports `?completed=true/false`) |
| `GET` | `/tasks/:id` | `200 OK` | `400 Bad Request`, `404 Not Found` | Retrieve single task resource by numerical ID |
| `POST` | `/tasks` | `201 Created` | `400 Bad Request` | Create a new task (body requires `title`) |
| `PUT` | `/tasks/:id` | `200 OK` | `400 Bad Request`, `404 Not Found` | Update task title, description, or status |
| `DELETE` | `/tasks/:id` | `200 OK` | `400 Bad Request`, `404 Not Found` | Delete task by numerical ID |
| `GET` | `/error-test` | — | `500 Internal Server Error` | Simulated endpoint to test Global Error Middleware |

---

## 🧪 Testing & Verification Guide

### 1. Start the Backend Server
```bash
# Option A (from folder 4):
npm run server

# Option B (direct node):
node server.js
```
The server will start listening at `http://localhost:5000`.

### 2. Run Automated API Test Suite
Open a second terminal window in directory `4`:
```bash
npm run test:api
```
**Output**:
```text
=====================================================
🧪 Practical 4: RESTful API Test Suite & Verification
Target Base URL: http://localhost:5000
=====================================================

1. Testing Server Root (GET /)
  ✔ PASS - Status is 200 OK

2. Testing Read Tasks (GET /tasks)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Response is an Array

3. Testing Create Task (POST /tasks)
  ✔ PASS - Status is 201 Created
  ✔ PASS - Task has valid generated ID
  ✔ PASS - Task title matches

4. Testing Create Task Validation (POST /tasks without title)
  ✔ PASS - Status is 400 Bad Request

5. Testing Read Single Task (GET /tasks/5)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Fetched task ID matches

6. Testing Update Task (PUT /tasks/5)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task completed updated to true
  ✔ PASS - Task title updated

7. Testing Delete Task (DELETE /tasks/5)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Deleted task yields 404 Not Found

8. Testing 404 Handler (GET /non-existent-route-xyz)
  ✔ PASS - Status is 404 Not Found

9. Testing Global Error Handler (GET /error-test)
  ✔ PASS - Status is 500 Internal Server Error
  ✔ PASS - Response contains error payload

=====================================================
Test Results Summary:
  Passed: 17
  Failed: 0
=====================================================
```

### 3. Start the Frontend React Client
```bash
npm run dev
```
Open `http://localhost:5173` and navigate to **Task Manager (API)** in the navigation header to view live server status, perform interactive CRUD operations, and inspect real-time request/response traffic!

---

## 💻 Manual Testing with cURL / Postman

### 1. Create Task (`POST /tasks` -> 201 Created)
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Study Express Middleware", "description": "Learn logging and error pipelines", "completed": false}'
```

### 2. Get All Tasks (`GET /tasks` -> 200 OK)
```bash
curl -X GET http://localhost:5000/tasks
```

### 3. Update Task (`PUT /tasks/1` -> 200 OK)
```bash
curl -X PUT http://localhost:5000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### 4. Delete Task (`DELETE /tasks/1` -> 200 OK)
```bash
curl -X DELETE http://localhost:5000/tasks/1
```

### 5. Trigger Global 500 Error Handler (`GET /error-test` -> 500 Server Error)
```bash
curl -X GET http://localhost:5000/error-test
```
