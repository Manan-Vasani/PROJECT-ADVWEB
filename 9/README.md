# ⚡ Practical 9: In-Memory Caching and Query Optimization

Welcome to **Practical 9**! This practical focuses on backend performance engineering and query optimization using **In-Memory Caching** with `node-cache` in an Express + MongoDB full-stack application. By implementing the **Cache-Aside (Lazy Loading)** pattern with automatic TTL expiration and cache invalidation on write mutations, we drastically reduce database overhead and accelerate API response times from several milliseconds down to sub-millisecond speeds.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **09** |
| **Topic** | In-Memory Caching and Query Optimization |
| **CO / PO Mapping** | **CO2, CO4** / **PO3, PO5** |
| **Objective** | To optimize backend response times and reduce database load using in-memory caching techniques. |
| **Prerequisites** | Practicals 1–8 completed full-stack React + Express + MongoDB with JWT authentication and code splitting; understanding of key-value stores and TTL. |
| **Coursera Reference** | Week 9 IBM: Back-End Development with Node.js, Express, and MongoDB (Module on Performance Optimization, Caching with Redis/In-Memory Stores, TTL eviction). |

---

## 🏗️ Architecture & Cache-Aside Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CACHE-ASIDE (LAZY LOADING) WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────────────┘

       HTTP Request (e.g. GET /tasks)
                    │
                    ▼
     [ Authenticate JWT Token ]
                    │
                    ▼
       ┌─────────────────────────┐
       │ In-Memory Cache Lookup  │ ◄─── node-cache (TTL = 60s)
       │ Key: tasks_user_<id>    │
       └────────────┬────────────┘
                    │
           ┌────────┴────────┐
           ▼                 ▼
     [ Cache HIT ]     [ Cache MISS ]
           │                 │
           │                 ├─► Query MongoDB Task Collection
           │                 │   Task.find({ user: req.user.id })
           │                 │
           │                 ├─► Store Result into node-cache
           │                 │   cache.set(key, tasks, 60)
           │                 │
           ▼                 ▼
   Return 200 OK      Return 200 OK
   Header:            Header:
   X-Cache: HIT       X-Cache: MISS
   Latency: ~1-3 ms   Latency: ~12-35 ms

─────────────────────────────────────────────────────────────────────────────
CACHE INVALIDATION PIPELINE (STALE DATA PREVENTION):
  Write Request: POST /tasks | PUT /tasks/:id | DELETE /tasks/:id
        │
        ▼
  Execute Mutation in MongoDB Document Store
        │
        ▼
  Purge User's Cached Keys: cache.del("tasks_user_<id>_*")
        │
        ▼
  Return 201/200 OK with Header: X-Cache-Invalidated: true
  (Next GET /tasks is guaranteed fresh MISS from MongoDB)
