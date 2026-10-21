import mongoose from 'mongoose';

/**
 * Task Schema Definition for Practical 7
 * Inherits all fields from Practical 5 & 6 and adds User ownership
 */
const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to an authenticated user']
    },
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
  },
  {
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

// Pre-save hook: auto-trim title
taskSchema.pre('save', function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (next && typeof next === 'function') {
    next();
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
