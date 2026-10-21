// Practical 13: AI Service Integration Module (Gemini / OpenAI API)
// Provides server-side AI completion with strict Graceful Degradation and Rate Limiting.

const rateLimitStore = new Map(); // Key: userId/ip -> timestamp of last request
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute per request (Supplementary Problem 2)

// Telemetry tracker
const aiStats = {
  totalRequests: 0,
  successfulLiveCalls: 0,
  gracefulFallbacks: 0,
  rateLimitedBlocked: 0
};

/**
 * Checks and updates rate limit for a given user or IP.
 */
export const checkRateLimit = (key) => {
  const now = Date.now();
  const lastRequest = rateLimitStore.get(key);

  if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW_MS) {
    const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
    aiStats.rateLimitedBlocked++;
    return {
      allowed: false,
      remainingSeconds
    };
  }

  rateLimitStore.set(key, now);
  return { allowed: true, remainingSeconds: 0 };
};

/**
 * Domain-Aware Heuristic Generator used during Graceful Degradation.
 * Guarantees meaningful, structured responses even if external AI is offline or key is missing.
 */
const generateHeuristicDescription = (title, priority = 'medium') => {
  const lower = (title || '').toLowerCase();

  if (lower.includes('docker') || lower.includes('container') || lower.includes('compose')) {
    return `Containerize the application stack using Docker. Structure multi-stage Dockerfiles for the React frontend, configure the Node.js backend environment, and orchestrate the microservices with MongoDB using Docker Compose on an internal bridge network.`;
  }
  if (lower.includes('ci') || lower.includes('cd') || lower.includes('action') || lower.includes('pipeline')) {
    return `Implement an automated CI/CD pipeline using GitHub Actions. Configure triggers on push and pull request to main, provision a live MongoDB service container, execute automated integration tests, and build production assets.`;
  }
  if (lower.includes('auth') || lower.includes('jwt') || lower.includes('login') || lower.includes('register')) {
    return `Establish secure user authentication using bcrypt for password hashing and JSON Web Tokens (JWT) for stateless session verification. Protect API routes with authentication middleware and scope database queries to the logged-in user.`;
  }
  if (lower.includes('cache') || lower.includes('caching') || lower.includes('redis') || lower.includes('node-cache')) {
    return `Optimize API query latency by implementing an in-memory caching layer with node-cache. Enforce the Cache-Aside pattern on read queries and ensure immediate cache invalidation on write mutations to prevent stale data.`;
  }
  if (lower.includes('event') || lower.includes('emitter') || lower.includes('async')) {
    return `Decouple heavy background side-effects from the primary request-response path using Node.js native EventEmitter. Immediately dispatch HTTP responses and process notifications asynchronously in background listeners.`;
  }
  if (lower.includes('api') || lower.includes('rest') || lower.includes('crud')) {
    return `Design and implement RESTful endpoints with Express adhering to HTTP specifications. Enforce structured JSON payloads, request validation middleware, and standardized error response formats.`;
  }
  if (lower.includes('db') || lower.includes('mongo') || lower.includes('schema') || lower.includes('database')) {
    return `Design robust MongoDB schemas and Mongoose models. Implement field-level validation, indexes, and custom error handling intercepting ValidationError and CastError before persistence.`;
  }
  if (lower.includes('test') || lower.includes('jest') || lower.includes('verify')) {
    return `Develop comprehensive unit and integration test suites. Verify both happy paths and edge cases, ensuring reproducible assertions and automated verification across the application.`;
  }

  return `Plan, implement, and rigorously verify "${title}" with high engineering standards. Ensure complete documentation, modular structure, and end-to-end integration across the application stack.`;
};

/**
 * Heuristic Priority Estimator for Graceful Degradation.
 */
const estimateHeuristicPriority = (title, description = '') => {
  const combined = `${title} ${description}`.toLowerCase();

  if (combined.includes('urgent') || combined.includes('critical') || combined.includes('security') ||
      combined.includes('auth') || combined.includes('crash') || combined.includes('bug') ||
      combined.includes('docker') || combined.includes('ci')) {
    return {
      priority: 'high',
      reasoning: 'Critical system architecture, security pipeline, or deployment dependency.'
    };
  }

  if (combined.includes('optimize') || combined.includes('cache') || combined.includes('test') ||
      combined.includes('api') || combined.includes('feature')) {
    return {
      priority: 'medium',
      reasoning: 'Standard feature development or performance enhancement task.'
    };
  }

  return {
    priority: 'low',
    reasoning: 'Maintenance, cosmetic UI adjustment, or optional documentation update.'
  };
};

/**
 * Heuristic Subtask Breakdown Generator.
 */
const generateHeuristicSubtasks = (title) => {
  const lower = (title || '').toLowerCase();

  if (lower.includes('docker')) {
    return [
      'Write multi-stage Dockerfile for React frontend',
      'Create Node.js Alpine Dockerfile for backend',
      'Configure docker-compose.yml with bridge network and volume',
      'Verify full-stack single-command startup (docker compose up)'
    ];
  }
  if (lower.includes('ci') || lower.includes('pipeline')) {
    return [
      'Create .github/workflows/ci.yml with push triggers',
      'Configure ESLint code quality job',
      'Set up MongoDB service container and automated test job',
      'Verify build badge in README'
    ];
  }

  return [
    `Analyze functional requirements for: ${title}`,
    'Implement core logic and API endpoints',
    'Write unit and integration tests',
    'Document usage and update project README'
  ];
};

