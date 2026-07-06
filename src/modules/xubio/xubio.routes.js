const express = require('express');
const { crearPresupuesto, crearFactura, sincronizar } = require('./xubio.controller');

const router = express.Router();

router.post('/presupuesto', crearPresupuesto);
router.post('/factura', crearFactura);
router.get('/sincronizar', sincronizar);

module.exports = router;
