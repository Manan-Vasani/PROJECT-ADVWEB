import mongoose from 'mongoose';

// Practical 5: MongoDB Integration and Schema Design with Mongoose
// Task Schema definition enforcing data types, required constraints, and default values
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required and cannot be empty'],
      trim: true,
      minlength: [1, 'Task title must contain at least 1 character']
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
  },
  {
    // Enable virtuals and transform for clean JSON outputs
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

// Create and export Mongoose Task Model
const Task = mongoose.model('Task', taskSchema);

export default Task;
