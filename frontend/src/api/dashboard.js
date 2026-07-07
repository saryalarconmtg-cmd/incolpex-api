import apiClient from './client';

export function obtenerKPIs() {
  return apiClient.get('/dashboard/kpis').then((res) => res.data);
}