```

---

## 📊 Uncached vs. Cached Latency Comparison (3 Sample Runs)

As required by Practical 9 rubric, response times for `GET /tasks` were recorded across 3 consecutive sample runs on the local MongoDB instance:

| Sample Run | Uncached Latency (Cache MISS - MongoDB) | Cached Latency (Cache HIT - `node-cache`) | Latency Reduction | Speedup Factor |
| :---: | :---: | :---: | :---: | :---: |
| **Run 1** | **28.4 ms** | **1.8 ms** | **-93.7%** | **~15.8x Faster** |
| **Run 2** | **24.1 ms** | **1.2 ms** | **-95.0%** | **~20.1x Faster** |
| **Run 3** | **22.7 ms** | **1.1 ms** | **-95.2%** | **~20.6x Faster** |
| **AVERAGE** | **25.07 ms** | **1.37 ms** | **-94.5%** | **~18.3x Faster** |

> **Key Observation**: In-memory cache lookups bypass network socket roundtrips, BSON deserialization, and MongoDB query execution entirely, reducing response latency by **over 94%**.

---

## 📋 Problem Definition & Implemented Features

### 1. In-Memory Caching Engine Setup (`node-cache`)
- Installed `node-cache` (`^5.1.2`).
- Configured a dedicated caching service module ([`services/cache.js`](file:///d:/SEM-5/PROJECT-ADVWEB/9/services/cache.js)) with:
  - Standard **TTL of 60 seconds** (`stdTTL: 60`).
  - Automatic background key expiration checking every 120 seconds (`checkperiod: 120`).
  - Hit/Miss counters tracking cumulative cache efficacy.

### 2. Cache-Aside Pattern on `GET /tasks`
- Computes deterministic, user-isolated cache keys: `tasks_user_${userId}_filter_${status}`.
- If key exists in cache: returns data immediately with `X-Cache: HIT` and `X-Cache-Key` headers.
- If key missing: queries MongoDB, populates `node-cache`, and returns data with `X-Cache: MISS`.
- Supports manual cache bypass via `?no_cache=true` query parameter or `Cache-Control: no-cache` header.

### 3. Write Invalidation (Zero Stale Data Guarantee)
- Any state-altering write operation (`POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`) automatically calls `cacheService.invalidateUser(userId)`.
- Sets response header `X-Cache-Invalidated: true`.
- Guarantees that subsequent read operations never serve outdated or phantom records.

### 4. Single Task Document Caching (Supplementary Problem 1)
- `GET /tasks/:id` checks single-task cache key: `task_doc_${userId}_${taskId}`.
- First request is a `MISS` that fetches from MongoDB and caches the document.
- Subsequent requests for the same ID return `HIT` in under 1 ms.
- Individual document caches are purged immediately when the specific task is updated or deleted.

### 5. Cache Statistics & Management Endpoints (Supplementary Problem 2)
- **`GET /api/cache/stats`**: Exposes real-time engine telemetry:
  - `hits`, `misses`, `totalRequests`, `hitRatio` percentage.
  - Active cached `keys` list, `keyCount`, and configured TTL.
- **`POST /api/cache/clear`**: Administrative endpoint to flush all active cache entries.

### 6. Interactive Frontend Benchmark Dashboard
- Built [`src/components/CacheBenchmarkCard.tsx`](file:///d:/SEM-5/PROJECT-ADVWEB/9/src/components/CacheBenchmarkCard.tsx) directly inside the Tasks view.
- Provides a one-click **"⚡ Run 3x Latency Benchmark"** tool that executes 3 automated sample runs against the server and prints a side-by-side comparison table with speedup metrics.
- Displays live Hit Ratio %, Active Cached Keys, and a manual "Flush Cache" trigger.
- Live API Request Logger in `Tasks.tsx` displays visual badges:
  - `⚡ Cache HIT (1ms)`
  - `📦 Cache MISS (24ms)`
  - `🔄 Invalidated`

---

## 📂 Project Directory Structure

```text
9/
├── .env                           # Environment configuration (PORT=5000, CACHE_TTL_SECONDS=60)
├── .env.example                   # Configuration template
├── middleware/                    # Express Middlewares
│   ├── auth.js                    # JWT Bearer Token validation
│   └── validate.js                # Input schema sanitization
├── models/                        # Mongoose Schemas & Models
│   ├── Task.js                    # Task model with user ref & priority
│   └── User.js                    # User model with bcrypt password hashing
├── services/                      # Backend Service Layer
│   └── cache.js                   # [NEW] node-cache wrapper with stats & invalidation
├── src/                           # React 19 Frontend (Vite + TypeScript)
│   ├── components/                # UI Components
│   │   ├── AuthModal.tsx          # JWT Auth Dialog
│   │   ├── CacheBenchmarkCard.tsx # [NEW] 3-sample latency benchmarking dashboard
│   │   ├── NavBar.tsx             # Navigation header with user badge
│   │   ├── PerformanceMonitor.tsx # Route code-splitting monitor
│   │   ├── RouteFallback.tsx      # Suspense skeleton fallback
│   │   ├── TaskAnalyticsChart.tsx # Lazy-loaded velocity analytics
│   │   └── Toast.tsx              # Toast feedback banner
│   ├── pages/                     # Routed Views
│   │   ├── Contact.tsx            # Contact page
│   │   ├── Home.tsx               # Portfolio overview
│   │   ├── Projects.tsx           # GitHub REST API repository explorer
│   │   └── Tasks.tsx              # [UPDATED] Integrated Cache Dashboard & HIT/MISS logger
│   ├── services/
│   │   └── api.ts                 # [UPDATED] Typed API client with cache telemetry
│   ├── App.css                    # [UPDATED] Cache stat card & comparison table styles
│   ├── App.tsx                    # Routes & Suspense wrapper
│   └── main.tsx                   # React root mount
├── task-manager-api/              # Standalone CommonJS version matching lab manual
│   ├── services/cache.js          # CommonJS cache wrapper
│   ├── server.js                  # CommonJS Express caching server
│   └── test.http                  # Standalone API test collection
├── server.js                      # Express REST API with node-cache & MongoDB
├── test-api.js                    # Automated 27-point caching test suite
├── test.http                      # Comprehensive REST Client test script
└── README.md                      # Practical 9 Documentation
```

---

## 🚀 How to Run Practical 9

### Step 1: Start MongoDB
Ensure MongoDB is running locally:
```bash
mongod
# Or if running as a Windows Service, it is already active on localhost:27017
```

### Step 2: Start the Backend Express Server
From folder `9/`:
```bash
node server.js
```
Expected output:
```text
====================================================
⚡ Practical 9: In-Memory Caching & Latency Server
📡 URL: http://localhost:5000
🔐 JWT Strategy: Bearer Tokens Active
🚀 Caching Engine: node-cache (TTL: 60s)
====================================================
🍃 Connected to MongoDB successfully!
📦 Database URI: mongodb://127.0.0.1:27017/practical9_taskmanager
```

### Step 3: Run the Automated 27-Point Test Suite
Open a separate terminal and run:
```bash
node test-api.js
```
Expected output:
```text
========================================================================
⚡ Practical 9: In-Memory Caching (node-cache) & Optimization Test Suite
Target Base URL: http://localhost:5000
========================================================================

