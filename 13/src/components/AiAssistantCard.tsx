import React, { useState, useEffect } from 'react';
import {
  generateAiDescription,
  suggestAiPriority,
  suggestAiSubtasks,
  getAiStatus
} from '../services/api';
import type { AiStatusResponse } from '../services/api';

interface AiAssistantCardProps {
  onApplyDescription?: (desc: string) => void;
  onApplyPriority?: (prio: 'low' | 'medium' | 'high') => void;
  onNotify?: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AiAssistantCard: React.FC<AiAssistantCardProps> = ({
  onApplyDescription,
  onApplyPriority,
  onNotify
}) => {
  const [status, setStatus] = useState<AiStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'playground' | 'governance' | 'telemetry'>('playground');

  // Interactive Form State
  const [testTitle, setTestTitle] = useState<string>('Containerize Task API with Docker');
  const [testPriority, setTestPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // AI Output States
  const [aiOutput, setAiOutput] = useState<string>('');
  const [aiFallbackUsed, setAiFallbackUsed] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<string>('');
  const [aiDisclaimer, setAiDisclaimer] = useState<string>('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [suggestedPrio, setSuggestedPrio] = useState<{ priority: string; reasoning: string } | null>(null);

  // Rate Limiting Cooldown State (Supplementary Problem 2)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const fetchStatus = async () => {
    try {
      const res = await getAiStatus();
      setStatus(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleGenerate = async (forceFail = false) => {
    if (!testTitle.trim()) {
      onNotify?.('Please provide a task title to test AI generation.', 'warning');
      return;
    }

    setLoading(true);
    setSubtasks([]);
    setSuggestedPrio(null);

    try {
      const res = await generateAiDescription(testTitle, testPriority, forceFail, false);
      setAiOutput(res.description);
      setAiFallbackUsed(res.fallback);
      setAiProvider(res.provider);
      setAiDisclaimer(res.disclaimer || 'AI-generated suggestion. Please review before saving.');
      setCooldownSeconds(60); // 60s cooldown
      fetchStatus();

      if (res.fallback) {
        onNotify?.('Graceful Degradation triggered: Returned local domain-aware smart fallback.', 'info');
      } else {
        onNotify?.(`AI Generation successful via ${res.provider}!`, 'success');
      }
    } catch (err: any) {
      if (err.status === 429) {
        onNotify?.('Rate limit active! Please wait for the cooldown timer.', 'warning');
      } else {
        onNotify?.(`AI error: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestPriority = async () => {
    if (!testTitle.trim()) return;
    setLoading(true);
    try {
      const res = await suggestAiPriority(testTitle, aiOutput);
      setSuggestedPrio({ priority: res.priority, reasoning: res.reasoning });
      onNotify?.(`Suggested priority: ${res.priority.toUpperCase()}`, 'info');
      fetchStatus();
    } catch (err: any) {
      onNotify?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestSubtasks = async () => {
    if (!testTitle.trim()) return;
    setLoading(true);
    try {
      const res = await suggestAiSubtasks(testTitle);
      setSubtasks(res.subtasks);
      onNotify?.('Actionable subtasks generated successfully.', 'success');
      fetchStatus();
    } catch (err: any) {
      onNotify?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
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
            background: 'linear-gradient(135deg, #af52de 0%, #5856d6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(175, 82, 222, 0.25)'
          }}>
            ✨
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1d1d1f' }}>
              Practical 13: AI API Integration & Responsible AI
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#86868b' }}>
              Server-side Gemini / OpenAI API with Graceful Degradation & Rate Limiting
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '20px',
            background: status?.aiService.hasApiKey ? 'rgba(52, 199, 89, 0.12)' : 'rgba(175, 82, 222, 0.12)',
            color: status?.aiService.hasApiKey ? '#28cd41' : '#af52de',
            border: `1px solid ${status?.aiService.hasApiKey ? 'rgba(52, 199, 89, 0.3)' : 'rgba(175, 82, 222, 0.3)'}`
          }}>
            {status?.aiService.hasApiKey ? '● Live External AI Key Active' : '● Graceful Heuristic Engine Active'}
          </span>
          <button
            onClick={fetchStatus}
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
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px', marginBottom: '18px' }}>
        {[
          { id: 'playground', label: 'AI Smart Assist Playground' },
          { id: 'governance', label: 'Responsible AI & Data Privacy' },
          { id: 'telemetry', label: 'Service Telemetry & Specs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 500,
              border: 'none',
              background: activeTab === tab.id ? '#af52de' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#6e6e73',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Playground */}
      {activeTab === 'playground' && (
        <div>
          {/* Input Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '4px' }}>
                Task Title to Assist:
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g. Implement Docker Multi-Stage Pipeline"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: '4px' }}>
                Priority Context:
              </label>
              <select
                value={testPriority}
                onChange={(e) => setTestPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: '13px',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => handleGenerate(false)}
              disabled={loading || cooldownSeconds > 0}
              style={{
                background: cooldownSeconds > 0 ? '#e5e5ea' : 'linear-gradient(135deg, #af52de 0%, #5856d6 100%)',
                color: cooldownSeconds > 0 ? '#8e8e93' : '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: cooldownSeconds > 0 || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading ? '✨ Generating...' : cooldownSeconds > 0 ? `⏳ Cooldown (${cooldownSeconds}s)` : '✨ Generate Description'}
            </button>

            <button
              onClick={handleSuggestPriority}
              disabled={loading}
              style={{
                background: '#f5f5f7',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⚡ Suggest Priority
            </button>

            <button
              onClick={handleSuggestSubtasks}
              disabled={loading}
              style={{
                background: '#f5f5f7',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📋 Break Down Subtasks
            </button>

            {/* Test Graceful Degradation Demo */}
            <button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              style={{
                background: 'rgba(255, 149, 0, 0.1)',
                color: '#ff9500',
                border: '1px solid rgba(255, 149, 0, 0.3)',
                borderRadius: '10px',
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Simulates broken API key or network timeout to demonstrate Graceful Degradation"
            >
              🛡️ Test Graceful Degradation
            </button>
          </div>

          {/* Shimmering Loading State (Supplementary Problem 1) */}
          {loading && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: '#f8f9fa',
              border: '1px dashed #d1d1d6',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid #af52de',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '13px', color: '#6e6e73' }}>
                Connecting securely to AI service on backend (API key protected in .env)...
              </span>
            </div>
          )}

          {/* Output Suggestion Box (Human in the loop - Editable) */}
          {aiOutput && (
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(0,0,0,0.08)',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: aiFallbackUsed ? '#ff9500' : '#af52de',
                  letterSpacing: '0.05em'
                }}>
                  {aiFallbackUsed ? '🛡️ Graceful Fallback Output' : `✨ ${aiProvider.toUpperCase()} Output`}
                </span>
                <span style={{ fontSize: '11px', color: '#86868b' }}>Human-in-the-loop: Edit below before saving</span>
              </div>

              <textarea
                value={aiOutput}
                onChange={(e) => setAiOutput(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />

              {/* Responsible AI Disclaimer (Supplementary Problem 3) */}
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: 'rgba(255, 149, 0, 0.08)',
                border: '1px solid rgba(255, 149, 0, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#b25e00',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>⚠️</span>
                <span>{aiDisclaimer}</span>
              </div>

              {/* Apply Button */}
              {onApplyDescription && (
                <button
                  onClick={() => onApplyDescription(aiOutput)}
                  style={{
                    marginTop: '10px',
                    background: '#0071e3',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apply Suggestion to Task Creation Form
                </button>
              )}
            </div>
          )}

          {/* Suggested Priority Card */}
          {suggestedPrio && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid rgba(0,0,0,0.06)',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase' }}>Recommended Priority:</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d1d1f' }}>
                  {suggestedPrio.priority.toUpperCase()} — <span style={{ fontWeight: 400, fontSize: '12px', color: '#6e6e73' }}>{suggestedPrio.reasoning}</span>
                </div>
              </div>
              {onApplyPriority && (
                <button
                  onClick={() => onApplyPriority(suggestedPrio.priority as any)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Use Priority
                </button>
              )}
            </div>
          )}

          {/* Subtasks Checklist */}
          {subtasks.length > 0 && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid rgba(0,0,0,0.06)',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '11px', color: '#86868b', fontWeight: 600, textTransform: 'uppercase' }}>Suggested Subtasks:</span>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', fontSize: '13px', color: '#1d1d1f' }}>
                {subtasks.map((st, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{st}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Responsible AI & Data Governance */}
      {activeTab === 'governance' && (
        <div style={{ fontSize: '13px', color: '#1d1d1f', lineHeight: '1.6' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>
            Responsible AI & Data Protection Framework
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#48484a' }}>
            <li><strong>Server-Side Secret Isolation:</strong> AI API keys (`GEMINI_API_KEY` / `OPENAI_API_KEY`) reside exclusively in the Express backend (`.env`). Keys are never sent to the React client or browser network tab.</li>
            <li><strong>Zero Sensitive Data Transmission:</strong> Only non-sensitive task titles and priority descriptors are sent. No user passwords, authentication tokens, or personal identifiers (PII) are ever included in prompt payloads.</li>
            <li><strong>Graceful Degradation Guarantee:</strong> If the external AI service returns 401 (invalid key), 429 (rate quota exceeded), or times out after 5s, the application does not crash. It seamlessly falls back to a deterministic, domain-aware heuristic engine with status 200.</li>
            <li><strong>Human in the Loop:</strong> AI responses are delivered as editable suggestions in a form textarea, allowing the user to review, edit, or reject the suggestion before storing it in MongoDB.</li>
            <li><strong>Rate Limiting (Supplementary 2):</strong> Prevents API credit exhaustion with a 60-second cooldown window per client.</li>
          </ul>
        </div>
      )}

      {/* Tab 3: Telemetry */}
      {activeTab === 'telemetry' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1f' }}>{status?.telemetry.totalRequests || 0}</div>
              <div style={{ fontSize: '11px', color: '#86868b' }}>Total AI Requests</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#28cd41' }}>{status?.telemetry.successfulLiveCalls || 0}</div>
              <div style={{ fontSize: '11px', color: '#86868b' }}>Live AI Calls</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff9500' }}>{status?.telemetry.gracefulFallbacks || 0}</div>
              <div style={{ fontSize: '11px', color: '#86868b' }}>Graceful Fallbacks</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0071e3' }}>{status?.telemetry.rateLimitedBlocked || 0}</div>
              <div style={{ fontSize: '11px', color: '#86868b' }}>Rate Limits Enforced</div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#6e6e73' }}>
            <div>• Active Provider: <code>{status?.aiService.providerConfigured || 'Heuristic Fallback Engine'}</code></div>
            <div>• Endpoints: <code>POST /api/ai/generate-description</code>, <code>POST /api/ai/suggest-priority</code>, <code>POST /api/ai/suggest-subtasks</code></div>
            <div>• Rate Limit Window: <code>{status?.aiService.rateLimitWindowSeconds || 60} seconds</code></div>
          </div>
        </div>
      )}
    </div>
  );
};
