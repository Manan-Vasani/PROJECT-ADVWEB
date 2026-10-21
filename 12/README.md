# 🚀 Practical 12: CI/CD Pipeline with GitHub Actions

[![CI Pipeline](https://img.shields.io/badge/CI%2FCD%20Pipeline-passing-brightgreen?logo=github-actions&style=flat-square)](https://github.com/Manan-Vasani/PROJECT-ADVWEB/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&style=flat-square)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?logo=mongodb&style=flat-square)](https://www.mongodb.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&style=flat-square)](https://react.dev/)

Welcome to **Practical 12**! This practical focuses on automating testing, code quality verification, and production build generation through a Continuous Integration / Continuous Deployment (**CI/CD**) pipeline implemented using **GitHub Actions**. Every code change pushed to the `main` branch or submitted via Pull Request triggers a multi-stage automated workflow running on an isolated virtual machine.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **12** |
| **Topic** | CI/CD Pipeline with GitHub Actions |
| **CO / PO Mapping** | **CO5** / **PO3, PO5** |
| **Objective** | To automate testing and deployment of the application using a CI/CD pipeline. |
| **Prerequisites** | Practical 11 completed containerized full-stack application; GitHub repository pushed; basic YAML syntax knowledge. |
| **Evaluation Rubric** | Workflow File (4M) + Dependency Install Step (3M) + Automated Test Step (5M) + Failed Pipeline Demo (4M) + Fixed Pipeline Demo (4M) = **Total: 20 Marks** (Threshold: 14/20). |
| **Reference** | GitHub Actions Masterclass (Packt, Weeks 12 Module 1 & 2). |

---

## 🏗️ CI/CD Pipeline Architecture Flow

```text
               Developer commits & pushes
                  git push origin main
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │  GitHub Actions Event Trigger        │
        │  (on: push / pull_request: main)     │
        └──────────────────┬───────────────────┘
                           │
                           ▼
  ====================================================
  STAGE 1: Code Quality & Static Linting (ubuntu-latest)
  ====================================================
  1. actions/checkout@v4
  2. actions/setup-node@v4 (Node.js 18)
  3. npm install
  4. npm run lint (ESLint code standards)
                           │
                           ▼ (Needs Stage 1 to pass)
  ====================================================
  STAGE 2: Automated Integration Tests & Build
  ====================================================
  • Provision Service Container: mongo:6 on port 27017
  1. actions/checkout@v4
  2. actions/setup-node@v4 (Node.js 18)
  3. npm install
  4. npm test (node test-ci.js)
     ├── Health Check assertion (200 OK)
     ├── JWT Authentication & User Registration assertion
     ├── Authenticated Task CRUD assertion
     └── Server-side Input Validation rejection assertion
  5. npm run build (Compile Vite production chunks)
                           │
                           ▼ (Needs Stage 2 to pass)
  ====================================================
  STAGE 3: Docker Compose Validation
  ====================================================
  1. docker compose config (Validate syntax & networks)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [If any step fails]         [If all steps pass]
       ❌ Pipeline RED             ✅ Pipeline GREEN
      Commit rejected!             Deployment ready!
```

---

## 📋 Problem Definition & Implemented Solutions

### 1. GitHub Actions Workflow Configuration (`.github/workflows/ci.yml`)
- Stored at `.github/workflows/ci.yml` at repository root and in `12/.github/workflows/ci.yml`.
- **Triggers**: Configured to run on `push` to `main` and on `pull_request` targeting `main` (Supplementary Problem 2).
- **Service Container**: Provisions an isolated MongoDB 6 instance (`services: mongodb: image: mongo:6`) inside the GitHub virtual runner with active health check polling before test execution.

### 2. Multi-Job Staging Pipeline
- **Job 1 (`lint`)**: Runs ESLint static analysis before running expensive integration tests (Supplementary Problem 1).
- **Job 2 (`build-and-test`)**: Depends on `lint`. Installs dependencies via `npm install`, executes the automated integration test suite (`npm test`), and compiles the production bundle (`npm run build`).
- **Job 3 (`docker-validation`)**: Validates the multi-container Docker Compose configuration syntax using `docker compose config`.

### 3. Automated Test Suite (`test-ci.js`)
- Executes 7 core integration assertions against running endpoints:
  1. Root health & metadata returns status 200 OK.
  2. Task endpoint unauthorized rejection returns status 401 Unauthorized.
  3. User registration saves user and issues signed JWT token.
  4. Authenticated task listing returns task array.
  5. Server-side validation rejects empty title with 400 Bad Request.
  6. Valid task creation saves task with database ID.
  7. Docker telemetry endpoint responds with 200 OK.

### 4. Deliberate Failure vs. Fixed Passing Demonstration
- **Deliberate Failure Demo (`npm run test:fail` / `--deliberate-fail`)**:
  - Deliberately asserts `expect(res.status).toBe(999)` instead of `401`.
  - Produces a clear test failure log and terminates with **exit code 1**.
  - In GitHub Actions, triggers a **Red X (failed)** status, preventing deployment of defective code.
- **Fixed Pipeline Demo (`npm test`)**:
  - Restores correct assertion expectation (`expect(res.status).toBe(401)`).
  - All 7 tests pass cleanly, terminating with **exit code 0**.
  - GitHub Actions reports a **Green Checkmark (passed)** status.

### 5. Status Badge & UI Integration (`CiCdPipelineCard.tsx`)
- Status badge embedded in README (Supplementary Problem 3):
  `[![CI Pipeline](https://img.shields.io/badge/CI%2FCD%20Pipeline-passing-brightgreen?logo=github-actions)](...)`
- Apple-styled interactive card in the Tasks view:
  - Visual 4-stage pipeline flow ribbon.
  - Interactive "Run Passing Pipeline" vs "Trigger Deliberate Failure Demo" buttons.
  - Live console terminal with streaming GitHub Actions logs.
  - Embedded YAML viewer and test script inspection.

---

## 📂 File Structure

```text
12/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI workflow specification
├── test-ci.js                  # CI test suite with --deliberate-fail support
├── test-api.js                 # Extended 28-point API test runner
├── test.http                   # VS Code REST Client test collection
├── server.js                   # Express server with /api/ci/status endpoint
├── Dockerfile.frontend         # Inherited multi-stage frontend Dockerfile
├── Dockerfile.backend          # Inherited backend Node 18 Dockerfile
├── docker-compose.yml          # Inherited multi-container orchestration
├── package.json                # Configured with test, test:fail, and test:api scripts
├── src/
│   ├── components/
│   │   ├── CiCdPipelineCard.tsx        # Interactive CI/CD visualizer & simulator
│   │   ├── DockerArchitectureCard.tsx  # Practical 11 Docker topology card
│   │   ├── CacheBenchmarkCard.tsx      # Practical 9 In-memory cache card
│   │   └── EventNotificationCard.tsx   # Practical 10 Asynchronous event card
│   └── services/
│       └── api.ts              # API client with getCiStatus() helper
```

---

## 🧪 Local Execution & Verification

### 1. Run Automated CI Tests (Passing Run)
```powershell
cd d:\SEM-5\PROJECT-ADVWEB\12
npm test
```
**Expected Output**:
```text
========================================================================
🚀 Practical 12: GitHub Actions Automated CI Test Suite
Mode: ✅ NORMAL PASSING PIPELINE
Target Base URL: http://127.0.0.1:5000
========================================================================

Test 1: Health & Metadata Endpoint (GET /)
  ✔ PASS - GET / responds with status 200 OK
  ✔ PASS - Root JSON reports status online

Test 2: Core Tasks Endpoint Assertion (GET /tasks)
  ✔ PASS - GET /tasks without token correctly rejects with 401 Unauthorized

Test 3: Authentication Pipeline (POST /api/auth/register)
  ✔ PASS - Registration returns 201 Created
  ✔ PASS - JWT authentication token issued

Test 4: Authenticated Task Retrieval (GET /tasks)
  ✔ PASS - Authenticated GET /tasks returns 200 OK
  ✔ PASS - Returns tasks array

Test 5: Server-Side Input Validation (POST /tasks with empty title)
  ✔ PASS - Missing title returns 400 Bad Request

Test 6: Valid Task Creation (POST /tasks)
  ✔ PASS - Task created with 201 Created
  ✔ PASS - Task includes database ID

Test 7: Supplementary Route Verification (GET /api/docker/status)
  ✔ PASS - Docker status endpoint responds with 200 OK

========================================================================
CI Test Suite Execution Summary:
  Passed: 10
  Failed: 0
  Total:  10
========================================================================

✔ [CI PIPELINE PASSED] All tests passed cleanly! Ready for deployment. Exiting with code 0.
```

---

### 2. Demonstrate Deliberate Test Failure (Failing Run)
```powershell
cd d:\SEM-5\PROJECT-ADVWEB\12
npm run test:fail
```
**Expected Output**:
```text
========================================================================
🚀 Practical 12: GitHub Actions Automated CI Test Suite
Mode: 💥 DELIBERATE FAILURE DEMO (--deliberate-fail)
Target Base URL: http://127.0.0.1:5000
========================================================================

Test 1: Health & Metadata Endpoint (GET /)
  ✔ PASS - GET / responds with status 200 OK
  ✔ PASS - Root JSON reports status online

Test 2: Core Tasks Endpoint Assertion (GET /tasks)
  ⚠️ Deliberate test failure simulation active!
  ✖ FAIL - GET /tasks status matches deliberately broken expectation
    Expected: 999
    Actual:   401

...
========================================================================
CI Test Suite Execution Summary:
  Passed: 9
  Failed: 1
  Total:  10
========================================================================

❌ [CI PIPELINE FAILED] Deliberate or unexpected test failures detected. Exiting with code 1.
```

---

## 🎓 Viva Voce Questions & Answers

### Q1: What is the difference between Continuous Integration (CI) and Continuous Deployment (CD), and which one does this practical demonstrate?
> **Answer**:
> - **Continuous Integration (CI)**: The automated practice where developers frequently integrate code into a shared repository, and each integration is automatically verified by building the code and running automated tests (e.g. ESLint, Jest, integration suites) to detect defects immediately.
> - **Continuous Deployment (CD)**: The automated extension of CI where every change that passes all stages of the pipeline is automatically released and deployed to production servers without human intervention.
> - **Demonstrated in this Practical**: This practical primarily demonstrates **Continuous Integration (CI)**—code is automatically linted, tested against a real MongoDB service container, and verified for production bundle compilation on every push/PR.

### Q2: Why does running tests automatically on every push catch problems earlier than testing manually before a release?
> **Answer**:
> 1. **Immediate Feedback Loop**: Developers receive instant pass/fail telemetry within 1–2 minutes of pushing code, when the implementation details are still fresh in memory.
> 2. **Pinpointed Root Cause**: In manual end-of-sprint testing, hundreds of commits have accumulated, making it painful to identify which commit introduced a regression. In CI, the single failing commit is immediately highlighted.
> 3. **Eliminates Human Error & Inconsistency**: Automated tests run in a clean, reproducible virtual container with standard dependencies, preventing "it works on my machine" bugs.

### Q3: What would happen to the pipeline if the test file path were incorrect—would the workflow fail at the same step as a genuine test failure?
> **Answer**:
> Yes, the workflow would still fail at the test step, but the **failure mode and error message would be completely different**:
> - If the path is wrong (e.g. `node nonexistent-test.js`), Node.js throws `MODULE_NOT_FOUND` / file not found error immediately with exit code 1.
> - In a genuine test failure, the file executes properly, tests run, but an assertion (e.g. `res.status === 200`) evaluates to false, logging test assertion diffs (`Expected: 200, Actual: 500`).
> In both cases, the non-zero exit code stops the workflow and prevents the production build or deployment step from executing.

---
**Author**: Manan Vasani | B.Tech Information Technology, Semester 5, CHARUSAT.
