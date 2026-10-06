// Practical 9: In-Memory Caching & Latency Optimization Test Suite
// Verifies node-cache integration, Cache HIT/MISS lifecycles, Invalidation on writes, and API speedups

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
  console.log(`${colors.bright}${colors.cyan}⚡ Practical 9: In-Memory Caching (node-cache) & Optimization Test Suite${colors.reset}`);
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
    // Test 1: Server Root & Caching Metadata (GET /)
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Testing Server Root & Caching Engine Metadata (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('Database is MongoDB', rootData.database?.type === 'MongoDB', rootData.database?.type, 'MongoDB');

    // ----------------------------------------------------
    // Test 2: Flush Cache Initially
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Testing Cache Reset (POST /api/cache/clear)${colors.reset}`);
    const resClear = await fetch(`${BASE_URL}/api/cache/clear`, { method: 'POST' });
    assertTest('Status is 200 OK', resClear.status === 200, resClear.status, 200);

    // ----------------------------------------------------
    // Test 3: User Registration & Login for Auth Token
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Register & Login Test Account${colors.reset}`);
    const uniqueEmail = `cache_tester_${Date.now()}@charusat.edu.in`;
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cache Tester',
        email: uniqueEmail,
        password: 'securePassword123'
      })
    });
    const regData = await resReg.json();
    assertTest('Registration successful (201 Created)', resReg.status === 201, resReg.status, 201);
    const token = regData.token;

    // ----------------------------------------------------
    // Test 4: Seed Task Document in MongoDB
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Seed Task in MongoDB (POST /tasks)${colors.reset}`);
    const resSeed = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Evaluate In-Memory Caching Latency',
        description: 'Testing node-cache performance in Practical 9',
        priority: 'high',
        completed: false
      })
    });
    assertTest('Task created (201 Created)', resSeed.status === 201, resSeed.status, 201);
    const createdTask = await resSeed.json();
    const taskId = createdTask._id || createdTask.id;

    // ----------------------------------------------------
    // Test 5: Cache MISS on First GET /tasks
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Testing Cache MISS on First GET /tasks${colors.reset}`);
    const start1 = performance.now();
    const resGet1 = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dur1 = Math.round(performance.now() - start1);
    const cacheHeader1 = resGet1.headers.get('X-Cache');
    assertTest('Status is 200 OK', resGet1.status === 200, resGet1.status, 200);
    assertTest('X-Cache header is MISS (queried MongoDB)', cacheHeader1 === 'MISS', cacheHeader1, 'MISS');
    console.log(`     Recorded First Request (Uncached): ${dur1} ms`);

    // ----------------------------------------------------
    // Test 6: Cache HIT on Subsequent GET /tasks
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Testing Cache HIT on Subsequent GET /tasks${colors.reset}`);
    const start2 = performance.now();
    const resGet2 = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dur2 = Math.round(performance.now() - start2);
    const cacheHeader2 = resGet2.headers.get('X-Cache');
    assertTest('Status is 200 OK', resGet2.status === 200, resGet2.status, 200);
    assertTest('X-Cache header is HIT (served from node-cache)', cacheHeader2 === 'HIT', cacheHeader2, 'HIT');
    console.log(`     Recorded Second Request (Cached): ${dur2} ms`);

    // ----------------------------------------------------
    // Test 7: Third GET /tasks (Cache HIT Confirmation)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Testing Third Consecutive Request (Cache HIT)${colors.reset}`);
    const resGet3 = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Third request is Cache HIT', resGet3.headers.get('X-Cache') === 'HIT', resGet3.headers.get('X-Cache'), 'HIT');

    // ----------------------------------------------------
    // Test 8: Single Task Caching (GET /tasks/:id) - Supplementary 1
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Testing Single Task Document Caching (GET /tasks/:id)${colors.reset}`);
    const resSingle1 = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Initial single task fetch is MISS', resSingle1.headers.get('X-Cache') === 'MISS', resSingle1.headers.get('X-Cache'), 'MISS');

    const resSingle2 = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Subsequent single task fetch is HIT', resSingle2.headers.get('X-Cache') === 'HIT', resSingle2.headers.get('X-Cache'), 'HIT');

    // ----------------------------------------------------
    // Test 9: Cache Invalidation on Task Creation (POST /tasks)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Testing Cache Invalidation after POST /tasks${colors.reset}`);
    const resNewTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Cache Invalidation Verification Task',
        priority: 'low'
      })
    });
    assertTest('Task creation returns 201', resNewTask.status === 201, resNewTask.status, 201);
    assertTest('X-Cache-Invalidated header present', resNewTask.headers.get('X-Cache-Invalidated') === 'true', true, true);

    // Verify next GET /tasks is a fresh MISS from MongoDB (never stale data!)
    const resAfterCreate = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('GET /tasks after write is MISS (stale cache cleared)', resAfterCreate.headers.get('X-Cache') === 'MISS', resAfterCreate.headers.get('X-Cache'), 'MISS');

    // ----------------------------------------------------
    // Test 10: Cache Invalidation on Update (PUT /tasks/:id)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Testing Cache Invalidation on PUT /tasks/:id${colors.reset}`);
    const resUpdate = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completed: true })
    });
    assertTest('Update returns 200 OK', resUpdate.status === 200, resUpdate.status, 200);

    const resAfterUpdate = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('GET /tasks after update is MISS', resAfterUpdate.headers.get('X-Cache') === 'MISS', resAfterUpdate.headers.get('X-Cache'), 'MISS');

    // ----------------------------------------------------
    // Test 11: Cache Invalidation on Delete (DELETE /tasks/:id)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}11. Testing Cache Invalidation on DELETE /tasks/:id${colors.reset}`);
    const resDelete = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Delete returns 200 OK', resDelete.status === 200, resDelete.status, 200);

    const resAfterDelete = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('GET /tasks after delete is MISS', resAfterDelete.headers.get('X-Cache') === 'MISS', resAfterDelete.headers.get('X-Cache'), 'MISS');

    // ----------------------------------------------------
    // Test 12: Cache Statistics Endpoint (GET /api/cache/stats) - Supplementary 2
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}12. Testing Cache Stats Endpoint (GET /api/cache/stats)${colors.reset}`);
    const resStats = await fetch(`${BASE_URL}/api/cache/stats`);
    assertTest('Stats endpoint returns 200 OK', resStats.status === 200, resStats.status, 200);
    const statsData = await resStats.json();
    assertTest('Stats contains hits counter', typeof statsData.stats?.hits === 'number', true, true);
    assertTest('Stats contains misses counter', typeof statsData.stats?.misses === 'number', true, true);
    assertTest('Stats contains hitRatio string', typeof statsData.stats?.hitRatio === 'string', true, true);
    assertTest('Stats contains TTL of 60s', statsData.stats?.ttl === 60, statsData.stats?.ttl, 60);

    // ----------------------------------------------------
    // Test 13: Cache Bypass via Query Parameter (?no_cache=true)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}13. Testing Cache Bypass with ?no_cache=true${colors.reset}`);
    // Warm up cache
    await fetch(`${BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    const resBypass = await fetch(`${BASE_URL}/tasks?no_cache=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('X-Cache header indicates BYPASS', resBypass.headers.get('X-Cache') === 'BYPASS', resBypass.headers.get('X-Cache'), 'BYPASS');

    // ----------------------------------------------------
    // Test 14: Undefined 404 & 500 Error Handlers
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}14. Testing 404 & 500 Error Handlers${colors.reset}`);
    const res404 = await fetch(`${BASE_URL}/api/unknown-route`);
    assertTest('404 Route Not Found', res404.status === 404, res404.status, 404);

    const res500 = await fetch(`${BASE_URL}/error-test`);
    assertTest('500 Simulated Crash handled cleanly', res500.status === 500, res500.status, 500);

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
