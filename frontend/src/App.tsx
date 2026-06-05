import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InscripcionesPage } from './pages/InscripcionesPage';
import { LegajoPage } from './pages/LegajoPage';
import { ConstanciasPage } from './pages/ConstanciasPage';
import { MateriasPage } from './pages/MateriasPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { PerfilPage } from './pages/PerfilPage';
import { GestionUsuariosPage } from './pages/GestionUsuariosPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Rutas de la app.
// /login es publica, el resto pasa por ProtectedRoute + AppLayout.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inscripciones" element={<InscripcionesPage />} />
            <Route path="/legajo" element={<LegajoPage />} />
            <Route path="/materias" element={<MateriasPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/constancias" element={<ConstanciasPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/usuarios" element={<GestionUsuariosPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
