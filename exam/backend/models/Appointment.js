const mongoose = require('mongoose');

const allowedStatuses = ['pending', 'confirmed', 'cancelled'];

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID reference is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID reference is required']
  },
  date: {
    type: String,
    required: [true, 'Appointment date is required']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required']
  },
  status: {
    type: String,
    enum: {
      values: allowedStatuses,
      message: 'Invalid appointment status `{VALUE}`. Allowed values are: ' + allowedStatuses.join(', ')
    },
    default: 'pending'
  },
  reason: {
    type: String,
    maxlength: [300, 'Reason cannot exceed 300 characters'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
