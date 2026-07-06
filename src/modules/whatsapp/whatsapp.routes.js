const express = require('express');
const {
  enviarMensaje,
  enviarCotizacion,
  recordatorioEquipo,
  notificarTracking,
} = require('./whatsapp.controller');

const router = express.Router();

router.post('/send', enviarMensaje);
router.post('/enviar-cotizacion', enviarCotizacion);
router.post('/recordatorio-equipo', recordatorioEquipo);
router.post('/notificar-tracking', notificarTracking);

module.exports = router;
