export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(dateObj);
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length === 14) {
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
};

export const formatCEP = (cep: string): string => {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};

export const formatArea = (area: number): string => {
  return `${formatNumber(area)}m²`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d atrás`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}m atrás`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}a atrás`;
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export const generateCode = (prefix: string = '', length: number = 6): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  if (cleanCPF === '00000000000' || cleanCPF === '11111111111' || 
      cleanCPF === '22222222222' || cleanCPF === '33333333333' || 
      cleanCPF === '44444444444' || cleanCPF === '55555555555' || 
      cleanCPF === '66666666666' || cleanCPF === '77777777777' || 
      cleanCPF === '88888888888' || cleanCPF === '99999999999') {
    return false;
  }
  
  // Validação do dígito verificador
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return false;
  }
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return false;
  }
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    return false;
  }
  
  if (cleanCNPJ === '00000000000000' || cleanCNPJ === '11111111111111' || 
      cleanCNPJ === '22222222222222' || cleanCNPJ === '33333333333333' || 
      cleanCNPJ === '44444444444444' || cleanCNPJ === '55555555555555' || 
      cleanCNPJ === '66666666666666' || cleanCNPJ === '77777777777777' || 
      cleanCNPJ === '88888888888888' || cleanCNPJ === '99999999999999') {
    return false;
  }
  
  // Validação do dígito verificador
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  let digits = cleanCNPJ.substring(length);
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
  numbers = cleanCNPJ.substring(0, length);
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