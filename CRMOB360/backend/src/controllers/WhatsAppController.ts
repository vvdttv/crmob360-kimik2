import { Request, Response } from 'express';
import WhatsAppService from '../services/WhatsAppService';

export class WhatsAppController {
  /**
   * POST /api/whatsapp/enviar-texto
   * Enviar mensagem de texto
   */
  async enviarTexto(req: Request, res: Response) {
    try {
      const { telefone, mensagem } = req.body;

      if (!telefone || !mensagem) {
        return res.status(400).json({
          success: false,
          message: 'Telefone e mensagem são obrigatórios'
        });
      }

      const resultado = await WhatsAppService.enviarTexto(telefone, mensagem);

      res.json({
        success: true,
        data: resultado,
        message: 'Mensagem enviada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao enviar mensagem'
      });
    }
  }

  /**
   * POST /api/whatsapp/enviar-template
   * Enviar template aprovado
   */
  async enviarTemplate(req: Request, res: Response) {
    try {
      const { telefone, templateName, parameters } = req.body;

      if (!telefone || !templateName) {
        return res.status(400).json({
          success: false,
          message: 'Telefone e nome do template são obrigatórios'
        });
      }

      const resultado = await WhatsAppService.enviarTemplate(
        telefone,
        templateName,
        parameters || []
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Template enviado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao enviar template'
      });
    }
  }

  /**
   * POST /api/whatsapp/enviar-imagem
   * Enviar imagem
   */
  async enviarImagem(req: Request, res: Response) {
    try {
      const { telefone, imageUrl, caption } = req.body;

      if (!telefone || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Telefone e URL da imagem são obrigatórios'
        });
      }

      const resultado = await WhatsAppService.enviarImagem(
        telefone,
        imageUrl,
        caption
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Imagem enviada com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao enviar imagem'
      });
    }
  }

  /**
   * POST /api/whatsapp/enviar-documento
   * Enviar documento
   */
  async enviarDocumento(req: Request, res: Response) {
    try {
      const { telefone, documentUrl, filename } = req.body;

      if (!telefone || !documentUrl || !filename) {
        return res.status(400).json({
          success: false,
          message: 'Telefone, URL do documento e nome do arquivo são obrigatórios'
        });
      }

      const resultado = await WhatsAppService.enviarDocumento(
        telefone,
        documentUrl,
        filename
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Documento enviado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao enviar documento'
      });
    }
  }

  /**
   * POST /api/whatsapp/webhook
   * Processar webhooks do WhatsApp
   */
  async processarWebhook(req: Request, res: Response) {
    try {
      const payload = req.body;

      // Verificação do webhook (Meta requer verificação)
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'verify_token_9mob';

        if (req.query['hub.verify_token'] === verifyToken) {
          return res.status(200).send(req.query['hub.challenge']);
        } else {
          return res.status(403).send('Forbidden');
        }
      }

      // Processar webhook
      await WhatsAppService.processarWebhook(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processado'
      });
    } catch (error: any) {
      console.error('Erro ao processar webhook WhatsApp:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/whatsapp/mensagens/:telefone
   * Listar mensagens de um telefone
   */
  async listarMensagens(req: Request, res: Response) {
    try {
      const { telefone } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const mensagens = await WhatsAppService.listarMensagens(telefone, limit);

      res.json({
        success: true,
        data: mensagens
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/whatsapp/estatisticas
   * Estatísticas de WhatsApp
   */
  async getEstatisticas(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      const stats = await WhatsAppService.getEstatisticas(
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined
      );

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
}

export default new WhatsAppController();
