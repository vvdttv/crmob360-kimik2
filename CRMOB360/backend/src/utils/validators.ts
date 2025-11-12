export const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^\d{11}$/.test(cpf) === false) {
    return false;
  }
  
  if (cpf === '00000000000' || cpf === '11111111111' || 
      cpf === '22222222222' || cpf === '33333333333' || 
      cpf === '44444444444' || cpf === '55555555555' || 
      cpf === '66666666666' || cpf === '77777777777' || 
      cpf === '88888888888' || cpf === '99999999999') {
    return false;
  }
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.substring(9, 10))) {
    return false;
  }
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.substring(10, 11))) {
    return false;
  }
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) {
    return false;
  }
  
  if (cnpj === '00000000000000' || cnpj === '11111111111111' || 
      cnpj === '22222222222222' || cnpj === '33333333333333' || 
      cnpj === '44444444444444' || cnpj === '55555555555555' || 
      cnpj === '66666666666666' || cnpj === '77777777777777' || 
      cnpj === '88888888888888' || cnpj === '99999999999999') {
    return false;
  }
  
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  let digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }
  
  return true;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
};

export const formatCPF = (cpf: string): string => {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  cnpj = cnpj.replace(/[^\d]/g, '');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatPhone = (phone: string): string => {
  phone = phone.replace(/[^\d]/g, '');
  
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
};

export const generateCode = (prefix: string = '', length: number = 6): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

export const sanitizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .trim();
};

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};