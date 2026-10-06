// Practical 10: Event-Driven Architecture & Non-Blocking Async Processing Test Suite
// Verifies EventEmitter setup, task-created & task-deleted emissions, timestamp ordering evidence, and error handling

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
  console.log(`${colors.bright}${colors.cyan}⚡ Practical 10: Event-Driven Architecture (EventEmitter) Test Suite${colors.reset}`);
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
    // Test 1: Server Root & EventEmitter Subsystem Metadata
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Server Root & EventEmitter Metadata (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('EventEmitter subsystem enabled', rootData.events?.enabled === true, rootData.events?.enabled, true);
    assertTest('Engine is native EventEmitter', rootData.events?.engine === 'Node.js native EventEmitter', rootData.events?.engine, 'Node.js native EventEmitter');
    assertTest('Supports task-created and task-deleted events', rootData.events?.supportedEvents?.includes('task-created') && rootData.events?.supportedEvents?.includes('task-deleted'), true, true);

    // ----------------------------------------------------
    // Test 2: Flush Event Telemetry & Cache
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. Reset Event Telemetry & Cache Logs${colors.reset}`);
    const resClearEvt = await fetch(`${BASE_URL}/api/events/clear`, { method: 'POST' });
    assertTest('Clear events returns 200 OK', resClearEvt.status === 200, resClearEvt.status, 200);

    const resClearCache = await fetch(`${BASE_URL}/api/cache/clear`, { method: 'POST' });
    assertTest('Clear cache returns 200 OK', resClearCache.status === 200, resClearCache.status, 200);

    // ----------------------------------------------------
    // Test 3: Register & Login Test Account
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. Register & Login Test Account${colors.reset}`);
    const uniqueEmail = `event_tester_${Date.now()}@charusat.edu.in`;
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Event Architect',
        email: uniqueEmail,
        password: 'securePassword123'
      })
    });
    const regData = await resReg.json();
    assertTest('Registration successful (201 Created)', resReg.status === 201, resReg.status, 201);
    const token = regData.token;

    // ----------------------------------------------------
    // Test 4: Task Creation & Instant HTTP 201 Response
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Task Creation with Immediate Response (POST /tasks)${colors.reset}`);
    const t0 = performance.now();
    const resCreate = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Implement Native EventEmitter Pipeline',
        description: 'Demonstrating asynchronous non-blocking background notifications',
        priority: 'high',
        completed: false
      })
    });
    const apiDurationMs = Math.round(performance.now() - t0);
    assertTest('HTTP Status is 201 Created', resCreate.status === 201, resCreate.status, 201);
    assertTest('API response returned immediately (< 200ms)', apiDurationMs < 200, `${apiDurationMs}ms`, '< 200ms');
    console.log(`     Recorded API Roundtrip: ${apiDurationMs} ms`);

    const createdTask = await resCreate.json();
    const taskId = createdTask._id || createdTask.id;

    // ----------------------------------------------------
    // Test 5: Verify Non-Blocking Execution & Timestamp Ordering
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. Verify Asynchronous Background Event Processing & Timestamps${colors.reset}`);
    console.log(`     Waiting 1800ms for simulated background email worker to finish...`);
    await sleep(1800);

    const resLogs = await fetch(`${BASE_URL}/api/events/logs`);
    assertTest('GET /api/events/logs returns 200 OK', resLogs.status === 200, resLogs.status, 200);
    const logsData = await resLogs.json();

    const createdEvt = logsData.history?.find((e) => e.event === 'task-created' && e.taskId === String(taskId));
    assertTest('task-created event recorded in telemetry', Boolean(createdEvt), Boolean(createdEvt), true);

    if (createdEvt) {
      console.log(`     ${colors.magenta}[Timestamp Proof]${colors.reset}`);
      console.log(`       1. API Response Dispatched: ${createdEvt.apiSentAt}`);
      console.log(`       2. Listener Started:        ${createdEvt.listenerStartedAt}`);
      console.log(`       3. Listener Completed:      ${createdEvt.listenerCompletedAt}`);
      console.log(`       Worker Processing Took:     ${createdEvt.durationMs} ms`);

      const apiSentTime = new Date(createdEvt.apiSentAt).getTime();
      const listenerFinishTime = new Date(createdEvt.listenerCompletedAt).getTime();
      assertTest(
        'PROOF: API response timestamp is <= listener completion timestamp',
        apiSentTime <= listenerFinishTime,
        `${apiSentTime} <= ${listenerFinishTime}`,
        true
      );
    }

    // ----------------------------------------------------
    // Test 6: Supplementary 3 - Simulated Slow Background Job
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. Supplementary 3: Simulated Slow Background Worker (POST /api/events/test-slow)${colors.reset}`);
    const tSlow = performance.now();
    const resSlow = await fetch(`${BASE_URL}/api/events/test-slow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Heavy Monthly Analytics Digest',
        delayMs: 1200
      })
    });
    const slowApiDuration = Math.round(performance.now() - tSlow);
    assertTest('Slow worker route responds 200 OK', resSlow.status === 200, resSlow.status, 200);
    assertTest('API returned immediately despite 1200ms background delay', slowApiDuration < 150, `${slowApiDuration}ms`, '< 150ms');

    // Wait for the background worker to finish
    await sleep(1400);

    // ----------------------------------------------------
    // Test 7: Supplementary 1 - Task Deletion Event (task-deleted)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. Supplementary 1: Task Deletion Event (DELETE /tasks/:id)${colors.reset}`);
    const tDel = performance.now();
    const resDel = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const delApiDuration = Math.round(performance.now() - tDel);
    assertTest('Task deletion returns 200 OK', resDel.status === 200, resDel.status, 200);
    assertTest('Delete API responded immediately', delApiDuration < 150, `${delApiDuration}ms`, '< 150ms');

    // Wait for audit listener to record
    await sleep(1000);

    const resLogsAfterDel = await fetch(`${BASE_URL}/api/events/logs`);
    const logsAfterDel = await resLogsAfterDel.json();
    const deletedEvt = logsAfterDel.history?.find((e) => e.event === 'task-deleted' && e.taskId === String(taskId));
    assertTest('task-deleted event recorded in telemetry', Boolean(deletedEvt), Boolean(deletedEvt), true);
    if (deletedEvt) {
      console.log(`     ${colors.magenta}[Audit Event Proof]${colors.reset}`);
      console.log(`       Deleted Task:    ${deletedEvt.taskTitle}`);
      console.log(`       Audit Completed: ${deletedEvt.listenerCompletedAt}`);
    }

    // ----------------------------------------------------
    // Test 8: Supplementary 2 - Error Event Listener Catch
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Supplementary 2: Error Event Listener Safety (POST /api/events/test-error)${colors.reset}`);
    const resErr = await fetch(`${BASE_URL}/api/events/test-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Mail server timeout during background notification' })
    });
    assertTest('Error event route returns 200 OK', resErr.status === 200, resErr.status, 200);

    // Verify error was logged in telemetry without crashing server
    const resLogsAfterErr = await fetch(`${BASE_URL}/api/events/logs`);
    const logsAfterErr = await resLogsAfterErr.json();
    const errorEvt = logsAfterErr.history?.find((e) => e.event === 'error');
    assertTest('Error event safely caught and recorded by listener', Boolean(errorEvt), Boolean(errorEvt), true);

    // ----------------------------------------------------
    // Test 9: Server Remains Healthy after Error Event
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. Server Liveness Verification after Background Error${colors.reset}`);
    const resLive = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Server is responsive (200 OK) after handling error event', resLive.status === 200, resLive.status, 200);

    // ----------------------------------------------------
    // Test 10: Event Telemetry Summary Counters
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Event Telemetry Counters & Statistics${colors.reset}`);
    const finalLogsRes = await fetch(`${BASE_URL}/api/events/logs`);
    const finalLogs = await finalLogsRes.json();
    assertTest('Total events emitted counter >= 3', finalLogs.stats?.totalEmitted >= 3, finalLogs.stats?.totalEmitted, '>= 3');
    assertTest('task-created counter >= 2', finalLogs.stats?.byEvent?.['task-created'] >= 2, finalLogs.stats?.byEvent?.['task-created'], '>= 2');
    assertTest('task-deleted counter >= 1', finalLogs.stats?.byEvent?.['task-deleted'] >= 1, finalLogs.stats?.byEvent?.['task-deleted'], '>= 1');
    assertTest('error counter >= 1', finalLogs.stats?.byEvent?.['error'] >= 1, finalLogs.stats?.byEvent?.['error'], '>= 1');

    // ----------------------------------------------------
    // Test 11: Inherited Caching Engine (Practical 9 Baseline)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}11. Inherited Caching Baseline (Practical 9)${colors.reset}`);
    const resCacheStats = await fetch(`${BASE_URL}/api/cache/stats`);
    assertTest('Cache stats endpoint returns 200 OK', resCacheStats.status === 200, resCacheStats.status, 200);

    // ----------------------------------------------------
    // Test 12: 401 Unauthorized & 404 Error Handlers
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}12. Error Handler Integrity${colors.reset}`);
    const res401 = await fetch(`${BASE_URL}/tasks`);
    assertTest('401 Unauthorized without token', res401.status === 401, res401.status, 401);

    const res404 = await fetch(`${BASE_URL}/api/nonexistent-route`);
    assertTest('404 Route Not Found', res404.status === 404, res404.status, 404);

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
