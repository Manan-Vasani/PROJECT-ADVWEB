# 🌐 Practical 6: Full Stack Integration (React + Node.js + MongoDB)

Welcome to **Practical 6**! This milestone practical completes our full-stack engineering sequence by connecting the **React 19 Frontend Client** to the **Node.js / Express / MongoDB Backend** into a unified, reactive web application. We implement a **Centralized API Service Layer (`api.ts`)**, real-time **Full-Stack State Synchronization**, animated **Toast Notifications**, **Granular Loading Spinners**, **Deletion Safety Confirmations**, and verified **MongoDB Database Persistence**.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development (SEM-5) |
| **Practical No.** | **06** |
| **Topic** | Full Stack Integration (React + Node.js + MongoDB) |
| **CO / PO Mapping** | **CO1, CO2** / **PO3, PO5** |
| **Objective** | To wire the React frontend to the Node/Express/MongoDB backend into a fully functional, synchronized full-stack application. |
| **Prerequisites** | Practicals 1–3 completed working React UI with routing and API consumption; Practicals 4–5 completed working Node/Express/MongoDB backend with CRUD. |
| **Coursera Reference** | Week 6 IBM: Node.js & MongoDB Developing Back-end Database Applications, Module 3 (connecting frontend to backend, end-to-end API calls, full-stack flow). |

---

## 🏗️ Full-Stack System Architecture & Data Flow

```text
 ┌─────────────────────────────────────────────────────────────┐
 │               React 19 Frontend (Port 5173)                │
 │  ┌────────────────┐   ┌────────────────┐   ┌──────────────┐ │
 │  │ Task Form (UI) │   │ Task List (UI) │   │ Toast Stack  │ │
 │  └───────┬────────┘   └───────▲────────┘   └──────▲───────┘ │
 │          │                    │                   │         │
 │          ▼                    │                   │         │
 │   [Central API Service Layer: src/services/api.ts]         │
 │   • createTask()    • getTasks()    • updateTask()          │
 │   • deleteTask()    • checkServerHealth()                  │
 └───────────────────────────────┬─────────────────────────────┘
                                 │ HTTP (JSON + CORS)
                                 ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               Express Backend (Port 5000)                  │
 │  [1. CORS Middleware (app.use(cors()))]                    │
 │  [2. Request Logger Middleware]                            │
 │  [3. REST Controller Endpoints (/tasks)]                   │
 │  [4. Mongoose ODM Schema & Model Layer (Task.js)]           │
 │  [5. Global Structured Error Handler (400/404/500)]         │
 └───────────────────────────────┬─────────────────────────────┘
                                 │ Mongoose Driver (TCP)
                                 ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                MongoDB Database Server                      │
 │    Database: practical6_taskmanager                         │
 │    Collection: tasks { _id, title, description, ... }       │
 └─────────────────────────────────────────────────────────────┘
```

---

## 📋 Problem Definition & Objectives

1. **Full-Stack Wiring**: Wire the React Task UI to the Node.js + MongoDB backend built in Practicals 4 and 5.
2. **Centralized API Service**: Create `src/services/api.ts` with a configurable base URL (`http://localhost:5000`) providing typed functions (`getTasks`, `createTask`, `updateTask`, `deleteTask`, `checkServerHealth`).
3. **CORS Configuration**: Enable CORS on Express backend so the browser allows cross-origin requests from `http://localhost:5173`.
4. **End-to-End State Synchronization**:
   - **Create (POST)**: Submits task from form, inserts document to MongoDB, prepends new task to local state without requiring a full page refresh.
   - **Read (GET)**: Queries MongoDB on component mount and renders task cards.
   - **Update (PUT)**: Toggles checkbox status or edits task details, persisting to MongoDB and synchronizing UI state.
   - **Delete (DELETE)**: Displays a confirmation safety modal, deletes document from MongoDB, and removes task from state.
5. **Toast Notification System**: Dispatches auto-dismissing animated feedback toasts (`success`, `error`, `warning`, `info`) after every user action and API response.
6. **Granular Loading States**: Displays individual loading spinners on buttons and checkboxes during asynchronous mutations.
7. **Persistence Verification**: Refreshing the browser (`F5`) re-queries MongoDB, verifying that all created/edited tasks remain stored permanently.

