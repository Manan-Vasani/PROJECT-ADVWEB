import React, { useState, useEffect, useCallback } from 'react';
import {
  getEventLogs,
  clearEventLogs,
  triggerSlowTest,
  triggerErrorTest
} from '../services/api';
import type { EventLogRecord, EventStatsResponse } from '../services/api';

interface EventNotificationCardProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EventNotificationCard: React.FC<EventNotificationCardProps> = ({ onNotify }) => {
  const [telemetry, setTelemetry] = useState<EventStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [slowRunning, setSlowRunning] = useState(false);
  const [lastApiSent, setLastApiSent] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await getEventLogs();
      setTelemetry(data);
    } catch {
      // Background poll failure silent
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    let interval: any;
    if (pollingActive) {
      interval = setInterval(fetchTelemetry, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchTelemetry, pollingActive]);

  const handleTriggerSlow = async () => {
    setLoading(true);
    setSlowRunning(true);
    try {
      const startTime = performance.now();
      const res = await triggerSlowTest('Batch PDF Report Generation', 2500);
      const apiDuration = Math.round(performance.now() - startTime);

      setLastApiSent(res.apiSentAt);
      onNotify?.(
        `⚡ Non-blocking proof: API responded in ${apiDuration}ms while 2500ms background worker is still running!`,
        'success'
      );

      // Refresh after worker expected finish
      setTimeout(() => {
        setSlowRunning(false);
        fetchTelemetry();
      }, 2700);
    } catch (err: any) {
      setSlowRunning(false);
      onNotify?.(err.message || 'Failed to trigger slow worker', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerError = async () => {
    try {
      await triggerErrorTest('Simulated external mail server connection reset');
      onNotify?.('🛡️ Error event emitted! Listener handled it safely without crashing server.', 'info');
      fetchTelemetry();
    } catch (err: any) {
      onNotify?.(err.message || 'Failed to trigger error event', 'error');
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearEventLogs();
      setTelemetry({
        status: 'ok',
        engine: 'Node.js native EventEmitter',
        stats: { totalEmitted: 0, byEvent: {} },
        history: []
      });
      setLastApiSent(null);
      onNotify?.('Event logs cleared successfully', 'info');
    } catch (err: any) {
      onNotify?.(err.message || 'Failed to clear logs', 'error');
    }
  };

  const getEventBadgeClass = (event: EventLogRecord['event']) => {
    switch (event) {
      case 'task-created':
        return 'event-badge-created';
      case 'task-deleted':
        return 'event-badge-deleted';
      case 'task-updated':
        return 'event-badge-updated';
      case 'error':
        return 'event-badge-error';
      default:
        return 'event-badge-default';
    }
  };

  const totalEmitted = telemetry?.stats?.totalEmitted || 0;
  const history = telemetry?.history || [];

  return (
    <div className="cache-benchmark-card event-notification-card">
      <div className="cache-card-header">
        <div>
          <div className="cache-card-badge-row">
            <span className="badge badge-accent">⚡ Practical 10</span>
            <span className="badge badge-subtle">Node.js EventEmitter</span>
            <span className="badge badge-success">Non-Blocking Architecture</span>
          </div>
          <h3 className="cache-card-title">Asynchronous Background Processing</h3>
          <p className="cache-card-subtitle">
            Side effects (email notifications, audit logs) run asynchronously without blocking the client's HTTP response.
          </p>
        </div>

        <div className="cache-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTelemetry}
            title="Refresh event telemetry"
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClearHistory}
            title="Clear recorded logs"
          >
            🧹 Clear
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="event-metrics-grid">
        <div className="event-metric-box">
          <span className="event-metric-label">Total Events Emitted</span>
          <span className="event-metric-value">{totalEmitted}</span>
        </div>
        <div className="event-metric-box">
          <span className="event-metric-label">task-created</span>
          <span className="event-metric-value">{telemetry?.stats?.byEvent?.['task-created'] || 0}</span>
        </div>
        <div className="event-metric-box">
          <span className="event-metric-label">task-deleted</span>
          <span className="event-metric-value">{telemetry?.stats?.byEvent?.['task-deleted'] || 0}</span>
        </div>
        <div className="event-metric-box">
          <span className="event-metric-label">Error Handled</span>
          <span className="event-metric-value">{telemetry?.stats?.byEvent?.['error'] || 0}</span>
        </div>
      </div>

      {/* Interactive Testing Controls */}
      <div className="event-actions-panel">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleTriggerSlow}
          disabled={loading || slowRunning}
        >
          {slowRunning ? '⏳ Background Worker Running (2500ms)...' : '⚡ Test Slow Background Worker (2.5s Delay)'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleTriggerError}
        >
          🛡️ Test Error Listener Safety
        </button>

        <label className="event-poll-toggle">
          <input
            type="checkbox"
            checked={pollingActive}
            onChange={(e) => setPollingActive(e.target.checked)}
          />
          <span>Auto-poll event stream</span>
        </label>
      </div>

      {slowRunning && (
        <div className="event-slow-alert">
          <div className="event-spinner"></div>
          <div>
            <strong>Proof of Non-Blocking Decoupling:</strong>
            <p>
              Your browser received the HTTP response instantly {lastApiSent ? `at ${lastApiSent.split('T')[1].slice(0, 8)}` : ''},
              while the background notification worker is still simulating execution!
            </p>
          </div>
        </div>
      )}

      {/* Live Event Stream Table */}
      <div className="event-stream-container">
        <h4 className="event-stream-title">
          <span>📡 Live Background Event Telemetry Stream</span>
          <span className="event-stream-count">{history.length} logged</span>
        </h4>

        {history.length === 0 ? (
          <div className="event-empty-state">
            <p>No background events recorded yet.</p>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Create or delete a task, or click <strong>"Test Slow Background Worker"</strong> above to see events fire asynchronously.
            </p>
          </div>
        ) : (
          <div className="event-table-wrapper">
            <table className="cache-table event-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Task Title / Details</th>
                  <th>API Sent Timestamp</th>
                  <th>Worker Completed</th>
                  <th>Worker Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className={`event-badge ${getEventBadgeClass(record.event)}`}>
                        {record.event}
                      </span>
                    </td>
                    <td>
                      <strong>{record.taskTitle}</strong>
                      <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                        User: {record.userName} {record.message ? `• ${record.message}` : ''}
                      </div>
                    </td>
                    <td className="timestamp-cell">
                      {record.apiSentAt ? record.apiSentAt.split('T')[1].slice(0, 12) : 'N/A'}
                    </td>
                    <td className="timestamp-cell">
                      {record.listenerCompletedAt ? record.listenerCompletedAt.split('T')[1].slice(0, 12) : 'Pending...'}
                    </td>
                    <td>
                      <span className="badge badge-subtle">
                        {record.durationMs > 0 ? `${record.durationMs}ms` : '<1ms'}
                      </span>
                    </td>
                    <td>
                      <span className={record.status === 'completed' ? 'text-success' : 'text-danger'}>
                        {record.status === 'completed' ? '✔ Done' : '✖ Handled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pedagogical Callout */}
      <div className="event-architecture-note">
        <strong>💡 Lab Concept: Non-Blocking Execution Proof</strong>
        <p>
          Notice how the <strong>API Sent Timestamp</strong> is recorded <em>before</em> the <strong>Worker Completed</strong> timestamp.
          By emitting <code>task-created</code> after calling <code>res.status(201).json()</code>, the client gets instant feedback while heavy notifications run in the background.
        </p>
      </div>
    </div>
  );
};

export default EventNotificationCard;
