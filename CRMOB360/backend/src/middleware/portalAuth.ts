import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TokenPayload {
  clienteId: string;
  tipo: 'cliente' | 'proprietario';
}

/**
 * Middleware para autenticar requisições dos portais (cliente ou proprietário)
 */
export const portalAuth = (tipoPortal: 'cliente' | 'proprietario') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extrair token do header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token de autenticação não fornecido'
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verificar token JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as TokenPayload;

      // Verificar se o tipo do token corresponde ao portal
      if (decoded.tipo !== tipoPortal) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Token inválido para este portal.'
        });
      }

      // Verificar se a sessão está ativa
      const sessao = await prisma.portal_sessions.findFirst({
        where: {
          token_acesso: token,
          cliente_id: decoded.clienteId,
          tipo_portal: tipoPortal,
          ativo: true,
          expira_em: {
            gte: new Date()
          }
        }
      });

      if (!sessao) {
        return res.status(401).json({
          success: false,
          message: 'Sessão expirada ou inválida. Faça login novamente.'
        });
      }

      // Atualizar último acesso
      await prisma.portal_sessions.update({
        where: { id: sessao.id },
        data: { ultimo_acesso: new Date() }
      });

      // Adicionar clienteId ao request
      (req as any).clienteId = decoded.clienteId;
      (req as any).tipoPortal = tipoPortal;

      next();
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado. Faça login novamente.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro na autenticação'
      });
    }
  };
};

/**
 * Middleware específico para portal do cliente
 */
export const clienteAuth = portalAuth('cliente');

/**
 * Middleware específico para portal do proprietário
 */
export const proprietarioAuth = portalAuth('proprietario');
