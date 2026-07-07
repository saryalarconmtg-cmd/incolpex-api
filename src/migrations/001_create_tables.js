require('dotenv').config();

const pool = require('../config/database');
const { createTableSQL: usersTableSQL } = require('../modules/auth/auth.model');
const { createTableSQL: clientesTableSQL } = require('../modules/clientes/cliente.model');
const { createTableSQL: cotizacionesTableSQL } = require('../modules/cotizaciones/cotizacion.model');
const { createTableSQL: shipmentsTableSQL } = require('../modules/fedex/fedex.model');
const { createTableSQL: xubioMovimientosTableSQL } = require('../modules/xubio/xubio.model');

const TABLAS = [
  { nombre: 'users', sql: usersTableSQL },
  { nombre: 'clientes', sql: clientesTableSQL },
  { nombre: 'cotizaciones', sql: cotizacionesTableSQL },
  { nombre: 'shipments', sql: shipmentsTableSQL },
  { nombre: 'xubio_movimientos', sql: xubioMovimientosTableSQL },
];

async function migrar() {
  for (let i = 0; i < TABLAS.length; i += 1) {
    const tabla = TABLAS[i];
    // eslint-disable-next-line no-await-in-loop
    await pool.query(tabla.sql);
    console.log(`✓ Tabla '${tabla.nombre}' verificada/creada`);
  }
  await pool.end();
}

migrar().catch((error) => {
  console.error('Error al ejecutar las migraciones:', error.message);
  process.exit(1);
});
