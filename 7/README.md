# 🔐 Practical 7: Authentication and Middleware Pipeline

Welcome to **Practical 7**! This practical enhances our full-stack web application with industry-standard **Security Architecture**. We implement **User Registration & Login**, password hashing with **bcrypt (10 salt rounds)**, stateless session management via **JSON Web Tokens (JWT)**, custom **Authentication & Input Validation Middleware**, and user-scoped MongoDB document persistence.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **07** |
| **Topic** | Authentication and Middleware Pipeline |
| **CO / PO Mapping** | **CO2, CO6** / **PO3, PO5** |
| **Objective** | To implement JWT-based authentication and input validation as part of the Express middleware pipeline. |
| **Prerequisites** | Practical 6 completed full-stack Task Management application; understanding of hashing and tokens. |
| **Coursera Reference** | Week 7 IBM: Node.js & MongoDB Developing Back-end Database Applications, Module 4 (Authentication & authorization, JWT token generation, middleware pipeline, input validation). |

---

## 🏗️ Architecture & Security Pipeline

```text
Registration & Login Flow:
POST /api/auth/register ──► [validateRegister] ──► bcrypt.hash(10) ──► save User to MongoDB ──► 201 Created
POST /api/auth/login    ──► [validateLogin]    ──► bcrypt.compare ──► sign JWT (expiresIn: 1h) ──► 200 { token, user }

Protected Task Routes Pipeline:
Client Request (Header: Authorization: Bearer <token>)
       │
       ▼
 [1. Global Request Logger Middleware]
       │
       ▼
 [2. JWT Authentication Middleware (authenticateToken)]
   ├── Missing Header / No Token ──► 401 Unauthorized
   ├── Invalid / Expired Token   ──► 401 Unauthorized
   └── Valid Token               ──► req.user = decoded; next()
       │
       ▼
 [3. Server-Side Input Validation Middleware (validateTask)]
   ├── Missing Title / Invalid Priority ──► 400 Bad Request
   └── Valid Payload                    ──► next()
       │
       ▼
 [4. User-Scoped Controller Endpoints]
   ├── GET /tasks       ──► Task.find({ user: req.user.id })
   ├── GET /tasks/:id   ──► Task.findOne({ _id: req.params.id, user: req.user.id })
   ├── POST /tasks      ──► Task.create({ ...req.body, user: req.user.id })
   ├── PUT /tasks/:id   ──► Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id })
   └── DELETE /tasks/:id──► Task.findOneAndDelete({ _id: req.params.id, user: req.user.id })
       │
       ▼
 [5. Centralized Error Handling Middleware]
   ├── ValidationError  ──► 400 Bad Request (Structured JSON)
   ├── CastError        ──► 400 Invalid ID Format
   ├── JsonWebTokenError──► 401 Unauthorized
   └── Server Error     ──► 500 Internal Server Error (No raw stacks)
```

---

## 📋 Problem Definition & Objectives

1. **User Registration & Password Hashing**:
   - Register endpoint (`POST /api/auth/register`) accepts `name`, `email`, `password`.
   - Passwords securely hashed with `bcrypt` (10 rounds) before MongoDB persistence.
2. **JWT Authentication Flow**:
   - Login endpoint (`POST /api/auth/login`) validates credentials with `bcrypt.compare`.
   - Signs and returns a JSON Web Token (JWT) with 1-hour expiration.
3. **Route Protection Middleware**:
   - Rejects unauthenticated requests to `/tasks` endpoints with `401 Unauthorized`.
   - Attaches decoded `req.user` to the request object on success.
4. **Server-Side Input Validation**:
   - Enforces email regex, minimum password length (>= 6 chars), and required task titles before database queries.
5. **Frontend Token Expiry & Logout**:
   - Centralized `api.ts` attaches `Authorization: Bearer <token>` to requests.
   - Automatically handles 401 responses, resets client session, and prompts user to re-login.
   - Logout button clears token from `localStorage` and resets state.

---

## 📂 Project Directory Structure

```text
7/
├── .env                      # Environment variables (PORT, MONGO_URI, JWT_SECRET)
├── .env.example              # Template environment configuration
├── middleware/               # [NEW] Express Custom Middlewares
│   ├── auth.js               # JWT verification & route protection
│   └── validate.js           # Server-side input validation
├── models/                   # Mongoose Data Models
│   ├── Task.js               # Task model with User reference & priority enum
│   └── User.js               # [NEW] User model with hashed password
├── public/                   # Static icons & favicons
├── src/                      # Source Code (React 19 + TypeScript)
│   ├── components/           # UI Components
│   │   ├── AuthModal.tsx     # [NEW] Tabbed Sign-In / Register Modal Dialog
│   │   ├── NavBar.tsx        # [UPDATED] Navigation bar with Auth profile pill & Logout
│   │   ├── Toast.tsx         # Toast notification stack
│   │   └── ...               # Inherited layout components
│   ├── pages/                # Routed Views
│   │   └── Tasks.tsx         # [UPDATED] Authenticated Task Management UI
│   ├── services/             # Service Layer
│   │   └── api.ts            # [UPDATED] Central HTTP service with JWT Bearer headers
│   ├── App.css               # [UPDATED] Apple-style auth modal & badge styling
│   ├── App.tsx               # [UPDATED] Global Auth state management & 401 listeners
│   └── main.tsx              # React DOM entry point
├── task-manager-api/         # Standalone Express API folder (CommonJS)
├── package.json              # Project scripts & dependencies (bcryptjs, jsonwebtoken)
├── server.js                 # [UPDATED] Express backend with Auth & Protected Routes
├── test-api.js               # [NEW] Automated 18-suite test runner for Practical 7
├── test.http                 # [NEW] VS Code REST Client test requests
└── README.md                 # Practical 7 Documentation
```

