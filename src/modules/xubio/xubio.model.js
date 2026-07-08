const pool = require('../../config/database');

const TABLE_NAME = 'xubio_movimientos';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id INT AUTO_INCREMENT PRIMARY KEY,
  xubio_id VARCHAR(100) NOT NULL UNIQUE,
  tipo VARCHAR(50),
  monto NUMERIC(14,2),
  fecha DATE,
  datos JSON,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function upsertMovimiento({
  xubio_id, tipo, monto, fecha, datos,
}) {
  await pool.query(
    `INSERT INTO ${TABLE_NAME} (xubio_id, tipo, monto, fecha, datos)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       tipo = VALUES(tipo),
       monto = VALUES(monto),
       fecha = VALUES(fecha),
       datos = VALUES(datos),
       updated_at = NOW()`,
    [xubio_id, tipo, monto, fecha, JSON.stringify(datos)],
  );
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE xubio_id = ?`, [xubio_id]);
  return rows[0];
}

module.exports = { createTableSQL, upsertMovimiento };
