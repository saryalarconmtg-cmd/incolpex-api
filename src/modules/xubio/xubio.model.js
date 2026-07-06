const pool = require('../../config/database');

const TABLE_NAME = 'xubio_movimientos';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id SERIAL PRIMARY KEY,
  xubio_id VARCHAR(100) NOT NULL UNIQUE,
  tipo VARCHAR(50),
  monto NUMERIC(14,2),
  fecha DATE,
  datos JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function upsertMovimiento({
  xubio_id, tipo, monto, fecha, datos,
}) {
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME} (xubio_id, tipo, monto, fecha, datos)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (xubio_id) DO UPDATE SET
       tipo = EXCLUDED.tipo,
       monto = EXCLUDED.monto,
       fecha = EXCLUDED.fecha,
       datos = EXCLUDED.datos,
       updated_at = NOW()
     RETURNING *`,
    [xubio_id, tipo, monto, fecha, JSON.stringify(datos)],
  );
  return rows[0];
}

module.exports = { createTableSQL, upsertMovimiento };
