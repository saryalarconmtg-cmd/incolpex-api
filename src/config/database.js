const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// mysql2 returns [rows, fields] for SELECT and [ResultSetHeader, fields] for
// INSERT/UPDATE/DELETE. Normalizing to { rows, insertId, affectedRows } lets
// every model keep the same `const { rows } = await pool.query(...)` shape
// pg used, since MySQL has no RETURNING clause and models fetch the row back
// (by insertId or a natural key) after writing.
async function query(sql, params) {
  const [result] = await pool.query(sql, params);

  if (Array.isArray(result)) {
    return { rows: result };
  }

  return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows };
}

async function end() {
  await pool.end();
}

module.exports = { query, end };
