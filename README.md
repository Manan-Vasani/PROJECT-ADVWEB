# 🚀 Advanced Web Development Frameworks (ITUE301) — Practical Lab Repository

Welcome to the comprehensive university laboratory repository for **Advanced Web Development Frameworks (ITUE301)** (B.Tech Information Technology, Semester 5, CHARUSAT).

This repository follows a strict **Progressive Practical Architecture Pattern**, where each practical folder inherits the complete working state of the preceding practical and introduces the new concepts and features incrementally:

$$\text{Folder } N = (\text{Folder } N-1 \text{ Complete Baseline}) + (\text{Practical } N \text{ Requirements})$$

---

## 📂 Laboratory Practicals Directory & Index

| Folder | Practical | Topic | Key Concepts & Additions | Status |
| :---: | :--- | :--- | :--- | :---: |
| **[`1/`](./1)** | **Practical 01** | **React & Component Architecture** | Functional components, TypeScript interfaces, props data flow, Apple design system (`Header`, `About`, `Skills`, `Footer`, `NavBar`). | ✅ Complete |
| **[`2/`](./2)** | **Practical 02** | **State Management & Routing** | `react-router-dom` multi-page navigation (`Home`, `Projects`, `Contact`), `useState` controlled form with real-time preview, toggle guide box. | ✅ Complete |
| **[`3/`](./3)** | **Practical 03** | **REST API Integration** | GitHub REST API consumption via `useEffect`, tri-state async lifecycle (`repos`, `loading`, `error`), `<Spinner />`, `<ErrorMessage />`, `<RepoList />`. | ✅ Complete |
| **[`4/`](./4)** | **Practical 04** | **RESTful API with Node & Express** | Express REST server on Port 5000, Request Logger middleware, global 500 error handler, in-memory CRUD routes, HTTP status code discipline, 17-point test runner. | ✅ Complete |
| **[`5/`](./5)** | **Practical 05** | **MongoDB & Mongoose Schema Design** | MongoDB connection via Mongoose ODM, `Task` schema with validation (`title`, `description`, `completed`, `priority`), Mongoose error handler (`ValidationError`, `CastError`), 24-point test suite. | ✅ Complete |
| **[`6/`](./6)** | **Practical 06** | **Full Stack Integration** | Typed HTTP API service layer (`services/api.ts`), Toast notification system (`Toast.tsx`), per-item loading states, deletion confirm modal, live full-stack state sync. | ✅ Complete |
| **[`7/`](./7)** | **Practical 07** | **Authentication & Middleware Pipeline** | User registration/login with `bcrypt` (10 rounds), signed stateless JSON Web Tokens (JWT, 1h), JWT auth middleware (`middleware/auth.js`), input validation middleware (`middleware/validate.js`), user-scoped tasks, Auth modal. | ✅ Complete |
| **[`8/`](./8)** | **Practical 08** | **Performance Optimization & Lazy Loading** | Route-based code splitting using `React.lazy()` & `<Suspense>`, Apple shimmer `<RouteFallback />`, lazy-loaded heavy `<TaskAnalyticsChart />`, live `<PerformanceMonitor />` (~51% initial JS reduction, 7 dynamic chunks). | ✅ Complete |
| **[`9/`](./9)** | **Practical 09** | **In-Memory Caching & Latency Optimization** | `node-cache` in-memory engine (60s TTL), Cache-Aside pattern on `GET /tasks` (`X-Cache: HIT|MISS|BYPASS`), single-task document caching, write invalidation (`POST`, `PUT`, `DELETE`), interactive 3x latency benchmark UI (~18x speedup). | ✅ Complete |
| **[`10/`](./10)** | **Practical 10** | **Event-Driven Architecture (EventEmitter)** | Node.js native `EventEmitter` singleton, non-blocking background notification worker (`task-created`), background audit archival listener (`task-deleted`), safe error event handler, live event stream card & timestamp proof. | ✅ Complete |

---

## 🏗️ Architecture & Evolution Timeline

```text
Practical 1: React Components + Props
     │
     ▼
Practical 2: + React Router + useState State
     │
     ▼
Practical 3: + GitHub REST API + useEffect Tri-State
     │
     ▼
Practical 4: + Node.js / Express REST API Backend + Middlewares
     │
     ▼
Practical 5: + MongoDB Database + Mongoose ODM Schemas
     │
     ▼
Practical 6: + Full Stack React ↔ Express ↔ MongoDB Integration + Toasts
     │
     ▼
Practical 7: + JWT Authentication + bcrypt Password Hashing + User Scoping
     │
     ▼
Practical 8: + Route-Based Code Splitting + React.lazy() & <Suspense>
     │
     ▼
Practical 9: + In-Memory Caching with node-cache (Cache-Aside & Invalidation)
     │
     ▼
Practical 10: + Asynchronous Processing with Event-Driven Architecture (EventEmitter)
```

---

## 🛠️ Unified Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, React Router DOM v7 |
| **Styling & Aesthetics** | Pure Vanilla CSS Design System with Apple Human Interface Guidelines tokens (`DESIGN-apple.md`) |
| **Backend API** | Node.js (v18+), Express.js (Port 5000) |
| **Database** | MongoDB with Mongoose ODM (Port 27017) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Caching Engine** | In-Memory `node-cache` with automatic 60s TTL eviction |
| **Event Subsystem** | Node.js Native `EventEmitter` (Non-blocking background processing) |
| **Testing & Tooling** | Automated test suites (`test-api.js`), VS Code REST Client (`test.http`), concurrently |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Active local service on `mongodb://127.0.0.1:27017`

### 2. Running Any Practical (e.g. Practical 10)
Navigate to the desired practical folder:
```bash
cd 10
npm install
```

Start both the backend server and frontend development server simultaneously:
```bash
npm run dev
```
- **React Frontend**: `http://localhost:5173`
- **Express Backend API**: `http://localhost:5000`

### 3. Running Automated Test Suites
Each backend practical includes a standalone automated test runner:
```bash
cd 10
node test-api.js
```
All assertions will execute and report live pass/fail status with detailed telemetry.

---

## 📜 Academic Integrity & Guidelines
- All implementations strictly adhere to the university lab syllabus outlined in [`Practical List.pdf`](./Practical%20List.pdf).
- For complete progressive guidelines and technical specifications, refer to [`.agents/AGENTS.md`](./.agents/AGENTS.md).
- Authored by: **Manan Vasani** | CHARUSAT University.
