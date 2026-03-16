import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
const client = axios.create({ baseURL: BASE, timeout: 20000 });
client.interceptors.response.use(
  (r) => r.data,
  (err) => Promise.reject(new Error(err.response?.data?.error || err.message))
);

export const api = {
  getAudit: (params) => client.get('/audit', { params }),
  getAuditSummary: (params) => client.get('/audit/summary', { params }),
  refreshAudit: () => client.post('/audit/refresh'),
  triggerEnrichment: (emails, tableId) => client.post('/audit/enrich', { emails, tableId }),
  getPipelines: () => client.get('/deals/pipelines'),
  getOwners: () => client.get('/deals/owners'),
};
