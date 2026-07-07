import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import CotizacionesPage from './pages/CotizacionesPage';
import CotizacionDetallePage from './pages/CotizacionDetallePage';
import OrdenesPage from './pages/OrdenesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/cotizaciones" element={<CotizacionesPage />} />
              <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
              <Route path="/ordenes" element={<OrdenesPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
