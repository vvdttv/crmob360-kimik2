import { PrismaClient } from '@prisma/client';
import WhatsAppService from './WhatsAppService';
import MarketingService from './MarketingService';
import AuditService from './AuditService';

const prisma = new PrismaClient();

interface AutomationRule {
  nome: string;
  descricao?: string;
  trigger_tipo: string;
  trigger_condicoes: any;
  acoes: AutomationAction[];
  ativo: boolean;
}

interface AutomationAction {
  tipo: string; // enviar_email, enviar_whatsapp, criar_tarefa, atualizar_campo, etc
  config: any;
}

interface TriggerEvent {
  tipo: string;
  entidade_tipo?: string;
  entidade_id?: string;
  dados?: any;
}

export class AutomationService {
  /**
   * Criar regra de automação
   */
  async criarRegra(dados: AutomationRule) {
    await prisma.$queryRaw`
      INSERT INTO regras_automacao (
        nome, descricao, trigger_tipo, trigger_condicoes, acoes, ativo
      ) VALUES (
        ${dados.nome},
        ${dados.descricao || null},
        ${dados.trigger_tipo},
        ${JSON.stringify(dados.trigger_condicoes)},
        ${JSON.stringify(dados.acoes)},
        ${dados.ativo}
      )
    `;

    return { sucesso: true, mensagem: 'Regra de automação criada com sucesso' };
  }

  /**
   * Atualizar regra de automação
   */
  async atualizarRegra(regraId: string, dados: Partial<AutomationRule>) {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dados.nome) {
      updates.push(`nome = $${paramIndex}`);
      params.push(dados.nome);
      paramIndex++;
    }

    if (dados.descricao !== undefined) {
      updates.push(`descricao = $${paramIndex}`);
      params.push(dados.descricao);
      paramIndex++;
    }

    if (dados.trigger_condicoes) {
      updates.push(`trigger_condicoes = $${paramIndex}`);
      params.push(JSON.stringify(dados.trigger_condicoes));
      paramIndex++;
    }

    if (dados.acoes) {
      updates.push(`acoes = $${paramIndex}`);
      params.push(JSON.stringify(dados.acoes));
      paramIndex++;
    }

