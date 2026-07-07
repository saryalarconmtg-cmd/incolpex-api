import { useEffect, useState } from 'react';
import { listarShipments } from '../api/fedex';

export default function TablaOrdenes() {
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarShipments()
      .then(setShipments)
      .catch(() => setError('No se pudieron cargar las órdenes'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando órdenes...</p>;
  }

  if (error) {
    return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (shipments.length === 0) {
    return <p className="text-sm text-slate-500">No hay órdenes confirmadas con envío todavía.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Peso</th>
            <th className="px-4 py-3">Tracking FedEx</th>
            <th className="px-4 py-3">Etiqueta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td className="px-4 py-3">{shipment.producto}</td>
              <td className="px-4 py-3">{shipment.peso} kg</td>
              <td className="px-4 py-3 font-mono text-xs">{shipment.tracking_number}</td>
              <td className="px-4 py-3">
                {shipment.etiqueta_url ? (
                  <a
                    href={shipment.etiqueta_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Ver etiqueta
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
