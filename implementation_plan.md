# Implementation Plan: Practical 7 - Authentication and Middleware Pipeline

This plan outlines the complete implementation of **Practical 7: Authentication and Middleware Pipeline** in [`D:\SEM-5\PROJECT-ADVWEB\7`](file:///D:/SEM-5/PROJECT-ADVWEB/7), strictly based on the syllabus specifications from [`Practical List.pdf`](file:///D:/SEM-5/advweb/Practical%20List.pdf).

---

## 🎯 Practical Overview & Academic Alignment

| Item | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **Practical 7** |
| **Topic** | Authentication and Middleware Pipeline |
| **CO / PO Mapping** | **CO2, CO6 / PO3, PO5** |
| **Objective** | To implement JWT-based authentication and input validation as part of the Express middleware pipeline. |
| **Prerequisites** | Practical 6 completed full-stack Task Management application, understanding of hashing and tokens. |

---

## 🏗️ Architecture & Request-Response Pipeline

```text
POST /register ──► [Input Validation] ──► bcrypt.hash (salt rounds: 10) ──► save User to MongoDB ──► 201 Created
POST /login    ──► [Input Validation] ──► bcrypt.compare ──► sign JWT (expiresIn: 1h) ──► 200 { token, user }

Protected Task Routes:
Client Request (Header: Authorization: Bearer <token>)
       │
       ▼
 [1. Global Request Logger Middleware]
       │
       ▼
 [2. JWT Authentication Middleware (auth.js)]
   ├── Missing / Malformed Header ──► 401 Unauthorized
   ├── Invalid / Expired Token    ──► 401 Unauthorized
   └── Valid Token                ──► req.user = decoded; next()
       │
       ▼
 [3. Server-Side Input Validation Middleware (validateTask.js)]
   ├── Missing Title / Invalid Type / Invalid Priority ──► 400 Bad Request
   └── Valid Payload                                   ──► next()
       │
       ▼
 [4. Task Controller Endpoints (Scoped to Logged-in User)]
   ├── GET /tasks       ──► Task.find({ user: req.user.id })
   ├── GET /tasks/:id   ──► Task.findOne({ _id: req.params.id, user: req.user.id })
   ├── POST /tasks      ──► Task.create({ ...req.body, user: req.user.id })
   ├── PUT /tasks/:id   ──► Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id })
   └── DELETE /tasks/:id──► Task.findOneAndDelete({ _id: req.params.id, user: req.user.id })
       │
       ▼
 [5. Supplementary /me Endpoint]
   └── GET /api/auth/me ──► Return logged-in user profile from req.user
       │
       ▼
 [6. Centralized Error Handling Middleware]
   ├── ValidationError  ──► 400 Bad Request (Structured JSON)
   ├── CastError        ──► 400 Invalid ID Format
   ├── JsonWebTokenError──► 401 Unauthorized
   └── Server Error     ──► 500 Internal Server Error (No raw stacks)
```

---

## 📋 Rubrics & Grading Checklist (Total: 20 Marks)

1. **User Registration (3 marks):** Endpoint accepts `name`, `email`, `password`. Password hashed using bcrypt before MongoDB persistence.
2. **JWT Login Flow (5 marks):** Validates credentials, checks password hash with `bcrypt.compare`, returns signed JWT with 1h expiry.
3. **Auth Middleware (5 marks):** Rejects requests without valid token with `401 Unauthorized`; attaches `req.user` when valid.
4. **Input Validation (4 marks):** At least 3 validation rules enforced (valid email format, password minimum length >= 6, required title).
5. **Error Response Structure (3 marks):** All errors returned as consistent JSON (`status` and `message`), no raw stack traces exposed.
6. **Supplementary Problems:**
   - `GET /api/auth/me` endpoint.
   - Frontend token expiry handling (auto-redirect to login on 401).
   - Logout button that clears client token and state.

---

## Proposed Changes

We will scaffold **Practical 7** inside [`D:\SEM-5\PROJECT-ADVWEB\7`](file:///D:/SEM-5/PROJECT-ADVWEB/7):

### 1. Backend Core & Middleware

#### [NEW] [`7/package.json`](file:///D:/SEM-5/PROJECT-ADVWEB/7/package.json)
- Add `bcryptjs` and `jsonwebtoken` dependencies alongside `express`, `mongoose`, `cors`, and `dotenv`.

#### [NEW] [`7/.env`](file:///D:/SEM-5/PROJECT-ADVWEB/7/.env) & [`7/.env.example`](file:///D:/SEM-5/PROJECT-ADVWEB/7/.env.example)
- Configuration for `PORT=5000`, `MONGO_URI=mongodb://127.0.0.1:27017/practical7_auth_tasks`, and `JWT_SECRET=itue301_practical7_jwt_secret_key_2026`.
- `.env` excluded via `.gitignore`.

#### [NEW] [`7/models/User.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/models/User.js)
- User schema with `name` (required), `email` (required, unique, regex validated, lowercase), `password` (required, hashed), and `createdAt`.

#### [NEW] [`7/models/Task.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/models/Task.js)
- Task schema extended with user relationship:
  `user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`.
  Includes `title`, `description`, `completed`, `priority`, and pre-save trimming hook.

#### [NEW] [`7/middleware/auth.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/middleware/auth.js)
- Authentication middleware verifying `Authorization: Bearer <token>`. Catches token expiration and invalid signatures returning 401.

#### [NEW] [`7/middleware/validate.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/middleware/validate.js)
- Input validation middlewares for:
  - Registration: email regex format, password >= 6 characters, name present.
  - Login: email and password provided.
  - Task creation: title required, length >= 1, priority enum validation.

#### [NEW] [`7/server.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/server.js)
- Full Express server mounting:
  - Auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
  - Protected Task routes: `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PUT /tasks/:id`, `DELETE /tasks/:id`
  - Centralized error handler returning structured JSON.

#### [NEW] [`7/task-manager-api/`](file:///D:/SEM-5/PROJECT-ADVWEB/7/task-manager-api/)
- Standalone CommonJS version matching the faculty handout.

---

### 2. Frontend Integration (React 19 + TypeScript + Apple UI)

#### [NEW] [`7/src/services/api.ts`](file:///D:/SEM-5/PROJECT-ADVWEB/7/src/services/api.ts)
- Extended with auth methods: `register()`, `login()`, `logout()`, `getMe()`, and `getToken()`.
- Automatically attaches `Authorization: Bearer <token>` to all protected task requests.
- Handles 401 responses by triggering token expiry cleanup and redirecting to the login view.

#### [NEW] [`7/src/components/AuthModal.tsx`](file:///D:/SEM-5/PROJECT-ADVWEB/7/src/components/AuthModal.tsx)
- Modern Apple-style tabbed Login & Register modal dialog with validation feedback.

#### [NEW] [`7/src/components/NavBar.tsx`](file:///D:/SEM-5/PROJECT-ADVWEB/7/src/components/NavBar.tsx)
- Display current logged-in user profile pill, avatar, and active Logout button.

#### [NEW] [`7/src/pages/Tasks.tsx`](file:///D:/SEM-5/PROJECT-ADVWEB/7/src/pages/Tasks.tsx)
- Full-Stack protected Task Management UI:
  - Shows user-specific tasks from MongoDB.
  - Prompts for login/registration when unauthenticated.
  - Live Request Logger showing `Bearer <token>` headers.
  - Toast notifications and deletion confirmation.

---

### 3. Automated Verification & Testing

#### [NEW] [`7/test-api.js`](file:///D:/SEM-5/PROJECT-ADVWEB/7/test-api.js)
- Automated 30-point test runner testing:
  1. User Registration (password hashed in DB)
  2. Registration validation rejection (invalid email / short password)
  3. User Login & JWT issuance
  4. Accessing protected `/tasks` without token -> 401
  5. Accessing protected `/tasks` with invalid token -> 401
  6. Accessing protected `/tasks` with valid JWT -> 200
  7. Creating, updating, and deleting tasks under the authenticated user
  8. Fetching `/api/auth/me` with token -> 200
  9. Malformed ObjectId -> 400 CastError
  10. 404 handler for undefined routes

#### [NEW] [`7/test.http`](file:///D:/SEM-5/PROJECT-ADVWEB/7/test.http)
- REST client test cases for VS Code / Thunder Client.

#### [NEW] [`7/README.md`](file:///D:/SEM-5/PROJECT-ADVWEB/7/README.md)
- Complete academic guide, architecture diagram, rubrics, setup instructions, and Viva Q&A.

---

## 🔬 Verification Plan

### Automated Verification
```powershell
cd D:\SEM-5\PROJECT-ADVWEB\7
npm run test:api
```
- Verify all 30 tests pass.
- Verify TypeScript compiles cleanly: `npx tsc --noEmit`.

### Manual End-to-End Verification
1. Run `npm run dev` in `7/`.
2. Open `http://localhost:5173`.
3. Register a new user (`test@charusat.edu.in`) with password.
4. Verify JWT token is saved in client `localStorage` and shown in navbar.
5. Create, edit, and delete tasks.
6. Verify in MongoDB Compass or CLI that password in `users` collection is a bcrypt hash (`$2a$10$...`) and tasks have a `user` reference field.
7. Click **Logout**, verify token is cleared and task list is protected.
