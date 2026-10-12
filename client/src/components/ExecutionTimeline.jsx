import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export default function ExecutionTimeline({ logs, selectedWorkflowId, onSelectWorkflow }) {
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          Showing {filteredLogs.length} recent executions
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'SUCCESS', 'FAILURE'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-container">
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            No execution logs match the selected criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            const isExpanded = expandedLogId === log._id;

            return (
              <div key={log._id} className="timeline-item">
                <div className="timeline-line"></div>
                <div className={`timeline-dot ${isSuccess ? 'dot-success' : 'dot-failure'}`}></div>

                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-title">
                      {log.workflow?.title || 'Standalone Bot Task'}
                    </span>
                    <span className="timeline-time">
                      {new Date(log.executedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${isSuccess ? 'badge-success' : 'badge-failure'}`}>
                        {log.status}
                      </span>
                      {log.statusCode && (
                        <span className="workflow-tag">HTTP {log.statusCode}</span>
                      )}
                      <span className="workflow-tag">{log.durationMs}ms</span>
                    </div>

                    <button
                      onClick={() => toggleExpand(log._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.725rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <Terminal size={12} />
                      {isExpanded ? 'Hide Payload' : 'Inspect Output'}
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>

                  {log.errorMessage && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '6px 8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 4,
                        color: '#f87171',
                        fontSize: '0.725rem',
                      }}
                    >
                      <strong>Error:</strong> {log.errorMessage}
                    </div>
                  )}

                  {isExpanded && log.output && (
                    <pre className="timeline-payload">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
