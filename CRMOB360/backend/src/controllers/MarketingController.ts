import { Request, Response } from 'express';
import MarketingService from '../services/MarketingService';

export class MarketingController {
  /**
   * POST /api/marketing/campanhas
   * Criar campanha
   */
  async criarCampanha(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).userId;
      const campanha = await MarketingService.criarCampanha(usuarioId, req.body);

      res.json({
        success: true,
        data: campanha,
        message: 'Campanha criada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar campanha'
      });
    }
  }

  /**
   * GET /api/marketing/campanhas
   * Listar campanhas
   */
  async listarCampanhas(req: Request, res: Response) {
    try {
      const campanhas = await MarketingService.listarCampanhas(req.query);

      res.json({
        success: true,
        data: campanhas
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/marketing/campanhas/:id/enviar
   * Enviar campanha
   */
  async enviarCampanha(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await MarketingService.enviarCampanha(id);

      res.json({
        success: true,
        data: resultado,
        message: `Campanha enviada: ${resultado.enviados} enviados, ${resultado.erros} erros`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/marketing/campanhas/:id/estatisticas
   * Estatísticas da campanha
   */
  async getEstatisticas(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await MarketingService.getEstatisticasCampanha(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/marketing/templates
   * Criar template
   */
  async criarTemplate(req: Request, res: Response) {
    try {
      const template = await MarketingService.criarTemplate(req.body);

      res.json({
        success: true,
        data: template,
        message: 'Template criado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/marketing/templates
   * Listar templates
   */
  async listarTemplates(req: Request, res: Response) {
    try {
      const { tipo } = req.query;
      const templates = await MarketingService.listarTemplates(tipo as string);

      res.json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new MarketingController();
