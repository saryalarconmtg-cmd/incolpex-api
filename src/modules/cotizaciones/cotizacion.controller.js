const cotizacionModel = require('./cotizacion.model');

const SHIPPING_DEFAULT = Number(process.env.SHIPPING_DEFAULT) || 50;

function calcularPrecioFinal({ precio_unitario_china, cantidad, margen_porcentaje, shipping }) {
  const subtotal = precio_unitario_china * cantidad;
  const margenMonto = subtotal * (margen_porcentaje / 100);
  return Number((subtotal + shipping + margenMonto).toFixed(2));
}

async function crearCotizacion(req, res) {
  const { cliente_id, producto, cantidad, precio_unitario_china, margen_porcentaje } = req.body;

  if (
    cliente_id === undefined
    || !producto
    || cantidad === undefined
    || precio_unitario_china === undefined
    || margen_porcentaje === undefined
  ) {
    return res.status(400).json({
      error: 'Faltan campos requeridos: cliente_id, producto, cantidad, precio_unitario_china, margen_porcentaje',
    });
  }

  if ([cantidad, precio_unitario_china, margen_porcentaje].some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    return res.status(400).json({
      error: 'cantidad, precio_unitario_china y margen_porcentaje deben ser numéricos',
    });
  }

  const shipping = SHIPPING_DEFAULT;
  const precio_final = calcularPrecioFinal({
    precio_unitario_china,
    cantidad,
    margen_porcentaje,
    shipping,
  });

  try {
    const cotizacion = await cotizacionModel.create({
      cliente_id,
      producto,
      cantidad,
      precio_unitario_china,
      shipping,
      margen_porcentaje,
      precio_final,
    });
    return res.status(201).json(cotizacion);
  } catch (error) {
    return res.status(500).json({ error: 'Error al crear la cotización' });
  }
}

module.exports = { crearCotizacion, calcularPrecioFinal };
