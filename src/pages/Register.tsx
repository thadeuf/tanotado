
import React from 'react';
import AuthLayout from '../components/AuthLayout';
import RegisterForm from '../components/RegisterForm';

const Register: React.FC = () => {
  return (
    <AuthLayout 
      title="Comece seu teste gratuito" 
      subtitle="7 dias grátis para experimentar todos os recursos"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
