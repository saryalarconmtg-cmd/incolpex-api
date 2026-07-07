import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginRequest } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function login(email, password) {
    const { token, usuario: usuarioLogueado } = await loginRequest(email, password);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));
    setUsuario(usuarioLogueado);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  const value = useMemo(() => ({ usuario, login, logout }), [usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
