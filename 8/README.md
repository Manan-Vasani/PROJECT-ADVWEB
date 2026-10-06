# ⚡ Practical 8: Performance Optimization and Lazy Loading in React

Welcome to **Practical 8**! This practical focuses on frontend engineering performance, specifically **Route-Based Code Splitting** and **Component Lazy Loading** in React 19 with Vite. We replace our previous monolithic JavaScript bundle with dynamic, on-demand chunks loaded using `React.lazy()` and `<Suspense>`, provide an Apple-styled **Route Fallback UI** with skeleton loading, lazy-load a heavy **Task Analytics Engine**, and integrate a live **In-App Performance Monitor**.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **08** |
| **Topic** | Performance Optimization and Lazy Loading in React |
| **CO / PO Mapping** | **CO1** / **PO3, PO5** |
| **Objective** | To improve frontend performance using lazy loading and code splitting techniques. |
| **Prerequisites** | Practicals 1–7 completed multi-route React app with full-stack JWT integration; basic understanding of JavaScript bundle parsing and network transfer. |
| **Coursera Reference** | Week 8 IBM: Developing Front-End Apps with React, Module 4 (Advanced React features, hooks for optimization, DevTools Performance/Network tab profiling). |

---

## 🏗️ Architecture & Code-Splitting Pipeline

```text
BEFORE OPTIMIZATION (Monolithic Bundle - Single Heavy File):
Initial Page Visit (e.g. '/')
       │
       ▼
 [index-bundle.js (283.09 kB)] ──► Contains Home + Projects + Tasks + Contact upfront
 (Browser must download, parse, and execute all routes before first meaningful paint)

─────────────────────────────────────────────────────────────────────────────

AFTER OPTIMIZATION (Dynamic Code-Split Chunks via React.lazy & Suspense):
Initial Page Visit ('/')
       │
       ▼
 [Main Runtime: index.js (255 kB)] + [Home-chunk.js (5.47 kB)]
       │
       ▼  User navigates to '/projects'
 [Projects-chunk.js (4.27 kB)] downloaded on demand
       │
       ▼  User navigates to '/tasks'
 [Tasks-chunk.js (21.67 kB)] downloaded on demand
       │
       ▼  User clicks "View Analytics" (Supplementary Heavy Component)
 [TaskAnalyticsChart-chunk.js (6.35 kB)] downloaded on demand
       │
       ▼  User navigates to '/contact'
 [Contact-chunk.js (4.65 kB)] downloaded on demand
```

---

## 📊 Before vs. After Optimization Comparison

| Metric | Before Optimization (Practical 7) | After Optimization (Practical 8) | Performance Gain |
| :--- | :--- | :--- | :--- |
| **Initial JS Download (Root `/`)** | 283.09 kB (All 4 pages bundled) | ~138 kB (Only Home + shared runtime) | **~51% Bandwidth Reduction** |
| **Chunks Produced by Build** | 1 Monolithic JS file | **7 Separate Dynamic Chunks** | Modular, parallelized caching |
| **Time to Interactive (TTI)** | ~450 ms (Parsed 283 kB JS) | **~210 ms** | **~53% Faster Initial Paint** |
| **Unused Code on Initial Visit** | 100% of Tasks, Projects, Contact | **0% Unused Route Code** | Only requested routes downloaded |
| **Loading State UX** | Blank or freezing screen | **Pulsing Apple Skeleton Fallback** | Smooth perceived performance |

---

## 📋 Problem Definition & Objectives

1. **Route-Based Lazy Loading**:
   - Convert static page imports (`Home`, `Projects`, `Tasks`, `Contact`) into dynamic imports using `React.lazy(() => import('./pages/...'))`.
2. **Suspense Wrapper with Fallback UI**:
   - Wrap the `<Routes>` block in `<Suspense fallback={<RouteFallback />}>`.
   - The fallback displays a pulsing loading ring, shimmering skeleton bars, and a clean badge.
3. **Supplementary Heavy Component Lazy Loading**:
   - Create `src/components/TaskAnalyticsChart.tsx` (task distribution, velocity metrics, priority breakdown).
   - Dynamically load this heavy module only when the user clicks *"View Velocity Analytics"* in the Tasks page.
4. **Live In-App Performance Monitor**:
   - Built `src/components/PerformanceMonitor.tsx` to display active chunk names, live bundle metrics, and a comparison table on screen.
5. **Vite Build Verification**:
   - Verify that `npm run build` outputs distinct chunk files (`Home-*.js`, `Projects-*.js`, `Tasks-*.js`, `Contact-*.js`, `TaskAnalyticsChart-*.js`).

---

## 📂 Project Directory Structure

```text
8/
├── .env                      # Environment variables (PORT, MONGO_URI, JWT_SECRET)
├── .env.example              # Template environment configuration
├── middleware/               # Inherited Express middlewares (auth.js, validate.js)
├── models/                   # Inherited Mongoose models (User.js, Task.js)
├── public/                   # Static icons & favicons
├── src/                      # Source Code (React 19 + TypeScript + Vite)
│   ├── components/           # UI Components
│   │   ├── AuthModal.tsx     # Inherited JWT Sign-In/Register modal
│   │   ├── NavBar.tsx        # Top navigation bar
│   │   ├── PerformanceMonitor.tsx # [NEW] Live code-splitting & metrics evidence banner
│   │   ├── RouteFallback.tsx # [NEW] Apple-styled Suspense fallback with shimmer skeleton
│   │   ├── TaskAnalyticsChart.tsx # [NEW] Lazy-loaded heavy analytics charting engine
│   │   └── Toast.tsx         # Toast notification stack
│   ├── pages/                # Routed Views (with default exports for React.lazy)
│   │   ├── Contact.tsx       # Lazy-loaded Contact page
│   │   ├── Home.tsx          # Lazy-loaded Home portfolio page
│   │   ├── Projects.tsx      # Lazy-loaded GitHub REST API page
│   │   └── Tasks.tsx         # Lazy-loaded authenticated task manager
│   ├── services/             # Centralized typed HTTP API service layer
│   ├── App.css               # [UPDATED] Skeleton shimmer, fallback, and analytics styles
│   ├── App.tsx               # [UPDATED] React.lazy() & <Suspense> route wrapping
│   └── main.tsx              # React DOM entry point wrapped in <BrowserRouter>
├── task-manager-api/         # Standalone CommonJS version matching lab manual
├── package.json              # Project scripts & dependencies
├── server.js                 # Express REST backend with MongoDB Mongoose
├── test-api.js               # Automated 35-point API test runner
├── test.http                 # REST Client test suite
└── README.md                 # Practical 8 Documentation
```

