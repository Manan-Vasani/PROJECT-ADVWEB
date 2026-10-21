// Practical 13: AI API Integration, Graceful Degradation & Responsible AI Test Suite
// Verifies Gemini / OpenAI API endpoints, smart heuristic fallbacks, rate limiting, and core full-stack tasks.

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

const runTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}✨ Practical 13: AI API Integration & Responsible AI Test Suite${colors.reset}`);
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
    // Test 1: Server Root & AI Metadata
    // ----------------------------------------------------
    console.log(`${colors.yellow}1. Server Root & AI Subsystem Metadata (GET /)${colors.reset}`);
    const resRoot = await fetch(`${BASE_URL}/`);
    assertTest('Status is 200 OK', resRoot.status === 200, resRoot.status, 200);
    const rootData = await resRoot.json();
    assertTest('Project title reflects Practical 13', rootData.project?.includes('Practical 13'), rootData.project, 'Practical 13');
    assertTest('AI subsystem metadata declared', Boolean(rootData.ai), Boolean(rootData.ai), true);
    assertTest('AI endpoints list mounted in metadata', Boolean(rootData.endpoints?.ai), Boolean(rootData.endpoints?.ai), true);

    // ----------------------------------------------------
    // Test 2: AI Subsystem Status Endpoint
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}2. AI Subsystem Status (GET /api/ai/status)${colors.reset}`);
    const resAiStatus = await fetch(`${BASE_URL}/api/ai/status`);
    assertTest('Status returns 200 OK', resAiStatus.status === 200, resAiStatus.status, 200);
    const statusData = await resAiStatus.json();
    assertTest('Service status is online', statusData.status === 'online', statusData.status, 'online');
    assertTest('AI provider declared', Boolean(statusData.aiService?.providerConfigured), true, true);
    assertTest('Rate limit window is 60 seconds', statusData.aiService?.rateLimitWindowSeconds === 60, statusData.aiService?.rateLimitWindowSeconds, 60);

    // ----------------------------------------------------
    // Test 3: AI Description Generation (Happy Path)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}3. AI Description Generation (POST /api/ai/generate-description)${colors.reset}`);
    const resAiGen = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Containerize Backend and Frontend with Docker',
        priority: 'high',
        skipRateLimit: true
      })
    });
    assertTest('Generation returns 200 OK', resAiGen.status === 200, resAiGen.status, 200);
    const aiGenData = await resAiGen.json();
    assertTest('Generated description is non-empty string', typeof aiGenData.description === 'string' && aiGenData.description.length > 20, true, true);
    assertTest('Response specifies active provider', Boolean(aiGenData.provider), Boolean(aiGenData.provider), true);

    // ----------------------------------------------------
    // Test 4: Graceful Degradation Proof (Failure Path)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}4. Graceful Degradation Simulation (forceFailure: true)${colors.reset}`);
    const resFallback = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Configure CI Pipeline with GitHub Actions',
        priority: 'medium',
        forceFailure: true
      })
    });
    assertTest('Returns status 200 OK without crashing', resFallback.status === 200, resFallback.status, 200);
    const fallbackData = await resFallback.json();
    assertTest('Graceful fallback flag is true', fallbackData.fallback === true, fallbackData.fallback, true);
    assertTest('Fallback generated meaningful description', fallbackData.description?.includes('pipeline') || fallbackData.description?.length > 20, true, true);
    assertTest('Fallback provider identified as heuristic-engine', fallbackData.provider === 'heuristic-engine', fallbackData.provider, 'heuristic-engine');

    // ----------------------------------------------------
    // Test 5: AI Priority Recommendation
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}5. AI Priority Recommendation (POST /api/ai/suggest-priority)${colors.reset}`);
    const resPrio = await fetch(`${BASE_URL}/api/ai/suggest-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Fix Critical Production Security Authentication Vulnerability',
        description: 'Passwords exposed or unauthorized token generation'
      })
    });
    assertTest('Priority suggestion returns 200 OK', resPrio.status === 200, resPrio.status, 200);
    const prioData = await resPrio.json();
    assertTest('Critical security task suggested as HIGH priority', prioData.priority === 'high', prioData.priority, 'high');
    assertTest('Reasoning provided', Boolean(prioData.reasoning), true, true);

    // ----------------------------------------------------
    // Test 6: AI Subtasks Breakdown
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}6. AI Subtasks Breakdown (POST /api/ai/suggest-subtasks)${colors.reset}`);
    const resSub = await fetch(`${BASE_URL}/api/ai/suggest-subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Deploy Containerized App via Docker' })
    });
    assertTest('Subtasks breakdown returns 200 OK', resSub.status === 200, resSub.status, 200);
    const subData = await resSub.json();
    assertTest('Returns array of subtasks', Array.isArray(subData.subtasks) && subData.subtasks.length >= 3, true, true);

    // ----------------------------------------------------
    // Test 7: Input Validation
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}7. AI Route Input Validation (Missing Title)${colors.reset}`);
    const resBad = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' })
    });
    assertTest('Empty title rejected with 400 Bad Request', resBad.status === 400, resBad.status, 400);

    // ----------------------------------------------------
    // Test 8: Rate Limiting Enforcement (Supplementary Problem 2)
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}8. Rate Limiting Cooldown Verification${colors.reset}`);
    // Trigger first request to arm the 60s cooldown
    await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.42' },
      body: JSON.stringify({ title: 'First Trigger Request' })
    });

    // Immediate second request from same IP without skip flag
    const resRateLimited = await fetch(`${BASE_URL}/api/ai/generate-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.42' },
      body: JSON.stringify({ title: 'Rapid Fire Second Request' })
    });
    assertTest('Consecutive request rejected with 429 Too Many Requests', resRateLimited.status === 429, resRateLimited.status, 429);
    const rateData = await resRateLimited.json();
    assertTest('Returns retryAfterSeconds cooldown count', Boolean(rateData.retryAfterSeconds), true, true);

    // ----------------------------------------------------
    // Test 9: End-to-End User Registration & Task Creation with AI Description
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}9. End-to-End Auth & Saving AI-Assisted Task${colors.reset}`);
    const uniqueEmail = `ai_engineer_${Date.now()}@charusat.edu.in`;
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Fullstack Developer',
        email: uniqueEmail,
        password: 'AiPassword123!'
      })
    });
    assertTest('User registered with 201 Created', resReg.status === 201, resReg.status, 201);
    const regData = await resReg.json();
    const token = regData.token;

    const resTask = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Build AI-Assisted Task Manager Web App',
        description: aiGenData.description,
        priority: 'high'
      })
    });
    assertTest('Task saved to MongoDB with 201 Created', resTask.status === 201, resTask.status, 201);
    const taskJson = await resTask.json();
    assertTest('Task contains AI-generated description', taskJson.description === aiGenData.description, true, true);

    // ----------------------------------------------------
    // Test 10: Fetch Tasks & Cache Verification
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}10. Fetch Tasks with Cache-Aside Verification (GET /tasks)${colors.reset}`);
    const resFetch = await fetch(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assertTest('Fetch tasks returns 200 OK', resFetch.status === 200, resFetch.status, 200);

    // ----------------------------------------------------
    // Test 11: CI & Docker Subsystems Intact
    // ----------------------------------------------------
    console.log(`\n${colors.yellow}11. Inherited CI & Docker Subsystem Health${colors.reset}`);
    const resCi = await fetch(`${BASE_URL}/api/ci/status`);
    assertTest('CI status endpoint responds with 200 OK', resCi.status === 200, resCi.status, 200);
    const resDocker = await fetch(`${BASE_URL}/api/docker/status`);
    assertTest('Docker status endpoint responds with 200 OK', resDocker.status === 200, resDocker.status, 200);

    // Summary
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
    console.error(`\n${colors.red}❌ Test Suite Error: ${err.message}${colors.reset}`);
    process.exit(1);
  }
};

runTests();
