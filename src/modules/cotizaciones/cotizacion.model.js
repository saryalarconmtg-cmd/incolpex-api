const pool = require('../../config/database');

const TABLE_NAME = 'cotizaciones';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL,
  producto VARCHAR(255) NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario_china NUMERIC(12,2) NOT NULL,
  shipping NUMERIC(12,2) NOT NULL,
  margen_porcentaje NUMERIC(5,2) NOT NULL,
  precio_final NUMERIC(12,2) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function create({
  cliente_id,
  producto,
  cantidad,
  precio_unitario_china,
  shipping,
  margen_porcentaje,
  precio_final,
}) {
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME}
      (cliente_id, producto, cantidad, precio_unitario_china, shipping, margen_porcentaje, precio_final)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [cliente_id, producto, cantidad, precio_unitario_china, shipping, margen_porcentaje, precio_final],
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findAll() {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`);
  return rows;
}

async function actualizarEstado(id, estado) {
  const { rows } = await pool.query(
    `UPDATE ${TABLE_NAME} SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [estado, id],
  );
  return rows[0] || null;
}

module.exports = {
  createTableSQL, create, findById, findAll, actualizarEstado,
};
