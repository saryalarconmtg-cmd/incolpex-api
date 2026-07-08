const pool = require('../../config/database');

const TABLE_NAME = 'cotizaciones';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  const { insertId } = await pool.query(
    `INSERT INTO ${TABLE_NAME}
      (cliente_id, producto, cantidad, precio_unitario_china, shipping, margen_porcentaje, precio_final)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cliente_id, producto, cantidad, precio_unitario_china, shipping, margen_porcentaje, precio_final],
  );
  return findById(insertId);
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findAll() {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`);
  return rows;
}

async function actualizarEstado(id, estado) {
  const { affectedRows } = await pool.query(
    `UPDATE ${TABLE_NAME} SET estado = ?, updated_at = NOW() WHERE id = ?`,
    [estado, id],
  );
  if (affectedRows === 0) {
    return null;
  }
  return findById(id);
}

module.exports = {
  createTableSQL, create, findById, findAll, actualizarEstado,
};
