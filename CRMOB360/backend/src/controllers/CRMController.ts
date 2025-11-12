import { Request, Response, NextFunction } from 'express';
import { CRMService } from '@/services/CRMService';
import { AuthRequest } from '@/middleware/auth';
import { AppError } from '@/utils/AppError';

const crmService = new CRMService();

export class CRMController {
  // Clientes
  async listarClientes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        responsavel_id: req.query.responsavel_id as string,
        search: req.query.search as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 20
      };

      const result = await crmService.listarClientes(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async buscarCliente(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cliente = await crmService.buscarCliente(id);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async criarCliente(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const cliente = await crmService.criarCliente(req.body, req.user.id);
      res.status(201).json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async atualizarCliente(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cliente = await crmService.atualizarCliente(id, req.body);
      res.json(cliente);
    } catch (error) {
      next(error);
    }
  }

  async deletarCliente(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await crmService.deletarCliente(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Pipeline
  async listarPipeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        funil_id: req.query.funil_id as string,
        etapa: req.query.etapa as string
      };

      const result = await crmService.listarPipeline(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async moverLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { lead_id, nova_etapa, motivo } = req.body;
      
      const result = await crmService.moverLead(
        lead_id, 
        nova_etapa, 
        req.user.id,
        motivo
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Atividades
  async listarAtividades(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clienteId = req.params.id;
      const filters = {
        tipo: req.query.tipo as string,
        realizado_por: req.query.realizado_por as string,
        data_inicio: req.query.data_inicio as string,
        data_fim: req.query.data_fim as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 50
      };

      const result = await crmService.listarAtividades(clienteId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async criarAtividade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const atividade = await crmService.criarAtividade({
        ...req.body,
        realizado_por: req.user.id
      });
      
      res.status(201).json(atividade);
    } catch (error) {
      next(error);
    }
  }

  // Funis
  async listarFunis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const funis = await crmService.listarFunis();
      res.json(funis);
    } catch (error) {
      next(error);
    }
  }

  async criarFunil(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const funil = await crmService.criarFunil(req.body);
      res.status(201).json(funil);
    } catch (error) {
      next(error);
    }
  }

  // Dashboard
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const userId = req.user.type === 'corretor' ? req.user.id : undefined;
      const dashboard = await crmService.getDashboardData(userId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
}