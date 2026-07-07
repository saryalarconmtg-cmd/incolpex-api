const pool = require('../../config/database');

const TABLE_NAME = 'shipments';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id SERIAL PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL,
  direccion_destino JSONB NOT NULL,
  peso NUMERIC(6,2) NOT NULL,
  dimensiones JSONB NOT NULL,
  tracking_number VARCHAR(100) NOT NULL,
  etiqueta_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function create({
  cotizacion_id,
  direccion_destino,
  peso,
  dimensiones,
  tracking_number,
  etiqueta_url,
}) {
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME}
      (cotizacion_id, direccion_destino, peso, dimensiones, tracking_number, etiqueta_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      cotizacion_id,
      JSON.stringify(direccion_destino),
      peso,
      JSON.stringify(dimensiones),
      tracking_number,
      etiqueta_url,
    ],
  );
  return rows[0];
}

async function findAll() {
  const { rows } = await pool.query(
    `SELECT s.*, c.producto, c.cliente_id AS cotizacion_cliente_id, c.estado AS cotizacion_estado
     FROM ${TABLE_NAME} s
     JOIN cotizaciones c ON c.id = s.cotizacion_id
     ORDER BY s.created_at DESC`,
  );
  return rows;
}

async function findByTrackingNumber(trackingNumber) {
  const { rows } = await pool.query(
    `SELECT * FROM ${TABLE_NAME} WHERE tracking_number = $1`,
    [trackingNumber],
  );
  return rows[0] || null;
}

module.exports = {
  createTableSQL, create, findAll, findByTrackingNumber,
};
