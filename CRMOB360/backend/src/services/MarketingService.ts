import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import axios from 'axios';

const prisma = new PrismaClient();

interface CampanhaData {
  nome: string;
  tipo: 'email' | 'sms' | 'whatsapp';
  assunto?: string;
  mensagem: string;
  segmentacao?: any;
  agendamento?: Date;
  template_id?: string;
}

interface SegmentacaoData {
  tags?: string[];
  cidade?: string;
  status_lead?: string;
  score_minimo?: number;
  tipo_pessoa?: string;
}

export class MarketingService {
  /**
   * Criar campanha de marketing
   */
  async criarCampanha(usuarioId: string, dados: CampanhaData) {
    // Gerar código único
    const count = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as total FROM campanhas_marketing
    `;
    const codigo = `CAMP-${String(parseInt(count[0].total) + 1).padStart(6, '0')}`;

    const campanha = await prisma.$queryRaw`
      INSERT INTO campanhas_marketing (
        codigo, nome, tipo, assunto, mensagem, segmentacao,
        status, agendamento, template_id, criado_por
      ) VALUES (
        ${codigo}, ${dados.nome}, ${dados.tipo}, ${dados.assunto || null},
        ${dados.mensagem}, ${JSON.stringify(dados.segmentacao || {})},
        ${dados.agendamento ? 'agendada' : 'rascunho'},
        ${dados.agendamento || null}, ${dados.template_id || null}, ${usuarioId}
      ) RETURNING *
    `;

    return campanha;
  }

  /**
   * Listar campanhas
   */
  async listarCampanhas(filtros: any = {}) {
    let where = '1=1';
    const params: any[] = [];

    if (filtros.tipo) {
      where += ` AND tipo = $${params.length + 1}`;
      params.push(filtros.tipo);
    }

    if (filtros.status) {
      where += ` AND status = $${params.length + 1}`;
      params.push(filtros.status);
    }

    const campanhas = await prisma.$queryRawUnsafe(`
      SELECT * FROM campanhas_marketing
      WHERE ${where}
      ORDER BY created_at DESC
    `, ...params);

    return campanhas;
  }

  /**
   * Buscar destinatários baseado na segmentação
   */
  async buscarDestinatarios(segmentacao: SegmentacaoData) {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (segmentacao.tags && segmentacao.tags.length > 0) {
      where += ` AND tags && $${params.length + 1}`;
      params.push(segmentacao.tags);
    }

    if (segmentacao.cidade) {
      where += ` AND EXISTS (
        SELECT 1 FROM jsonb_extract_path_text(perfil_busca, 'cidade')
        WHERE jsonb_extract_path_text(perfil_busca, 'cidade') = $${params.length + 1}
      )`;
      params.push(segmentacao.cidade);
    }

    if (segmentacao.status_lead) {
      where += ` AND status_lead = $${params.length + 1}`;
      params.push(segmentacao.status_lead);
    }

    if (segmentacao.score_minimo) {
      where += ` AND score_ia >= $${params.length + 1}`;
      params.push(segmentacao.score_minimo);
    }

    if (segmentacao.tipo_pessoa) {
      where += ` AND tipo_pessoa = $${params.length + 1}`;
      params.push(segmentacao.tipo_pessoa);
    }

    const clientes = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, telefone FROM clientes
      ${where}
    `, ...params);

