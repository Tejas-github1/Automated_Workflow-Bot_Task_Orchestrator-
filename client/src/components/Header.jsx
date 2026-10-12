import React from 'react';
import { Bot, Play, Plus, RefreshCw, Zap } from 'lucide-react';

export default function Header({ onOpenNewModal, onTriggerTick, isTicking, onRefresh, isRefreshing }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">
          <Bot size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="brand-title">iBots Orchestrator</h1>
            <span className="brand-badge">Vercel Ready</span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Automated Workflow &amp; Background Bot Task Engine
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Dashboard"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onTriggerTick}
          disabled={isTicking}
          style={{ borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
          title="Trigger Vercel Cron worker loop immediately"
        >
          <Zap size={14} className={isTicking ? 'spin' : ''} />
          <span>{isTicking ? 'Dispatching...' : 'Trigger Cron Tick'}</span>
        </button>

        <button className="btn btn-primary btn-sm" onClick={onOpenNewModal}>
          <Plus size={15} />
          <span>New Bot Workflow</span>
        </button>
      </div>
    </header>
  );
}