/**
 * Calls Google Gemini REST API.
 */
const callGeminiApi = async (apiKey, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(5000), // 5s timeout
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) throw new Error('No candidate content returned by Gemini');
  return candidate.trim();
};

/**
 * Calls OpenAI REST API.
 */
const callOpenAiApi = async (apiKey, prompt) => {
  const url = 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(5000), // 5s timeout
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('No choices returned by OpenAI');
  return text.trim();
};

/**
 * Generate Task Description with Graceful Degradation.
 */
export const generateDescription = async ({ title, priority = 'medium', forceFailure = false }) => {
  aiStats.totalRequests++;

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const prompt = `Write a concise, professional 2-3 sentence task description for a software project management system. Task Title: "${title}". Priority: ${priority}. Focus on clear action items.`;

  if (forceFailure) {
    console.warn('⚠️ [AI Service] Force failure triggered for test demonstration.');
    aiStats.gracefulFallbacks++;
    return {
      description: generateHeuristicDescription(title, priority),
      fallback: true,
      provider: 'heuristic-engine',
      model: 'domain-fallback-v1',
      disclaimer: 'AI simulation: Fallback suggestion generated gracefully without service interruption.'
    };
  }

  // Attempt Gemini API if key is present
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const generated = await callGeminiApi(geminiKey, prompt);
      aiStats.successfulLiveCalls++;
      return {
        description: generated,
        fallback: false,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        disclaimer: 'Generated by Google Gemini AI. Please review and verify accuracy before saving.'
      };
    } catch (err) {
      console.warn(`⚠️ [AI Service] Gemini API call failed (${err.message}). Activating Graceful Degradation...`);
    }
  }

  // Attempt OpenAI API if key is present
  if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
    try {
      const generated = await callOpenAiApi(openAiKey, prompt);
      aiStats.successfulLiveCalls++;
      return {
        description: generated,
        fallback: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        disclaimer: 'Generated by OpenAI. Please review and verify accuracy before saving.'
      };
    } catch (err) {
      console.warn(`⚠️ [AI Service] OpenAI API call failed (${err.message}). Activating Graceful Degradation...`);
    }
  }

  // Graceful Degradation Path: Returns heuristic suggestion without crashing
  aiStats.gracefulFallbacks++;
  return {
    description: generateHeuristicDescription(title, priority),
    fallback: true,
    provider: 'heuristic-engine',
    model: 'domain-fallback-v1',
    disclaimer: 'External AI unavailable. Generated rule-based smart suggestion. Please review before saving.'
  };
};

/**
 * Suggest Priority with Graceful Degradation.
 */
export const suggestPriority = async ({ title, description = '' }) => {
  aiStats.totalRequests++;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const prompt = `Analyze this task and respond ONLY with a JSON object in this format: {"priority": "low"|"medium"|"high", "reasoning": "1 sentence explanation"}. Task Title: "${title}". Description: "${description}".`;

  if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
    try {
      const text = await callGeminiApi(geminiKey, prompt);
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      aiStats.successfulLiveCalls++;
      return {
        priority: ['low', 'medium', 'high'].includes(parsed.priority) ? parsed.priority : 'medium',
        reasoning: parsed.reasoning || 'Suggested by Gemini AI model.',
        fallback: false,
        provider: 'gemini'
      };
    } catch {
      // Degrade to heuristic
    }
  }

  aiStats.gracefulFallbacks++;
  const heuristic = estimateHeuristicPriority(title, description);
  return {
    priority: heuristic.priority,
    reasoning: heuristic.reasoning,
    fallback: true,
    provider: 'heuristic-engine'
  };
};

/**
 * Suggest Subtasks Checklist with Graceful Degradation.
 */
export const suggestSubtasks = async ({ title }) => {
  aiStats.totalRequests++;
  aiStats.gracefulFallbacks++;
  return {
    subtasks: generateHeuristicSubtasks(title),
    fallback: true,
    provider: 'heuristic-engine'
  };
};

/**
 * Retrieves AI Subsystem Status & Telemetry.
 */
export const getAiStatus = () => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');

  return {
    status: 'online',
    aiService: {
      providerConfigured: hasGemini ? 'Google Gemini (Live)' : hasOpenAi ? 'OpenAI (Live)' : 'Heuristic Graceful Fallback Engine',
      hasApiKey: hasGemini || hasOpenAi,
      rateLimitWindowSeconds: RATE_LIMIT_WINDOW_MS / 1000,
      supportedActions: ['generate-description', 'suggest-priority', 'suggest-subtasks'],
      disclaimerNotice: 'AI-generated suggestions should be reviewed and verified by the user before saving.'
    },
    telemetry: { ...aiStats }
  };
};

export default {
  checkRateLimit,
  generateDescription,
  suggestPriority,
  suggestSubtasks,
  getAiStatus
};
