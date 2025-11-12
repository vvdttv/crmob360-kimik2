import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          error: 'Conflito',
          message: 'Registro duplicado',
          details: error.meta
        });
        break;
      case 'P2025':
        res.status(404).json({
          error: 'Não encontrado',
          message: 'Registro não encontrado'
        });
        break;
      case 'P2003':
        res.status(400).json({
          error: 'Violação de chave estrangeira',
          message: 'Registro referenciado não existe'
        });
        break;
      default:
        res.status(400).json({
          error: 'Erro no banco de dados',
          message: error.message,
          code: error.code
        });
    }
    return;
  }

  // Erros de validação Zod
  if (error.name === 'ZodError') {
    res.status(422).json({
      error: 'Validação falhou',
      message: 'Dados inválidos',
      details: error.errors
    });
    return;
  }

  // AppError (erros controlados)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    });
    return;
  }

  // Erros JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Token expirado',
      message: 'Token de autenticação expirado'
    });
    return;
  }

  // Erro de limite de arquivo
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: 'Arquivo muito grande',
      message: 'O arquivo enviado excede o limite permitido'
    });
    return;
  }

  // Erros de multer
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      error: 'Arquivo inválido',
      message: 'Tipo de arquivo não esperado'
    });
    return;
  }

  // Erro genérico (não expor detalhes em produção)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: isDevelopment ? error.message : 'Ocorreu um erro inesperado',
    ...(isDevelopment && { stack: error.stack })
  });
};