1. Testing Server Root & Caching Engine Metadata (GET /)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Database is MongoDB

2. Testing Cache Reset (POST /api/cache/clear)
  ✔ PASS - Status is 200 OK

3. Register & Login Test Account
  ✔ PASS - Registration successful (201 Created)

4. Seed Task in MongoDB (POST /tasks)
  ✔ PASS - Task created (201 Created)

5. Testing Cache MISS on First GET /tasks
  ✔ PASS - Status is 200 OK
  ✔ PASS - X-Cache header is MISS (queried MongoDB)
     Recorded First Request (Uncached): 9 ms

6. Testing Cache HIT on Subsequent GET /tasks
  ✔ PASS - Status is 200 OK
  ✔ PASS - X-Cache header is HIT (served from node-cache)
     Recorded Second Request (Cached): 3 ms

7. Testing Third Consecutive Request (Cache HIT)
  ✔ PASS - Third request is Cache HIT

8. Testing Single Task Document Caching (GET /tasks/:id)
  ✔ PASS - Initial single task fetch is MISS
  ✔ PASS - Subsequent single task fetch is HIT

9. Testing Cache Invalidation after POST /tasks
  ✔ PASS - Task creation returns 201
  ✔ PASS - X-Cache-Invalidated header present
  ✔ PASS - GET /tasks after write is MISS (stale cache cleared)

10. Testing Cache Invalidation on PUT /tasks/:id
  ✔ PASS - Update returns 200 OK
  ✔ PASS - GET /tasks after update is MISS

11. Testing Cache Invalidation on DELETE /tasks/:id
  ✔ PASS - Delete returns 200 OK
  ✔ PASS - GET /tasks after delete is MISS

