import apiClient from './client';

export function listarCotizaciones() {
  return apiClient.get('/cotizaciones').then((res) => res.data);
}

export function obtenerCotizacion(id) {
  return apiClient.get(`/cotizaciones/${id}`).then((res) => res.data);
}

export function crearCotizacion(datos) {
  return apiClient.post('/cotizaciones', datos).then((res) => res.data);
}

export function actualizarEstadoCotizacion(id, estado) {
  return apiClient.patch(`/cotizaciones/${id}/estado`, { estado }).then((res) => res.data);
}
