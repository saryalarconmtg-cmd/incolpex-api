const express = require('express');
const { crearShipment, listarShipments } = require('./fedex.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/shipment', crearShipment);
router.get('/shipments', verifyToken, listarShipments);

module.exports = router;
