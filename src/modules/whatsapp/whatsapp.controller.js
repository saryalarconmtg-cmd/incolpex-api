const pool = require('../../config/database');
const whatsappService = require('./whatsapp.service');
const cotizacionModel = require('../cotizaciones/cotizacion.model');

const TELEFONO_REGEX = /^\+(56|57)\d{8,10}$/;

function validarTelefono(telefono) {
  return typeof telefono === 'string' && TELEFONO_REGEX.test(telefono);
}

function formatearMensajeCotizacion(cotizacion) {
  return `Hola, tu cotización #${cotizacion.id} para "${cotizacion.producto}" `
    + `(cantidad: ${cotizacion.cantidad}) tiene un precio final de $${cotizacion.precio_final}. `
    + `Estado: ${cotizacion.estado}.`;
}

function formatearMensajeRecordatorio({ tarea, fecha }) {
  return `Recordatorio: tienes pendiente la tarea "${tarea}" con fecha límite ${fecha}.`;
}

function formatearMensajeTracking(tracking_number) {
  return `Tu pedido ha sido despachado. Puedes rastrearlo con el número de guía: ${tracking_number}.`;
}

async function obtenerTelefonoCliente(cliente_id) {
  const { rows } = await pool.query('SELECT telefono FROM clientes WHERE id = ?', [cliente_id]);
  return rows[0]?.telefono || null;
}

async function enviarCotizacion(req, res) {
  const { cliente_id, cotizacion_id } = req.body;

  if (cliente_id === undefined || cotizacion_id === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos: cliente_id, cotizacion_id' });
  }

  try {
    const cotizacion = await cotizacionModel.findById(cotizacion_id);
    if (!cotizacion) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const telefono = await obtenerTelefonoCliente(cliente_id);
    if (!telefono) {
      return res.status(404).json({ error: 'Cliente no encontrado o sin teléfono registrado' });
    }

    if (!validarTelefono(telefono)) {
      return res.status(422).json({
        error: 'El teléfono registrado para el cliente tiene un formato inválido (+56 o +57 seguido del número)',
      });
    }

    const mensaje = formatearMensajeCotizacion(cotizacion);
    const { messageId } = await whatsappService.sendMessage(telefono, mensaje, 'cotizacion');

    return res.status(200).json({ enviado: true, messageId });
  } catch (error) {
    return res.status(502).json({ error: 'Error al enviar el mensaje de WhatsApp' });
  }
}

async function recordatorioEquipo(req, res) {
  const { tarea, asignado_a, fecha } = req.body;

  if (!tarea || !asignado_a || !fecha) {
    return res.status(400).json({ error: 'Faltan campos requeridos: tarea, asignado_a, fecha' });
  }

  if (!validarTelefono(asignado_a)) {
    return res.status(422).json({
      error: 'asignado_a debe ser un teléfono con formato +56 o +57 seguido del número',
    });
  }

  try {
    const mensaje = formatearMensajeRecordatorio({ tarea, fecha });
    const { messageId } = await whatsappService.sendMessage(asignado_a, mensaje, 'recordatorio_equipo');

    return res.status(200).json({ enviado: true, messageId });
  } catch (error) {
    return res.status(502).json({ error: 'Error al enviar el recordatorio de WhatsApp' });
  }
}

async function notificarTracking(req, res) {
  const { tracking_number, cliente_id } = req.body;

  if (!tracking_number || cliente_id === undefined) {
    return res.status(400).json({ error: 'Faltan campos requeridos: tracking_number, cliente_id' });
  }

  try {
    const telefono = await obtenerTelefonoCliente(cliente_id);
    if (!telefono) {
      return res.status(404).json({ error: 'Cliente no encontrado o sin teléfono registrado' });
    }

    if (!validarTelefono(telefono)) {
      return res.status(422).json({
        error: 'El teléfono registrado para el cliente tiene un formato inválido (+56 o +57 seguido del número)',
      });
    }

    const mensaje = formatearMensajeTracking(tracking_number);
    const { messageId } = await whatsappService.sendMessage(telefono, mensaje, 'tracking');

    return res.status(200).json({ enviado: true, messageId });
  } catch (error) {
    return res.status(502).json({ error: 'Error al enviar la notificación de tracking' });
  }
}

async function enviarMensaje(req, res) {
  const { telefono, mensaje } = req.body;

  if (!telefono || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos requeridos: telefono, mensaje' });
  }

  if (!validarTelefono(telefono)) {
    return res.status(422).json({
      error: 'telefono debe tener formato +56 o +57 seguido del número (ej: +56912345678)',
    });
  }

  try {
    const { messageId } = await whatsappService.sendMessage(telefono, mensaje);
    return res.status(200).json({ enviado: true, messageId });
  } catch (error) {
    return res.status(502).json({ error: 'Error al enviar el mensaje de WhatsApp' });
  }
}

module.exports = {
  enviarMensaje,
  enviarCotizacion,
  recordatorioEquipo,
  notificarTracking,
  validarTelefono,
  formatearMensajeCotizacion,
  formatearMensajeRecordatorio,
  formatearMensajeTracking,
};
