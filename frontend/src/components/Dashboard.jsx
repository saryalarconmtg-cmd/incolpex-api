import { useEffect, useState } from 'react';
import { obtenerKPIs } from '../api/dashboard';

const formatoMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' });

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerKPIs()
      .then(setKpis)
      .catch(() => setError('No se pudieron cargar los KPIs'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando KPIs...</p>;
  }

  if (error) {
    return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  const tarjetas = [
    { titulo: 'Ventas del mes', valor: formatoMoneda.format(kpis.total_ventas_mes) },
    { titulo: 'Margen promedio', valor: `${kpis.margen_promedio.toFixed(1)}%` },
    { titulo: 'Órdenes pendientes', valor: kpis.ordenes_pendientes },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.titulo} className="rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{tarjeta.titulo}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-800">{tarjeta.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
