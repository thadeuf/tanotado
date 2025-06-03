
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSessionManager } from '../hooks/useSessionManager';
import DashboardStats from '../components/dashboard/DashboardStats';
import AppointmentsSection from '../components/dashboard/AppointmentsSection';
import BirthdaysSection from '../components/dashboard/BirthdaysSection';
import SubscriptionBanner from '../components/dashboard/SubscriptionBanner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize session management
  useSessionManager();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-tanotado-navy">
          Bem-vindo, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo do seu dia
        </p>
      </div>

      <SubscriptionBanner />

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <AppointmentsSection />
        </div>
        <div className="lg:col-span-2">
          <BirthdaysSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
