# ✨ Practical 13: AI API Integration into a Web Application

[![AI Integration](https://img.shields.io/badge/AI%20Service-Google%20Gemini%20%7C%20OpenAI-blueviolet?style=flat-square)](https://ai.google.dev/)
[![Graceful Degradation](https://img.shields.io/badge/Resilience-Graceful%20Degradation%20Guaranteed-success?style=flat-square)](#)
[![Responsible AI](https://img.shields.io/badge/Responsible%20AI-Compliant-brightgreen?style=flat-square)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square)](https://react.dev/)

Welcome to **Practical 13**! This practical integrates external Generative AI services (**Google Gemini API** and **OpenAI API**) into our full-stack Task Management application. Designed with strict adherence to **Responsible AI engineering**, API keys are confined exclusively to the server, all AI calls degrade gracefully on network failure or rate exhaustion without interrupting core functionality, and suggestions are presented as human-reviewable inputs accompanied by prominent ethical disclaimers.

---

## 🎯 Academic & Practical Information

| Attribute | Details |
| :--- | :--- |
| **Course** | Advanced Web Development Frameworks (ITUE301) |
| **Practical No.** | **13** |
| **Topic** | AI API Integration into a Web Application |
| **CO / PO Mapping** | **CO6** / **PO3, PO5, PO12** |
| **Objective** | To integrate an external AI service into the existing application and understand responsible AI usage. |
| **Prerequisites** | Practical 6–12 completed working full-stack Task Management application with CI/CD and Docker; active Gemini or OpenAI API key. |
| **Evaluation Rubric** | API Integration (5M) + Feature Meaningfulness (5M) + Graceful Degradation (5M) + Response Handling (5M) = **Total: 20 Marks** (Threshold: 14/20). |
| **Reference** | Traversy Media: AI API Integration in Node.js; Google Generative AI Documentation. |

---

## 🏗️ Architecture & Graceful Degradation Request Pipeline

```text
 React Frontend UI (Browser)
      │
      │ 1. User clicks "✨ Generate Description" or "⚡ Suggest Priority"
      ▼
 Express Backend Server (Port 5000)
      │
      │ 2. Check Rate Limit (max 1 req / min per client)
      │ 3. Fetch process.env.GEMINI_API_KEY (Never sent to browser!)
      │
      ├─────────────────────────────────────────────────┐
      │ (Attempt External AI Call)                      │ (If Key Missing / Network Error / Timeout)
      ▼                                                 ▼
 Google Gemini / OpenAI API                       [Graceful Degradation Heuristic Engine]
      │                                                 │
      ├── Status: 200 OK ──────────────┐                │ Generates domain-aware fallback suggestion
      │                                ▼                │
      └── Status: 401 / 429 / Timeout ─► 4. Catch Error │
                                               │        │
                                               ▼        ▼
                                       Dispatches HTTP 200 OK
                                       { description: "...", fallback: true }
                                               │
                                               ▼
                              React UI: Shimmer spinner resolves
                              • Displays suggestion in editable textarea
                              • Shows ⚠️ Responsible AI Disclaimer Banner
                              • Core app continues functioning 100% normally!
```

---

## 📋 Problem Definition & Implemented Solutions

### 1. Secure Server-Side Key Management (API Integration: 5 Marks)
- The Gemini API key (`GEMINI_API_KEY`) and OpenAI key (`OPENAI_API_KEY`) are stored and consumed **exclusively on the Express backend** via `.env`.
- No API keys are bundled into the Vite client distribution or exposed in browser network requests.
- The React frontend communicates strictly with our internal endpoint: `POST /api/ai/generate-description`.

### 2. Meaningful AI Capabilities (Feature Meaningfulness: 5 Marks)
- **Auto-Generate Task Descriptions (`POST /api/ai/generate-description`)**: Synthesizes a structured 2–3 sentence technical task description based on title and priority.
- **Smart Priority Estimation (`POST /api/ai/suggest-priority`)**: Evaluates complexity, security implications, and deadlines to recommend `low`, `medium`, or `high` priority with reasoning.
- **Actionable Subtask Breakdown (`POST /api/ai/suggest-subtasks`)**: Breaks high-level tasks into concrete checklist steps.

### 3. Strict Graceful Degradation (Graceful Degradation: 5 Marks)
- Third-party APIs can suffer outages, quota limits (429), or authentication changes (401).
- All AI calls are bounded by a 5-second timeout via `AbortSignal.timeout(5000)`.
- If an API call fails or the key is absent, the backend **catches the error and never crashes the server**.
- Returns status `200 OK` with a context-rich, domain-aware fallback description and flag `fallback: true`.
- **Verified via automated simulation**: `forceFailure: true` produces a complete, usable response seamlessly.

### 4. Human-in-the-Loop & Response Handling (Response Handling: 5 Marks)
- AI responses are never saved directly to the database or dumped on screen as raw JSON.
- The UI presents the suggestion in an **editable input**, allowing the user to review, edit, or reject the generated text before saving.
- An inline "Apply to Form" button enables one-click integration into the task creation form.

### 5. Supplementary Problem Solutions
- **Supplementary Problem 1 (Loading State)**: Pulsing animated spinner and shimmer box displayed while awaiting backend AI completion.
- **Supplementary Problem 2 (Rate Limiting)**: In-memory cooldown system enforcing a maximum of 1 request per task per minute per client, preventing quota drain.
- **Supplementary Problem 3 (Responsible AI Disclaimer)**: Prominent banner rendered below suggestions:
  > *"⚠️ Responsible AI Notice: All AI suggestions are assistive predictions. Please verify accuracy and safety before committing."*

---

## 📂 File Structure

```text
13/
├── services/
│   ├── aiService.js            # Gemini / OpenAI client with Graceful Degradation & Rate Limiting
│   └── cache.js                # In-memory caching engine
├── server.js                   # Express server with /api/ai/* endpoints
├── test-api.js                 # Automated 32-point AI & full-stack test suite
├── test-ci.js                  # CI/CD test runner inherited from Practical 12
├── test.http                   # VS Code REST Client test collection
├── .env                        # Server-side API keys (GEMINI_API_KEY, OPENAI_API_KEY)
├── .env.example                # Example template
├── src/
│   ├── components/
│   │   ├── AiAssistantCard.tsx         # Interactive AI Playground & Governance card
│   │   ├── CiCdPipelineCard.tsx        # Practical 12 CI/CD Pipeline card
│   │   ├── DockerArchitectureCard.tsx  # Practical 11 Docker Compose card
│   │   ├── CacheBenchmarkCard.tsx      # Practical 9 In-memory cache card
│   │   └── EventNotificationCard.tsx   # Practical 10 Asynchronous event card
│   ├── pages/
│   │   └── Tasks.tsx           # Full-stack task view with inline "✨ AI Assist"
│   └── services/
│       └── api.ts              # API client with generateAiDescription(), suggestAiPriority()
```

---

## 🧪 Automated Testing Suite

Run the 32-point automated test runner:
```powershell
cd d:\SEM-5\PROJECT-ADVWEB\13
node test-api.js
```

### Verified Assertions:
- ✅ Server root endpoint reports `Practical 13` with AI metadata.
- ✅ AI status endpoint reports provider, rate limits, and disclaimer.
- ✅ `POST /api/ai/generate-description` returns structured text (Status 200).
- ✅ **Graceful Degradation Verified**: `forceFailure: true` returns 200 OK with `fallback: true` and meaningful text without crashing.
- ✅ AI Priority correctly classifies security vulnerabilities as `high` priority.
- ✅ AI Subtasks returns an actionable checklist array.
- ✅ Empty title rejected with `400 Bad Request`.
- ✅ Rapid consecutive calls rejected with `429 Too Many Requests` (cooldown active).
- ✅ End-to-end task saved with AI description and persisted to MongoDB under authenticated user.

---

## 🎓 Viva Voce Questions & Answers

### Q1: Why must the AI API key be called from the backend rather than directly from the React frontend?
> **Answer**:
> In frontend client code (React), JavaScript executes directly in the user's browser. Any environment variable embedded in client code (such as Vite's `VITE_` variables) or used in client `fetch()` requests is visible to anyone via the browser's Developer Tools (Network tab, debugger, or bundled source code). A leaked API key can be extracted and abused, leading to account hijacking, massive financial bills, or quota exhaustion. Calling the AI API exclusively from the backend keeps the secret key secured in the server's `.env` file where client browsers have zero access.

### Q2: What does "graceful degradation" mean in this context, and why does it matter for a feature that depends on a third-party service?
> **Answer**:
> **Graceful Degradation** is an architectural resilience pattern where a system continues to operate and deliver core functionality even when one of its external dependencies suffers a complete failure or outage. Because third-party AI APIs (like Google or OpenAI) are external cloud services subject to network latency, server downtime, rate limiting (429), or API key expiration (401), the application must not crash or prevent users from creating tasks when AI fails. Instead, errors are caught in `try/catch` blocks, and the system seamlessly degrades to a local heuristic fallback suggestion, returning HTTP 200 so the user workflow remains uninterrupted.

### Q3: What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?
> **Answer**:
> When sending data to a third-party commercial AI model, that data leaves our private network and is processed on external servers where it may be subject to third-party data retention policies or used for model training unless zero-data-retention agreements are configured.
> - **Data that should NEVER be sent**: Personally Identifiable Information (PII) such as student national IDs, credit card numbers, passwords, cryptographic keys, medical records, or proprietary source code.
> - **Best Practices**: Implement payload sanitization, send only generalized titles/prompts, obtain user consent, and display clear disclaimers that AI outputs must be verified by humans before being acted upon.

---
**Author**: Manan Vasani | B.Tech Information Technology, Semester 5, CHARUSAT.
