import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import PublicRoute from './PublicRoute';
import AppLayout from './AppLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import Clients from '../pages/Clients';
import NewClient from '../pages/NewClient';
import EditClient from '../pages/EditClient';
import Agenda from '../pages/Agenda';
import Financial from '../pages/Financial';
import NotFound from '../pages/NotFound';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Rotas protegidas com layout */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Rota do Admin */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/clientes/novo" element={<NewClient />} />
              <Route path="/clientes/:id/editar" element={<EditClient />} />
              <Route path="/prontuarios" element={
                <div>Prontuários (Em desenvolvimento)</div>
              } />
              <Route path="/configuracoes" element={
                <div>Configurações (Em desenvolvimento)</div>
              } />
              <Route path="/financeiro" element={<Financial />} />

              {/* Redirecionamentos */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;
