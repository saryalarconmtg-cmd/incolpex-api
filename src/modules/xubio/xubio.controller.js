const xubioService = require('./xubio.service');
const cotizacionModel = require('../cotizaciones/cotizacion.model');
const xubioModel = require('./xubio.model');

async function crearPresupuesto(req, res) {
  const { cotizacion_id } = req.body;

  if (cotizacion_id === undefined) {
    return res.status(400).json({ error: 'Falta el campo requerido: cotizacion_id' });
  }

  try {
    const cotizacion = await cotizacionModel.findById(cotizacion_id);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const presupuesto = await xubioService.createPresupuesto(cotizacion);
    console.log(`[xubio] presupuesto creado cotizacion_id=${cotizacion_id} xubio_id=${presupuesto.id}`);

    return res.status(201).json(presupuesto);
  } catch (error) {
    console.error(`[xubio] error al crear presupuesto cotizacion_id=${cotizacion_id} error=${error.message}`);
    return res.status(502).json({ error: 'Error al crear el presupuesto en Xubio' });
  }
}

async function crearFactura(req, res) {
  const { orden_id } = req.body;

  if (orden_id === undefined) {
    return res.status(400).json({ error: 'Falta el campo requerido: orden_id' });
  }

  try {
    // orden_id referencia una cotización confirmada (estado = 'accepted'); todavía no
    // existe una tabla de órdenes independiente en el esquema.
    const orden = await cotizacionModel.findById(orden_id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (orden.estado !== 'accepted') {
      return res.status(422).json({ error: 'La orden debe estar confirmada (estado "accepted") para facturar' });
    }

    const factura = await xubioService.createFactura(orden);
    console.log(`[xubio] factura creada orden_id=${orden_id} xubio_id=${factura.id}`);

    return res.status(201).json(factura);
  } catch (error) {
    console.error(`[xubio] error al crear factura orden_id=${orden_id} error=${error.message}`);
    return res.status(502).json({ error: 'Error al crear la factura en Xubio' });
  }
}

async function sincronizar(req, res) {
  try {
    const movimientos = await xubioService.obtenerMovimientos();
    const guardados = [];

    for (let i = 0; i < movimientos.length; i += 1) {
      const movimiento = movimientos[i];
      // eslint-disable-next-line no-await-in-loop
      const guardado = await xubioModel.upsertMovimiento({
        xubio_id: movimiento.id,
        tipo: movimiento.tipo,
        monto: movimiento.monto,
        fecha: movimiento.fecha,
        datos: movimiento,
      });
      guardados.push(guardado);
    }

    console.log(`[xubio] sincronización completada movimientos=${guardados.length}`);
    return res.status(200).json({ sincronizados: guardados.length, movimientos: guardados });
  } catch (error) {
    console.error(`[xubio] error en sincronización error=${error.message}`);
    return res.status(502).json({ error: 'Error al sincronizar movimientos de Xubio' });
  }
}

module.exports = { crearPresupuesto, crearFactura, sincronizar };
