# Project & Workflow Guidelines: Progressive Practical Development Pattern

## 📌 Architecture & Folder Pattern Overview

This repository (`PROJECT-ADVWEB`) follows a **progressive cumulative practical structure** where each practical folder builds directly upon all previous practicals.

### Progressive Inheritance Rule
> **Folder `N` = (Folder `N-1` Complete Baseline) + (New Practical `N` Requirements)**

---

## 📂 Current Practical Breakdown

### 1. [Folder `1/`](file:///d:/SEM-5/PROJECT-ADVWEB/1) — Practical 1 (Base Project)
- **Topic**: React + TypeScript Component Fundamentals & Props.
- **Contents**:
  - Reusable layout components: `Header.tsx`, `About.tsx`, `Skills.tsx`, `Footer.tsx`, `NavBar.tsx`.
  - Student portfolio data structure passed down via props.
  - Apple design system typography, CSS variables, and layout.

### 2. [Folder `2/`](file:///d:/SEM-5/PROJECT-ADVWEB/2) — Practical 2 (Practical 1 + Routing & State)
- **Topic**: Multi-Page Routing (`react-router-dom`) & `useState` Hook.
- **Includes**: Everything from Practical 1 PLUS:
  - `react-router-dom` client-side navigation (`<BrowserRouter>`, `<Routes>`, `<Route>`).
  - Distinct routed page views under `src/pages/`: `Home.tsx`, `Projects.tsx`, `Contact.tsx`.
  - `useState` controlled form with real-time keystroke preview.
  - `useState` UI visibility toggle guide box.

### 3. [Folder `3/`](file:///d:/SEM-5/PROJECT-ADVWEB/3) — Practical 3 (Practical 1 + 2 + API Integration)
- **Topic**: REST API Integration, `useEffect` Hook & Asynchronous States.
- **Includes**: Everything from Practical 1 & 2 PLUS:
  - Public REST API consumption (`https://api.github.com/users/<username>/repos`) triggered on mount via `useEffect`.
  - Tri-state asynchronous lifecycle management (`repos`, `loading`, `error`) via `useState`.
  - `<Spinner />`: CSS loading ring shown during active requests.
  - `<ErrorMessage />`: Error alert banner with interactive retry trigger.
  - `<RepoList />`: Dynamic repository cards rendering repo `name`, `html_url`, language, and stars.
  - Interactive username search form and "Test Error State" toggle for happy/error path verification.

### 4. [Folder `4/`](file:///d:/SEM-5/PROJECT-ADVWEB/4) — Practical 4 (Practical 1 + 2 + 3 + RESTful API Backend)
- **Topic**: Building a RESTful API with Node.js and Express.
- **Includes**: Everything from Practical 1, 2 & 3 PLUS:
  - Node.js & Express RESTful backend (`server.js`, `task-manager-api/server.js`) on Port 5000.
  - Global Request Logging middleware logging `${req.method} ${req.url} - ${timestamp}`.
  - In-memory array task data store with complete CRUD REST endpoints (`GET`, `POST`, `PUT`, `DELETE`).
  - Global 4-argument error handling middleware returning `500 Internal Server Error`.
  - Strict HTTP status code handling (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Server Error`).
  - Interactive full-stack Task Management UI (`Tasks.tsx`) with real-time request/response console.
  - Automated 17-point test runner (`test-api.js`) and REST Client collection (`test.http`).

### 5. [Folder `5/`](file:///d:/SEM-5/PROJECT-ADVWEB/5) — Practical 5 (Practical 1 + 2 + 3 + 4 + MongoDB & Mongoose)
- **Topic**: MongoDB Integration and Schema Design with Mongoose.
- **Includes**: Everything from Practical 1, 2, 3 & 4 PLUS:
  - MongoDB connection using Mongoose ODM with configurable `.env` (`MONGO_URI`).
  - Mongoose `Task` schema & model with 4 fields: `title` (required, trimmed), `description`, `completed` (default false), and `createdAt` (default Date.now).
  - Database model operations replacing in-memory array (`Task.find()`, `Task.create()`, `Task.findByIdAndUpdate()`, `Task.findByIdAndDelete()`).
  - Structured JSON validation error handling intercepting Mongoose `ValidationError` (400 Bad Request) and `CastError` (400 Invalid ID).
  - Full-stack React Task Management UI (`Tasks.tsx`) reflecting live MongoDB connection, ObjectId support, and schema simulator.
  - Automated 24-point test runner (`test-api.js`) and REST Client collection (`test.http`).

### 6. [Folder `6/`](file:///d:/SEM-5/PROJECT-ADVWEB/6) — Practical 6 (Practical 1 + 2 + 3 + 4 + 5 + Full-Stack Integration)
- **Topic**: Full Stack Integration (React + Node.js + MongoDB).
- **Includes**: Everything from Practical 1, 2, 3, 4 & 5 PLUS:
  - Centralized typed API service layer (`src/services/api.ts`) managing all backend HTTP communication.
  - Animated Toast Notification system (`src/components/Toast.tsx`) providing auto-dismissing visual feedback on all CRUD mutations.
  - Granular per-item loading states for asynchronous toggling, creation, and modal editing.
  - Deletion safety confirmation modal preventing accidental document loss.
  - Verified end-to-end state synchronization with MongoDB persistence across browser refreshes (`F5`).
  - Automated 25-point full-stack test runner (`test-api.js`) and REST Client collection (`test.http`).

---

## 🚀 Instructions for Future Practicals (Folder `5/`, `6/`, etc.)

Whenever creating or working on a new practical folder `N`:
1. **Initialize Baseline**: Copy the complete working codebase from folder `N-1` into the new folder `N`.
2. **Install Dependencies**: Ensure dependencies are installed in folder `N`.
3. **Implement Incremental Feature**: Implement the new Practical `N` objectives without breaking or removing features inherited from earlier practicals.
4. **Maintain Design Consistency**: Reuse existing CSS tokens, typography, and component styling.
5. **Verify**: Always run `npm run build` in the new practical folder to confirm clean compilation and test any backend servers or test suites.
