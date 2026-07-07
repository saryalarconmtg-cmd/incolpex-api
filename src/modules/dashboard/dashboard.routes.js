const express = require('express');
const { obtenerKPIs } = require('./dashboard.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/kpis', verifyToken, obtenerKPIs);

module.exports = router;
