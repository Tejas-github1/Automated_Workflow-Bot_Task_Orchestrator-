import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import WorkflowList from './components/WorkflowList';
import WorkflowModal from './components/WorkflowModal';
import ExecutionTimeline from './components/ExecutionTimeline';
import api from './services/api';

export default function App() {
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runningIds, setRunningIds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTicking, setIsTicking] = useState(false);
  const [toast, setToast] = useState(null);
  const [dbError, setDbError] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [workflowsData, logsData, statsData] = await Promise.all([
        api.getWorkflows(),
        api.getLogs({ limit: 40 }),
        api.getStats(),
      ]);

      setWorkflows(workflowsData);
      setLogs(logsData);
      setStats(statsData);
      setDbError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (err.message && (err.message.includes('Database connection') || err.message.includes('MONGODB_URI'))) {
        setDbError(err.message);
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Initial load + background polling every 6 seconds
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleToggle = async (id) => {
    try {
      const res = await api.toggleWorkflow(id);
      showToast(res.message || 'Status updated', 'success');
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRunNow = async (id) => {
    setRunningIds((prev) => [...prev, id]);
    try {
      const res = await api.runWorkflowNow(id);
      showToast(`Completed: ${res.executionLog?.status}`, res.executionLog?.status === 'SUCCESS' ? 'success' : 'error');
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRunningIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bot workflow?')) return;
    try {
      await api.deleteWorkflow(id);
      showToast('Workflow deleted', 'info');
      loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateWorkflow = async (formData) => {
    const created = await api.createWorkflow(formData);
    showToast(`Created bot: ${created.title}`, 'success');
    loadData(true);
  };

  const handleTriggerCronTick = async () => {
    setIsTicking(true);
    try {
      const res = await api.triggerCronTick();
      showToast(`Dispatched ${res.dispatchedCount} task(s)`, 'success');
      await loadData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsTicking(false);
    }
  };

  return (
    <div className="container">
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: 600,
            color: '#fff',
            background:
              toast.type === 'error'
                ? 'rgba(239, 68, 68, 0.95)'
                : toast.type === 'success'
                ? 'rgba(16, 185, 129, 0.95)'
                : 'rgba(99, 102, 241, 0.95)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
          }}
        >
          {toast.message}
        </div>
      )}

      <Header
        onOpenNewModal={() => setIsModalOpen(true)}
        onTriggerTick={handleTriggerCronTick}
        isTicking={isTicking}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
      />

      {dbError && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem', marginBottom: 3 }}>
              ⚡ Connect MongoDB Database
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Your Vercel deployment is live! To persist workflows in the cloud, add your{' '}
              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, color: '#38bdf8' }}>
                MONGODB_URI
              </code>{' '}
              (e.g., MongoDB Atlas) in your Vercel Project Settings ➔ Environment Variables.
            </div>
          </div>
          <a
            href="https://vercel.com/pro-8e48/ibots1/settings/environment-variables"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
            style={{ fontSize: '0.78rem' }}
          >
            Configure in Vercel
          </a>
        </div>
      )}

      <StatsOverview stats={stats} />

      <div className="dashboard-grid">
        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Automated Bot Workflows</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {workflows.length} configured
            </span>
          </div>

          <WorkflowList
            workflows={workflows}
            onToggle={handleToggle}
            onRunNow={handleRunNow}
            onDelete={handleDelete}
            runningIds={runningIds}
          />
        </section>

        <section className="section-card">
          <div className="section-header">
            <h2 className="section-title">Execution Timeline</h2>
            <span className="badge badge-success">LIVE</span>
          </div>

          <ExecutionTimeline logs={logs} />
        </section>
      </div>

      <WorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
}
