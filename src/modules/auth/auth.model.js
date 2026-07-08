const pool = require('../../config/database');

const TABLE_NAME = 'users';

const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

async function create({ nombre, email, password_hash }) {
  const { insertId } = await pool.query(
    `INSERT INTO ${TABLE_NAME} (nombre, email, password_hash) VALUES (?, ?, ?)`,
    [nombre, email, password_hash],
  );
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol, created_at FROM ${TABLE_NAME} WHERE id = ?`,
    [insertId],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query(`SELECT * FROM ${TABLE_NAME} WHERE email = ?`, [email]);
  return rows[0] || null;
}

module.exports = { createTableSQL, create, findByEmail };
