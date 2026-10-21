// Practical 12: Automated CI/CD Test Runner for GitHub Actions
// Executes automated endpoint assertions and supports deliberate test failure demonstration.

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.API_URL || `http://127.0.0.1:${PORT}`;
const IS_DELIBERATE_FAIL = process.argv.includes('--deliberate-fail') || process.env.DELIBERATE_FAIL === 'true';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isServerListening = async (url) => {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
};

const runCiTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🚀 Practical 12: GitHub Actions Automated CI Test Suite${colors.reset}`);
  console.log(`${colors.cyan}Mode: ${IS_DELIBERATE_FAIL ? colors.red + '💥 DELIBERATE FAILURE DEMO (--deliberate-fail)' : colors.green + '✅ NORMAL PASSING PIPELINE'}${colors.reset}`);
  console.log(`${colors.cyan}Target Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================\n${colors.reset}`);

  let serverProcess = null;

  // Check if backend server is already running; if not, spin it up automatically
  const alreadyUp = await isServerListening(`${BASE_URL}/`);
  if (!alreadyUp) {
    console.log(`[CI] Server not detected on ${BASE_URL}. Launching in-process backend...`);
    serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'pipe'
    });

    let ready = false;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      if (await isServerListening(`${BASE_URL}/`)) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.error(`${colors.red}❌ [CI FATAL] Could not start server within timeout period.${colors.reset}`);
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
    console.log(`${colors.green}✔ [CI] Server successfully started and ready for assertions.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✔ [CI] Reusing running backend instance on ${BASE_URL}.${colors.reset}\n`);
  }

  let passed = 0;
  let failed = 0;

  const assertTest = (name, condition, actual, expected) => {
    if (condition) {
      console.log(`  ${colors.green}✔ PASS${colors.reset} - ${name}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✖ FAIL${colors.reset} - ${name}`);
      console.log(`    Expected: ${expected}`);
      console.log(`    Actual:   ${actual}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // Test 1: Root Health Check
    // ----------------------------------------------------
    console.log(`${colors.yellow}Test 1: Health & Metadata Endpoint (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('GET / responds with status 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootJson = await resRoot.json();
    assertTest('Root JSON reports status online', rootJson.status === 'online', rootJson.status, 'online');

    // ----------------------------------------------------
    // Test 2: Core Task Endpoint Assertion (Deliberate Fail Hook)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 2: Core Tasks Endpoint Assertion (GET /tasks)${colors.reset}`);
    const resTasksUnauth = await fetch(`${BASE_URL}/tasks`);
    if (IS_DELIBERATE_FAIL) {
      // Deliberately broken test expectation to demonstrate red X failure in CI pipeline
      console.log(`  ${colors.red}⚠️ Deliberate test failure simulation active!${colors.reset}`);
      assertTest(
        'GET /tasks status matches deliberately broken expectation',
        resTasksUnauth.status === 999,
        resTasksUnauth.status,
        999
      );
    } else {
      assertTest(
        'GET /tasks without token correctly rejects with 401 Unauthorized',
        resTasksUnauth.status === 401,
        resTasksUnauth.status,
        401
      );
    }

    // ----------------------------------------------------
    // Test 3: User Registration & JWT Token Issuance
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 3: Authentication Pipeline (POST /api/auth/register)${colors.reset}`);
    const uniqueEmail = `ci_runner_${Date.now()}@charusat.edu.in`;
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'GitHub Actions Runner',
        email: uniqueEmail,
        password: 'CiPassword123!'
      })
    });
    assertTest('Registration returns 201 Created', resReg.status === 201, resReg.status, 201);
    const regData = await resReg.json();
    const token = regData.token;
    assertTest('JWT authentication token issued', Boolean(token), Boolean(token), true);

    // ----------------------------------------------------
    // Test 4: Authenticated Task Listing
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 4: Authenticated Task Retrieval (GET /tasks)${colors.reset}`);
    const resTasksAuth = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Authenticated GET /tasks returns 200 OK', resTasksAuth.status === 200, resTasksAuth.status, 200);
    const tasksList = await resTasksAuth.json();
    assertTest('Returns tasks array', Array.isArray(tasksList), typeof tasksList, 'array');

    // ----------------------------------------------------
    // Test 5: Input Validation Middleware Rejection
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 5: Server-Side Input Validation (POST /tasks with empty title)${colors.reset}`);
    const resBadTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title: '' })
    });
    assertTest('Missing title returns 400 Bad Request', resBadTask.status === 400, resBadTask.status, 400);

    // ----------------------------------------------------
    // Test 6: Successful Task Creation
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 6: Valid Task Creation (POST /tasks)${colors.reset}`);
    const resCreate = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'CI/CD Pipeline Automated Integration Test',
        description: 'Verified by GitHub Actions runner on every push to main branch',
        priority: 'high'
      })
    });
    assertTest('Task created with 201 Created', resCreate.status === 201, resCreate.status, 201);
    const createdTask = await resCreate.json();
    assertTest('Task includes database ID', Boolean(createdTask._id || createdTask.id), true, true);

    // ----------------------------------------------------
    // Test 7: Supplementary Problem: Docker Telemetry Inspection
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}Test 7: Supplementary Route Verification (GET /api/docker/status)${colors.reset}`);
    const resDocker = await fetch(`${BASE_URL}/api/docker/status`);
    assertTest('Docker status endpoint responds with 200 OK', resDocker.status === 200, resDocker.status, 200);

    // Summary
    console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bright}CI Test Suite Execution Summary:${colors.reset}`);
    console.log(`  Passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`  Failed: ${failed > 0 ? colors.red + failed : colors.green + '0'}${colors.reset}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log(`${colors.bright}${colors.cyan}========================================================================\n${colors.reset}`);

    if (serverProcess) {
      serverProcess.kill();
    }

    if (failed > 0) {
      console.error(`${colors.red}❌ [CI PIPELINE FAILED] Deliberate or unexpected test failures detected. Exiting with code 1.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✔ [CI PIPELINE PASSED] All tests passed cleanly! Ready for deployment. Exiting with code 0.${colors.reset}\n`);
      process.exit(0);
    }
  } catch (err) {
    if (serverProcess) serverProcess.kill();
    console.error(`\n${colors.red}❌ CI Suite Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
};

runCiTests();
