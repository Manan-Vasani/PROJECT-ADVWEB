// Practical 5: Automated MongoDB & Mongoose RESTful API Verification Script
// Tests all CRUD routes, Schema Validation (required title), ObjectId CastError, and Error Handling

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const runTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🍃 Practical 5: MongoDB & Mongoose RESTful API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}Target Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}================================================================\n${colors.reset}`);

  let passed = 0;
  let failed = 0;

  const assertTest = (testName, condition, actual, expected) => {
    if (condition) {
      console.log(`  ${colors.green}✔ PASS${colors.reset} - ${testName}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✖ FAIL${colors.reset} - ${testName}`);
      console.log(`    Expected: ${expected}`);
      console.log(`    Actual:   ${actual}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // Test 1: GET / - Server Health & MongoDB Metadata
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Testing Server Root (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('Contains Database Metadata', rootData.database !== undefined, typeof rootData.database, 'object');
    assertTest('Database is MongoDB', rootData.database.provider === 'MongoDB', rootData.database.provider, 'MongoDB');

    // ----------------------------------------------------
    // Test 2: GET /tasks - Read All Tasks from MongoDB
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Testing Read Tasks (GET /tasks)${colors.reset}`);
    const resGetTasks = await fetch(`${BASE_URL}/tasks`);
    const tasks = await resGetTasks.json();
    assertTest('Status is 200 OK', resGetTasks.status === 200, resGetTasks.status, 200);
    assertTest('Response is an Array', Array.isArray(tasks), typeof tasks, 'Array');
    console.log(`     Fetched ${tasks.length} tasks from MongoDB collection.`);

    // ----------------------------------------------------
    // Test 3: POST /tasks - Create New Task (Schema Validation Happy Path)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Testing Create Task with Schema Validation (POST /tasks)${colors.reset}`);
    const newTaskPayload = {
      title: 'Mongoose Automated Test Document',
      description: 'Testing document persistence and schema default values in MongoDB',
      completed: false
    };

    const resPost = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaskPayload)
    });

    const createdTask = await resPost.json();
    assertTest('Status is 201 Created', resPost.status === 201, resPost.status, 201);
    assertTest('Contains valid MongoDB _id or id', Boolean(createdTask._id || createdTask.id), true, true);
    assertTest('Document title matches', createdTask.title === newTaskPayload.title, createdTask.title, newTaskPayload.title);
    assertTest('Default createdAt exists', Boolean(createdTask.createdAt), true, true);
    const createdId = createdTask._id || createdTask.id;
    console.log(`     Created MongoDB Document ID: ${createdId}`);

    // ----------------------------------------------------
    // Test 4: POST /tasks - Mongoose Validation Rejection (Missing Title)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Testing Mongoose Validation Rejection (POST /tasks without title)${colors.reset}`);
    const invalidPayload = {
      description: 'Invalid task missing required title'
    };

    const resInvalidPost = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPayload)
    });

    const errorData = await resInvalidPost.json();
    assertTest('Status is 400 Bad Request', resInvalidPost.status === 400, resInvalidPost.status, 400);
    assertTest('Returns structured Validation Error', errorData.error === 'Validation Error', errorData.error, 'Validation Error');
    console.log(`     Structured Error Response: ${JSON.stringify(errorData)}`);

    // ----------------------------------------------------
    // Test 5: GET /tasks/:id - Read Single Task by MongoDB ObjectId
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Testing Read Single Task (GET /tasks/${createdId})${colors.reset}`);
    const resGetSingle = await fetch(`${BASE_URL}/tasks/${createdId}`);
    const singleTask = await resGetSingle.json();
    assertTest('Status is 200 OK', resGetSingle.status === 200, resGetSingle.status, 200);
    assertTest('Fetched task ID matches created ID', (singleTask._id || singleTask.id) === createdId, (singleTask._id || singleTask.id), createdId);

    // ----------------------------------------------------
    // Test 6: PUT /tasks/:id - Update Task by ObjectId
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Testing Update Task (PUT /tasks/${createdId})${colors.reset}`);
    const updatePayload = {
      completed: true,
      title: 'Mongoose Automated Test Document (Updated)'
    };

    const resPut = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });

    const updatedTask = await resPut.json();
    assertTest('Status is 200 OK', resPut.status === 200, resPut.status, 200);
    assertTest('Task completed is updated to true', updatedTask.completed === true, updatedTask.completed, true);
    assertTest('Task title is updated', updatedTask.title === updatePayload.title, updatedTask.title, updatePayload.title);

    // ----------------------------------------------------
    // Test 7: DELETE /tasks/:id - Delete Task from MongoDB
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Testing Delete Task (DELETE /tasks/${createdId})${colors.reset}`);
    const resDelete = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'DELETE'
    });

    const deleteResponse = await resDelete.json();
    assertTest('Status is 200 OK', resDelete.status === 200, resDelete.status, 200);
    assertTest('Task successfully deleted message', Boolean(deleteResponse.message), true, true);

    // Verify deletion yields 404
    const resVerifyDelete = await fetch(`${BASE_URL}/tasks/${createdId}`);
    assertTest('Deleted task yields 404 Not Found', resVerifyDelete.status === 404, resVerifyDelete.status, 404);

    // ----------------------------------------------------
    // Test 8: CastError Handling for Invalid ObjectId
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Testing CastError for Malformed ObjectId (GET /tasks/invalid-id-xyz)${colors.reset}`);
    const resCastError = await fetch(`${BASE_URL}/tasks/invalid-id-xyz`);
    const castErrorData = await resCastError.json();
    assertTest('Status is 400 Bad Request', resCastError.status === 400, resCastError.status, 400);
    assertTest('Returns structured Invalid ID Format', castErrorData.error === 'Invalid ID Format', castErrorData.error, 'Invalid ID Format');

    // ----------------------------------------------------
    // Test 9: 404 Handler for Unmatched Routes
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Testing 404 Handler (GET /api/non-existent-route)${colors.reset}`);
    const res404 = await fetch(`${BASE_URL}/api/non-existent-route`);
    assertTest('Status is 404 Not Found', res404.status === 404, res404.status, 404);

    // ----------------------------------------------------
    // Test 10: Global Error Handler Simulation (GET /error-test)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Testing Global 500 Error Handler (GET /error-test)${colors.reset}`);
    const res500 = await fetch(`${BASE_URL}/error-test`);
    const err500Data = await res500.json();
    assertTest('Status is 500 Internal Server Error', res500.status === 500, res500.status, 500);
    assertTest('Response contains structured error message', Boolean(err500Data.error), true, true);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test suite execution error:${colors.reset}`, error.message);
    failed++;
  }

  console.log(`\n${colors.bright}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bright}Test Results Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}================================================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
