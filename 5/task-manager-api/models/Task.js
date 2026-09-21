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
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid priority (must be low, medium, or high)'
    },
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Supplementary: Pre-save hook to trim title whitespace
taskSchema.pre('save', function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (next && typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Task', taskSchema);