---

## ⚡ Step-by-Step Implementation Breakdown

### Step 1: Install Dependencies
```bash
npm install bcryptjs jsonwebtoken
```

### Step 2: Configure Environment (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/practical7_taskmanager
VITE_API_URL=http://localhost:5000
JWT_SECRET=charusat_itue301_practical7_jwt_secret_key_2026
```

### Step 3: Define User Model (`models/User.js`)
```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
```

### Step 4: JWT Authentication Middleware (`middleware/auth.js`)
```javascript
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token.'
    });
  }
};
```

---

## 🧪 Testing & Verification

### 1. Automated Test Suite Execution
Make sure your server is running or start it, then run:
```bash
node test-api.js
```

**Expected Console Output:**
```text
========================================================================
🔐 Practical 7: Authentication & Middleware Pipeline Test Suite
Target Base URL: http://localhost:5000
========================================================================

1. Testing Server Root & Status (GET /)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Database is MongoDB
  ✔ PASS - Auth Strategy is JWT

2. Testing Protected Route Without Token (GET /tasks)
  ✔ PASS - Status is 401 Unauthorized
  ✔ PASS - Returns Unauthorized Error

3. Testing Protected Route With Malformed Token (GET /tasks)
  ✔ PASS - Status is 401 Unauthorized

4. Testing Registration Input Validation Rejections (POST /api/auth/register)
  ✔ PASS - Short password rejected with 400 Bad Request
  ✔ PASS - Invalid email rejected with 400 Bad Request

5. Testing Successful User Registration (POST /api/auth/register)
  ✔ PASS - Status is 201 Created
  ✔ PASS - Returns valid JWT token
  ✔ PASS - Returns user profile with ID

6. Testing Duplicate Email Registration Rejection
  ✔ PASS - Duplicate email rejected with 400 Bad Request

7. Testing User Login with Wrong Password (POST /api/auth/login)
  ✔ PASS - Status is 401 Unauthorized

8. Testing Successful User Login (POST /api/auth/login)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Login returns new JWT token

9. Testing Protected User Profile (GET /api/auth/me)
  ✔ PASS - Status is 200 OK
  ✔ PASS - User email matches
  ✔ PASS - Password hash excluded from response

10. Testing Task Input Validation (POST /tasks without title)
  ✔ PASS - Status is 400 Bad Request

11. Testing Create Task with Bearer Token (POST /tasks)
  ✔ PASS - Status is 201 Created
  ✔ PASS - Task has valid MongoDB ObjectId
  ✔ PASS - Task title matches
  ✔ PASS - Task priority is high

12. Testing Fetch Tasks with Bearer Token (GET /tasks)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Tasks returned as Array
  ✔ PASS - Contains created task

13. Testing Read Single Task (GET /tasks/:id)
  ✔ PASS - Status is 200 OK

14. Testing Update Task (PUT /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Task completed is true
  ✔ PASS - Task priority updated to medium

15. Testing Delete Task (DELETE /tasks/:id)
  ✔ PASS - Status is 200 OK
  ✔ PASS - Deleted task yields 404 Not Found

16. Testing CastError on Malformed ID (GET /tasks/bad-id-123)
  ✔ PASS - Status is 400 Bad Request

17. Testing 404 Handler (GET /api/undefined-endpoint)
  ✔ PASS - Status is 404 Not Found

18. Testing 500 Global Error Handler (GET /error-test)
  ✔ PASS - Status is 500 Internal Server Error

========================================================================
Test Results Summary:
  Passed: 28
  Failed: 0
========================================================================
```

---

## ⚡ How to Run Locally

Inside folder `7`:
```bash
npm run dev
```

1. **Frontend**: `http://localhost:5173`
2. **Backend**: `http://localhost:5000`
3. Click on **Task Manager (JWT Auth)** in the top navigation bar.
4. Click **Sign In** or **Create Account** to register a new user and manage your secure personal tasks!

---

## 🎓 Viva Questions & Answers

**Q1: Why must passwords be hashed using bcrypt rather than simple SHA-256?**  
> *Answer*: SHA-256 is an extremely fast hashing algorithm designed for data integrity, making it vulnerable to GPU-accelerated brute-force and rainbow table attacks. `bcrypt` incorporates automatic salt generation and an intentional work factor (cost parameter) that slows down hashing to resist brute-force attacks.

**Q2: What is a JWT and how does stateless authentication work?**  
> *Answer*: A JSON Web Token (JWT) is a digitally signed compact string consisting of Header, Payload, and Signature (`header.payload.signature`). In stateless authentication, the server verifies the signature using a secret key without querying a session table in the database on every request.

**Q3: Why should input validation happen on the server even if the client already validates inputs?**  
> *Answer*: Client-side validation improves user experience by giving immediate feedback, but it can easily be bypassed using tools like Postman, cURL, or browser developer tools. Server-side validation is mandatory to ensure data integrity and prevent malicious or malformed data from reaching the database.

**Q4: What HTTP status code is returned when a JWT token is missing or expired?**  
> *Answer*: `401 Unauthorized` is returned to indicate that the request lacks valid authentication credentials.