    return clientes;
  }

  /**
   * Enviar campanha
   */
  async enviarCampanha(campanhaId: string) {
    const campanha: any = await prisma.$queryRaw`
      SELECT * FROM campanhas_marketing WHERE id = ${campanhaId}
    `;

    if (!campanha || campanha.length === 0) {
      throw new Error('Campanha não encontrada');
    }

    const camp = campanha[0];

    // Buscar destinatários
    const destinatarios = await this.buscarDestinatarios(camp.segmentacao || {});

    // Atualizar status
    await prisma.$queryRaw`
      UPDATE campanhas_marketing
      SET status = 'enviando', data_envio = NOW()
      WHERE id = ${campanhaId}
    `;

    let enviados = 0;
    let erros = 0;

    // Enviar para cada destinatário
    for (const destinatario of destinatarios as any[]) {
      try {
        if (camp.tipo === 'email') {
          await this.enviarEmail(destinatario, camp);
        } else if (camp.tipo === 'sms') {
          await this.enviarSMS(destinatario, camp);
        } else if (camp.tipo === 'whatsapp') {
          await this.enviarWhatsApp(destinatario, camp);
        }

        enviados++;

        // Registrar envio
        await prisma.$queryRaw`
          INSERT INTO envios_campanha (campanha_id, cliente_id, status)
          VALUES (${campanhaId}, ${destinatario.id}, 'enviado')
        `;
      } catch (error) {
        erros++;
        await prisma.$queryRaw`
          INSERT INTO envios_campanha (campanha_id, cliente_id, status, erro)
          VALUES (${campanhaId}, ${destinatario.id}, 'erro', ${(error as Error).message})
        `;
      }
    }

    // Atualizar estatísticas
    await prisma.$queryRaw`
      UPDATE campanhas_marketing
      SET status = 'enviada',
          total_envios = ${enviados + erros},
          total_enviados = ${enviados},
          total_erros = ${erros}
      WHERE id = ${campanhaId}
    `;

    return { enviados, erros, total: enviados + erros };
  }

  /**
   * Enviar email
   */
  private async enviarEmail(destinatario: any, campanha: any) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mensagem = this.personalizarMensagem(campanha.mensagem, destinatario);

    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: destinatario.email,
      subject: campanha.assunto,
      html: mensagem,
    });
  }

  /**
   * Enviar SMS
   */
  private async enviarSMS(destinatario: any, campanha: any) {
    // Integração com provedor de SMS (exemplo: Twilio, Zenvia)
    // Por enquanto, apenas simulação
    const mensagem = this.personalizarMensagem(campanha.mensagem, destinatario);

    console.log(`SMS enviado para ${destinatario.telefone}: ${mensagem}`);

    // Exemplo de integração real:
    /*
    await axios.post('https://api.sms-provider.com/send', {
      to: destinatario.telefone,
      message: mensagem,
      apiKey: process.env.SMS_API_KEY
    });
    */
  }

  /**
   * Enviar WhatsApp
   */
  private async enviarWhatsApp(destinatario: any, campanha: any) {
    const mensagem = this.personalizarMensagem(campanha.mensagem, destinatario);

    // Integração com WhatsApp Business API
    try {
      await axios.post(
        `${process.env.WHATSAPP_API_URL}/messages`,
        {
          messaging_product: 'whatsapp',
          to: destinatario.telefone,
          type: 'text',
          text: { body: mensagem },
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Personalizar mensagem com variáveis
   */
  private personalizarMensagem(template: string, destinatario: any): string {
    let mensagem = template;

    // Substituir variáveis
    mensagem = mensagem.replace(/\{nome\}/g, destinatario.nome || 'Cliente');
    mensagem = mensagem.replace(/\{email\}/g, destinatario.email || '');
    mensagem = mensagem.replace(/\{telefone\}/g, destinatario.telefone || '');

    return mensagem;
  }

  /**
   * Criar template de mensagem
   */
  async criarTemplate(dados: any) {
    const template = await prisma.$queryRaw`
      INSERT INTO templates_mensagem (
        nome, tipo, assunto, conteudo, variaveis, ativo
      ) VALUES (
        ${dados.nome}, ${dados.tipo}, ${dados.assunto || null},
        ${dados.conteudo}, ${JSON.stringify(dados.variaveis || [])}, true
      ) RETURNING *
    `;

    return template;
  }

  /**
   * Listar templates
   */
  async listarTemplates(tipo?: string) {
    if (tipo) {
      return await prisma.$queryRaw`
        SELECT * FROM templates_mensagem
        WHERE tipo = ${tipo} AND ativo = true
        ORDER BY created_at DESC
      `;
    }

    return await prisma.$queryRaw`
      SELECT * FROM templates_mensagem
      WHERE ativo = true
      ORDER BY created_at DESC
    `;
  }

  /**
   * Obter estatísticas da campanha
   */
  async getEstatisticasCampanha(campanhaId: string) {
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erros,
        SUM(CASE WHEN aberto = true THEN 1 ELSE 0 END) as abertos,
        SUM(CASE WHEN clicado = true THEN 1 ELSE 0 END) as clicados
      FROM envios_campanha
      WHERE campanha_id = ${campanhaId}
    `;

    return stats[0];
  }

  /**
   * Registrar abertura de email
   */
  async registrarAbertura(envioId: string) {
    await prisma.$queryRaw`
      UPDATE envios_campanha
      SET aberto = true, data_abertura = NOW()
      WHERE id = ${envioId} AND aberto = false
    `;
  }

  /**
   * Registrar clique no link
   */
  async registrarClique(envioId: string, link: string) {
    await prisma.$queryRaw`
      UPDATE envios_campanha
      SET clicado = true, data_clique = NOW()
      WHERE id = ${envioId} AND clicado = false
    `;

    // Registrar qual link foi clicado
    await prisma.$queryRaw`
      INSERT INTO cliques_campanha (envio_id, link)
      VALUES (${envioId}, ${link})
    `;
  }
}

export default new MarketingService();
