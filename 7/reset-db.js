import mongoose from 'mongoose';
import User from './models/User.js';
import Task from './models/Task.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical7_taskmanager';

async function reset() {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({});
  await Task.deleteMany({});
  console.log('✅ Database practical7_taskmanager cleaned! You can now re-register with any email.');
  await mongoose.disconnect();
  process.exit(0);
}

reset().catch(err => {
  console.error('Error resetting database:', err.message);
  process.exit(1);
});
