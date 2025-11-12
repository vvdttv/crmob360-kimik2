import { Request, Response, NextFunction } from 'express';
import { AIProcessingService } from '@/services/AIProcessingService';
import { AuthRequest } from '@/middleware/auth';
import { AppError } from '@/utils/AppError';

const aiService = new AIProcessingService();

export class AIController {
  // Lead Scoring
  async calcularScoreLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cliente_id } = req.params;
      const result = await aiService.calcularScoreLead(cliente_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Matching de Imóveis
  async buscarImoveisCompativeis(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cliente_id } = req.params;
      const limite = parseInt(req.query.limite as string) || 10;

      const result = await aiService.buscarImoveisCompativeis(cliente_id, limite);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Geração de Descrições
  async gerarDescricaoAnuncio(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { imovel_id } = req.params;
      const { tom_voz, palavras_chave } = req.body;

      const result = await aiService.gerarDescricaoAnuncio(
        imovel_id,
        tom_voz,
        palavras_chave || []
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Precificação Inteligente
  async calcularPrecoSugerido(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { imovel_id } = req.params;
      const result = await aiService.calcularPrecoSugerido(imovel_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Análise de Conversas
  async analisarConversa(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cliente_id } = req.params;
      const result = await aiService.analisarConversa(cliente_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Extração de Perfil
  async extrairPerfilBusca(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cliente_id } = req.params;
      const { texto } = req.body;

      const result = await aiService.extrairPerfilBusca(cliente_id, texto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Chatbot Webhook (para integração futura)
  async processarMensagemChatbot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mensagem, cliente_id, canal } = req.body;

      // Processar mensagem do chatbot
      // Implementação futura - por enquanto retorna resposta padrão
      
      res.json({
        resposta: 'Obrigado pelo contato! Em breve um de nossos corretores entrará em contato.',
        acao: 'encaminhar_para_corretor',
        dados_cliente: {
          id: cliente_id,
          mensagem_original: mensagem,
          canal: canal
        }
      });
    } catch (error) {
      next(error);
    }
  }
}