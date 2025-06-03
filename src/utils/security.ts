
import DOMPurify from 'dompurify';

// Input sanitization
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

export const sanitizeText = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
};

// Password security validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} => {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score
  };
};

// Generic error message for production
export const getGenericErrorMessage = (error: any): string => {
  // In development, show detailed errors
  if (process.env.NODE_ENV === 'development') {
    return error?.message || 'Erro desconhecido';
  }
  
  // In production, show generic messages
  if (error?.message?.includes('não autenticado')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  
  if (error?.message?.includes('permissão')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  return 'Ocorreu um erro inesperado. Tente novamente.';
};

// Session timeout utility
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const isSessionExpired = (lastActivity: Date): boolean => {
  return Date.now() - lastActivity.getTime() > SESSION_TIMEOUT;
};

// Input validation for common fields
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(cleanCPF.charAt(10));
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};
