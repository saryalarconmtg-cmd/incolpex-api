const express = require('express');
const { crearShipment } = require('./fedex.controller');

const router = express.Router();

router.post('/shipment', crearShipment);

module.exports = router;
