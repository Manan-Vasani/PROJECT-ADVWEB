// Practical 4: Automated RESTful API Verification Script
// Tests all 4 CRUD routes, request logging, and error handling status codes (200, 201, 400, 404, 500)

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
  console.log(`\n${colors.bright}${colors.cyan}=====================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🧪 Practical 4: RESTful API Test Suite & Verification${colors.reset}`);
  console.log(`${colors.cyan}Target Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=====================================================\n${colors.reset}`);

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
    // Test 1: GET / - Server Health & Metadata
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Testing Server Root (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);

    // ----------------------------------------------------
    // Test 2: GET /tasks - Read All Tasks
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Testing Read Tasks (GET /tasks)${colors.reset}`);
    const resGetTasks = await fetch(`${BASE_URL}/tasks`);
    const tasks = await resGetTasks.json();
    assertTest('Status is 200 OK', resGetTasks.status === 200, resGetTasks.status, 200);
    assertTest('Response is an Array', Array.isArray(tasks), typeof tasks, 'Array');
    console.log(`     Fetched ${tasks.length} tasks successfully.`);

    // ----------------------------------------------------
    // Test 3: POST /tasks - Create New Task (Valid)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Testing Create Task (POST /tasks)${colors.reset}`);
    const newTaskPayload = {
      title: 'Automated Test Task',
      description: 'Created by automated verification runner',
      completed: false
    };
    const resPost = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaskPayload)
    });
    const createdTask = await resPost.json();
    assertTest('Status is 201 Created', resPost.status === 201, resPost.status, 201);
    assertTest('Task has valid generated ID', typeof createdTask.id === 'number', createdTask.id, 'number');
    assertTest('Task title matches', createdTask.title === newTaskPayload.title, createdTask.title, newTaskPayload.title);

    const createdId = createdTask.id;

    // ----------------------------------------------------
    // Test 4: POST /tasks - Validation Failure (Missing Title)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Testing Create Task Validation (POST /tasks without title)${colors.reset}`);
    const resPostInvalid = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No title provided' })
    });
    assertTest('Status is 400 Bad Request', resPostInvalid.status === 400, resPostInvalid.status, 400);

    // ----------------------------------------------------
    // Test 5: GET /tasks/:id - Read Single Task
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Testing Read Single Task (GET /tasks/${createdId})${colors.reset}`);
    const resGetSingle = await fetch(`${BASE_URL}/tasks/${createdId}`);
    const fetchedTask = await resGetSingle.json();
    assertTest('Status is 200 OK', resGetSingle.status === 200, resGetSingle.status, 200);
    assertTest('Fetched task ID matches', fetchedTask.id === createdId, fetchedTask.id, createdId);

    // ----------------------------------------------------
    // Test 6: PUT /tasks/:id - Update Task
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Testing Update Task (PUT /tasks/${createdId})${colors.reset}`);
    const resPut = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Test Task Title',
        completed: true
      })
    });
    const updatedTask = await resPut.json();
    assertTest('Status is 200 OK', resPut.status === 200, resPut.status, 200);
    assertTest('Task completed updated to true', updatedTask.completed === true, updatedTask.completed, true);
    assertTest('Task title updated', updatedTask.title === 'Updated Test Task Title', updatedTask.title, 'Updated Test Task Title');

    // ----------------------------------------------------
    // Test 7: DELETE /tasks/:id - Delete Task
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Testing Delete Task (DELETE /tasks/${createdId})${colors.reset}`);
    const resDelete = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'DELETE'
    });
    assertTest('Status is 200 OK', resDelete.status === 200, resDelete.status, 200);

    // Verify deletion: GET /tasks/:id should now return 404
    const resGetDeleted = await fetch(`${BASE_URL}/tasks/${createdId}`);
    assertTest('Deleted task yields 404 Not Found', resGetDeleted.status === 404, resGetDeleted.status, 404);

    // ----------------------------------------------------
    // Test 8: Non-Existent Route - 404 Handler
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Testing 404 Handler (GET /non-existent-route-xyz)${colors.reset}`);
    const res404 = await fetch(`${BASE_URL}/non-existent-route-xyz`);
    assertTest('Status is 404 Not Found', res404.status === 404, res404.status, 404);

    // ----------------------------------------------------
    // Test 9: Global Error Handler - 500 Simulation
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Testing Global Error Handler (GET /error-test)${colors.reset}`);
    const res500 = await fetch(`${BASE_URL}/error-test`);
    const errorBody = await res500.json();
    assertTest('Status is 500 Internal Server Error', res500.status === 500, res500.status, 500);
    assertTest('Response contains error payload', Boolean(errorBody.error), errorBody.error, 'Defined');

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log(`\n${colors.bright}${colors.cyan}=====================================================${colors.reset}`);
    console.log(`${colors.bright}Test Results Summary:${colors.reset}`);
    console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`  Failed: ${failed > 0 ? colors.red + failed : colors.green + 0}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}=====================================================\n${colors.reset}`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n${colors.red}❌ Connection Error: Could not connect to API server at ${BASE_URL}.${colors.reset}`);
    console.error(`Please ensure the server is running with 'npm run server' or 'node server.js' first.\n`);
    console.error(err.message);
    process.exit(1);
  }
};

runTests();
