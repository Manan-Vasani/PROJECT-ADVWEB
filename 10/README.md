# ⚡ Practical 10: Asynchronous Processing with Event-Driven Architecture

Welcome to **Practical 10**! This practical focuses on backend asynchronous engineering and architectural decoupling using Node.js's native **`EventEmitter`**. By implementing an **Event-Driven Architecture (EDA)**, we decouple expensive side effects (such as email dispatches, push notifications, and audit logging) from the critical HTTP request-response lifecycle. This keeps API response times under 10 milliseconds while deferred background listeners process jobs asynchronously without blocking the Node.js event loop.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **10** |
| **Topic** | Asynchronous Processing with Event-Driven Architecture |
| **CO / PO Mapping** | **CO4** / **PO3, PO5** |
| **Objective** | To implement asynchronous background processing using Node.js native `EventEmitter` without external dependencies. |
| **Prerequisites** | Practicals 4–9 completed working Node/Express/MongoDB backend with in-memory caching and React frontend; understanding of synchronous vs asynchronous execution and the Node.js event loop. |
| **Evaluation Rubric** | EventEmitter Setup (4M) + Event Emission (5M) + Async Handler (5M) + Timestamp Logging Evidence (6M) = **Total: 20 Marks** (Threshold: 14/20). |
| **Reference** | Node.js official documentation on Events (`nodejs.org/en/docs/guides/event-loop-timers-and-nexttick`). |

---

## 🏗️ Architecture: Synchronous vs. Event-Driven Decoupling

```text
❌ BEFORE OPTIMIZATION (SYNCHRONOUS BLOCKING FLOW):
Client Request: POST /tasks
      │
      ▼
Save to Database (~20ms)
      │
      ▼
Send Email Notification (~1500ms) ──► CLIENT MUST WAIT 1520ms!
      │
      ▼
Dispatch HTTP 201 Created Response

─────────────────────────────────────────────────────────────────────────────

✅ AFTER OPTIMIZATION (EVENT-DRIVEN ASYNCHRONOUS DECOUPLING):
Client Request: POST /tasks
      │
      ▼
Save to MongoDB (~10ms)
      │
      ├─────────────────────────────────────────┐
      ▼                                         ▼
Dispatched HTTP 201 Created (9ms)       emit('task-created', payload)
(Client receives instant response!)             │
                                                ▼  (Offloaded to Event Loop)
                                        [Notification Listener]
                                        Simulate email dispatch (1500ms)
                                                │
                                                ▼
                                        Logged to Telemetry at T + 1.5s
```

---

## ⏱️ Live Timestamp Execution Proof