---

## 📂 Project Directory Structure

```text
6/
├── .env                      # Environment variables (PORT, MONGO_URI, VITE_API_URL)
├── .env.example              # Template environment configuration
├── node_modules/             # Installed packages (React, Express, Mongoose, CORS, etc.)
├── models/                   # Mongoose Data Models
│   └── Task.js               # Task Mongoose schema & model definition
├── public/                   # Static icons & favicons
├── src/                      # Source Code (React 19 + TypeScript)
│   ├── components/           # UI Components
│   │   ├── About.tsx         # About Me section layout (Practical 1)
│   │   ├── ErrorMessage.tsx  # Dynamic error alert component (Practical 3)
│   │   ├── Footer.tsx        # Portfolio footer section (Practical 1)
│   │   ├── Header.tsx        # Hero banner (Practical 1)
│   │   ├── NavBar.tsx        # [UPDATED] Navigation bar with Full Stack tab
│   │   ├── RepoList.tsx      # GitHub repository list (Practical 3)
│   │   ├── Skills.tsx        # Technical skills chart (Practical 1)
│   │   ├── Spinner.tsx       # Loading spinner indicator (Practical 3)
│   │   └── Toast.tsx         # [NEW] Animated Toast Notification System
│   ├── pages/                # Routed Views
│   │   ├── Contact.tsx       # Controlled message form (Practical 2)
│   │   ├── Home.tsx          # Home page view (Practical 1)
│   │   ├── Projects.tsx      # GitHub REST API integration (Practical 3)
│   │   └── Tasks.tsx         # [UPDATED] Full-Stack Synchronized Task Manager UI
│   ├── services/             # [NEW] Service Layer
│   │   └── api.ts            # Centralized typed HTTP API client
│   ├── App.css               # [UPDATED] Full-stack toasts & granular loading styles
│   ├── App.tsx               # Route registration (<Route path="/tasks" />)
│   ├── index.css             # Global CSS variables & typography
│   └── main.tsx              # React DOM entry point
├── task-manager-api/         # Standalone Express API folder (CommonJS)
│   ├── models/Task.js        # CommonJS Task Mongoose Model
│   ├── .env                  # Sub-project environment variables
│   ├── package.json          # Sub-project dependencies
│   └── server.js             # CommonJS Express + MongoDB server
├── package.json              # Project scripts & dependencies
├── server.js                 # Express RESTful backend with MongoDB Mongoose
├── test-api.js               # [UPDATED] Automated 25-point full-stack test suite
├── test.http                 # [UPDATED] VS Code REST Client test requests
└── README.md                 # Practical 6 Documentation
```

---

## ⚡ Step-by-Step Implementation Breakdown

### Step 1: Centralized API Service (`src/services/api.ts`)
```typescript
const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

export const getTasks = async (completed?: boolean): Promise<Task[]> => {
  const url = completed !== undefined ? `${BASE_URL}/tasks?completed=${completed}` : `${BASE_URL}/tasks`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return res.json();
};

export const createTask = async (payload: CreateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Validation failed');
  return res.json();
};

export const updateTask = async (id: string, payload: UpdateTaskDto): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
};

export const deleteTask = async (id: string): Promise<{ message: string; deletedTask: Task }> => {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
};
```

### Step 2: Toast Notification System (`src/components/Toast.tsx`)
```tsx
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss
}) => (
  <div className="toast-stack">
    {toasts.map((t) => (
      <div key={t.id} className={`toast-card toast-${t.type}`}>
        <div className="toast-icon-box">{t.type === 'success' ? '✅' : '❌'}</div>
        <div className="toast-content">
          <h5 className="toast-title">{t.title}</h5>
          {t.message && <p className="toast-description">{t.message}</p>}
        </div>
        <button className="toast-close-btn" onClick={() => onDismiss(t.id)}>✕</button>
      </div>
    ))}
  </div>
);
```

### Step 3: Full-Stack React State Integration (`src/pages/Tasks.tsx`)
- **Creation**: Dispatches `createTask()`, updates `tasks` state, displays Success Toast.
- **Toggle**: Dispatches `updateTask()`, updates item completion in state, displays Info Toast.
- **Edit**: Opens modal, dispatches `updateTask()`, updates item in state, displays Success Toast.
- **Delete**: Prompts confirmation modal, dispatches `deleteTask()`, filters task from state, displays Success Toast.