    if (dados.ativo !== undefined) {
      updates.push(`ativo = $${paramIndex}`);
      params.push(dados.ativo);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(regraId);

    await prisma.$queryRawUnsafe(`
      UPDATE regras_automacao
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);

    return { sucesso: true, mensagem: 'Regra atualizada com sucesso' };
  }

  /**
   * Deletar regra de automação
   */
  async deletarRegra(regraId: string) {
    await prisma.$queryRaw`
      DELETE FROM regras_automacao WHERE id = ${regraId}
    `;

    return { sucesso: true, mensagem: 'Regra deletada com sucesso' };
  }

  /**
   * Listar regras de automação
   */
  async listarRegras(ativo?: boolean) {
    if (ativo !== undefined) {
      return await prisma.$queryRaw`
        SELECT * FROM regras_automacao
        WHERE ativo = ${ativo}
        ORDER BY created_at DESC
      `;
    }

    return await prisma.$queryRaw`
      SELECT * FROM regras_automacao
      ORDER BY created_at DESC
    `;
  }

  /**
   * Buscar regra específica
   */
  async buscarRegra(regraId: string) {
    const regra: any = await prisma.$queryRaw`
      SELECT * FROM regras_automacao WHERE id = ${regraId} LIMIT 1
    `;

    return regra[0] || null;
  }

  /**
   * Processar evento e executar automações
   */
  async processarEvento(evento: TriggerEvent) {
    // Buscar regras ativas para este tipo de trigger
    const regras: any = await prisma.$queryRaw`
      SELECT * FROM regras_automacao
      WHERE trigger_tipo = ${evento.tipo} AND ativo = true
    `;

    for (const regra of regras) {
      // Verificar se as condições do trigger são atendidas
      if (this.verificarCondicoes(evento, regra.trigger_condicoes)) {
        await this.executarRegra(regra, evento);
      }
    }
  }

  /**
   * Executar regra de automação
   */
  private async executarRegra(regra: any, evento: TriggerEvent) {
    // Registrar execução
    const execucaoResult: any = await prisma.$queryRaw`
      INSERT INTO execucoes_automacao (
        regra_id, entidade_tipo, entidade_id, status
      ) VALUES (
        ${regra.id},
        ${evento.entidade_tipo || null},
        ${evento.entidade_id || null},
        'executando'
      ) RETURNING id
    `;

    const execucaoId = execucaoResult[0]?.id;

    try {
      const resultado: any = {};

      // Executar cada ação da regra
      for (const acao of regra.acoes) {
        const resultadoAcao = await this.executarAcao(acao, evento);
        resultado[acao.tipo] = resultadoAcao;
      }

      // Atualizar execução como concluída
      await prisma.$queryRaw`
        UPDATE execucoes_automacao
        SET
          status = 'concluida',
          resultado = ${JSON.stringify(resultado)},
          concluida_em = NOW()
        WHERE id = ${execucaoId}
      `;

      return { sucesso: true, resultado };
    } catch (error: any) {
      // Atualizar execução com erro
      await prisma.$queryRaw`
        UPDATE execucoes_automacao
        SET
          status = 'erro',
          erro = ${error.message},
          concluida_em = NOW()
        WHERE id = ${execucaoId}
      `;

      console.error(`Erro ao executar regra ${regra.nome}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }

  /**
   * Executar ação específica
   */
  private async executarAcao(acao: AutomationAction, evento: TriggerEvent) {
    switch (acao.tipo) {
      case 'enviar_email':
        return await this.enviarEmail(acao.config, evento);

      case 'enviar_whatsapp':
        return await this.enviarWhatsApp(acao.config, evento);

      case 'enviar_sms':
        return await this.enviarSMS(acao.config, evento);

      case 'criar_tarefa':
        return await this.criarTarefa(acao.config, evento);

      case 'atualizar_campo':
        return await this.atualizarCampo(acao.config, evento);

      case 'criar_notificacao':
        return await this.criarNotificacao(acao.config, evento);

      case 'mover_pipeline':
        return await this.moverPipeline(acao.config, evento);

      case 'webhook':
        return await this.chamarWebhook(acao.config, evento);

      default:
        console.log(`Ação ${acao.tipo} não implementada`);
        return { sucesso: false, mensagem: 'Ação não implementada' };
    }
  }

  /**
   * Verificar se condições do trigger são atendidas
   */
  private verificarCondicoes(evento: TriggerEvent, condicoes: any): boolean {
    if (!condicoes || Object.keys(condicoes).length === 0) {
      return true; // Sem condições, sempre executa
    }

    // Implementar lógica de verificação de condições
    // Exemplo: condicoes = { campo: 'status', operador: 'igual', valor: 'novo' }

    for (const [campo, regra] of Object.entries(condicoes)) {
      const valorEvento = evento.dados?.[campo];
      const { operador, valor }: any = regra;

      switch (operador) {
        case 'igual':
          if (valorEvento !== valor) return false;
          break;
        case 'diferente':
          if (valorEvento === valor) return false;
          break;
        case 'contem':
          if (!String(valorEvento).includes(valor)) return false;
          break;
        case 'maior_que':
          if (Number(valorEvento) <= Number(valor)) return false;
          break;
        case 'menor_que':
          if (Number(valorEvento) >= Number(valor)) return false;
          break;
        default:
          return true;
      }
    }

    return true;
  }

  /**
   * Ações específicas
   */
  private async enviarEmail(config: any, evento: TriggerEvent) {
    // Usar MarketingService para enviar email
    const { destinatario, assunto, mensagem } = config;

    // Substituir variáveis no template
    const mensagemFinal = this.substituirVariaveis(mensagem, evento.dados);

    // Enviar via MarketingService (implementar método sendEmail)
    console.log('Enviando email:', { destinatario, assunto, mensagem: mensagemFinal });

    return { sucesso: true, destinatario };
  }

  private async enviarWhatsApp(config: any, evento: TriggerEvent) {
    const { telefone, mensagem } = config;
    const mensagemFinal = this.substituirVariaveis(mensagem, evento.dados);

    await WhatsAppService.enviarTexto(telefone, mensagemFinal);

    return { sucesso: true, telefone };
  }

  private async enviarSMS(config: any, evento: TriggerEvent) {
    const { telefone, mensagem } = config;
    const mensagemFinal = this.substituirVariaveis(mensagem, evento.dados);

    // Implementar envio de SMS
    console.log('Enviando SMS:', { telefone, mensagem: mensagemFinal });

    return { sucesso: true, telefone };
  }

  private async criarTarefa(config: any, evento: TriggerEvent) {
    const { titulo, descricao, responsavel_id, prazo_dias } = config;

    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + (prazo_dias || 7));

    await prisma.$queryRaw`
      INSERT INTO tarefas (
        titulo, descricao, responsavel_id, data_vencimento, status
      ) VALUES (
        ${this.substituirVariaveis(titulo, evento.dados)},
        ${this.substituirVariaveis(descricao, evento.dados)},
        ${responsavel_id},
        ${dataVencimento},
        'pendente'
      )
    `;

    return { sucesso: true, titulo };
  }

  private async atualizarCampo(config: any, evento: TriggerEvent) {
    const { entidade, entidade_id, campo, valor } = config;

    await prisma.$queryRawUnsafe(`
      UPDATE ${entidade}
      SET ${campo} = $1, updated_at = NOW()
      WHERE id = $2
    `, valor, entidade_id || evento.entidade_id);

    return { sucesso: true, campo, valor };
  }

  private async criarNotificacao(config: any, evento: TriggerEvent) {
    const { usuario_id, tipo, categoria, titulo, mensagem } = config;

    await prisma.$queryRaw`
      INSERT INTO notificacoes_sistema (
        usuario_id, tipo, categoria, titulo, mensagem
      ) VALUES (
        ${usuario_id},
        ${tipo || 'info'},
        ${categoria || 'automacao'},
        ${this.substituirVariaveis(titulo, evento.dados)},
        ${this.substituirVariaveis(mensagem, evento.dados)}
      )
    `;

    return { sucesso: true, usuario_id };
  }

