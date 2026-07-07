const pool = require('../../config/database');

const TABLE_NAME = 'clientes';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function create({ nombre, telefono, email }) {
  const { rows } = await pool.query(
    `INSERT INTO ${TABLE_NAME} (nombre, telefono, email) VALUES ($1, $2, $3) RETURNING *`,
    [nombre, telefono || null, email || null],
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByTelefono(telefono) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE telefono = $1`, [telefono]);
  return rows[0] || null;
}

module.exports = {
  createTableSQL, create, findById, findByTelefono,
};
