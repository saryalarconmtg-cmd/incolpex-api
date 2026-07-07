import { useState } from 'react';
import { crearCotizacion } from '../api/cotizaciones';

const FORM_INICIAL = {
  cliente_id: '',
  producto: '',
  cantidad: '',
  precio_unitario_china: '',
  margen_porcentaje: '',
};

export default function FormularioCotizacion({ onCreada }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  function handleChange(campo) {
    return (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      const cotizacion = await crearCotizacion({
        cliente_id: Number(form.cliente_id),
        producto: form.producto,
        cantidad: Number(form.cantidad),
        precio_unitario_china: Number(form.precio_unitario_china),
        margen_porcentaje: Number(form.margen_porcentaje),
      });
      setForm(FORM_INICIAL);
      onCreada?.(cotizacion);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cotización');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Nueva cotización</h2>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="cliente_id">
            Cliente ID
          </label>
          <input
            id="cliente_id"
            type="number"
            required
            value={form.cliente_id}
            onChange={handleChange('cliente_id')}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="producto">
            Producto
          </label>
          <input
            id="producto"
            type="text"
            required
            value={form.producto}
            onChange={handleChange('producto')}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="cantidad">
            Cantidad
          </label>
          <input
            id="cantidad"
            type="number"
            min="1"
            required
            value={form.cantidad}
            onChange={handleChange('cantidad')}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="precio_unitario_china">
            Precio unitario en China (USD)
          </label>
          <input
            id="precio_unitario_china"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.precio_unitario_china}
            onChange={handleChange('precio_unitario_china')}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600" htmlFor="margen_porcentaje">
            Margen (%)
          </label>
          <input
            id="margen_porcentaje"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.margen_porcentaje}
            onChange={handleChange('margen_porcentaje')}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {enviando ? 'Creando...' : 'Crear cotización'}
      </button>
    </form>
  );
}
