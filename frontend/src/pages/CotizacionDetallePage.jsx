import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerCotizacion } from '../api/cotizaciones';
import VistaCotizacion from '../components/VistaCotizacion';

export default function CotizacionDetallePage() {
  const { id } = useParams();
  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    obtenerCotizacion(id)
      .then(setCotizacion)
      .catch((err) => setError(err.response?.data?.error || 'No se pudo cargar la cotización'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando cotización...</p>;
  }

  if (error) {
    return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  return <VistaCotizacion cotizacion={cotizacion} />;
}
