import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InscripcionesPage } from './pages/InscripcionesPage';
import { LegajoPage } from './pages/LegajoPage';
import { ConstanciasPage } from './pages/ConstanciasPage';
import { MateriasPage } from './pages/MateriasPage';
import { MateriaForoPage } from './pages/MateriaForoPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { PerfilPage } from './pages/PerfilPage';
import { GestionUsuariosPage } from './pages/GestionUsuariosPage';
import { MisMateriasPage } from './pages/MisMateriasPage';
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
            <Route path="/materias/:materiaId" element={<MateriaForoPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/constancias" element={<ConstanciasPage />} />
            <Route path="/perfil" element={<PerfilPage />} />

            {/* Gestión de usuarios: solo staff administrativo */}
            <Route
              path="/usuarios"
              element={
                <RoleRoute allow={['SUPERADMIN', 'ADMINISTRACION']}>
                  <GestionUsuariosPage />
                </RoleRoute>
              }
            />
            {/* Panel del docente */}
            <Route
              path="/mis-materias"
              element={
                <RoleRoute allow={['DOCENTE', 'SUPERADMIN']}>
                  <MisMateriasPage />
                </RoleRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
