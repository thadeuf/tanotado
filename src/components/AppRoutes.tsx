
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import PublicRoute from './PublicRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AdminDashboard from '../pages/AdminDashboard';
import Clients from '../pages/Clients';
import NewClient from '../pages/NewClient';
import ClientDetails from '../pages/ClientDetails';
import EditClient from '../pages/EditClient';
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

      {/* Rotas protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Rota do Admin */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        </ProtectedRoute>
      } />
      
      <Route path="/agenda" element={
        <ProtectedRoute>
          <div>Agenda (Em desenvolvimento)</div>
        </ProtectedRoute>
      } />
      <Route path="/clientes" element={
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      } />
      <Route path="/clientes/novo" element={
        <ProtectedRoute>
          <NewClient />
        </ProtectedRoute>
      } />
      <Route path="/clientes/:id" element={
        <ProtectedRoute>
          <ClientDetails />
        </ProtectedRoute>
      } />
      <Route path="/clientes/:id/editar" element={
        <ProtectedRoute>
          <EditClient />
        </ProtectedRoute>
      } />
      <Route path="/prontuarios" element={
        <ProtectedRoute>
          <div>Prontuários (Em desenvolvimento)</div>
        </ProtectedRoute>
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute>
          <div>Configurações (Em desenvolvimento)</div>
        </ProtectedRoute>
      } />

      {/* Redirecionamentos */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
