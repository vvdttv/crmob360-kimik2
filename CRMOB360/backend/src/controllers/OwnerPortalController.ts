import { Request, Response } from 'express';
import OwnerPortalService from '../services/OwnerPortalService';
import { z } from 'zod';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export class OwnerPortalController {
  /**
   * POST /api/portal-proprietario/login
   * Login do proprietário no portal
   */
  async login(req: Request, res: Response) {
    try {
      const dados = loginSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const resultado = await OwnerPortalService.login(dados, ip, userAgent);

      res.json({
        success: true,
        data: resultado
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Erro ao realizar login'
      });
    }
  }

  /**
   * POST /api/portal-proprietario/logout
   * Logout do proprietário
   */
  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token não fornecido'
        });
      }

      await OwnerPortalService.logout(token);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao realizar logout'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/dashboard
   * Dashboard do proprietário
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;

      const dashboard = await OwnerPortalService.getDashboard(proprietarioId);

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao carregar dashboard'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/imoveis
   * Listar imóveis do proprietário
   */
  async listarImoveis(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const filtros = req.query;

      const imoveis = await OwnerPortalService.listarImoveis(proprietarioId, filtros);

      res.json({
        success: true,
        data: imoveis,
        total: imoveis.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar imóveis'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/imoveis/:id
   * Detalhes de um imóvel
   */
  async getImovelDetalhes(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { id } = req.params;

      const imovel = await OwnerPortalService.getImovelDetalhes(proprietarioId, id);

      res.json({
        success: true,
        data: imovel
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Imóvel não encontrado'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/propostas
   * Listar propostas recebidas
   */
  async listarPropostas(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { status } = req.query;

      const propostas = await OwnerPortalService.listarPropostas(
        proprietarioId,
        status as string
      );

      res.json({
        success: true,
        data: propostas,
        total: propostas.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar propostas'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/propostas/:id
   * Detalhes de uma proposta
   */
  async getPropostaDetalhes(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { id } = req.params;

      const proposta = await OwnerPortalService.getPropostaDetalhes(proprietarioId, id);

      res.json({
        success: true,
        data: proposta
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Proposta não encontrada'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/visitas
   * Listar visitas agendadas
   */
  async listarVisitas(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { status } = req.query;

      const visitas = await OwnerPortalService.listarVisitas(
        proprietarioId,
        status as string
      );

      res.json({
        success: true,
        data: visitas,
        total: visitas.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar visitas'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/financeiro
   * Relatório financeiro
   */
  async getRelatorioFinanceiro(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { data_inicio, data_fim } = req.query;

      const relatorio = await OwnerPortalService.getRelatorioFinanceiro(
        proprietarioId,
        data_inicio as string,
        data_fim as string
      );

      res.json({
        success: true,
        data: relatorio
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar relatório financeiro'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/contratos
   * Listar contratos
   */
  async listarContratos(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { status } = req.query;

      const contratos = await OwnerPortalService.listarContratos(
        proprietarioId,
        status as string
      );

      res.json({
        success: true,
        data: contratos,
        total: contratos.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar contratos'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/contratos/:id
   * Detalhes de um contrato
   */
  async getContratoDetalhes(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { id } = req.params;

      const contrato = await OwnerPortalService.getContratoDetalhes(proprietarioId, id);

      res.json({
        success: true,
        data: contrato
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Contrato não encontrado'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/documentos
   * Listar documentos dos imóveis
   */
  async listarDocumentos(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { imovel_id } = req.query;

      const documentos = await OwnerPortalService.listarDocumentos(
        proprietarioId,
        imovel_id as string
      );

      res.json({
        success: true,
        data: documentos,
        total: documentos.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar documentos'
      });
    }
  }

  /**
   * GET /api/portal-proprietario/notificacoes
   * Listar notificações
   */
  async listarNotificacoes(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { nao_lidas } = req.query;

      const notificacoes = await OwnerPortalService.listarNotificacoes(
        proprietarioId,
        nao_lidas === 'true'
      );

      res.json({
        success: true,
        data: notificacoes,
        total: notificacoes.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar notificações'
      });
    }
  }

  /**
   * PUT /api/portal-proprietario/notificacoes/:id/ler
   * Marcar notificação como lida
   */
  async marcarNotificacaoLida(req: Request, res: Response) {
    try {
      const proprietarioId = (req as any).clienteId;
      const { id } = req.params;

      await OwnerPortalService.marcarNotificacaoLida(proprietarioId, id);

      res.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao marcar notificação'
      });
    }
  }
}

export default new OwnerPortalController();
