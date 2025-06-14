import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/Dashboard';

// Componente de diseño que envuelve todas las rutas
const Layout = () => {
  return (
    <AuthProvider>
      <ConfigProvider>
        <Outlet />
      </ConfigProvider>
    </AuthProvider>
  );
};

// Componente de rutas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta raíz que usa el diseño */}
      <Route element={<Layout />}>
        {/* Rutas de autenticación */}
        <Route path="/auth/login" element={<LoginForm />} />
        <Route path="/auth/register" element={<RegisterForm />} />
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Ruta catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

// Componente principal de la aplicación
function App() {
  return <AppRoutes />;
}

export default App;