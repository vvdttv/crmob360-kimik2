import { Request, Response, NextFunction } from 'express';
import { ProcessService } from '@/services/ProcessService';
import { AuthRequest } from '@/middleware/auth';
import { AppError } from '@/utils/AppError';

const processService = new ProcessService();

export class ProcessController {
  // Templates
  async listarTemplates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        tipo: req.query.tipo as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 20
      };

      const result = await processService.listarTemplates(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async buscarTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await processService.buscarTemplate(id);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async criarTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const template = await processService.criarTemplate(req.body, req.user.id);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  async atualizarTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await processService.atualizarTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async deletarTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await processService.deletarTemplate(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Processos
  async listarProcessos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        responsavel_id: req.query.responsavel_id as string,
        entidade_tipo: req.query.entidade_tipo as string,
        template_id: req.query.template_id as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 20
      };

      const result = await processService.listarProcessos(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async buscarProcesso(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const processo = await processService.buscarProcesso(id);
      res.json(processo);
    } catch (error) {
      next(error);
    }
  }

  async iniciarProcesso(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const processo = await processService.iniciarProcesso(req.body, req.user.id);
      res.status(201).json(processo);
    } catch (error) {
      next(error);
    }
  }

  async avancarProcesso(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const result = await processService.avancarProcesso(id, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async cancelarProcesso(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const { motivo } = req.body;

      const result = await processService.cancelarProcesso(id, motivo, req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Tarefas
  async listarTarefas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        processo_id: req.query.processo_id as string,
        atribuido_para: req.query.atribuido_para as string,
        status: req.query.status as string,
        prioridade: req.query.prioridade as string,
        prazo_vencido: req.query.prazo_vencido === 'true',
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 50
      };

      const result = await processService.listarTarefas(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async listarMinhasTarefas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        prioridade: req.query.prioridade as string
      };

      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const result = await processService.listarMinhasTarefas(req.user.id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async criarTarefa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const tarefa = await processService.criarTarefa(req.body, req.user.id);
      res.status(201).json(tarefa);
    } catch (error) {
      next(error);
    }
  }

  async atualizarTarefa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const tarefa = await processService.atualizarTarefa(id, req.body);
      res.json(tarefa);
    } catch (error) {
      next(error);
    }
  }

  async concluirTarefa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const tarefa = await processService.concluirTarefa(id, req.user.id);
      res.json(tarefa);
    } catch (error) {
      next(error);
    }
  }

  async deletarTarefa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await processService.deletarTarefa(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Dashboard
  async getProcessosDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await processService.getProcessosDashboard();
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  async getEficienciaProcessos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eficiencia = await processService.getEficienciaProcessos();
      res.json(eficiencia);
    } catch (error) {
      next(error);
    }
  }
}