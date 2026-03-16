import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: BASE, timeout: 15000 });

client.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Unknown error';
    return Promise.reject(new Error(msg));
  }
);

export const api = {
  getForecast: (params) => client.get('/forecast', { params }),
  getForecastSummary: (params) => client.get('/forecast/summary', { params }),
  getDeals: (params) => client.get('/deals', { params }),
  getPipelines: () => client.get('/deals/pipelines'),
  getStages: (params) => client.get('/deals/stages', { params }),
  getOwners: () => client.get('/deals/owners'),
  getKpis: (params) => client.get('/metrics/kpis', { params }),
  getAttainment: (params) => client.get('/metrics/attainment', { params }),
};
