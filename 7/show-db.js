import mongoose from 'mongoose';
import User from './models/User.js';
import Task from './models/Task.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/practical7_taskmanager';

async function displayDatabase() {
  await mongoose.connect(MONGO_URI);
  console.log('\n🍃 Connected to MongoDB: practical7_taskmanager\n');

  console.log('================================================================');
  console.log('👥 USERS IN DATABASE (Proving bcrypt hashed passwords):');
  console.log('================================================================');
  const users = await User.find().lean();
  if (users.length === 0) {
    console.log('  No users found yet. Register a user first via POST /api/auth/register.');
  } else {
    users.forEach((u, i) => {
      console.log(`[User ${i + 1}]`);
      console.log(`  ID:       ${u._id}`);
      console.log(`  Name:     ${u.name}`);
      console.log(`  Email:    ${u.email}`);
      console.log(`  Password: ${u.password}   <-- HASHED WITH BCRYPT ($2a$10$...)`);
      console.log(`  Created:  ${u.createdAt}\n`);
    });
  }

  console.log('================================================================');
  console.log('📋 TASKS IN DATABASE (Showing user-scoped ObjectId ownership):');
  console.log('================================================================');
  const tasks = await Task.find().lean();
  if (tasks.length === 0) {
    console.log('  No tasks found yet.\n');
  } else {
    tasks.forEach((t, i) => {
      console.log(`[Task ${i + 1}]`);
      console.log(`  ID:        ${t._id}`);
      console.log(`  User Ref:  ${t.user}`);
      console.log(`  Title:     ${t.title}`);
      console.log(`  Completed: ${t.completed}`);
      console.log(`  Priority:  ${t.priority}\n`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

displayDatabase().catch((err) => {
  console.error('Error connecting to database:', err.message);
  process.exit(1);
});