Recorded from the automated test suite ([`test-api.js`](file:///d:/SEM-5/PROJECT-ADVWEB/10/test-api.js)):

```text
[API] Response sent at:           2026-10-06T08:13:24.080Z  <── Client received HTTP 201 (Roundtrip: 9ms)
[Notification Listener] Started:  2026-10-06T08:13:24.081Z  <── Listener picked up event immediately
[Notification Listener] Finished: 2026-10-06T08:13:25.588Z  <── Background job completed 1508ms LATER!
```

> **Conclusive Evidence**: The client received the HTTP 201 Created response **1508 ms before** the background notification finished executing. The main request cycle was completely non-blocking!

---

## 📋 Problem Definition & Implemented Solutions

### 1. Dedicated EventEmitter Singleton Module
- Created [`events/taskEvents.js`](file:///d:/SEM-5/PROJECT-ADVWEB/10/events/taskEvents.js) extending Node.js native `EventEmitter`.
- Implemented in-memory event telemetry buffer (`history`, `stats`, `recordEvent`) to allow full inspection via API and React UI.
- Created standalone CommonJS equivalent in [`task-manager-api/events.js`](file:///d:/SEM-5/PROJECT-ADVWEB/10/task-manager-api/events.js).

### 2. Asynchronous Notification Listeners Module
- Created [`events/listeners.js`](file:///d:/SEM-5/PROJECT-ADVWEB/10/events/listeners.js) and [`task-manager-api/listeners.js`](file:///d:/SEM-5/PROJECT-ADVWEB/10/task-manager-api/listeners.js).
- Registered `task-created`:
  - Receives `{ task, user, apiSentAt }`.
  - Simulates non-blocking background notification (e.g., mail dispatch) with configurable `setTimeout` delay (`NOTIFICATION_DELAY_MS=1500`).
  - Records completion timestamps proving `apiSentAt <= listenerCompletedAt`.

### 3. Immediate API Response & Event Emission
- In `POST /tasks`:
  ```javascript
  const apiSentAt = new Date().toISOString();
  console.log(`[API] Response sent at ${apiSentAt} (Status: 201 Created)`);
  res.status(201).json(savedTask); // Responds immediately!

  taskEvents.emit('task-created', { task: savedTask, user: req.user, apiSentAt });
  ```

### 4. Supplementary Problem 1: `task-deleted` Event
- In `DELETE /tasks/:id`, sends immediate `200 OK` response and emits `task-deleted`.
- Listener logs audit archival details with deleted task title, ID, and requesting user.

### 5. Supplementary Problem 2: Unhandled Error Safety
- Syllabus Note: *"EventEmitter has a special case: an unhandled 'error' event throws and crashes the Node.js process."*
- Registered dedicated `error` event listener:
  ```javascript
  taskEvents.on('error', (err) => {
    console.error(`💥 [Event Error Listener] Handled background failure:`, err.message);
  });
  ```
- Tested via `POST /api/events/test-error`: verified server remains alive and responsive after catching background failures.

### 6. Supplementary Problem 3: Simulated Slow Background Worker
- Route `POST /api/events/test-slow` accepts custom delays (e.g. 2500ms).
- Responds to the client in **< 15 ms** while the background job executes asynchronously.

### 7. Interactive Frontend Telemetry Card
- Built [`src/components/EventNotificationCard.tsx`](file:///d:/SEM-5/PROJECT-ADVWEB/10/src/components/EventNotificationCard.tsx) inside the Tasks view.
- Provides live event stream polling, non-blocking proof alert with spinner, one-click "Test Slow Worker" and "Test Error Listener" triggers.

---

## 📂 Project Directory Structure

```text
10/
├── .env                           # Environment config (PORT=5000, NOTIFICATION_DELAY_MS=1500)
├── .env.example                   # Configuration template
├── events/                        # [NEW] Event-Driven Architecture Modules
│   ├── taskEvents.js              # Native EventEmitter singleton with telemetry tracking
│   └── listeners.js               # Background notification, audit, and error listeners
├── middleware/                    # Express Middlewares (auth.js, validate.js)
├── models/                        # Mongoose Schemas (Task.js, User.js)
├── services/                      # Caching service (cache.js - inherited from Practical 9)
├── src/                           # React 19 Frontend (Vite + TypeScript)
│   ├── components/
│   │   ├── EventNotificationCard.tsx # [NEW] Live background event telemetry dashboard
│   │   ├── CacheBenchmarkCard.tsx    # Caching latency benchmark (inherited from 9)
│   │   ├── TaskAnalyticsChart.tsx    # Lazy loaded chart (inherited from 8)
│   │   ├── RouteFallback.tsx         # Suspense shimmer fallback (inherited from 8)
│   │   └── Toast.tsx                 # Toast system (inherited from 6)
│   ├── pages/
│   │   ├── Home.tsx                  # Portfolio overview
│   │   ├── Projects.tsx              # GitHub REST API explorer
│   │   └── Tasks.tsx                 # [UPDATED] Integrated Event Dashboard
│   ├── services/
│   │   └── api.ts                    # [UPDATED] Typed Event API methods
│   ├── App.css                       # [UPDATED] Event stream table and badge styling
│   └── App.tsx                       # React router & suspense
├── task-manager-api/              # Standalone CommonJS version matching lab manual
│   ├── events.js                  # CommonJS EventEmitter singleton
│   ├── listeners.js               # CommonJS background listeners
│   ├── server.js                  # CommonJS Express server with events
│   └── test.http                  # REST Client tests
├── server.js                      # Express REST API with events, caching & MongoDB
├── test-api.js                    # Automated 27-point Event & Caching test suite
├── test.http                      # Comprehensive REST Client test collection
└── README.md                      # Practical 10 Documentation
```

---

## 🚀 How to Run Practical 10

### Step 1: Start MongoDB
Ensure MongoDB is running locally on port 27017:
```bash
mongod
```

### Step 2: Start the Backend Server
From directory `10/`:
```bash
node server.js
```
Console output:
```text
📡 [Event Subsystem] Registering background task event listeners...
✅ [Event Subsystem] All event listeners registered successfully.
====================================================
⚡ Practical 10: Event-Driven Architecture Server
📡 URL: http://localhost:5000
🔐 JWT Strategy: Bearer Tokens Active
🚀 Event Subsystem: Node.js EventEmitter (Non-Blocking)
📦 Caching Engine: node-cache (TTL: 60s)
====================================================
🍃 Connected to MongoDB successfully!
📦 Database URI: mongodb://127.0.0.1:27017/practical10_taskmanager
```

### Step 3: Run the Automated 27-Point Test Suite
In another terminal:
```bash
node test-api.js
```
Output:
```text
========================================================================
⚡ Practical 10: Event-Driven Architecture (EventEmitter) Test Suite
========================================================================
✔ PASS - Status is 200 OK
✔ PASS - EventEmitter subsystem enabled
✔ PASS - Engine is native EventEmitter
✔ PASS - Supports task-created and task-deleted events
✔ PASS - Clear events returns 200 OK
✔ PASS - Clear cache returns 200 OK
✔ PASS - Registration successful (201 Created)
✔ PASS - HTTP Status is 201 Created (API Roundtrip: 9 ms)
✔ PASS - API response returned immediately (< 200ms)
✔ PASS - task-created event recorded in telemetry
     [Timestamp Proof]
       1. API Response Dispatched: 2026-10-06T08:13:24.080Z
       2. Listener Started:        2026-10-06T08:13:24.081Z
       3. Listener Completed:      2026-10-06T08:13:25.588Z
       Worker Processing Took:     1507 ms
✔ PASS - PROOF: API response timestamp is <= listener completion timestamp
✔ PASS - Slow worker route responds 200 OK
✔ PASS - API returned immediately despite 1200ms background delay
✔ PASS - Task deletion returns 200 OK
✔ PASS - Delete API responded immediately
✔ PASS - task-deleted event recorded in telemetry
✔ PASS - Error event route returns 200 OK
✔ PASS - Error event safely caught and recorded by listener
✔ PASS - Server is responsive (200 OK) after handling error event
✔ PASS - Total events emitted counter >= 3
✔ PASS - task-created counter >= 2
✔ PASS - task-deleted counter >= 1
✔ PASS - error counter >= 1
✔ PASS - Cache stats endpoint returns 200 OK
✔ PASS - 401 Unauthorized without token
✔ PASS - 404 Route Not Found
========================================================================
Test Results Summary: Passed: 27 | Failed: 0
========================================================================
```

### Step 4: Run the React Frontend Client
In a separate terminal:
```bash
npm run dev
```
Open `http://localhost:5173/tasks` in your browser.

---

## 📸 Lab Journal Screenshot Guide

| # | Step / View | Action to Perform | Expected Screenshot Evidence |
| :---: | :--- | :--- | :--- |
| **SS 1** | **Backend Server Boot** | Run `node server.js` | Console showing `Event Subsystem registered` and `Node.js EventEmitter (Non-Blocking)`. |
| **SS 2** | **Timestamp Console Proof** | Create task via API or UI | Console showing `[API] Response sent at T1` followed by `[Notification Listener] Background email sent at T2 (took 1500ms)`. |
| **SS 3** | **Automated Test Suite** | Run `node test-api.js` | Terminal displaying all 27 tests passing with green checkmarks and timestamp proof. |
| **SS 4** | **Frontend Event Telemetry** | Navigate to `/tasks` | The "Asynchronous Background Processing" card with live metrics and event stream table. |
| **SS 5** | **Slow Background Job Test** | Click "Test Slow Background Worker" | Alert showing instant API response banner and live countdown while worker runs. |
| **SS 6** | **Error Listener Safety** | Click "Test Error Listener Safety" | Toast notification and event log row showing error caught cleanly with server remaining online. |

---

## 💡 Viva Voce Questions & Answers

### Q1: Why does emitting an event not block the API response?
> **Answer**: In Node.js, `res.status().json()` immediately serializes and flushes HTTP response headers and body bytes to the client socket. Calling `taskEvents.emit('task-created')` afterwards invokes listener callbacks on the event loop. If the listener schedules asynchronous I/O or timers (e.g. `setTimeout`), execution yields control back to the event loop, ensuring the client connection is never kept hanging.

### Q2: What would happen to API response time if notification logic were placed directly inside the route handler?
> **Answer**: If notification logic (like sending an email or connecting to a push gateway) were inside the route handler with synchronous blocking calls or `await sendEmail()`, the client request would be stalled until the email server finished (typically 1–3 seconds). Response times would degrade significantly.

### Q3: Why is EventEmitter suitable for this scale, but not for production enterprise applications?
> **Answer**: `EventEmitter` is an in-memory, process-local pub/sub mechanism. If the Node.js server crashes or restarts while a listener is executing, pending events in memory are lost forever (no persistence). Additionally, in a clustered/multi-instance environment, events emitted on Server A cannot reach listeners on Server B. Enterprise systems use distributed message brokers (RabbitMQ, Kafka, AWS SQS, or Redis BullMQ) to ensure persistence, retries, and cross-instance distribution.

### Q4: What is the special behavior of the `'error'` event in Node.js `EventEmitter`?
> **Answer**: In Node.js `EventEmitter`, the `'error'` event is treated as a special fatal event. If an `'error'` event is emitted and no listener has been registered for it (`taskEvents.on('error', ...)`), Node.js will throw an unhandled exception, print a stack trace, and terminate (crash) the entire process. Always register an error listener.

### Q5: How does this practical connect to Practical 9 (Caching)?
> **Answer**: Both practicals apply the core engineering principle of **decoupling work from the critical request path**. Practical 9 eliminates redundant database read queries via in-memory caching, while Practical 10 eliminates side-effect execution latency via event-driven asynchronous background offloading.
