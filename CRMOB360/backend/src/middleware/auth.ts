import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/AppError';
import prisma from '@/config/database';

interface TokenPayload {
  userId: string;
  email: string;
  type: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    type: string;
    permissions?: string[];
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token não fornecido', 401);
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AppError('Token inválido', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('Chave secreta não configurada', 500);
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Buscar usuário no banco
    const user = await prisma.usuarios.findUnique({
      where: { id: decoded.userId },
      include: {
        usuario_perfis: {
          include: {
            perfil: true
          }
        }
      }
    });

    if (!user || !user.ativo) {
      throw new AppError('Usuário não encontrado ou inativo', 401);
    }

    // Extrair permissões do usuário
    const permissions: string[] = [];
    user.usuario_perfis.forEach(up => {
      if (up.perfil.permissoes && Array.isArray(up.perfil.permissoes)) {
        permissions.push(...up.perfil.permissoes);
      }
    });

    req.user = {
      id: user.id,
      email: user.email,
      type: user.tipo_usuario,
      permissions: [...new Set(permissions)] // Remove duplicatas
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expirado', 401));
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token inválido', 401));
    }
    
    next(error);
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }

    const hasPermission = req.user.permissions?.includes(permission) || 
                         req.user.type === 'admin';

    if (!hasPermission) {
      return next(new AppError('Permissão insuficiente', 403));
    }

    next();
  };
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }

    const hasRole = roles.includes(req.user.type) || req.user.type === 'admin';

    if (!hasRole) {
      return next(new AppError('Função não autorizada', 403));
    }

    next();
  };
};

// Middleware para verificar LGPD consent
export const requireLGPDConsent = (consentType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado', 401));
    }

    try {
      // Buscar último consentimento do usuário
      const lastConsent = await prisma.log_consentimento_lgpd.findFirst({
        where: {
          id_cliente: req.user.id,
          [`permissao_${consentType}`]: true
        },
        orderBy: {
          timestamp_consentimento: 'desc'
        }
      });

      if (!lastConsent) {
        return next(new AppError(`Consentimento ${consentType} necessário`, 403));
      }

      next();
    } catch (error) {
      next(new AppError('Erro ao verificar consentimento LGPD', 500));
    }
  };
};

// Middleware para rate limiting
export const createRateLimiter = (windowMs: number, max: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpar requests antigos
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < now) {
        requests.delete(key);
      }
    }

    const currentRequest = requests.get(ip);

    if (!currentRequest || currentRequest.resetTime < now) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (currentRequest.count >= max) {
      const retryAfter = Math.ceil((currentRequest.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return next(new AppError('Muitas requisições', 429));
    }

    currentRequest.count++;
    next();
  };
};