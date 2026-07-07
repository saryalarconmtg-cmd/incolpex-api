import TablaOrdenes from '../components/TablaOrdenes';

export default function OrdenesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-800">Órdenes confirmadas</h1>
      <TablaOrdenes />
    </div>
  );
}
