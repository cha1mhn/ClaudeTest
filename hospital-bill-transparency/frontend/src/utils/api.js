import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

export const getSummary = () => api.get('/stats/summary').then((r) => r.data);
export const getCities = () => api.get('/stats/cities').then((r) => r.data.data);
export const getCategories = () => api.get('/stats/categories').then((r) => r.data.data);

export const getProcedures = (params) => api.get('/procedures', { params }).then((r) => r.data.data);
export const compareProcedure = (procedure, params) =>
  api.get(`/procedures/${encodeURIComponent(procedure)}/compare`, { params }).then((r) => r.data);

export const getReports = (params) => api.get('/reports', { params }).then((r) => r.data);
export const submitReport = (payload) => api.post('/reports', payload).then((r) => r.data);

export default api;