---

## 🧪 Testing & Verification

### 1. Run the Automated 25-Point Test Suite
```bash
node test-api.js
```

**Expected Output:**
```text
========================================================================
🌐 Practical 6: Full Stack Integration API Test Suite (React + Express + MongoDB)
Target Base URL: http://localhost:5000
========================================================================

1. Testing Server Health & CORS Headers (GET /)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Contains Database Metadata
  ✔ PASS - Database is MongoDB
  ✔ PASS - CORS Access-Control-Allow-Origin header present

2. Testing Fetch Tasks for React Client (GET /tasks)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Response is an Array
     Fetched 4 tasks for frontend client rendering.

3. Testing Task Creation Form Submission (POST /tasks)
  ✔ PASS - Status is 201 Created
  ✔ PASS - Contains valid MongoDB _id or id
  ✔ PASS - Document title matches payload
  ✔ PASS - Default createdAt timestamp exists

4. Testing Validation Error Handled by Toast in Frontend (POST /tasks without title)
  ✔ PASS - Status is 400 Bad Request
  ✔ PASS - Returns structured Validation Error object

5. Testing Read Single Task (GET /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Fetched task ID matches created ID

6. Testing Task Status Toggle & Edit (PUT /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task completed is updated to true
  ✔ PASS - Task title is updated

7. Testing Task Deletion with UI Confirmation (DELETE /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task successfully deleted message
  ✔ PASS - Deleted task yields 404 Not Found

8. Testing CastError for Malformed ObjectId (GET /tasks/invalid-id-123)
  ✔ PASS - Status is 400 Bad Request
  ✔ PASS - Returns structured Invalid ID Format

9. Testing 404 Route Handler (GET /api/non-existent-route)
  ✔ PASS - Status is 404 Not Found

10. Testing Global 500 Error Handler Simulation (GET /error-test)
  ✔ PASS - Status is 500 Internal Server Error
  ✔ PASS - Response contains structured error details

========================================================================
Test Results Summary:
  Passed: 25
  Failed: 0
========================================================================
```

---

## ⚡ How to Run the Application

In directory `6`:
```bash
npm run dev
```

This concurrently boots:
1. **Express REST API Backend** on `http://localhost:5000` (connected to MongoDB `practical6_taskmanager`).
2. **React 19 Vite Client** on `http://localhost:5173`.

Open `http://localhost:5173` and click **Task Manager (Full Stack)** in the navbar to test live operations.

---

## 🎓 Evaluation Rubrics & Viva Questions

| Criteria (Marks) | Description |
| :--- | :--- |
| **API Connection from React (5 marks)** | React calls backend endpoints; central `api.ts` configured; CORS properly active. |
| **Create Operation (4 marks)** | New task submitted via form, persisted in MongoDB, rendered in UI with Toast. |
| **Read Operation (3 marks)** | Task list fetched on mount via `api.getTasks()` and correctly rendered. |
| **Update Operation (4 marks)** | Status toggle and modal editing update MongoDB and synchronize state with Toast. |
| **Delete Operation (4 marks)** | Confirmation dialog displayed, task removed from MongoDB, UI updated immediately. |
| **Total (20 marks)** | **Passing Threshold: 14 / 20 (70%)** |

**Q1: Why is a centralized API service module (`api.ts`) preferred over ad-hoc `fetch()` calls across components?**  
> *Answer*: A centralized service layer eliminates duplicated base URLs and headers, ensures consistent error handling/parsing, provides strong TypeScript typing, and simplifies environment switching (e.g., development vs production).

**Q2: What is CORS and why is it necessary in a full-stack application?**  
> *Answer*: Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts web applications running at one origin (`localhost:5173`) from making HTTP requests to a different origin (`localhost:5000`). Express uses `cors()` middleware to include `Access-Control-Allow-Origin` headers allowing the React client to communicate.

**Q3: Why should UI state be updated after receiving the server response rather than assuming silent success?**  
> *Answer*: Ensuring the backend confirms the write operation (returning 200/201) prevents the UI from displaying corrupted or unsaved state if a database constraint fails or network error occurs.
