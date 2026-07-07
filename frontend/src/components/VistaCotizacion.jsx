import { Link } from 'react-router-dom';
import EstadoBadge from './EstadoBadge';

const CAMPOS = [
  { clave: 'cliente_id', etiqueta: 'Cliente ID' },
  { clave: 'producto', etiqueta: 'Producto' },
  { clave: 'cantidad', etiqueta: 'Cantidad' },
  { clave: 'precio_unitario_china', etiqueta: 'Precio unitario en China' },
  { clave: 'shipping', etiqueta: 'Shipping' },
  { clave: 'margen_porcentaje', etiqueta: 'Margen (%)' },
  { clave: 'precio_final', etiqueta: 'Precio final' },
];

export default function VistaCotizacion({ cotizacion }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">
          Cotización #{cotizacion.id}
        </h1>
        <EstadoBadge estado={cotizacion.estado} />
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAMPOS.map(({ clave, etiqueta }) => (
          <div key={clave}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{etiqueta}</dt>
            <dd className="text-sm font-medium text-slate-800">{cotizacion[clave]}</dd>
          </div>
        ))}
      </dl>

      <Link to="/cotizaciones" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
        ← Volver a cotizaciones
      </Link>
    </div>
  );
}
