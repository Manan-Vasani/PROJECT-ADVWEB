const mongoose = require('mongoose');

// Practical 5: CommonJS Task Model for Standalone task-manager-api
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required and cannot be empty'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
