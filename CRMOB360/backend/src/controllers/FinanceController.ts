import { Request, Response, NextFunction } from 'express';
import { FinanceService } from '@/services/FinanceService';
import { AuthRequest } from '@/middleware/auth';
import { AppError } from '@/utils/AppError';

const financeService = new FinanceService();

export class FinanceController {
  // Contas
  async listarContas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        tipo: req.query.tipo as string,
        status: req.query.status as string,
        plano_conta_id: req.query.plano_conta_id as string,
        centro_custo_id: req.query.centro_custo_id as string,
        cliente_id: req.query.cliente_id as string,
        data_inicio: req.query.data_inicio as string,
        data_fim: req.query.data_fim as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 50
      };

      const result = await financeService.listarContas(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async buscarConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const conta = await financeService.buscarConta(id);
      res.json(conta);
    } catch (error) {
      next(error);
    }
  }

  async criarConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const conta = await financeService.criarConta(req.body, req.user.id);
      res.status(201).json(conta);
    } catch (error) {
      next(error);
    }
  }

  async atualizarConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const conta = await financeService.atualizarConta(id, req.body);
      res.json(conta);
    } catch (error) {
      next(error);
    }
  }

  async baixarConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { valor_pago, data_pagamento } = req.body;

      const conta = await financeService.baixarConta(id, valor_pago, data_pagamento);
      res.json(conta);
    } catch (error) {
      next(error);
    }
  }

  async deletarConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await financeService.deletarConta(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Plano de Contas
  async listarPlanoContas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const planoContas = await financeService.listarPlanoContas();
      res.json(planoContas);
    } catch (error) {
      next(error);
    }
  }

  async criarPlanoConta(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const planoConta = await financeService.criarPlanoConta(req.body);
      res.status(201).json(planoConta);
    } catch (error) {
      next(error);
    }
  }

  // Centros de Custo
  async listarCentrosCusto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const centrosCusto = await financeService.listarCentrosCusto();
      res.json(centrosCusto);
    } catch (error) {
      next(error);
    }
  }

  async criarCentroCusto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const centroCusto = await financeService.criarCentroCusto(req.body);
      res.status(201).json(centroCusto);
    } catch (error) {
      next(error);
    }
  }

  // Comissões
  async listarComissoes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        corretor_id: req.query.corretor_id as string,
        status: req.query.status as string,
        mes_referencia: req.query.mes_referencia as string,
        skip: parseInt(req.query.skip as string) || 0,
        take: parseInt(req.query.take as string) || 20
      };

      const result = await financeService.listarComissoes(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async calcularComissao(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Usuário não autenticado', 401);
      }

      const comissao = await financeService.calcularComissao(req.body, req.user.id);
      res.status(201).json(comissao);
    } catch (error) {
      next(error);
    }
  }

  // DRE
  async gerarDRE(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const mes = parseInt(req.query.mes as string);
      const ano = parseInt(req.query.ano as string);

      if (!mes || !ano) {
        throw new AppError('Mês e ano são obrigatórios', 400);
      }

      const dre = await financeService.gerarDRE(mes, ano);
      res.json(dre);
    } catch (error) {
      next(error);
    }
  }

  // Relatórios
  async getInadimplencia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inadimplencia = await financeService.getInadimplencia();
      res.json(inadimplencia);
    } catch (error) {
      next(error);
    }
  }

  async getRecebimentosPrevistos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        data_inicio: req.query.data_inicio as string,
        data_fim: req.query.data_fim as string
      };

      const result = await financeService.getRecebimentosPrevistos(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}