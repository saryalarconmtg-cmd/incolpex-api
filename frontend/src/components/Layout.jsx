import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/cotizaciones', label: 'Cotizaciones' },
  { to: '/ordenes', label: 'Órdenes' },
];

function navLinkClasses({ isActive }) {
  return [
    'block rounded px-3 py-2 text-sm font-medium',
    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-slate-800">Incolpex</span>

          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-slate-500">{usuario?.nombre}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Salir
            </button>
          </div>

          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto((v) => !v)}
            className="rounded p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {menuAbierto && (
          <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 sm:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClasses}
                onClick={() => setMenuAbierto(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-sm text-slate-500">{usuario?.nombre}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Salir
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
