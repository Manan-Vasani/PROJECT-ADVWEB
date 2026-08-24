# MedCare Plus — Hospital Appointment System

**Course**: ITUE301 — Advanced Web Development Frameworks (Practical Examination - SET A)  
**Student Roll No / Batch**: 24DCS147-C  
**Tech Stack**: React 18 (Frontend) + Express.js (Backend) + MongoDB / Mongoose (Database)

---

## 1. Project Name
**MedCare Plus — Hospital Appointment System**

MedCare Plus is a full-stack hospital management web application designed for doctor discovery, clinical scheduling, patient appointment booking with real-time state preview, and Mongoose schema validation.

---

## 2. Frontend Setup and Run Command

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install all frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web application at: **`http://localhost:5173`**

### Available Routes:
* `/` — **HomePage**: Hospital metrics overview and dynamic `<AppointmentCard />` display.
* `/doctors` — **DoctorsPage**: Live doctor availability loaded from Express REST API with tri-state lifecycle (`data`, `loading`, `error`).
* `/booking` — **BookingPage**: Interactive appointment booking form with real-time live keystroke preview.

---

## 3. Backend Setup and Run Command

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   node server.js
   ```
   *(or `npm start` / `npm run dev`)*
4. Backend runs at: **`http://localhost:5000`**

### REST API Endpoints:
* `GET  /api/v1/appointments` — Returns all hospital appointments (`HTTP 200 OK`).
* `POST /api/v1/appointments` — Creates and registers a new appointment (`HTTP 201 Created`).
* `GET  /api/v1/doctors` — Returns all specialist doctors (`HTTP 200 OK`).
* `POST /api/v1/patients` — Directly creates and persists a patient into MongoDB Atlas (`HTTP 201 Created`).
* `GET  /api/v1/patients` — Retrieves all patients from MongoDB Atlas (`HTTP 200 OK`).
* `POST /api/v1/test/validate` — Demonstrates Mongoose schema validation failure (`HTTP 400 Bad Request`).

---

## 4. MongoDB Setup

The application connects to MongoDB using Mongoose and loads the connection string securely from the `.env` file via `dotenv`.

1. Copy `.env.example` to create your `.env` file inside `backend/`:
   ```bash
   cp .env.example .env
   ```
2. Configure your MongoDB connection string in `backend/.env`.
3. Database Name: **`medcare_hospital`**
4. Collections:
   * **`patients`**: Schema with required `name`, unique `email`, and `bloodGroup` enum (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
   * **`doctors`**: Schema with `name`, `specialisation`, and `available` (default: `true`).
   * **`appointments`**: Schema with Mongoose `ObjectId` references to `Patient` and `Doctor`, `status` enum, and `reason` (max 300 characters).

---

## 5. Required Environment Variables

The backend requires the following environment variables configured in `backend/.env`:

```env
# Server Port Configuration
PORT=5000

# MongoDB Connection String (MongoDB Atlas or Local MongoDB Compass)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/medcare_hospital?retryWrites=true&w=majority
```

*(Note: `.env` is ignored in `.gitignore` and never committed to Git. A template `.env.example` is committed as required by the exam).*

---

## 📂 Project Structure

```text
itue301-exam-24DCS147-C/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── AppointmentCard.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── DoctorsPage.jsx
│   │   │   └── BookingPage.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── models/
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   └── Appointment.js
│   ├── server.js
│   ├── test-api.js
│   ├── test.http
│   ├── .env.example
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🧪 Automated Testing & Verification

Run the automated 13-point test suite:

```bash
cd backend
npm test
```
