import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BoletoData {
  valor: number;
  vencimento: Date;
  cliente_id: string;
  descricao: string;
  conta_id?: string;
}

interface PaymentWebhookData {
  event: string;
  payment: any;
}

export class PaymentService {
  private asaasApiKey: string;
  private asaasApiUrl: string;

  constructor() {
    this.asaasApiKey = process.env.PAYMENT_GATEWAY_API_KEY || '';
    this.asaasApiUrl = process.env.PAYMENT_GATEWAY_API_URL || 'https://sandbox.asaas.com/api/v3';
  }

  /**
   * Criar cliente no Asaas
   */
  async criarClienteAsaas(clienteId: string) {
    const cliente: any = await prisma.$queryRaw`
      SELECT * FROM clientes WHERE id = ${clienteId}
    `;

    if (!cliente || cliente.length === 0) {
      throw new Error('Cliente não encontrado');
    }

    const c = cliente[0];

    try {
      const response = await axios.post(
        `${this.asaasApiUrl}/customers`,
        {
          name: c.nome,
          email: c.email,
          phone: c.telefone,
          cpfCnpj: c.cpf_cnpj,
        },
        {
          headers: {
            'access_token': this.asaasApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Salvar ID do Asaas no cliente
      await prisma.$queryRaw`
        UPDATE clientes
        SET custom_fields = jsonb_set(
          COALESCE(custom_fields, '{}'::jsonb),
          '{asaas_customer_id}',
          to_jsonb(${response.data.id}::text)
        )
        WHERE id = ${clienteId}
      `;

      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar cliente no Asaas:', error.response?.data);
      throw error;
    }
  }

  /**
   * Gerar boleto
   */
  async gerarBoleto(dados: BoletoData) {
    // Buscar ou criar cliente no Asaas
    const cliente: any = await prisma.$queryRaw`
      SELECT custom_fields FROM clientes WHERE id = ${dados.cliente_id}
    `;

    let asaasCustomerId = cliente[0]?.custom_fields?.asaas_customer_id;

    if (!asaasCustomerId) {
      const asaasCustomer = await this.criarClienteAsaas(dados.cliente_id);
      asaasCustomerId = asaasCustomer.id;
    }

    try {
      const response = await axios.post(
        `${this.asaasApiUrl}/payments`,
        {
          customer: asaasCustomerId,
          billingType: 'BOLETO',
          value: dados.valor,
          dueDate: dados.vencimento.toISOString().split('T')[0],
          description: dados.descricao,
          externalReference: dados.conta_id || null,
        },
        {
          headers: {
            'access_token': this.asaasApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const payment = response.data;

      // Atualizar conta financeira com dados do boleto
      if (dados.conta_id) {
        await prisma.$queryRaw`
          UPDATE contas_financeiras
          SET
            boleto_url = ${payment.bankSlipUrl},
            boleto_codigo = ${payment.identificationField},
            gateway_pagamento = 'asaas'
          WHERE id = ${dados.conta_id}
        `;
      }

      // Registrar transação
      await prisma.$queryRaw`
        INSERT INTO transacoes_pagamento (
          conta_id, gateway, gateway_payment_id, valor, status, tipo
        ) VALUES (
          ${dados.conta_id}, 'asaas', ${payment.id}, ${payment.value}, ${payment.status}, 'boleto'
        )
      `;

      return payment;
    } catch (error: any) {
      console.error('Erro ao gerar boleto:', error.response?.data);
      throw error;
    }
  }

  /**
   * Gerar link de pagamento (PIX ou Cartão)
   */
  async gerarLinkPagamento(dados: BoletoData, metodo: 'PIX' | 'CREDIT_CARD' = 'PIX') {
    const cliente: any = await prisma.$queryRaw`
      SELECT custom_fields FROM clientes WHERE id = ${dados.cliente_id}
    `;

    let asaasCustomerId = cliente[0]?.custom_fields?.asaas_customer_id;

    if (!asaasCustomerId) {
      const asaasCustomer = await this.criarClienteAsaas(dados.cliente_id);
      asaasCustomerId = asaasCustomer.id;
    }

    try {
      const response = await axios.post(
        `${this.asaasApiUrl}/payments`,
        {
          customer: asaasCustomerId,
          billingType: metodo,
          value: dados.valor,
          dueDate: dados.vencimento.toISOString().split('T')[0],
          description: dados.descricao,
          externalReference: dados.conta_id || null,
        },
        {
          headers: {
            'access_token': this.asaasApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const payment = response.data;

      // Registrar transação
      await prisma.$queryRaw`
        INSERT INTO transacoes_pagamento (
          conta_id, gateway, gateway_payment_id, valor, status, tipo
        ) VALUES (
          ${dados.conta_id}, 'asaas', ${payment.id}, ${payment.value}, ${payment.status}, ${metodo.toLowerCase()}
        )
      `;

      return payment;
    } catch (error: any) {
      console.error('Erro ao gerar link de pagamento:', error.response?.data);
      throw error;
    }
  }

  /**
   * Consultar status do pagamento
   */
  async consultarPagamento(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.asaasApiUrl}/payments/${paymentId}`,
        {
          headers: {
            'access_token': this.asaasApiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Erro ao consultar pagamento:', error.response?.data);
      throw error;
    }
  }

  /**
   * Processar webhook do gateway
   */
  async processarWebhook(data: PaymentWebhookData) {
    const { event, payment } = data;

    // Buscar transação
    const transacao: any = await prisma.$queryRaw`
      SELECT * FROM transacoes_pagamento
      WHERE gateway_payment_id = ${payment.id}
      LIMIT 1
    `;

    if (!transacao || transacao.length === 0) {
      console.log('Transação não encontrada:', payment.id);
      return;
    }

    const trans = transacao[0];

    // Atualizar status da transação
    await prisma.$queryRaw`
      UPDATE transacoes_pagamento
      SET status = ${payment.status}, updated_at = NOW()
      WHERE id = ${trans.id}
    `;

    // Se pagamento foi confirmado
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      // Baixar conta automaticamente
      if (trans.conta_id) {
        await prisma.$queryRaw`
          UPDATE contas_financeiras
          SET
            status = 'pago',
            data_pagamento = NOW(),
            valor_pago = ${payment.value}
          WHERE id = ${trans.conta_id}
        `;

        console.log(`Conta ${trans.conta_id} baixada automaticamente`);
      }
    }

    // Se pagamento foi recusado ou expirou
    if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      if (trans.conta_id) {
        await prisma.$queryRaw`
          UPDATE contas_financeiras
          SET status = 'atrasado'
          WHERE id = ${trans.conta_id}
        `;
      }
    }
  }

  /**
   * Cancelar pagamento
   */
  async cancelarPagamento(paymentId: string) {
    try {
      const response = await axios.delete(
        `${this.asaasApiUrl}/payments/${paymentId}`,
        {
          headers: {
            'access_token': this.asaasApiKey,
          },
        }
      );

      // Atualizar transação
      await prisma.$queryRaw`
        UPDATE transacoes_pagamento
        SET status = 'cancelado', updated_at = NOW()
        WHERE gateway_payment_id = ${paymentId}
      `;

      return response.data;
    } catch (error: any) {
      console.error('Erro ao cancelar pagamento:', error.response?.data);
      throw error;
    }
  }

  /**
   * Listar pagamentos
   */
  async listarPagamentos(filtros: any = {}) {
    let where = '1=1';
    const params: any[] = [];

    if (filtros.status) {
      where += ` AND status = $${params.length + 1}`;
      params.push(filtros.status);
    }

    if (filtros.tipo) {
      where += ` AND tipo = $${params.length + 1}`;
      params.push(filtros.tipo);
    }

    const pagamentos = await prisma.$queryRawUnsafe(`
      SELECT * FROM transacoes_pagamento
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT 100
    `, ...params);

    return pagamentos;
  }

  /**
   * Obter estatísticas de pagamentos
   */
  async getEstatisticas(dataInicio?: Date, dataFim?: Date) {
    let whereClause = '1=1';
    const params: any[] = [];

    if (dataInicio && dataFim) {
      whereClause += ` AND created_at BETWEEN $1 AND $2`;
      params.push(dataInicio, dataFim);
    }

    const stats = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'CONFIRMED' OR status = 'RECEIVED' THEN valor ELSE 0 END) as total_recebido,
        SUM(CASE WHEN status = 'PENDING' THEN valor ELSE 0 END) as total_pendente,
        COUNT(CASE WHEN tipo = 'boleto' THEN 1 END) as total_boletos,
        COUNT(CASE WHEN tipo = 'pix' THEN 1 END) as total_pix,
        COUNT(CASE WHEN tipo = 'credit_card' THEN 1 END) as total_cartao
      FROM transacoes_pagamento
      WHERE ${whereClause}
    `, ...params);

    return stats[0];
  }
}

export default new PaymentService();