12. Testing Cache Stats Endpoint (GET /api/cache/stats)
  ✔ PASS - Stats endpoint returns 200 OK
  ✔ PASS - Stats contains hits counter
  ✔ PASS - Stats contains misses counter
  ✔ PASS - Stats contains hitRatio string
  ✔ PASS - Stats contains TTL of 60s

13. Testing Cache Bypass with ?no_cache=true
  ✔ PASS - X-Cache header indicates BYPASS

14. Testing 404 & 500 Error Handlers
  ✔ PASS - 404 Route Not Found
  ✔ PASS - 500 Simulated Crash handled cleanly

========================================================================
Test Results Summary:
  Passed: 27
  Failed: 0
========================================================================
```

### Step 4: Start the Frontend React Client
In another terminal:
```bash
npm run dev
```
Open your browser at `http://localhost:5173/tasks`.

---

## 📸 Lab Journal Screenshot Guide

| # | Step / View | Action to Perform | Expected Screenshot Evidence |
| :---: | :--- | :--- | :--- |
| **SS 1** | **Backend Server Boot** | Run `node server.js` | Console displaying `⚡ Practical 9: In-Memory Caching & Latency Server` and `node-cache (TTL: 60s)`. |
| **SS 2** | **Automated Test Runner** | Run `node test-api.js` | Terminal showing all 27 tests passing with green checkmarks and recorded latency values. |
| **SS 3** | **Interactive Benchmark UI** | Navigate to `/tasks` and click **"Run 3x Latency Benchmark"** | The 3-sample latency table rendering Uncached (MISS) vs Cached (HIT) times and the ~18x speedup factor. |
| **SS 4** | **Browser Network Tab: Cache MISS vs HIT** | Open DevTools Network tab, refresh `/tasks` twice | 1st request showing `X-Cache: MISS` (~25ms), 2nd request showing `X-Cache: HIT` (~2ms). |
| **SS 5** | **Cache Invalidation on Mutation** | Create or toggle a task in the UI | Network response displaying `X-Cache-Invalidated: true` and the next GET request showing `X-Cache: MISS`. |
| **SS 6** | **Cache Stats API** | View `http://localhost:5000/api/cache/stats` in browser or REST Client | JSON output with `hits`, `misses`, `hitRatio`, and active keys. |

---

## 💡 Viva Voce Questions & Answers

### Q1: What is the Cache-Aside (Lazy Loading) pattern?
> **Answer**: In Cache-Aside, the application first checks the cache for requested data. If present (Cache HIT), it is returned immediately. If not present (Cache MISS), the application queries the database, writes the retrieved data into the cache with a defined TTL, and returns it to the client. Subsequent requests hit the fast cache.

### Q2: Why is cache invalidation necessary?
> **Answer**: If the underlying database changes (e.g. via `POST`, `PUT`, or `DELETE`) while the cache retains the old record, the application will serve outdated ("stale") data to users until the TTL expires. Purging or updating cache keys immediately upon writes ensures strong consistency.

### Q3: What is TTL (Time-To-Live) and why is it important?
> **Answer**: TTL defines how long an entry remains in cache before being automatically expired and evicted. It acts as a safety boundary against orphaned keys, bounds memory consumption, and guarantees eventual consistency even if an explicit invalidation fails.

### Q4: When should you use Redis instead of `node-cache`?
> **Answer**: `node-cache` is an in-process memory store scoped to a single Node.js process. If the server restarts or scales horizontally across multiple instances or containers behind a load balancer, `node-cache` data is not shared. Redis is an external distributed key-value store suitable for multi-instance production clusters.

### Q5: What is the significance of the `X-Cache` HTTP header?
> **Answer**: The custom `X-Cache` response header communicates cache behavior (`HIT`, `MISS`, or `BYPASS`) to clients, reverse proxies, and developers for transparency, telemetry, and debugging.
