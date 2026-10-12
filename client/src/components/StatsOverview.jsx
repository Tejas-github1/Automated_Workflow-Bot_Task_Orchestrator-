import React from 'react';
import { Activity, CheckCircle2, Clock, Layers, Power } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const items = [
    {
      label: 'Configured Bots',
      value: stats?.totalWorkflows ?? 0,
      icon: <Layers size={18} color="#818cf8" />,
    },
    {
      label: 'Active Automations',
      value: stats?.activeWorkflows ?? 0,
      icon: <Power size={18} color="#34d399" />,
    },
    {
      label: 'Success Rate',
      value: `${stats?.successRate ?? 100}%`,
      icon: <CheckCircle2 size={18} color="#22c55e" />,
    },
    {
      label: 'Total Executions',
      value: stats?.totalExecutions ?? 0,
      icon: <Activity size={18} color="#06b6d4" />,
    },
    {
      label: 'Avg Response',
      value: `${stats?.avgDurationMs ?? 0}ms`,
      icon: <Clock size={18} color="#f59e0b" />,
    },
  ];

  return (
    <div className="stats-grid">
      {items.map((item, idx) => (
        <div key={idx} className="stat-card">
          <div>
            <div className="stat-label">{item.label}</div>
            <div className="stat-value">{item.value}</div>
          </div>
          <div className="stat-icon">{item.icon}</div>
        </div>
      ))}
    </div>
  );
}
