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

const ESTADOS_VALIDOS = ['pending', 'accepted', 'rejected'];

async function listarCotizaciones(req, res) {
  try {
    const cotizaciones = await cotizacionModel.findAll();
    return res.status(200).json(cotizaciones);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar las cotizaciones' });
  }
}

async function obtenerCotizacion(req, res) {
  try {
    const cotizacion = await cotizacionModel.findById(req.params.id);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    return res.status(200).json(cotizacion);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la cotización' });
  }
}

async function actualizarEstadoCotizacion(req, res) {
  const { estado } = req.body;

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    const cotizacion = await cotizacionModel.actualizarEstado(req.params.id, estado);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    return res.status(200).json(cotizacion);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el estado de la cotización' });
  }
}

module.exports = {
  crearCotizacion,
  calcularPrecioFinal,
  listarCotizaciones,
  obtenerCotizacion,
  actualizarEstadoCotizacion,
};