  private async moverPipeline(config: any, evento: TriggerEvent) {
    const { cliente_id, funil_id, etapa_id } = config;

    await prisma.$queryRaw`
      UPDATE clientes
      SET funil_id = ${funil_id}, etapa_atual_id = ${etapa_id}
      WHERE id = ${cliente_id || evento.entidade_id}
    `;

    return { sucesso: true, cliente_id, etapa_id };
  }

  private async chamarWebhook(config: any, evento: TriggerEvent) {
    const { url, metodo, headers, body } = config;

    const axios = require('axios');

    const response = await axios({
      method: metodo || 'POST',
      url,
      headers: headers || {},
      data: body || evento.dados
    });

    return { sucesso: true, status: response.status };
  }

  /**
   * Substituir variáveis no template
   */
  private substituirVariaveis(template: string, dados: any = {}): string {
    if (!template) return '';

    let resultado = template;

    for (const [chave, valor] of Object.entries(dados)) {
      const regex = new RegExp(`{{${chave}}}`, 'g');
      resultado = resultado.replace(regex, String(valor));
    }

    return resultado;
  }

  /**
   * Triggers pré-definidos
   */
  async triggerNovoLead(clienteId: string, dados: any) {
    await this.processarEvento({
      tipo: 'novo_lead',
      entidade_tipo: 'clientes',
      entidade_id: clienteId,
      dados
    });
  }

  async triggerVisitaAgendada(visitaId: string, dados: any) {
    await this.processarEvento({
      tipo: 'visita_agendada',
      entidade_tipo: 'agendamentos_visita',
      entidade_id: visitaId,
      dados
    });
  }

  async triggerPropostaRecebida(propostaId: string, dados: any) {
    await this.processarEvento({
      tipo: 'proposta_recebida',
      entidade_tipo: 'propostas',
      entidade_id: propostaId,
      dados
    });
  }

  async triggerPagamentoRecebido(transacaoId: string, dados: any) {
    await this.processarEvento({
      tipo: 'pagamento_recebido',
      entidade_tipo: 'transacoes_pagamento',
      entidade_id: transacaoId,
      dados
    });
  }

  async triggerContaVencendo(contaId: string, dados: any) {
    await this.processarEvento({
      tipo: 'conta_vencendo',
      entidade_tipo: 'contas_financeiras',
      entidade_id: contaId,
      dados
    });
  }

  /**
   * Processar webhook recebido
   */
  async processarWebhookRecebido(origem: string, evento: string, payload: any) {
    // Registrar webhook
    await prisma.$queryRaw`
      INSERT INTO webhooks_recebidos (origem, evento, payload, processado)
      VALUES (${origem}, ${evento}, ${JSON.stringify(payload)}, false)
    `;

    // Processar webhook específico
    switch (origem.toLowerCase()) {
      case 'whatsapp':
        await WhatsAppService.processarWebhook(payload);
        break;

      case 'asaas':
      case 'pagamento':
        // PaymentService já processa
        break;

      default:
        console.log(`Webhook de origem ${origem} não implementado`);
    }

    // Marcar como processado
    await prisma.$queryRaw`
      UPDATE webhooks_recebidos
      SET processado = true, processado_em = NOW()
      WHERE origem = ${origem} AND evento = ${evento}
        AND processado = false
    `;
  }

  /**
   * Estatísticas de automações
   */
  async getEstatisticas(dataInicio?: Date, dataFim?: Date) {
    let whereClause = '1=1';
    const params: any[] = [];

    if (dataInicio && dataFim) {
      whereClause += ' AND created_at BETWEEN $1 AND $2';
      params.push(dataInicio, dataFim);
    }

    const stats = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) as total_execucoes,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as execucoes_sucesso,
        COUNT(CASE WHEN status = 'erro' THEN 1 END) as execucoes_erro,
        COUNT(DISTINCT regra_id) as regras_executadas
      FROM execucoes_automacao
      WHERE ${whereClause}
    `, ...params);

    return stats[0];
  }

  /**
   * Histórico de execuções
   */
  async getHistoricoExecucoes(regraId?: string, limit: number = 100) {
    if (regraId) {
      return await prisma.$queryRaw`
        SELECT
          e.*,
          r.nome as regra_nome
        FROM execucoes_automacao e
        JOIN regras_automacao r ON r.id = e.regra_id
        WHERE e.regra_id = ${regraId}
        ORDER BY e.created_at DESC
        LIMIT ${limit}
      `;
    }

    return await prisma.$queryRaw`
      SELECT
        e.*,
        r.nome as regra_nome
      FROM execucoes_automacao e
      JOIN regras_automacao r ON r.id = e.regra_id
      ORDER BY e.created_at DESC
      LIMIT ${limit}
    `;
  }
}

export default new AutomationService();
