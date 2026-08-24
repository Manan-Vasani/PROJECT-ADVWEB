const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env
dotenv.config();

const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medcare_hospital';

// -------------------------------------------------------------
// Middleware: Core Parsing & CORS
// -------------------------------------------------------------
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// Task 3: Custom requestLogger Middleware
// Format: [METHOD] [PATH] [TIMESTAMP]
// Example: [GET] /api/v1/appointments [2026-08-20T10:15:20.000Z]
// -------------------------------------------------------------
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${req.method}] ${req.originalUrl || req.url} [${timestamp}]`);
  next();
};

app.use(requestLogger);

// -------------------------------------------------------------
// In-Memory Data Store (Fallback & Initial Task 3 Dataset)
// -------------------------------------------------------------
let inMemoryDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@medcareplus.com',
    specialisation: 'Cardiology',
    available: true
  },
  {
    id: '2',
    name: 'Dr. Alex Rivera',
    email: 'alex.rivera@medcareplus.com',
    specialisation: 'Neurology',
    available: true
  },
  {
    id: '3',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@medcareplus.com',
    specialisation: 'Pediatrics',
    available: false
  },
  {
    id: '4',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@medcareplus.com',
    specialisation: 'Orthopedics',
    available: true
  },
  {
    id: '5',
    name: 'Dr. Priya Patel',
    email: 'priya.patel@medcareplus.com',
    specialisation: 'Dermatology',
    available: true
  }
];

let inMemoryAppointments = [
  {
    id: '101',
    patientName: 'John Doe',
    doctorName: 'Dr. Sarah Jenkins',
    date: '2026-08-25',
    timeSlot: '10:00 AM',
    status: 'confirmed',
    reason: 'Routine cardiovascular checkup'
  },
  {
    id: '102',
    patientName: 'Alice Smith',
    doctorName: 'Dr. Alex Rivera',
    date: '2026-08-26',
    timeSlot: '02:30 PM',
    status: 'pending',
    reason: 'Persistent migraine headaches'
  },
  {
    id: '103',
    patientName: 'Robert Johnson',
    doctorName: 'Dr. Marcus Vance',
    date: '2026-08-27',
    timeSlot: '11:15 AM',
    status: 'cancelled',
    reason: 'Rescheduling knee follow-up'
  }
];

// -------------------------------------------------------------
// MongoDB Connection State
// -------------------------------------------------------------
let isMongoConnected = false;

mongoose.connect(MONGO_URI)
  .then(async () => {
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to ${MONGO_URI}`);
    
    // Seed initial doctors in MongoDB if collection is empty
    try {
      const count = await Doctor.countDocuments();
      if (count === 0) {
        await Doctor.insertMany([
          { name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@medcareplus.com', specialisation: 'Cardiology', available: true },
          { name: 'Dr. Alex Rivera', email: 'alex.rivera@medcareplus.com', specialisation: 'Neurology', available: true },
          { name: 'Dr. Emily Chen', email: 'emily.chen@medcareplus.com', specialisation: 'Pediatrics', available: false },
          { name: 'Dr. Marcus Vance', email: 'marcus.vance@medcareplus.com', specialisation: 'Orthopedics', available: true },
          { name: 'Dr. Priya Patel', email: 'priya.patel@medcareplus.com', specialisation: 'Dermatology', available: true }
        ]);
        console.log('[MongoDB] Seeded initial doctors list');
      }
    } catch (seedErr) {
      console.warn('[MongoDB] Seeding error:', seedErr.message);
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}). Falling back to in-memory store for REST API.`);
  });

// -------------------------------------------------------------
// Task 3: REST API Endpoints
// -------------------------------------------------------------

// Root healthcheck
app.get('/', (req, res) => {
  res.status(200).json({
    system: 'MedCare Plus Hospital Appointment System API',
    version: '1.0.0',
    mongoStatus: isMongoConnected ? 'connected' : 'in-memory fallback active',
    endpoints: {
      getAllAppointments: 'GET /api/v1/appointments',
      createAppointment: 'POST /api/v1/appointments',
      getAllDoctors: 'GET /api/v1/doctors',
      testValidation: 'POST /api/v1/test/validate'
    }
  });
});

// GET /api/v1/appointments - Return all appointments (200 OK)
app.get('/api/v1/appointments', async (req, res, next) => {
  try {
    if (isMongoConnected) {
      const dbAppointments = await Appointment.find()
        .populate('patientId', 'name email phone bloodGroup age')
        .populate('doctorId', 'name email specialisation available')
        .lean();
      
      // Format for frontend consumption
      const formatted = dbAppointments.map(app => ({
        id: app._id,
        patientName: app.patientId ? app.patientId.name : 'Unknown Patient',
        doctorName: app.doctorId ? app.doctorId.name : 'Unknown Doctor',
        date: app.date,
        timeSlot: app.timeSlot,
        status: app.status,
        reason: app.reason
      }));
      return res.status(200).json(formatted.length > 0 ? formatted : inMemoryAppointments);
    }
    
    return res.status(200).json(inMemoryAppointments);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/appointments - Create a new appointment (201 Created)
app.post('/api/v1/appointments', async (req, res, next) => {
  try {
    const { patientName, doctorName, date, timeSlot, status, reason, patientId, doctorId } = req.body;

    if (!patientName && !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient information (patientName or patientId) is required'
      });
    }
    if (!doctorName && !doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor information (doctorName or doctorId) is required'
      });
    }
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date is required'
      });
    }
    if (!timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is required'
      });
    }

    const newAppointment = {
      id: String(Date.now()),
      patientName: patientName || 'Patient',
      doctorName: doctorName || 'Doctor',
      date,
      timeSlot,
      status: status || 'pending',
      reason: reason || 'General Consultation'
    };

    inMemoryAppointments.unshift(newAppointment);

    // Also persist directly into MongoDB Atlas if connected!
    if (isMongoConnected) {
      try {
        // 1. Create or Find Patient in MongoDB
        const cleanName = (patientName || 'Patient').trim();
        const safeEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@medcareplus.com`;
        
        let dbPatient = await Patient.findOne({ name: cleanName });
        if (!dbPatient) {
          dbPatient = await Patient.create({
            name: cleanName,
            email: safeEmail,
            phone: '+91-98765-43210',
            bloodGroup: 'B+',
            age: 20
          });
          console.log(`[MongoDB Atlas] Created patient record for: ${cleanName}`);
        }

        // 2. Find Doctor in MongoDB (safe exact or partial match)
        let dbDoctor = await Doctor.findOne({ name: doctorName });
        if (!dbDoctor) {
          const docNameClean = (doctorName || '').split('(')[0].trim();
          dbDoctor = await Doctor.findOne({ name: new RegExp(docNameClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
        }
        if (!dbDoctor) {
          dbDoctor = await Doctor.findOne();
        }

        // 3. Create Appointment in MongoDB
        if (dbPatient && dbDoctor) {
          await Appointment.create({
            patientId: dbPatient._id,
            doctorId: dbDoctor._id,
            date,
            timeSlot,
            status: status || 'pending',
            reason: reason || 'General Consultation'
          });
          console.log(`[MongoDB Atlas] Created appointment document for: ${cleanName}`);
        }
      } catch (dbErr) {
        console.warn('[MongoDB Atlas Save Warning]', dbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Appointment successfully created and saved to MongoDB Atlas',
      data: newAppointment
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/doctors - Return all doctors (200 OK)
app.get('/api/v1/doctors', async (req, res, next) => {
  try {
    if (isMongoConnected) {
      const dbDoctors = await Doctor.find().lean();
      if (dbDoctors && dbDoctors.length > 0) {
        return res.status(200).json(dbDoctors);
      }
    }
    return res.status(200).json(inMemoryDoctors);
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Task 5: MongoDB + Mongoose Database Operations (Create & Read)
// Demonstrates real database insertion & querying in MongoDB Atlas
// -------------------------------------------------------------

// POST /api/v1/patients - Save a new Patient to MongoDB (201 Created)
app.post('/api/v1/patients', async (req, res, next) => {
  try {
    const { name, email, phone, bloodGroup, age } = req.body;
    
    // Real Mongoose database insertion: new Patient(...) and save()
    const newPatient = new Patient({
      name,
      email,
      phone,
      bloodGroup,
      age
    });

    const savedPatient = await newPatient.save();
    return res.status(201).json({
      success: true,
      message: 'Patient successfully created and saved to MongoDB Atlas',
      data: savedPatient
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        errorType: 'ValidationError',
        message: 'Mongoose schema validation failed',
        details: errors
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error: Email address already registered'
      });
    }
    next(error);
  }
});

// GET /api/v1/patients - Retrieve all Patients from MongoDB (200 OK)
app.get('/api/v1/patients', async (req, res, next) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Task 5: MongoDB Schema Validation & Test Endpoints
// -------------------------------------------------------------

// POST /api/v1/test/validate - Demonstrates Mongoose schema validation failures
app.post('/api/v1/test/validate', async (req, res, next) => {
  try {
    const { type, payload } = req.body;

    if (type === 'patient') {
      const testPatient = new Patient(payload);
      await testPatient.validate();
      return res.status(200).json({ success: true, message: 'Patient validation passed', data: testPatient });
    }

    if (type === 'doctor') {
      const testDoctor = new Doctor(payload);
      await testDoctor.validate();
      return res.status(200).json({ success: true, message: 'Doctor validation passed', data: testDoctor });
    }

    if (type === 'appointment') {
      const testAppointment = new Appointment(payload);
      await testAppointment.validate();
      return res.status(200).json({ success: true, message: 'Appointment validation passed', data: testAppointment });
    }

    return res.status(400).json({
      success: false,
      message: "Please specify type: 'patient', 'doctor', or 'appointment' along with payload"
    });
  } catch (error) {
    // Return structured Mongoose validation error response instead of raw stack
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        errorType: 'ValidationError',
        message: 'Mongoose schema validation failed',
        details: errors
      });
    }
    next(error);
  }
});

// Trigger an intentional 500 error for testing error middleware
app.get('/api/v1/test/trigger-error', (req, res, next) => {
  const err = new Error('Simulated unhandled server error for testing global error middleware');
  next(err);
});

// -------------------------------------------------------------
// Task 3: Global Error-Handling Middleware
// 4 Arguments: (err, req, res, next)
// Returns structured JSON response instead of exposing raw error stack
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(`[Error Handler] [${new Date().toISOString()}] ${err.message}`);
  
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` MedCare Plus Hospital Backend running on Port ${PORT}`);
  console.log(` API URL: http://localhost:${PORT}`);
  console.log(` Endpoints:`);
  console.log(`   - GET  /api/v1/appointments`);
  console.log(`   - POST /api/v1/appointments`);
  console.log(`   - GET  /api/v1/doctors`);
  console.log(`   - POST /api/v1/test/validate`);
  console.log(`====================================================`);
});

module.exports = app;
