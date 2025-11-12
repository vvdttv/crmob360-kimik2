import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '@/utils/AppError';
import prisma from '@/config/database';
import { AuthRequest } from '@/middleware/auth';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        throw new AppError('Email e senha são obrigatórios', 400);
      }

      // Buscar usuário
      const usuario = await prisma.usuarios.findUnique({
        where: { email },
        include: {
          usuario_perfis: {
            include: {
              perfil: true
            }
          }
        }
      });

      if (!usuario || !usuario.ativo) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Gerar tokens
      const tokens = this.gerarTokens(usuario);

      // Atualizar último acesso
      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { ultimo_acesso: new Date() }
      });

      res.json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo_usuario,
          avatar_url: usuario.avatar_url
        },
        tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError('Refresh token é obrigatório', 400);
      }

      const secret = process.env.JWT_REFRESH_SECRET;
      if (!secret) {
        throw new AppError('Chave secreta não configurada', 500);
      }

      // Verificar refresh token
      const decoded = jwt.verify(refresh_token, secret) as any;

      // Buscar usuário
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
        include: {
          usuario_perfis: {
            include: {
              perfil: true
            }
          }
        }
      });

      if (!usuario || !usuario.ativo) {
        throw new AppError('Usuário inválido', 401);
      }

      // Gerar novos tokens
      const tokens = this.gerarTokens(usuario);

      res.json(tokens);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new AppError('Refresh token expirado', 401));
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AppError('Refresh token inválido', 401));
      }
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Em produção, invalidar tokens no banco ou cache
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id },
        include: {
          usuario_perfis: {
            include: {
              perfil: true
            }
          }
        }
      });

      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }

      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo_usuario,
        avatar_url: usuario.avatar_url,
        permissoes: req.user.permissions,
        ultimo_acesso: usuario.ultimo_acesso
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { nome, telefone } = req.body;

      const usuario = await prisma.usuarios.update({
        where: { id: req.user.id },
        data: {
          nome,
          telefone
        }
      });

      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        avatar_url: usuario.avatar_url
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { senha_atual, nova_senha } = req.body;

      if (!senha_atual || !nova_senha) {
        throw new AppError('Senha atual e nova senha são obrigatórias', 400);
      }

      // Buscar usuário com senha
      const usuario = await prisma.usuarios.findUnique({
        where: { id: req.user.id }
      });

      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
      if (!senhaValida) {
        throw new AppError('Senha atual incorreta', 400);
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(nova_senha, 12);

      // Atualizar senha
      await prisma.usuarios.update({
        where: { id: req.user.id },
        data: { senha_hash: novaSenhaHash }
      });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  private gerarTokens(usuario: any) {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!secret || !refreshSecret) {
      throw new AppError('Chaves secretas não configuradas', 500);
    }

    // Extrair permissões
    const permissions: string[] = [];
    usuario.usuario_perfis.forEach((up: any) => {
      if (up.perfil.permissoes && Array.isArray(up.perfil.permissoes)) {
        permissions.push(...up.perfil.permissoes);
      }
    });

    const payload = {
      userId: usuario.id,
      email: usuario.email,
      type: usuario.tipo_usuario,
      permissions: [...new Set(permissions)]
    };

    const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600 // 1 hora em segundos
    };
  }
}