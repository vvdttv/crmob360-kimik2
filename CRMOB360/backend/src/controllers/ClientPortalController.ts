import { Request, Response } from 'express';
import ClientPortalService from '../services/ClientPortalService';
import { z } from 'zod';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

const agendarVisitaSchema = z.object({
  imovel_id: z.string().uuid('ID do imóvel inválido'),
  data_hora: z.string().datetime('Data/hora inválida'),
  tipo_visita: z.enum(['presencial', 'online']).optional(),
  observacoes: z.string().optional()
});

const enviarPropostaSchema = z.object({
  imovel_id: z.string().uuid('ID do imóvel inválido'),
  valor_proposta: z.number().positive('Valor da proposta deve ser positivo'),
  valor_sinal: z.number().positive().optional(),
  condicoes: z.string().optional()
});

export class ClientPortalController {
  /**
   * POST /api/portal-cliente/login
   * Login do cliente no portal
   */
  async login(req: Request, res: Response) {
    try {
      const dados = loginSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      const resultado = await ClientPortalService.login(dados, ip, userAgent);

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
   * POST /api/portal-cliente/logout
   * Logout do cliente
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

      await ClientPortalService.logout(token);

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
   * GET /api/portal-cliente/dashboard
   * Dashboard do cliente
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;

      const dashboard = await ClientPortalService.getDashboard(clienteId);

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
   * GET /api/portal-cliente/imoveis
   * Listar imóveis disponíveis
   */
  async listarImoveis(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const filtros = req.query;

      const imoveis = await ClientPortalService.listarImoveis(clienteId, filtros);

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
   * GET /api/portal-cliente/imoveis/:id
   * Detalhes de um imóvel
   */
  async getImovelDetalhes(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { id } = req.params;

      const imovel = await ClientPortalService.getImovelDetalhes(clienteId, id);

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
   * POST /api/portal-cliente/favoritos/:imovelId
   * Adicionar imóvel aos favoritos
   */
  async adicionarFavorito(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { imovelId } = req.params;

      const favorito = await ClientPortalService.adicionarFavorito(clienteId, imovelId);

      res.json({
        success: true,
        data: favorito,
        message: 'Imóvel adicionado aos favoritos'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao adicionar favorito'
      });
    }
  }

  /**
   * DELETE /api/portal-cliente/favoritos/:imovelId
   * Remover imóvel dos favoritos
   */
  async removerFavorito(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { imovelId } = req.params;

      await ClientPortalService.removerFavorito(clienteId, imovelId);

      res.json({
        success: true,
        message: 'Imóvel removido dos favoritos'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao remover favorito'
      });
    }
  }

  /**
   * GET /api/portal-cliente/favoritos
   * Listar imóveis favoritos
   */
  async listarFavoritos(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;

      const favoritos = await ClientPortalService.listarFavoritos(clienteId);

      res.json({
        success: true,
        data: favoritos,
        total: favoritos.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao listar favoritos'
      });
    }
  }

  /**
   * POST /api/portal-cliente/visitas
   * Agendar visita a um imóvel
   */
  async agendarVisita(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const dados = agendarVisitaSchema.parse(req.body);

      const visita = await ClientPortalService.agendarVisita(clienteId, dados);

      res.json({
        success: true,
        data: visita,
        message: 'Visita agendada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao agendar visita'
      });
    }
  }

  /**
   * GET /api/portal-cliente/visitas
   * Listar visitas do cliente
   */
  async listarVisitas(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { status } = req.query;

      const visitas = await ClientPortalService.listarVisitas(
        clienteId,
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
   * DELETE /api/portal-cliente/visitas/:id
   * Cancelar visita
   */
  async cancelarVisita(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { id } = req.params;
      const { motivo } = req.body;

      await ClientPortalService.cancelarVisita(clienteId, id, motivo);

      res.json({
        success: true,
        message: 'Visita cancelada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao cancelar visita'
      });
    }
  }

  /**
   * POST /api/portal-cliente/propostas
   * Enviar proposta para um imóvel
   */
  async enviarProposta(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const dados = enviarPropostaSchema.parse(req.body);

      const proposta = await ClientPortalService.enviarProposta(clienteId, dados);

      res.json({
        success: true,
        data: proposta,
        message: 'Proposta enviada com sucesso'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao enviar proposta'
      });
    }
  }

  /**
   * GET /api/portal-cliente/propostas
   * Listar propostas do cliente
   */
  async listarPropostas(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;

      const propostas = await ClientPortalService.listarPropostas(clienteId);

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
   * GET /api/portal-cliente/notificacoes
   * Listar notificações
   */
  async listarNotificacoes(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { nao_lidas } = req.query;

      const notificacoes = await ClientPortalService.listarNotificacoes(
        clienteId,
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
   * PUT /api/portal-cliente/notificacoes/:id/ler
   * Marcar notificação como lida
   */
  async marcarNotificacaoLida(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { id } = req.params;

      await ClientPortalService.marcarNotificacaoLida(clienteId, id);

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

  /**
   * GET /api/portal-cliente/documentos
   * Listar documentos compartilhados
   */
  async listarDocumentos(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;

      const documentos = await ClientPortalService.listarDocumentos(clienteId);

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
   * PUT /api/portal-cliente/documentos/:id/visualizar
   * Marcar documento como visualizado
   */
  async marcarDocumentoVisualizado(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const { id } = req.params;

      await ClientPortalService.marcarDocumentoVisualizado(clienteId, id);

      res.json({
        success: true,
        message: 'Documento marcado como visualizado'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao marcar documento'
      });
    }
  }

  /**
   * PUT /api/portal-cliente/perfil-busca
   * Atualizar perfil de busca
   */
  async atualizarPerfilBusca(req: Request, res: Response) {
    try {
      const clienteId = (req as any).clienteId;
      const perfilBusca = req.body;

      const cliente = await ClientPortalService.atualizarPerfilBusca(
        clienteId,
        perfilBusca
      );

      res.json({
        success: true,
        data: cliente,
        message: 'Perfil de busca atualizado'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar perfil de busca'
      });
    }
  }
}

export default new ClientPortalController();
