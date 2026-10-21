# Implementation Plan: Practicals 11, 12, and 13

This plan specifies the comprehensive implementation of **Practical 11**, **Practical 12**, and **Practical 13** for the **Advanced Web Development Frameworks (ITUE301)** laboratory repository, following the progressive practical architecture (`Folder N = Folder N-1 + Practical N features`) and university syllabus requirements from [`Practical List.pdf`](./Practical%20List.pdf).

---

## 🎯 High-Level Overview

| Practical | Title | Focus & Core Additions | Syllabus Reference |
| :---: | :--- | :--- | :--- |
| **[`11/`](./11)** | **Containerization with Docker & Docker Compose** | Frontend multi-stage `Dockerfile`, backend `Dockerfile`, `docker-compose.yml` orchestrating 3 services (`frontend:5173`, `backend:5000`, `mongodb:27017`), `.dockerignore`, named volume persistence, bridge network `app-network`, `DockerArchitectureCard.tsx`. | CO5 / PO3, PO5 (20 Marks) |
| **[`12/`](./12)** | **CI/CD Pipeline with GitHub Actions** | `.github/workflows/ci.yml`, automated multi-job pipeline (`lint` -> `test` -> `build`), Jest / CI test suite (`test-ci.js`), deliberate failure demo vs fixed passing run, status badge, `CiCdPipelineCard.tsx`. | CO5 / PO3, PO5 (20 Marks) |
| **[`13/`](./13)** | **AI API Integration into a Web Application** | Server-side Gemini / OpenAI API integration (`/api/ai/generate-description`, `/api/ai/suggest-priority`, `/api/ai/suggest-subtasks`), **Graceful Degradation** on failure/timeout, API key server-only (.env), rate limiting, editable suggestions, Responsible AI disclaimer, `AiAssistantCard.tsx`. | CO6 / PO3, PO5, PO12 (20 Marks) |

---

## 📂 Implementation Roadmap

### Phase 1: Practical 11 (Docker & Docker Compose)
1. Initialize `11/` from `10/` complete baseline.
2. Create `Dockerfile.backend` (Node 18 Alpine, port 5000, npm install, CMD node server.js).
3. Create `Dockerfile.frontend` (Multi-stage build: node:18 build stage + preview stage on port 5173).
4. Create `docker-compose.yml` defining `frontend`, `backend`, and `mongodb` with named volume `mongo-data` and bridge network `app-network`.
5. Create `.dockerignore` files excluding `node_modules`, `.env`, `dist`, `.git`.
6. Update backend MongoDB configuration to support `MONGO_URI=mongodb://mongodb:27017/practical11_container_tasks`.
7. Add `/api/docker/status` endpoint to inspect container environment.
8. Add Apple-styled `DockerArchitectureCard.tsx` in React frontend (`src/pages/Tasks.tsx`).
9. Build automated test suite `test-api.js` (28 tests) & `test.http`.
10. Write comprehensive `11/README.md` with architecture diagrams, step-by-step instructions, and Viva Q&A.
11. Verify with `npm run build` and `node test-api.js`.

### Phase 2: Practical 12 (CI/CD Pipeline with GitHub Actions)
1. Initialize `12/` from `11/` complete baseline.
2. Create `.github/workflows/ci.yml` at repository root and in `12/`.
3. Configure triggers: `push` and `pull_request` on `main`.
4. Define workflow jobs:
   - `lint`: ESLint check.
   - `test`: Node 18, MongoDB service container, `npm test`.
   - `build`: Vite production build & Docker config validation.
5. Create `12/test-ci.js` with `--deliberate-fail` flag for demonstrating both failed and passed runs.
6. Add `/api/ci/status` backend endpoint for pipeline telemetry.
7. Add `CiCdPipelineCard.tsx` with live interactive pipeline runner and status badge in React UI.
8. Build automated test runner `test-api.js` & `test.http`.
9. Write comprehensive `12/README.md` with pipeline logs, failure demonstration, and Viva Q&A.
10. Verify with `npm run build` and `node test-ci.js`.

### Phase 3: Practical 13 (AI API Integration & Responsible AI)
1. Initialize `13/` from `12/` complete baseline.
2. Integrate Google Gemini / OpenAI API in backend `services/aiService.js`.
3. Implement strict **Graceful Degradation**: catch all errors/timeouts and return friendly structured fallback suggestions without crashing.
4. Implement endpoints:
   - `POST /api/ai/generate-description`
   - `POST /api/ai/suggest-priority`
   - `POST /api/ai/suggest-subtasks`
   - `GET /api/ai/status`
5. Store API key exclusively in `.env` (`GEMINI_API_KEY` / `OPENAI_API_KEY`).
6. Implement server-side and client-side rate limiting (max 1 AI request per task per minute).
7. Create `AiAssistantCard.tsx` and integrate AI buttons ("✨ AI Generate Description", "⚡ AI Suggest Priority") with shimmering loading states and editable inputs in `Tasks.tsx`.
8. Prominently display Responsible AI disclaimer banner and data privacy guidelines.
9. Build automated test suite `test-api.js` (32 tests) testing live AI, fallback mode, rate limits, and task CRUD.
10. Write comprehensive `13/README.md` with ethical AI principles, architecture diagrams, and Viva Q&A.
11. Verify with `npm run build` and `node test-api.js`.

### Phase 4: Master Integration & Verification
1. Update root `README.md` index table and evolution timeline.
2. Update `.agents/AGENTS.md` guidelines.
3. Clean up temporary extraction files.
4. Final verification across all practicals.
