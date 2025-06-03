
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { validatePasswordStrength } from '@/utils/security';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const { score, errors, isValid } = validatePasswordStrength(password);
  
  const getStrengthText = (score: number): string => {
    if (score <= 1) return 'Muito fraca';
    if (score <= 2) return 'Fraca';
    if (score <= 3) return 'Média';
    if (score <= 4) return 'Forte';
    return 'Muito forte';
  };
  
  const getStrengthColor = (score: number): string => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Força da senha:</span>
        <span className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {getStrengthText(score)}
        </span>
      </div>
      
      <Progress 
        value={(score / 5) * 100} 
        className="h-2"
      />
      
      {errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-1">
          {errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrength;
