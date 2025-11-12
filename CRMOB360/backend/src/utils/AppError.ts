export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',
  ACCESS_DENIED: 'Acesso negado',
  
  // Resource errors
  NOT_FOUND: 'Recurso não encontrado',
  ALREADY_EXISTS: 'Recurso já existe',
  
  // Business logic errors
  INVALID_STATUS_TRANSITION: 'Transição de status inválida',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
  OPERATION_NOT_ALLOWED: 'Operação não permitida',
  
  // Validation errors
  VALIDATION_FAILED: 'Validação falhou',
  INVALID_EMAIL: 'Email inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'Erro em serviço externo',
  WHATSAPP_ERROR: 'Erro no serviço WhatsApp',
  EMAIL_ERROR: 'Erro no serviço de email',
  
  // Financial errors
  INVALID_PAYMENT: 'Pagamento inválido',
  COMMISSION_ERROR: 'Erro no cálculo de comissão',
  
  // LGPD/Compliance errors
  CONSENT_REQUIRED: 'Consentimento necessário',
  DATA_PROTECTION_ERROR: 'Erro de proteção de dados',
};