import apiClient from './client';

export function listarShipments() {
  return apiClient.get('/fedex/shipments').then((res) => res.data);
}
