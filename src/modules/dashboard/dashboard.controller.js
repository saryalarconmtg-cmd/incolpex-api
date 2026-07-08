const pool = require('../../config/database');

async function obtenerKPIs(req, res) {
  try {
    const ventasMes = await pool.query(
      `SELECT COALESCE(SUM(precio_final), 0) AS total
       FROM cotizaciones
       WHERE estado = 'accepted'
         AND YEAR(created_at) = YEAR(NOW())
         AND MONTH(created_at) = MONTH(NOW())`,
    );
    const margenPromedio = await pool.query(
      `SELECT COALESCE(AVG(margen_porcentaje), 0) AS promedio
       FROM cotizaciones
       WHERE estado = 'accepted'`,
    );
    const ordenesPendientes = await pool.query(
      'SELECT COUNT(*) AS total FROM cotizaciones WHERE estado = ?',
      ['pending'],
    );

    return res.status(200).json({
      total_ventas_mes: Number(ventasMes.rows[0].total),
      margen_promedio: Number(margenPromedio.rows[0].promedio),
      ordenes_pendientes: Number(ordenesPendientes.rows[0].total),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los KPIs' });
  }
}

module.exports = { obtenerKPIs };
