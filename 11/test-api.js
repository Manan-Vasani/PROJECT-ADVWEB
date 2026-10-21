// Practical 11: Multi-Container Architecture (Docker & Docker Compose) Test Suite
// Verifies Container status endpoints, Docker Compose service topology, persistent volume config,
// JWT authentication, task CRUD, in-memory caching, and asynchronous event notifications.

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🐳 Practical 11: Containerization with Docker & Compose Test Suite${colors.reset}`);
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
    // Test 1: Server Root & Containerization Metadata
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Server Root & Containerization Metadata (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('Project title reflects Practical 11', rootData.project?.includes('Practical 11'), rootData.project, 'Practical 11');
    assertTest('Containerization block is present', Boolean(rootData.containerization), Boolean(rootData.containerization), true);
    assertTest('Network name configured as app-network', rootData.containerization?.network === 'app-network', rootData.containerization?.network, 'app-network');
    assertTest('Named volume configured as mongo-data', rootData.containerization?.persistentVolume === 'mongo-data', rootData.containerization?.persistentVolume, 'mongo-data');

    // ----------------------------------------------------
    // Test 2: Docker Status & Service Orchestration Topology
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Docker Status & Service Orchestration (GET /api/docker/status)${colors.reset}`);
    const resDocker = await fetch(`${BASE_URL}/api/docker/status`);
    assertTest('Docker status returns 200 OK', resDocker.status === 200, resDocker.status, 200);
    const dockerData = await resDocker.json();
    assertTest('Status reports online', dockerData.status === 'online', dockerData.status, 'online');
    assertTest('Container metadata includes hostname', Boolean(dockerData.container?.hostname), Boolean(dockerData.container?.hostname), true);
    assertTest('Orchestration defines 3 services', dockerData.orchestration?.services?.length === 3, dockerData.orchestration?.services?.length, 3);
    const serviceNames = (dockerData.orchestration?.services || []).map(s => s.name);
    assertTest('Services include frontend, backend, mongodb', serviceNames.includes('frontend') && serviceNames.includes('backend') && serviceNames.includes('mongodb'), true, true);
    assertTest('MongoDB persistent volume declared', dockerData.orchestration?.mongoPersistentVolume === 'mongo-data', dockerData.orchestration?.mongoPersistentVolume, 'mongo-data');

    // ----------------------------------------------------
    // Test 3: Clear Cache & Event Logs
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Reset Telemetry and In-Memory Cache${colors.reset}`);
    const resClearCache = await fetch(`${BASE_URL}/api/cache/clear`, { method: 'POST' });
    assertTest('Cache clear returns 200 OK', resClearCache.status === 200, resClearCache.status, 200);
    const resClearEvt = await fetch(`${BASE_URL}/api/events/clear`, { method: 'POST' });
    assertTest('Event logs clear returns 200 OK', resClearEvt.status === 200, resClearEvt.status, 200);

    // ----------------------------------------------------
    // Test 4: User Registration
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. User Registration (POST /api/auth/register)${colors.reset}`);
    const uniqueEmail = `docker_dev_${Date.now()}@charusat.edu.in`;
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Docker Container Tester',
        email: uniqueEmail,
        password: 'Password123!'
      })
    });
    assertTest('Registration returns 201 Created', resReg.status === 201, resReg.status, 201);
    const regData = await resReg.json();
    assertTest('Registration returns JWT token', Boolean(regData.token), Boolean(regData.token), true);
    const token = regData.token;

    // ----------------------------------------------------
    // Test 5: User Profile Verification (/api/auth/me)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Verify Authenticated Profile (GET /api/auth/me)${colors.reset}`);
    const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('/api/auth/me returns 200 OK', resMe.status === 200, resMe.status, 200);
    const meData = await resMe.json();
    const fetchedEmail = meData.user?.email || meData.email;
    assertTest('Profile email matches', fetchedEmail === uniqueEmail, fetchedEmail, uniqueEmail);

    // ----------------------------------------------------
    // Test 6: Create Task & Trigger Background Events
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Create Task in Containerized Store (POST /tasks)${colors.reset}`);
    const startCreate = Date.now();
    const resCreate = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Containerize Full-Stack Application with Docker Compose',
        description: 'Multi-stage React build and Node.js express container wired to MongoDB',
        priority: 'high'
      })
    });
    const roundtripMs = Date.now() - startCreate;
    assertTest('Task creation returns 201 Created', resCreate.status === 201, resCreate.status, 201);
    assertTest('API responds quickly (< 250ms)', roundtripMs < 250, `${roundtripMs}ms`, '< 250ms');
    const createdTask = await resCreate.json();
    const taskId = createdTask._id || createdTask.id;
    assertTest('Created task has valid database ID', Boolean(taskId), Boolean(taskId), true);

    // ----------------------------------------------------
    // Test 7: Verify Task in Cache & Database
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Verify Task Fetching with Cache Telemetry (GET /tasks)${colors.reset}`);
    const resGet1 = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Initial fetch returns 200 OK', resGet1.status === 200, resGet1.status, 200);
    const cacheHeader1 = resGet1.headers.get('x-cache');
    assertTest('First fetch reports X-Cache MISS or BYPASS', cacheHeader1 === 'MISS' || cacheHeader1 === 'BYPASS', cacheHeader1, 'MISS or BYPASS');

    const resGet2 = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cacheHeader2 = resGet2.headers.get('x-cache');
    assertTest('Second fetch reports X-Cache HIT', cacheHeader2 === 'HIT', cacheHeader2, 'HIT');

    // ----------------------------------------------------
    // Test 8: Single Task Retrieval & Update
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Single Task Retrieval & Update (PUT /tasks/:id)${colors.reset}`);
    const resUpdate = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        completed: true,
        priority: 'high'
      })
    });
    assertTest('Update returns 200 OK', resUpdate.status === 200, resUpdate.status, 200);
    const updatedTask = await resUpdate.json();
    assertTest('Task status updated to completed', updatedTask.completed === true, updatedTask.completed, true);

    // ----------------------------------------------------
    // Test 9: Delete Task
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Delete Task (DELETE /tasks/:id)${colors.reset}`);
    const resDel = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Delete returns 200 OK', resDel.status === 200, resDel.status, 200);

    // ----------------------------------------------------
    // Test 10: Event Telemetry Verification
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Verify Asynchronous Event Subsystem Telemetry${colors.reset}`);
    await sleep(200);
    const resEvtLogs = await fetch(`${BASE_URL}/api/events/logs`);
    assertTest('Fetch event logs returns 200 OK', resEvtLogs.status === 200, resEvtLogs.status, 200);
    const evtData = await resEvtLogs.json();
    assertTest('Event engine is active', evtData.status === 'ok', evtData.status, 'ok');

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bright}Test Results Summary:${colors.reset}`);
    console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`  Failed: ${failed > 0 ? colors.red + failed : colors.green + '0'}${colors.reset}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log(`${colors.bright}${colors.cyan}========================================================================\n${colors.reset}`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n${colors.red}❌ Test Execution Exception: ${err.message}${colors.reset}`);
    process.exit(1);
  }
};

runTests();
