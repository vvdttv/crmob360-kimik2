import { Request, Response } from 'express';
import PaymentService from '../services/PaymentService';

export class PaymentController {
  /**
   * POST /api/pagamentos/boleto
   * Gerar boleto
   */
  async gerarBoleto(req: Request, res: Response) {
    try {
      const { valor, vencimento, cliente_id, descricao, conta_id } = req.body;

      if (!valor || !vencimento || !cliente_id || !descricao) {
        return res.status(400).json({
          success: false,
          message: 'Valor, vencimento, cliente_id e descrição são obrigatórios'
        });
      }

      const boleto = await PaymentService.gerarBoleto({
        valor: parseFloat(valor),
        vencimento: new Date(vencimento),
        cliente_id,
        descricao,
        conta_id
      });

      res.json({
        success: true,
        data: boleto,
        message: 'Boleto gerado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar boleto'
      });
    }
  }

  /**
   * POST /api/pagamentos/pix
   * Gerar link de pagamento PIX
   */
  async gerarPix(req: Request, res: Response) {
    try {
      const { valor, vencimento, cliente_id, descricao, conta_id } = req.body;

      if (!valor || !vencimento || !cliente_id || !descricao) {
        return res.status(400).json({
          success: false,
          message: 'Valor, vencimento, cliente_id e descrição são obrigatórios'
        });
      }

      const pagamento = await PaymentService.gerarLinkPagamento(
        {
          valor: parseFloat(valor),
          vencimento: new Date(vencimento),
          cliente_id,
          descricao,
          conta_id
        },
        'PIX'
      );

      res.json({
        success: true,
        data: pagamento,
        message: 'Link de pagamento PIX gerado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar pagamento PIX'
      });
    }
  }

  /**
   * POST /api/pagamentos/cartao
   * Gerar link de pagamento por cartão
   */
  async gerarCartao(req: Request, res: Response) {
    try {
      const { valor, vencimento, cliente_id, descricao, conta_id } = req.body;

      if (!valor || !vencimento || !cliente_id || !descricao) {
        return res.status(400).json({
          success: false,
          message: 'Valor, vencimento, cliente_id e descrição são obrigatórios'
        });
      }

      const pagamento = await PaymentService.gerarLinkPagamento(
        {
          valor: parseFloat(valor),
          vencimento: new Date(vencimento),
          cliente_id,
          descricao,
          conta_id
        },
        'CREDIT_CARD'
      );

      res.json({
        success: true,
        data: pagamento,
        message: 'Link de pagamento por cartão gerado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar pagamento por cartão'
      });
    }
  }

  /**
   * GET /api/pagamentos/:paymentId
   * Consultar status do pagamento
   */
  async consultarPagamento(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const pagamento = await PaymentService.consultarPagamento(paymentId);

      res.json({
        success: true,
        data: pagamento
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao consultar pagamento'
      });
    }
  }

  /**
   * DELETE /api/pagamentos/:paymentId
   * Cancelar pagamento
   */
  async cancelarPagamento(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const resultado = await PaymentService.cancelarPagamento(paymentId);

      res.json({
        success: true,
        data: resultado,
        message: 'Pagamento cancelado com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao cancelar pagamento'
      });
    }
  }

  /**
   * POST /api/pagamentos/webhook
   * Processar webhook do gateway
   */
  async processarWebhook(req: Request, res: Response) {
    try {
      const payload = req.body;

      // Validar assinatura do webhook (em produção)
      // const signature = req.headers['x-asaas-signature'];
      // if (!validarAssinatura(payload, signature)) {
      //   return res.status(401).json({ success: false });
      // }

      await PaymentService.processarWebhook(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processado'
      });
    } catch (error: any) {
      console.error('Erro ao processar webhook de pagamento:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/pagamentos
   * Listar pagamentos
   */
  async listarPagamentos(req: Request, res: Response) {
    try {
      const filtros = req.query;
      const pagamentos = await PaymentService.listarPagamentos(filtros);

      res.json({
        success: true,
        data: pagamentos
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/pagamentos/estatisticas
   * Estatísticas de pagamentos
   */
  async getEstatisticas(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim } = req.query;

      const stats = await PaymentService.getEstatisticas(
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

  /**
   * POST /api/pagamentos/cliente-asaas
   * Criar cliente no Asaas
   */
  async criarClienteAsaas(req: Request, res: Response) {
    try {
      const { cliente_id } = req.body;

      if (!cliente_id) {
        return res.status(400).json({
          success: false,
          message: 'cliente_id é obrigatório'
        });
      }

      const cliente = await PaymentService.criarClienteAsaas(cliente_id);

      res.json({
        success: true,
        data: cliente,
        message: 'Cliente criado no Asaas com sucesso'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar cliente no Asaas'
      });
    }
  }
}

export default new PaymentController();
