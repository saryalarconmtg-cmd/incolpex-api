import { useEffect, useState } from 'react';
import { listarCotizaciones } from '../api/cotizaciones';
import FormularioCotizacion from '../components/FormularioCotizacion';
import TablaCotizaciones from '../components/TablaCotizaciones';

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  function cargar() {
    setCargando(true);
    listarCotizaciones()
      .then(setCotizaciones)
      .catch(() => setError('No se pudieron cargar las cotizaciones'))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
  }, []);

  function handleCreada(nueva) {
    setCotizaciones((prev) => [nueva, ...prev]);
  }

  function handleEstadoActualizado(actualizada) {
    setCotizaciones((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800">Cotizaciones</h1>

      <FormularioCotizacion onCreada={handleCreada} />

      {cargando && <p className="text-sm text-slate-500">Cargando cotizaciones...</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!cargando && !error && (
        <TablaCotizaciones cotizaciones={cotizaciones} onEstadoActualizado={handleEstadoActualizado} />
      )}
    </div>
  );
}
