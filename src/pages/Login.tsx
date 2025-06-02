
import React from 'react';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';

const Login: React.FC = () => {
  return (
    <AuthLayout 
      title="Bem-vindo de volta!" 
      subtitle="Entre na sua conta para acessar sua agenda"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
