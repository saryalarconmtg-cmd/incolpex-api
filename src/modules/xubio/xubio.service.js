const axios = require('axios');

const XUBIO_API_URL = process.env.XUBIO_API_URL || 'https://api.xubio.com';

function client() {
  return axios.create({
    baseURL: XUBIO_API_URL,
    headers: {
      Authorization: `Bearer ${process.env.XUBIO_API_KEY}`,
      'X-Empresa-Id': process.env.XUBIO_EMPRESA_ID,
      'Content-Type': 'application/json',
    },
  });
}

// Simplificación: se factura/presupuesta como un único ítem con el precio_final ya
// prorrateado (incluye shipping y margen); no se desglosa por línea en Xubio.
function mapCotizacionAPresupuesto(cotizacion) {
  return {
    cliente_id: cotizacion.cliente_id,
    items: [
      {
        descripcion: cotizacion.producto,
        cantidad: cotizacion.cantidad,
        precio_unitario: cotizacion.precio_final / cotizacion.cantidad,
      },
    ],
    total: cotizacion.precio_final,
    referencia_externa: `cotizacion-${cotizacion.id}`,
  };
}

function mapOrdenAFactura(orden) {
  return {
    cliente_id: orden.cliente_id,
    items: [
      {
        descripcion: orden.producto,
        cantidad: orden.cantidad,
        precio_unitario: orden.precio_final / orden.cantidad,
      },
    ],
    total: orden.precio_final,
    referencia_externa: `orden-${orden.id}`,
  };
}

async function createPresupuesto(cotizacion_data) {
  const { data } = await client().post('/presupuestos', mapCotizacionAPresupuesto(cotizacion_data));
  return data;
}

async function createFactura(orden_data) {
  const { data } = await client().post('/facturas', mapOrdenAFactura(orden_data));
  return data;
}

async function obtenerMovimientos() {
  const { data } = await client().get('/movimientos');
  return data;
}

module.exports = {
  createPresupuesto,
  createFactura,
  obtenerMovimientos,
  mapCotizacionAPresupuesto,
  mapOrdenAFactura,
};
