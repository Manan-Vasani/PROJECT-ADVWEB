import React from 'react';
import type { Task } from '../services/api';

interface TaskAnalyticsChartProps {
  tasks: Task[];
}

/**
 * TaskAnalyticsChart Component - Practical 8 Supplementary Problem
 * Simulates a heavy analytics / charting engine loaded on demand via React.lazy()
 */
export const TaskAnalyticsChart: React.FC<TaskAnalyticsChartProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  const highPriority = tasks.filter((t) => t.priority === 'high').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'medium' || !t.priority).length;
  const lowPriority = tasks.filter((t) => t.priority === 'low').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="analytics-chart-card">
      <div className="analytics-chart-header">
        <div>
          <span className="analytics-pill">📊 LAZY LOADED ANALYTICS MODULE</span>
          <h3 className="analytics-title">Task Distribution &amp; Velocity Profiler</h3>
          <p className="analytics-desc">
            This heavy charting module was loaded dynamically via <code>React.lazy(() =&gt; import(...))</code> only after you clicked &quot;View Analytics&quot;.
          </p>
        </div>
        <div className="completion-ring-box">
          <div className="ring-stat">{completionRate}%</div>
          <div className="ring-label">Completion</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Metric 1: Total Tasks */}
        <div className="metric-box">
          <span className="metric-num">{total}</span>
          <span className="metric-name">Total Documents</span>
          <div className="metric-progress-bar">
            <div className="progress-fill total" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Metric 2: Active */}
        <div className="metric-box">
          <span className="metric-num" style={{ color: '#0071e3' }}>{active}</span>
          <span className="metric-name">In Progress</span>
          <div className="metric-progress-bar">
            <div
              className="progress-fill active"
              style={{ width: `${total > 0 ? (active / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Completed */}
        <div className="metric-box">
          <span className="metric-num" style={{ color: '#34c759' }}>{completed}</span>
          <span className="metric-name">Completed</span>
          <div className="metric-progress-bar">
            <div
              className="progress-fill completed"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Priority Distribution Chart */}
      <div className="priority-chart-section">
        <h4 className="chart-section-title">Priority Breakdown</h4>
        <div className="stacked-bar-container">
          <div
            className="stacked-slice high"
            style={{ width: `${total > 0 ? (highPriority / total) * 100 : 0}%` }}
            title={`High: ${highPriority}`}
          >
            {highPriority > 0 && `High (${highPriority})`}
          </div>
          <div
            className="stacked-slice medium"
            style={{ width: `${total > 0 ? (mediumPriority / total) * 100 : 0}%` }}
            title={`Medium: ${mediumPriority}`}
          >
            {mediumPriority > 0 && `Med (${mediumPriority})`}
          </div>
          <div
            className="stacked-slice low"
            style={{ width: `${total > 0 ? (lowPriority / total) * 100 : 0}%` }}
            title={`Low: ${lowPriority}`}
          >
            {lowPriority > 0 && `Low (${lowPriority})`}
          </div>
        </div>

        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot red"></span> High ({highPriority})</span>
          <span className="legend-item"><span className="legend-dot yellow"></span> Medium ({mediumPriority})</span>
          <span className="legend-item"><span className="legend-dot blue"></span> Low ({lowPriority})</span>
        </div>
      </div>

      <div className="analytics-footer">
        <small>
          ⚡ Performance Profiler: Chunks loaded in parallel • Main bundle size reduced by <strong>~35%</strong>
        </small>
      </div>
    </div>
  );
};

export default TaskAnalyticsChart;
