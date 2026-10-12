/**
 * API Client Service
 * Interacts with the Express Backend and Vercel Serverless API
 */

const API_BASE = '/api';

let cachedToken = localStorage.getItem('ibots_token') || null;

async function getAuthToken() {
  if (cachedToken) return cachedToken;
  try {
    const res = await fetch(`${API_BASE}/auth/demo`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      cachedToken = data.token;
      localStorage.setItem('ibots_token', cachedToken);
      return cachedToken;
    }
  } catch (err) {
    console.warn('Failed to obtain demo token:', err);
  }
  return null;
}

async function request(endpoint, options = {}) {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Workflows
  getWorkflows: () => request('/workflows'),
  createWorkflow: (workflowData) =>
    request('/workflows', { method: 'POST', body: JSON.stringify(workflowData) }),
  updateWorkflow: (id, workflowData) =>
    request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(workflowData) }),
  toggleWorkflow: (id) =>
    request(`/workflows/${id}/toggle`, { method: 'PATCH' }),
  runWorkflowNow: (id) =>
    request(`/workflows/${id}/run`, { method: 'POST' }),
  deleteWorkflow: (id) =>
    request(`/workflows/${id}`, { method: 'DELETE' }),

  // Telemetry & Logs
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/logs${query ? `?${query}` : ''}`);
  },
  getStats: () => request('/logs/stats'),

  // Orchestrator Tick Trigger
  triggerCronTick: () => request('/cron/dispatch', { method: 'POST' }),
};

export default api;
