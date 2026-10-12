import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function WorkflowModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('HEALTH_PING');
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/status/200');
  const [scheduleIntervalMinutes, setScheduleIntervalMinutes] = useState(5);
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (['HEALTH_PING', 'PAGE_SCRAPE', 'WEBHOOK_POST'].includes(taskType) && !targetUrl.trim()) {
      setError('Target URL is required for this bot task');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        taskType,
        scheduleIntervalMinutes: Number(scheduleIntervalMinutes) || 5,
        config: {
          targetUrl: targetUrl.trim(),
          expectedStatusCode: Number(expectedStatusCode) || 200,
        },
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create New Bot Workflow</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Workflow Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Production API Health Probe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Brief summary of what this bot task executes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Type</label>
            <select
              className="form-select"
              value={taskType}
              onChange={(e) => {
                const val = e.target.value;
                setTaskType(val);
                if (val === 'HEALTH_PING') setTargetUrl('https://httpbin.org/status/200');
                if (val === 'PAGE_SCRAPE') setTargetUrl('https://news.ycombinator.com');
                if (val === 'WEBHOOK_POST') setTargetUrl('https://httpbin.org/post');
              }}
            >
              <option value="HEALTH_PING">📡 Health Check Ping (HTTP GET / Latency)</option>
              <option value="PAGE_SCRAPE">🌐 Webpage Scraper (Extracts Title &amp; Metadata)</option>
              <option value="WEBHOOK_POST">⚡ Webhook POST Dispatcher</option>
              <option value="DATA_CLEANUP">🧹 Automated Cache &amp; Data Pruning</option>
            </select>
          </div>

          {['HEALTH_PING', 'PAGE_SCRAPE', 'WEBHOOK_POST'].includes(taskType) && (
            <div className="form-group">
              <label className="form-label">Target URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/api"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Run Interval (Minutes)</label>
              <input
                type="number"
                min="1"
                max="1440"
                className="form-input"
                value={scheduleIntervalMinutes}
                onChange={(e) => setScheduleIntervalMinutes(e.target.value)}
                required
              />
            </div>

            {taskType === 'HEALTH_PING' && (
              <div className="form-group">
                <label className="form-label">Expected Status Code</label>
                <input
                  type="number"
                  className="form-input"
                  value={expectedStatusCode}
                  onChange={(e) => setExpectedStatusCode(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
