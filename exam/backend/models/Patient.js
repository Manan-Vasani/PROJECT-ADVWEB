const mongoose = require('mongoose');

const allowedBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Patient email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: {
      values: allowedBloodGroups,
      message: 'Invalid blood group `{VALUE}`. Allowed values are: ' + allowedBloodGroups.join(', ')
    }
  },
  age: {
    type: Number,
    min: [0, 'Age must be a positive number']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
