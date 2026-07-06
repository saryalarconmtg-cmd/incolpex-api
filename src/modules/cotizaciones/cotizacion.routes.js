const express = require('express');
const { crearCotizacion } = require('./cotizacion.controller');

const router = express.Router();

router.post('/', crearCotizacion);

module.exports = router;
