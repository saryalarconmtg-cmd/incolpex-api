import { useState } from 'react';
import { Link } from 'react-router-dom';
import { actualizarEstadoCotizacion } from '../api/cotizaciones';
import EstadoBadge from './EstadoBadge';

export default function TablaCotizaciones({ cotizaciones, onEstadoActualizado }) {
  const [actualizandoId, setActualizandoId] = useState(null);

  async function cambiarEstado(id, estado) {
    setActualizandoId(id);
    try {
      const actualizada = await actualizarEstadoCotizacion(id, estado);
      onEstadoActualizado?.(actualizada);
    } finally {
      setActualizandoId(null);
    }
  }

  if (cotizaciones.length === 0) {
    return <p className="text-sm text-slate-500">No hay cotizaciones todavía.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Cantidad</th>
            <th className="px-4 py-3">Precio final</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cotizaciones.map((cotizacion) => (
            <tr key={cotizacion.id}>
              <td className="px-4 py-3">
                <Link to={`/cotizaciones/${cotizacion.id}`} className="text-indigo-600 hover:underline">
                  {cotizacion.producto}
                </Link>
              </td>
              <td className="px-4 py-3">{cotizacion.cantidad}</td>
              <td className="px-4 py-3">${cotizacion.precio_final}</td>
              <td className="px-4 py-3">
                <EstadoBadge estado={cotizacion.estado} />
              </td>
              <td className="px-4 py-3">
                {cotizacion.estado === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={actualizandoId === cotizacion.id}
                      onClick={() => cambiarEstado(cotizacion.id, 'accepted')}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      disabled={actualizandoId === cotizacion.id}
                      onClick={() => cambiarEstado(cotizacion.id, 'rejected')}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
