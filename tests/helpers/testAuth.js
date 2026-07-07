const jwt = require('jsonwebtoken');

function generarTokenPrueba(payload = { id: 1, email: 'admin@incolpex.com', rol: 'admin' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { generarTokenPrueba };
