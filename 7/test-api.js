// Practical 7: Automated Authentication & Middleware Pipeline Test Suite
// Verifies JWT Auth, Password Hashing, Protected Routes, Input Validation, and CRUD

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const runTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🔐 Practical 7: Authentication & Middleware Pipeline Test Suite${colors.reset}`);
  console.log(`${colors.cyan}Target Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================\n${colors.reset}`);

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
    // Test 1: Server Health & DB Status (GET /)
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Testing Server Root & Status (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('Database is MongoDB', rootData.database?.type === 'MongoDB', rootData.database?.type, 'MongoDB');
    assertTest('Auth Strategy is JWT', rootData.auth?.strategy?.includes('JWT'), true, true);

    // ----------------------------------------------------
    // Test 2: Protected Route Rejection Without Token (GET /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Testing Protected Route Without Token (GET /tasks)${colors.reset}`);
    const resNoToken = await fetch(`${BASE_URL}/tasks`);
    assertTest('Status is 401 Unauthorized', resNoToken.status === 401, resNoToken.status, 401);
    const noTokenData = await resNoToken.json();
    assertTest('Returns Unauthorized Error', noTokenData.error === 'Unauthorized', noTokenData.error, 'Unauthorized');

    // ----------------------------------------------------
    // Test 3: Protected Route With Malformed Token (GET /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Testing Protected Route With Malformed Token (GET /tasks)${colors.reset}`);
    const resBadToken = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: 'Bearer this_is_an_invalid_token_12345' }
    });
    assertTest('Status is 401 Unauthorized', resBadToken.status === 401, resBadToken.status, 401);

    // ----------------------------------------------------
    // Test 4: Registration Input Validation Rejections
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Testing Registration Input Validation Rejections (POST /api/auth/register)${colors.reset}`);
    // Short password (<6 chars)
    const resShortPass = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: '123' })
    });
    assertTest('Short password rejected with 400 Bad Request', resShortPass.status === 400, resShortPass.status, 400);

    // Invalid email format
    const resBadEmail = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'not-an-email', password: 'password123' })
    });
    assertTest('Invalid email rejected with 400 Bad Request', resBadEmail.status === 400, resBadEmail.status, 400);

    // ----------------------------------------------------
    // Test 5: Successful User Registration (POST /api/auth/register)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Testing Successful User Registration (POST /api/auth/register)${colors.reset}`);
    const uniqueEmail = `student_${Date.now()}@charusat.edu.in`;
    const resRegister = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manan Vasani',
        email: uniqueEmail,
        password: 'securePassword123'
      })
    });
    assertTest('Status is 201 Created', resRegister.status === 201, resRegister.status, 201);
    const regData = await resRegister.json();
    assertTest('Returns valid JWT token', typeof regData.token === 'string' && regData.token.length > 20, true, true);
    assertTest('Returns user profile with ID', Boolean(regData.user?.id), true, true);

    let authToken = regData.token;

    // ----------------------------------------------------
    // Test 6: Duplicate Email Registration (POST /api/auth/register)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Testing Duplicate Email Registration Rejection${colors.reset}`);
    const resDup = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: uniqueEmail,
        password: 'anotherPassword123'
      })
    });
    assertTest('Duplicate email rejected with 400 Bad Request', resDup.status === 400, resDup.status, 400);

    // ----------------------------------------------------
    // Test 7: User Login with Invalid Password (POST /api/auth/login)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Testing User Login with Wrong Password (POST /api/auth/login)${colors.reset}`);
    const resWrongPass = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'wrongPassword!' })
    });
    assertTest('Status is 401 Unauthorized', resWrongPass.status === 401, resWrongPass.status, 401);

    // ----------------------------------------------------
    // Test 8: User Login Success (POST /api/auth/login)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Testing Successful User Login (POST /api/auth/login)${colors.reset}`);
    const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'securePassword123' })
    });
    assertTest('Status is 200 OK', resLogin.status === 200, resLogin.status, 200);
    const loginData = await resLogin.json();
    assertTest('Login returns new JWT token', typeof loginData.token === 'string', true, true);
    authToken = loginData.token;

    // ----------------------------------------------------
    // Test 9: Fetch Current User Profile (GET /api/auth/me)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Testing Protected User Profile (GET /api/auth/me)${colors.reset}`);
    const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Status is 200 OK', resMe.status === 200, resMe.status, 200);
    const meData = await resMe.json();
    assertTest('User email matches', meData.user?.email === uniqueEmail, meData.user?.email, uniqueEmail);
    assertTest('Password hash excluded from response', meData.user?.password === undefined, true, true);

    // ----------------------------------------------------
    // Test 10: Task Input Validation Middleware (POST /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Testing Task Input Validation (POST /tasks without title)${colors.reset}`);
    const resBadTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ description: 'No title task' })
    });
    assertTest('Status is 400 Bad Request', resBadTask.status === 400, resBadTask.status, 400);

    // ----------------------------------------------------
    // Test 11: Create Task with JWT Authorization (POST /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}11. Testing Create Task with Bearer Token (POST /tasks)${colors.reset}`);
    const resCreateTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Learn JWT Authentication Pipeline',
        description: 'Practical 7 Express middleware and bcrypt hashing',
        priority: 'high',
        completed: false
      })
    });
    assertTest('Status is 201 Created', resCreateTask.status === 201, resCreateTask.status, 201);
    const createdTask = await resCreateTask.json();
    const createdId = createdTask._id || createdTask.id;
    assertTest('Task has valid MongoDB ObjectId', Boolean(createdId), true, true);
    assertTest('Task title matches', createdTask.title === 'Learn JWT Authentication Pipeline', createdTask.title, 'Learn JWT Authentication Pipeline');
    assertTest('Task priority is high', createdTask.priority === 'high', createdTask.priority, 'high');

    // ----------------------------------------------------
    // Test 12: Read Tasks for Authenticated User (GET /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}12. Testing Fetch Tasks with Bearer Token (GET /tasks)${colors.reset}`);
    const resGetTasks = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Status is 200 OK', resGetTasks.status === 200, resGetTasks.status, 200);
    const tasks = await resGetTasks.json();
    assertTest('Tasks returned as Array', Array.isArray(tasks), true, true);
    assertTest('Contains created task', tasks.some((t) => (t._id || t.id) === createdId), true, true);

    // ----------------------------------------------------
    // Test 13: Read Single Task by ID (GET /tasks/:id)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}13. Testing Read Single Task (GET /tasks/:id)${colors.reset}`);
    const resGetOne = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Status is 200 OK', resGetOne.status === 200, resGetOne.status, 200);

    // ----------------------------------------------------
    // Test 14: Update Task (PUT /tasks/:id)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}14. Testing Update Task (PUT /tasks/:id)${colors.reset}`);
    const resUpdate = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ completed: true, priority: 'medium' })
    });
    assertTest('Status is 200 OK', resUpdate.status === 200, resUpdate.status, 200);
    const updatedTask = await resUpdate.json();
    assertTest('Task completed is true', updatedTask.completed === true, updatedTask.completed, true);
    assertTest('Task priority updated to medium', updatedTask.priority === 'medium', updatedTask.priority, 'medium');

    // ----------------------------------------------------
    // Test 15: Delete Task (DELETE /tasks/:id)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}15. Testing Delete Task (DELETE /tasks/:id)${colors.reset}`);
    const resDelete = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Status is 200 OK', resDelete.status === 200, resDelete.status, 200);

    // Verify deleted
    const resDeletedCheck = await fetch(`${BASE_URL}/tasks/${createdId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Deleted task yields 404 Not Found', resDeletedCheck.status === 404, resDeletedCheck.status, 404);

    // ----------------------------------------------------
    // Test 16: CastError for Malformed ObjectId
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}16. Testing CastError on Malformed ID (GET /tasks/bad-id-123)${colors.reset}`);
    const resCast = await fetch(`${BASE_URL}/tasks/bad-id-123`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assertTest('Status is 400 Bad Request', resCast.status === 400, resCast.status, 400);

    // ----------------------------------------------------
    // Test 17: 404 Handler for Undefined Routes
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}17. Testing 404 Handler (GET /api/undefined-endpoint)${colors.reset}`);
    const res404 = await fetch(`${BASE_URL}/api/undefined-endpoint`);
    assertTest('Status is 404 Not Found', res404.status === 404, res404.status, 404);

    // ----------------------------------------------------
    // Test 18: Global 500 Error Handler Simulation
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}18. Testing 500 Global Error Handler (GET /error-test)${colors.reset}`);
    const res500 = await fetch(`${BASE_URL}/error-test`);
    assertTest('Status is 500 Internal Server Error', res500.status === 500, res500.status, 500);

  } catch (err) {
    console.error(`\n${colors.red}Test Execution Error:${colors.reset}`, err.message);
    failed++;
  }

  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}Test Results Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${failed === 0 ? colors.green : colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================\n${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
