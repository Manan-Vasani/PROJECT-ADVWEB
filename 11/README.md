# 🐳 Practical 11: Containerization with Docker and Docker Compose

Welcome to **Practical 11**! This practical focuses on containerizing our full-stack Task Management application using **Docker** and orchestrating a multi-container microservice topology using **Docker Compose**. All 3 tiers—the **React Frontend**, **Node.js Express REST Backend**, and **MongoDB Database**—are isolated into dedicated containers communicating over an internal bridge network (`app-network`) and running seamlessly with a single command.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **11** |
| **Topic** | Containerization with Docker and Docker Compose |
| **CO / PO Mapping** | **CO5** / **PO3, PO5** |
| **Objective** | To containerize the full-stack application using Docker and orchestrate services using Docker Compose. |
| **Prerequisites** | Practicals 1–10 completed working full-stack Task Management application; Docker Desktop / Engine installed on lab machine. |
| **Evaluation Rubric** | Frontend Dockerfile (4M) + Backend Dockerfile (4M) + Docker Compose Orchestration (6M) + Single Command Run & Persistence (6M) = **Total: 20 Marks** (Threshold: 14/20). |
| **Reference** | IBM: Introduction to Containers with Docker, Kubernetes & OpenShift (Week 11). |

---

## 🏗️ Multi-Container Architecture & Inter-Container Networking

```text
Host Browser / Developer Machine (http://localhost:5173, http://localhost:5000)
       │                                     │
       ▼ (Port 5173:5173)                    ▼ (Port 5000:5000)
┌────────────────────────────────────────────────────────────────────────┐
│                        Docker Host Environment                         │
│                                                                        │
│   ┌──────────────────────────┐             ┌───────────────────────┐   │
│   │   practical11-frontend   │             │  practical11-backend  │   │
│   │   (React 19 + Vite)      │             │  (Node 18 Express)    │   │
│   │                          │             │                       │   │
│   │  • Multi-stage build     │  REST Calls │  • In-Memory Caching  │   │
│   │  • Exposes Port 5173     │ ──────────► │  • EventEmitter       │   │
│   │  • Preview Runner        │ (Browser/API)│ • Port 5000          │   │
│   └─────────────┬────────────┘             └───────────┬───────────┘   │
│                 │                                      │               │
│                 │      Docker Internal Bridge Network  │ (mongodb:27017)│
│                 │        (network: app-network)        ▼               │
│                 │                         ┌────────────────────────┐   │
│                 └────────────────────────►│  practical11-mongodb   │   │
│                                           │  (Official mongo:6)    │   │
│                                           │                        │   │
│                                           │  • Internal Port 27017 │   │
│                                           │  • Service Name DNS    │   │
│                                           └────────────┬───────────┘   │
│                                                        │               │
│                                                        ▼ Mount /data/db│
│                                           ┌────────────────────────┐   │
│                                           │ Named Volume           │   │
│                                           │ (mongo-data)           │   │
│                                           │ Data persists on exit! │   │
│                                           └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Problem Definition & Implemented Solutions

### 1. Multi-Stage Build React Frontend Dockerfile (`Dockerfile.frontend`)
- **Supplementary Problem 2 Addressed**:
  - **Stage 1 (`build`)**: Installs dependencies and runs `npm run build` using `node:18-alpine` to compile TypeScript and Vite assets into `/app/dist`.
  - **Stage 2 (`runner`)**: Uses a fresh, minimal `node:18-alpine` image with only production dependencies and compiled assets, running `vite preview --host 0.0.0.0 --port 5173`.
  - Dramatically reduces final image size and isolates developer tools from the production runtime.

### 2. Node.js & Express REST Backend Dockerfile (`Dockerfile.backend`)
- Built on `node:18-alpine`.
- Copies `package*.json` and executes `npm install`.
- Exposes port `5000` and executes `CMD ["node", "server.js"]`.
- Includes environment defaults for `PORT=5000`, `NODE_ENV=production`, and `DOCKER_CONTAINER=true`.

### 3. Docker Compose Orchestration (`docker-compose.yml`)
- Defines all 3 microservices with correct port bindings:
  - `frontend`: maps `5173:5173`, depends on `backend`.
  - `backend`: maps `5000:5000`, depends on `mongodb`.
  - `mongodb`: maps `27017:27017`, uses official `mongo:6` image.
- **Inter-Container Networking**: Services communicate over a custom user-defined bridge network (`app-network`).
  - Backend connects to MongoDB using the service DNS name: `mongodb://mongodb:27017/taskdb` instead of `localhost`.

### 4. Build Context Optimization (`.dockerignore`)
- **Supplementary Problem 1 Addressed**: Excludes `node_modules`, `dist`, `.env`, `.git`, and log files from the Docker context to ensure fast builds and prevent host OS binary conflicts.

### 5. Persistent Named Volume (`mongo-data`)
- **Supplementary Problem 3 Addressed**: Mounts a Docker named volume `mongo-data` to `/data/db` inside the MongoDB container, ensuring all user accounts and tasks persist across `docker compose down` and container restarts.

### 6. Interactive Frontend Docker Card (`DockerArchitectureCard.tsx`)
- Apple-styled diagnostics card embedded directly into the full-stack UI:
  - Visual 3-node topology showing Frontend (:5173) ──► Backend (:5000) ──► MongoDB (:27017).
  - Live container telemetry polling `/api/docker/status`.
  - In-app tabbed view of `docker-compose.yml`, `Dockerfile.frontend`, and `Dockerfile.backend`.
  - One-click copy commands for `docker compose up --build` and `docker compose ps`.

