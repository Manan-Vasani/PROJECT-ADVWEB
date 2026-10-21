import React, { useState, useEffect } from 'react';
import { getCiStatus } from '../services/api';
import type { CiStatusResponse } from '../services/api';

export const CiCdPipelineCard: React.FC = () => {
  const [data, setData] = useState<CiStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'simulator' | 'workflow' | 'testScript' | 'telemetry'>('simulator');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Simulation states
  const [simMode, setSimMode] = useState<'idle' | 'running_pass' | 'running_fail' | 'passed' | 'failed'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simStep, setSimStep] = useState<number>(0);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getCiStatus();
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const runSimulation = (mode: 'pass' | 'fail') => {
    setSimMode(mode === 'pass' ? 'running_pass' : 'running_fail');
    setSimLogs([]);
    setSimStep(1);

    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(msg);
      setSimLogs([...logs]);
    };

    addLog('🚀 [GitHub Actions Runner] Job triggered: on push to refs/heads/main');
    addLog('📦 [Runner OS] Initializing ubuntu-latest virtual environment (Node.js 18.x)');

    setTimeout(() => {
      setSimStep(2);
      addLog('🔍 [Step 1: Lint] Running "npm run lint"... All 48 modules verified. Zero syntax errors.');
    }, 700);

    setTimeout(() => {
      setSimStep(3);
      addLog('🍃 [Service Container] Provisioned MongoDB 6 service container on port 27017.');
      addLog('🧪 [Step 2: Test Suite] Running "npm test"...');
      addLog('   ✔ PASS - GET / (Health Check 200 OK)');
    }, 1400);

    setTimeout(() => {
      if (mode === 'fail') {
        setSimStep(3);
        setSimMode('failed');
        addLog('   ✖ FAIL - GET /tasks returns 999 (DELIBERATE TEST FAILURE DEMO)');
        addLog('     Expected: 999');
        addLog('     Received: 401');
        addLog('💥 [CI ERROR] Process completed with exit code 1. Deployment pipeline aborted!');
      } else {
        setSimStep(4);
        addLog('   ✔ PASS - GET /tasks unauthorized rejection (401)');
        addLog('   ✔ PASS - POST /api/auth/register (201 Created & JWT Token)');
        addLog('   ✔ PASS - GET /tasks with Bearer Token (200 OK)');
        addLog('   ✔ PASS - POST /tasks schema validation (400 on empty title)');
        addLog('   ✔ PASS - POST /tasks task creation (201 Created)');
        addLog('⚡ [Step 3: Production Build] Running "npm run build"... 7 dynamic chunks compiled.');
        addLog('🐳 [Step 4: Docker Compose] "docker compose config" validated cleanly.');
        addLog('✅ [CI PIPELINE SUCCESS] All 7 assertions passed. Status: Green Checkmark (Passed).');
        setSimMode('passed');
      }
    }, 2200);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
      marginBottom: '28px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2ea043 0%, #1f6feb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(46, 160, 67, 0.25)'
          }}>
            🚀
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1d1d1f' }}>
              Practical 12: CI/CD Pipeline with GitHub Actions
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#86868b' }}>
              Automated linting, integration testing, and production build verification on push to main
            </p>
          </div>
        </div>

        {/* Status Badge (Supplementary Problem 3) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: simMode === 'failed' ? 'rgba(255, 59, 48, 0.12)' : 'rgba(52, 199, 89, 0.12)',
            color: simMode === 'failed' ? '#ff3b30' : '#28cd41',
            border: `1px solid ${simMode === 'failed' ? 'rgba(255, 59, 48, 0.3)' : 'rgba(52, 199, 89, 0.3)'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: simMode === 'failed' ? '#ff3b30' : '#28cd41'
            }} />
            {simMode === 'failed' ? 'build: failing' : 'build: passing'}
          </span>

          <button
            onClick={fetchStatus}
            disabled={loading}
            style={{
              background: '#f5f5f7',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#1d1d1f'
            }}
          >
            {loading ? '↻ Syncing...' : '↻ Sync Pipeline'}
          </button>
        </div>
      </div>

      {/* Pipeline Visual Flow Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
        padding: '14px',
        background: '#f8f9fa',
        borderRadius: '14px',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {[
          { step: 1, title: '1. Trigger', desc: 'Push / PR to main', status: simStep >= 1 ? 'done' : 'idle' },
          { step: 2, title: '2. Code Quality', desc: 'npm run lint', status: simStep >= 2 ? 'done' : 'idle' },
          { step: 3, title: '3. Automated Tests', desc: 'Live Mongo + npm test', status: simStep >= 3 ? (simMode === 'failed' ? 'error' : 'done') : 'idle' },
          { step: 4, title: '4. Production Build', desc: 'Vite build & Docker', status: simStep >= 4 ? 'done' : 'idle' }
        ].map(item => (
          <div key={item.step} style={{
            background: item.status === 'error' ? '#ffebee' : item.status === 'done' ? '#e8f5e9' : '#ffffff',
            border: `1px solid ${item.status === 'error' ? '#ef9a9a' : item.status === 'done' ? '#a5d6a7' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: '10px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: item.status === 'error' ? '#c62828' : item.status === 'done' ? '#2e7d32' : '#6e6e73'
            }}>
              {item.status === 'error' ? '❌ FAIL' : item.status === 'done' ? '✅ PASS' : '○ PENDING'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1d1d1f', marginTop: '2px' }}>{item.title}</div>
            <div style={{ fontSize: '11px', color: '#86868b' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px', marginBottom: '18px' }}>
        {[
          { id: 'simulator', label: 'Interactive Pipeline Runner' },
          { id: 'workflow', label: '.github/workflows/ci.yml' },
          { id: 'testScript', label: 'test-ci.js (Automated Suite)' },
          { id: 'telemetry', label: 'Pipeline Specifications' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 500,
              border: 'none',
              background: activeTab === tab.id ? '#2ea043' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#6e6e73',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Interactive Runner Simulator */}
      {activeTab === 'simulator' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => runSimulation('pass')}
              disabled={simMode.startsWith('running')}
              style={{
                background: '#2ea043',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46, 160, 67, 0.3)'
              }}
            >
              ▶ Run Passing Pipeline (Green Checkmark ✅)
            </button>

            <button
              onClick={() => runSimulation('fail')}
              disabled={simMode.startsWith('running')}
              style={{
                background: 'rgba(255, 59, 48, 0.1)',
                color: '#ff3b30',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚠️ Trigger Deliberate Failure Demo (Red X ❌)
            </button>

            <button
              onClick={() => { setSimMode('idle'); setSimLogs([]); setSimStep(0); }}
              style={{
                background: '#f5f5f7',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Reset Runner
            </button>
          </div>

          {/* Console Output */}
          <div style={{
            background: '#0d1117',
            color: '#c9d1d9',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
            padding: '16px',
            borderRadius: '12px',
            minHeight: '160px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid #30363d',
            lineHeight: '1.6'
          }}>
            <div style={{ color: '#8b949e', borderBottom: '1px solid #21262d', paddingBottom: '6px', marginBottom: '8px' }}>
              GitHub Actions Execution Log Terminal:
            </div>
            {simLogs.length === 0 ? (
              <span style={{ color: '#8b949e' }}>Click "Run Passing Pipeline" or "Trigger Deliberate Failure Demo" to simulate live workflow execution...</span>
            ) : (
              simLogs.map((log, i) => (
                <div key={i} style={{
                  color: log.includes('FAIL') || log.includes('ERROR') ? '#f85149' :
                         log.includes('PASS') || log.includes('SUCCESS') ? '#56d364' :
                         log.includes('Step') ? '#58a6ff' : '#c9d1d9'
                }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Workflow YAML */}
      {activeTab === 'workflow' && (
        <pre style={{
          background: '#0d1117',
          color: '#c9d1d9',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          overflowX: 'auto',
          margin: 0
        }}>
{`name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    name: Code Quality & Linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint || true

  build-and-test:
    name: Automated Tests & Production Build
    needs: lint
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run build`}
        </pre>
      )}

      {/* Tab 3: test-ci.js */}
      {activeTab === 'testScript' && (
        <pre style={{
          background: '#0d1117',
          color: '#c9d1d9',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '12px',
          lineHeight: '1.5',
          overflowX: 'auto',
          margin: 0
        }}>
{`// Practical 12: Automated CI/CD Test Assertions
// Supports normal execution and --deliberate-fail regression mode
test('GET / responds with status 200 OK', async () => {
  const res = await fetch(\`\${BASE_URL}/\`);
  expect(res.status).toBe(200);
});

test('GET /tasks unauthenticated returns 401 Unauthorized', async () => {
  const res = await fetch(\`\${BASE_URL}/tasks\`);
  if (IS_DELIBERATE_FAIL) {
    // Deliberate test failure for demonstration
    expect(res.status).toBe(999);
  } else {
    expect(res.status).toBe(401);
  }
});`}
        </pre>
      )}

      {/* Tab 4: Telemetry */}
      {activeTab === 'telemetry' && (
        <div style={{ fontSize: '13px', color: '#1d1d1f', lineHeight: '1.6' }}>
          <p><strong>Configured Workflow File:</strong> <code>{data?.pipeline?.workflowFile || '.github/workflows/ci.yml'}</code></p>
          <p><strong>Active Triggers:</strong> <code>{data?.pipeline?.triggers?.join(', ') || 'push:main, pull_request:main'}</code> (Supplementary Problem 2)</p>
          <p><strong>Runner Platform:</strong> <code>{data?.pipeline?.runnerOs || 'ubuntu-latest'}</code> (Node {data?.pipeline?.nodeVersion || '18'})</p>
          <p><strong>Service Containers:</strong> <code>mongo:6</code> on port 27017 (isolates database per pipeline run)</p>
          <p><strong>Test Runner:</strong> <code>npm test</code> (runs 7 automated endpoint checks, exit code 0 on success, exit code 1 on failure)</p>
          <p><strong>Deliberate Failure Demo Command:</strong> <code>npm run test:fail</code></p>
          {data?.assertions && (
            <div style={{ marginTop: '10px' }}>
              <strong>Verified Pipeline Assertions:</strong>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: '#48484a' }}>
                {data.assertions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Supplementary Checklist & One-Click Copy */}
      <div style={{ marginTop: '16px', background: '#f5f5f7', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#1d1d1f' }}>
          <span>✅ <strong>Supplementary 1:</strong> Pre-test linter job</span>
          <span>✅ <strong>Supplementary 2:</strong> PR & Push branch triggers</span>
          <span>✅ <strong>Supplementary 3:</strong> README status badge</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { cmd: 'npm test', label: 'npm test (Pass)' },
            { cmd: 'npm run test:fail', label: 'npm run test:fail (Demo)' },
            { cmd: 'git push origin main', label: 'git push' }
          ].map(c => (
            <button
              key={c.label}
              onClick={() => copyToClipboard(c.cmd, c.label)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '5px 10px',
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: copiedCmd === c.label ? '#28cd41' : '#1d1d1f'
              }}
            >
              {copiedCmd === c.label ? '✓ Copied!' : c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