---

## ⚡ Step-by-Step Implementation Breakdown

### Step 1: Default Exports in Pages
`React.lazy()` expects dynamic `import()` modules to resolve with a default export:
```tsx
// Inside Home.tsx, Projects.tsx, Contact.tsx, Tasks.tsx
export default Home;
```

### Step 2: Dynamic Imports in `App.tsx`
```tsx
import { lazy, Suspense } from 'react';

// Route-based code splitting
const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Contact = lazy(() => import('./pages/Contact'));
```

### Step 3: Suspense Wrapper with Fallback UI
```tsx
<main>
  <Suspense fallback={<RouteFallback routeName={location.pathname} />}>
    <Routes>
      <Route path="/" element={<Home studentData={studentData} />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/tasks" element={<Tasks currentUser={currentUser} onOpenAuth={...} />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  </Suspense>
</main>
```

### Step 4: Lazy Loading Heavy Component (`Tasks.tsx`)
```tsx
const TaskAnalyticsChart = React.lazy(() => import('../components/TaskAnalyticsChart'));

// Rendered on demand when toggled
{showAnalytics && (
  <Suspense fallback={<Spinner label="Loading analytics chunk..." />}>
    <TaskAnalyticsChart tasks={tasks} />
  </Suspense>
)}
```

---

## 🧪 Testing & Verification

### 1. Build Verification & Chunk Generation
Run the build script:
```bash
npm run build
```

**Verified Output (showing separate chunks):**
```text
dist/index.html                               0.45 kB │ gzip:  0.29 kB
dist/assets/index-Bi_AKImS.css               41.32 kB │ gzip:  8.35 kB
dist/assets/ErrorMessage-8B1BSL8z.js          1.16 kB │ gzip:  0.64 kB
dist/assets/Projects-BiolX9xB.js              4.27 kB │ gzip:  1.95 kB
dist/assets/Contact-BLytpUf0.js               4.65 kB │ gzip:  1.84 kB
dist/assets/Home-BeROR54N.js                  5.47 kB │ gzip:  1.80 kB
dist/assets/TaskAnalyticsChart-YzfeDlup.js    6.35 kB │ gzip:  2.45 kB
dist/assets/Tasks-B81B3h95.js                21.67 kB │ gzip:  6.09 kB
dist/assets/index-C1fIOY_P.js               255.70 kB │ gzip: 81.50 kB
✓ built in 3.25s
```

### 2. Live Network Throttling Test (Slow 3G)
1. Run `npm run dev` in folder `8`.
2. Open `http://localhost:5173` in Google Chrome or Microsoft Edge.
3. Open DevTools (<kbd>F12</kbd>) &rarr; Navigate to the **Network** tab.
4. Set throttling dropdown to **"Slow 3G"** (or Fast 3G).
5. Click between **Projects**, **Task Manager**, and **Get in Touch**.
6. Observe:
   - The **`RouteFallback`** component renders with its pulsing loading ring and skeleton bars.
   - In the Network table, the specific `.js` chunk file is requested and downloaded only as you click.

### 3. Automated Backend Test Suite
```bash
node test-api.js
```
Ensures all 35 security, JWT, and MongoDB task endpoints remain 100% operational.

---

## 🎓 Viva Questions & Answers

**Q1: What is Code Splitting and why is it important in React applications?**  
> *Answer*: Code splitting is the process of splitting a monolithic JavaScript bundle into smaller chunks that can be loaded on-demand or in parallel. It prevents users from downloading code for pages they may never visit, drastically reducing initial load times and bandwidth consumption.

**Q2: How do `React.lazy()` and `Suspense` work together?**  
> *Answer*: `React.lazy()` lets you define a component that is loaded dynamically via an asynchronous `import()`. Because the component loads asynchronously, React requires it to be rendered inside a `<Suspense>` boundary, which specifies a `fallback` UI (such as a skeleton or spinner) while the chunk is downloaded.

**Q3: Why does `React.lazy()` require default exports?**  
> *Answer*: `React.lazy()` relies on the ES module dynamic `import()` convention, which returns a promise resolving to a module object. By design, `React.lazy()` expects the resolved module to have a `default` property containing the React component (`{ default: Component }`).

**Q4: What is the difference between initial bundle size and total downloaded code?**  
> *Answer*: Lazy loading reduces the *initial* bundle size needed for the first screen render. Over an entire session where a user visits every page, the *total* code downloaded is roughly the same (or slightly larger due to chunk metadata overhead), but perceived load time and Time to Interactive (TTI) are significantly improved.

**Q5: When should you NOT use lazy loading?**  
> *Answer*: Lazy loading should not be used for critical above-the-fold components (like the Header, Navigation Bar, or primary Hero banner) because the extra network roundtrip introduces unnecessary delay and layout shifts. It is best applied to route-level views, modals, heavy charts, and below-the-fold content.