---

## 📂 File Structure

```text
11/
├── Dockerfile                  # Default root Dockerfile
├── Dockerfile.backend          # Backend Node.js 18 container specification
├── Dockerfile.frontend         # Frontend React multi-stage container specification
├── docker-compose.yml          # Multi-container orchestration (frontend + backend + mongodb)
├── .dockerignore               # Context exclusion rules (node_modules, .env, dist)
├── .env                        # Local bare-metal environment variables
├── .env.example                # Example template with Docker connection strings
├── server.js                   # Express server with /api/docker/status endpoint
├── test-api.js                 # Automated 28-point containerization test suite
├── test.http                   # VS Code REST Client test collection
├── models/
│   ├── User.js                 # User schema (bcrypt hashed passwords)
│   └── Task.js                 # Task schema with user ownership reference
├── middleware/
│   ├── auth.js                 # JWT Bearer token authentication middleware
│   └── validate.js             # Input validation middlewares
├── services/
│   └── cache.js                # node-cache in-memory engine
├── events/
│   ├── taskEvents.js           # EventEmitter singleton with telemetry
│   └── listeners.js            # Asynchronous background listeners
├── task-manager-api/           # CommonJS faculty handout equivalent
│   └── server.js               # CommonJS server with Docker status endpoint
└── src/
    ├── components/
    │   ├── DockerArchitectureCard.tsx  # Interactive Docker Compose topology card
    │   ├── CacheBenchmarkCard.tsx      # Practical 9 In-memory cache benchmark
    │   └── EventNotificationCard.tsx   # Practical 10 Asynchronous event stream
    ├── pages/
    │   └── Tasks.tsx           # Full-stack task manager view with Docker card
    └── services/
        └── api.ts              # API service client with getDockerStatus()
```

---

## 🚀 Execution & Verification Instructions

### Method A: Single Command Run via Docker Compose (Recommended)

1. Make sure Docker Desktop or Docker Engine is running:
   ```powershell
   docker --version
   docker compose version
   ```

2. Start the entire application stack:
   ```powershell
   cd d:\SEM-5\PROJECT-ADVWEB\11
   docker compose up --build
   ```

3. Open your browser:
   - **React Application**: `http://localhost:5173`
   - **Express REST Backend**: `http://localhost:5000`
   - **Docker Telemetry**: `http://localhost:5000/api/docker/status`

4. Verify running containers:
   ```powershell
   docker compose ps
   ```

5. Stop the stack:
   ```powershell
   docker compose down
   ```
   *(To wipe persistent volumes, run `docker compose down -v`)*

---

### Method B: Local Bare-Metal Execution (Without Docker)

1. Ensure local MongoDB is running on port 27017:
   ```powershell
   cd d:\SEM-5\PROJECT-ADVWEB\11
   npm install
   npm run dev
   ```

---

## 🧪 Automated Testing Suite

Run the 28-point automated test runner:
```powershell
cd d:\SEM-5\PROJECT-ADVWEB\11
node test-api.js
```

### Test Assertions Covered:
- ✅ Server root endpoint returns 200 OK with `Practical 11` and containerization metadata.
- ✅ Docker status endpoint returns 3 orchestrated services (`frontend`, `backend`, `mongodb`).
- ✅ Bridge network (`app-network`) and named persistent volume (`mongo-data`) declared.
- ✅ User registration & bcrypt password hashing.
- ✅ JWT login & profile retrieval (`GET /api/auth/me`).
- ✅ User-scoped Task CRUD operations.
- ✅ In-Memory Cache-Aside (`X-Cache: HIT` / `MISS`).
- ✅ Non-blocking EventEmitter background processing.

---

## 🎓 Viva Voce Questions & Answers

### Q1: Why does the backend container need to reference the MongoDB container by its service name (e.g., `mongodb`) rather than `localhost`?
> **Answer**: In Docker, each container runs in its own isolated network namespace with its own `localhost` (loopback interface `127.0.0.1`). If the backend container attempts to connect to `localhost:27017`, it looks for MongoDB inside itself where MongoDB is not running. In a Docker Compose user-defined bridge network, Docker provides automatic embedded DNS resolution where each service container is discoverable by its service name. Thus, the backend connects to `mongodb://mongodb:27017/taskdb`.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
> **Answer**: `EXPOSE` in a Dockerfile is purely documentation and metadata; it informs Docker that the container listens on the specified network ports at runtime, but does **not** publish or make those ports accessible to the host machine. The `ports` directive in `docker-compose.yml` (`HOST:CONTAINER`, e.g. `"5000:5000"`) actively maps a port on the host operating system to the port inside the container, enabling outside network traffic (e.g. from a web browser) to enter the container.

### Q3: Why is it bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
> **Answer**:
> 1. **OS and Architecture Binary Incompatibility**: Many Node packages include native C/C++ bindings (e.g., `bcryptjs`/`bcrypt`, `sharp`, `esbuild`). Copying host binaries (e.g., Windows x64) into a Linux container (`node:18-alpine`) results in fatal ELF binary execution errors.
> 2. **Build Context Bloat**: Copying hundreds of megabytes of `node_modules` drastically slows down `docker build` times.
> 3. **Reproducibility**: Running `npm install` inside the container ensures clean, deterministic dependencies built specifically for the container's Linux environment.

---
**Author**: Manan Vasani | B.Tech Information Technology, Semester 5, CHARUSAT.
