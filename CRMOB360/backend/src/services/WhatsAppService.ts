import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'image' | 'document';
  content: any;
}

export class WhatsAppService {
  private apiUrl: string;
  private apiToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || '';
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Enviar mensagem de texto
   */
  async enviarTexto(to: string, mensagem: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatarTelefone(to),
          type: 'text',
          text: {
            body: mensagem
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Registrar envio
      await this.registrarMensagem(to, 'text', mensagem, 'enviada');

      return response.data;
    } catch (error: any) {
      await this.registrarMensagem(to, 'text', mensagem, 'erro', error.message);
      throw error;
    }
  }

  /**
   * Enviar template aprovado
   */
  async enviarTemplate(to: string, templateName: string, parameters: any[] = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatarTelefone(to),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: 'pt_BR'
            },
            components: [
              {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p }))
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await this.registrarMensagem(to, 'template', templateName, 'enviada');

      return response.data;
    } catch (error: any) {
      await this.registrarMensagem(to, 'template', templateName, 'erro', error.message);
      throw error;
    }
  }

  /**
   * Enviar imagem
   */
  async enviarImagem(to: string, imageUrl: string, caption?: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatarTelefone(to),
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await this.registrarMensagem(to, 'image', imageUrl, 'enviada');

      return response.data;
    } catch (error: any) {
      await this.registrarMensagem(to, 'image', imageUrl, 'erro', error.message);
      throw error;
    }
  }

  /**
   * Enviar documento
   */
  async enviarDocumento(to: string, documentUrl: string, filename: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatarTelefone(to),
          type: 'document',
          document: {
            link: documentUrl,
            filename: filename
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      await this.registrarMensagem(to, 'document', documentUrl, 'enviada');

      return response.data;
    } catch (error: any) {
      await this.registrarMensagem(to, 'document', documentUrl, 'erro', error.message);
      throw error;
    }
  }

  /**
   * Processar webhook do WhatsApp
   */
  async processarWebhook(payload: any) {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) return;

    // Mensagem recebida
    if (value.messages) {
      for (const message of value.messages) {
        await this.processarMensagemRecebida(message, value.contacts?.[0]);
      }
    }

    // Status de mensagem
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.atualizarStatusMensagem(status);
      }
    }
  }

  /**
   * Processar mensagem recebida
   */
  private async processarMensagemRecebida(message: any, contact: any) {
    const telefone = message.from;
    const tipo = message.type;
    let conteudo = '';

    if (tipo === 'text') {
      conteudo = message.text.body;
    } else if (tipo === 'image') {
      conteudo = message.image.id;
    } else if (tipo === 'document') {
      conteudo = message.document.id;
    }

    // Buscar cliente pelo telefone
    const cliente: any = await prisma.$queryRaw`
      SELECT id FROM clientes WHERE telefone = ${telefone} LIMIT 1
    `;

    if (cliente && cliente.length > 0) {
      // Registrar como atividade
      await prisma.$queryRaw`
        INSERT INTO atividades (cliente_id, tipo, descricao, data_hora)
        VALUES (${cliente[0].id}, 'whatsapp', ${conteudo}, NOW())
      `;
    }

    // Registrar mensagem
    await this.registrarMensagem(telefone, tipo, conteudo, 'recebida');

    // Processar resposta automática (chatbot básico)
    await this.processarRespostaAutomatica(telefone, conteudo);
  }

  /**
   * Atualizar status da mensagem
   */
  private async atualizarStatusMensagem(status: any) {
    const messageId = status.id;
    const newStatus = status.status; // sent, delivered, read, failed

    await prisma.$queryRaw`
      UPDATE mensagens_whatsapp
      SET status = ${newStatus}, updated_at = NOW()
      WHERE message_id = ${messageId}
    `;
  }

  /**
   * Processar resposta automática (chatbot simples)
   */
  private async processarRespostaAutomatica(telefone: string, mensagem: string) {
    const mensagemLower = mensagem.toLowerCase();

    // Respostas automáticas básicas
    if (mensagemLower.includes('horário') || mensagemLower.includes('horario')) {
      await this.enviarTexto(
        telefone,
        '⏰ Nosso horário de atendimento:\nSegunda a Sexta: 8h às 18h\nSábado: 8h às 12h'
      );
    } else if (mensagemLower.includes('endereço') || mensagemLower.includes('endereco')) {
      await this.enviarTexto(
        telefone,
        '📍 Nosso endereço:\n[Endereço da Imobiliária]'
      );
    } else if (mensagemLower.includes('ajuda') || mensagemLower === 'oi' || mensagemLower === 'olá') {
      await this.enviarTexto(
        telefone,
        '👋 Olá! Bem-vindo à 9MOB!\n\nComo posso ajudar?\n\n1️⃣ Ver imóveis\n2️⃣ Agendar visita\n3️⃣ Falar com corretor\n4️⃣ Informações\n\nDigite o número da opção desejada.'
      );
    }
  }

  /**
   * Registrar mensagem no banco
   */
  private async registrarMensagem(
    telefone: string,
    tipo: string,
    conteudo: string,
    status: string,
    erro?: string
  ) {
    await prisma.$queryRaw`
      INSERT INTO mensagens_whatsapp (telefone, tipo, conteudo, status, erro)
      VALUES (${telefone}, ${tipo}, ${conteudo}, ${status}, ${erro || null})
    `;
  }

  /**
   * Formatar telefone para WhatsApp (formato internacional)
   */
  private formatarTelefone(telefone: string): string {
    // Remove caracteres não numéricos
    let numero = telefone.replace(/\D/g, '');

    // Se não tiver código do país, adiciona 55 (Brasil)
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }

    return numero;
  }

  /**
   * Listar mensagens por telefone
   */
  async listarMensagens(telefone: string, limit: number = 50) {
    return await prisma.$queryRaw`
      SELECT * FROM mensagens_whatsapp
      WHERE telefone = ${telefone}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Obter estatísticas de WhatsApp
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
        SUM(CASE WHEN status = 'enviada' THEN 1 ELSE 0 END) as enviadas,
        SUM(CASE WHEN status = 'recebida' THEN 1 ELSE 0 END) as recebidas,
        SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erros,
        COUNT(DISTINCT telefone) as contatos_unicos
      FROM mensagens_whatsapp
      WHERE ${whereClause}
    `, ...params);

    return stats[0];
  }
}

export default new WhatsAppService();
