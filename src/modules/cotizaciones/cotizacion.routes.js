const express = require('express');
const {
  crearCotizacion,
  listarCotizaciones,
  obtenerCotizacion,
  actualizarEstadoCotizacion,
} = require('./cotizacion.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', crearCotizacion);
router.get('/', verifyToken, listarCotizaciones);
router.get('/:id', verifyToken, obtenerCotizacion);
router.patch('/:id/estado', verifyToken, actualizarEstadoCotizacion);

module.exports = router;
