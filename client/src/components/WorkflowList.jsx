import React from 'react';
import { Clock, ExternalLink, Play, Trash2, Zap } from 'lucide-react';

const TASK_TYPE_LABELS = {
  HEALTH_PING: { label: 'Health Ping', color: '#38bdf8' },
  PAGE_SCRAPE: { label: 'Page Scraper', color: '#a78bfa' },
  WEBHOOK_POST: { label: 'Webhook POST', color: '#f472b6' },
  DATA_CLEANUP: { label: 'Data Cleanup', color: '#fb923c' },
};

function formatNextRun(dateString) {
  if (!dateString) return 'Pending';
  const target = new Date(dateString);
  const now = new Date();
  const diffSec = Math.round((target - now) / 1000);

  if (diffSec <= 0) return 'Due now';
  if (diffSec < 60) return `in ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  return `in ${diffMin} min`;
}

export default function WorkflowList({ workflows, onToggle, onRunNow, onDelete, runningIds }) {
  if (!workflows.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <p>No bot workflows configured yet.</p>
        <p style={{ fontSize: '0.825rem', marginTop: 4 }}>
          Click "New Bot Workflow" to create your first automated routine.
        </p>
      </div>
    );
  }

  return (
    <div>
      {workflows.map((wf) => {
        const isRunning = runningIds.includes(wf._id) || wf.currentStatus === 'RUNNING';
        const typeInfo = TASK_TYPE_LABELS[wf.taskType] || { label: wf.taskType, color: '#94a3b8' };

        return (
          <div key={wf._id} className={`workflow-item ${wf.isActive ? 'active' : 'paused'}`}>
            <div className="workflow-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="switch" title={wf.isActive ? 'Turn off bot' : 'Turn on bot'}>
                  <input
                    type="checkbox"
                    checked={wf.isActive}
                    onChange={() => onToggle(wf._id)}
                  />
                  <span className="slider"></span>
                </label>
                <div>
                  <h3 className="workflow-title">{wf.title}</h3>
                </div>
              </div>

              <div>
                {isRunning ? (
                  <span className="badge badge-running">RUNNING</span>
                ) : !wf.isActive ? (
                  <span className="badge badge-idle">PAUSED</span>
                ) : wf.currentStatus === 'FAILED' ? (
                  <span className="badge badge-failure">FAILED</span>
                ) : (
                  <span className="badge badge-success">ACTIVE</span>
                )}
              </div>
            </div>

            {wf.description && <p className="workflow-desc">{wf.description}</p>}

            <div className="workflow-meta">
              <span className="workflow-tag" style={{ borderLeft: `3px solid ${typeInfo.color}` }}>
                {typeInfo.label}
              </span>

              <span className="workflow-tag">
                <Clock size={12} /> Every {wf.scheduleIntervalMinutes}m
              </span>

              {wf.isActive && (
                <span className="workflow-tag" style={{ color: '#38bdf8' }}>
                  Next: {formatNextRun(wf.nextRunAt)}
                </span>
              )}

              {wf.config?.targetUrl && (
                <span
                  className="workflow-tag"
                  style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={wf.config.targetUrl}
                >
                  <ExternalLink size={12} /> {wf.config.targetUrl}
                </span>
              )}
            </div>

            <div className="workflow-actions">
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {wf.lastRunAt ? `Last run: ${new Date(wf.lastRunAt).toLocaleTimeString()}` : 'Never run'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onRunNow(wf._id)}
                  disabled={isRunning}
                  title="Execute this bot routine right now"
                >
                  <Play size={13} className={isRunning ? 'spin' : ''} />
                  <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(wf._id)}
                  title="Delete bot workflow"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
