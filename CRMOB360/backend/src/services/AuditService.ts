import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLog {
  usuario_id?: string;
  acao: string;
  entidade?: string;
  entidade_id?: string;
  dados_anteriores?: any;
  dados_novos?: any;
  ip_address?: string;
  user_agent?: string;
}

interface AuditFilters {
  usuario_id?: string;
  acao?: string;
  entidade?: string;
  entidade_id?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Registrar ação de auditoria
   */
  async registrarAcao(dados: AuditLog) {
    try {
      await prisma.$queryRaw`
        INSERT INTO logs_auditoria (
          usuario_id,
          acao,
          entidade,
          entidade_id,
          dados_anteriores,
          dados_novos,
          ip_address,
          user_agent
        ) VALUES (
          ${dados.usuario_id || null},
          ${dados.acao},
          ${dados.entidade || null},
          ${dados.entidade_id || null},
          ${dados.dados_anteriores ? JSON.stringify(dados.dados_anteriores) : null},
          ${dados.dados_novos ? JSON.stringify(dados.dados_novos) : null},
          ${dados.ip_address || null},
          ${dados.user_agent || null}
        )
      `;

      return { sucesso: true };
    } catch (error: any) {
      console.error('Erro ao registrar auditoria:', error);
      throw error;
    }
  }

  /**
   * Registrar login
   */
  async registrarLogin(usuarioId: string, ipAddress: string, userAgent: string, sucesso: boolean = true) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: sucesso ? 'login' : 'login_failed',
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Registrar logout
   */
  async registrarLogout(usuarioId: string, ipAddress: string, userAgent: string) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'logout',
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Registrar criação de entidade
   */
  async registrarCriacao(
    usuarioId: string,
    entidade: string,
    entidadeId: string,
    dadosNovos: any,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'create',
      entidade,
      entidade_id: entidadeId,
      dados_novos: dadosNovos,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Registrar atualização de entidade
   */
  async registrarAtualizacao(
    usuarioId: string,
    entidade: string,
    entidadeId: string,
    dadosAnteriores: any,
    dadosNovos: any,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'update',
      entidade,
      entidade_id: entidadeId,
      dados_anteriores: dadosAnteriores,
      dados_novos: dadosNovos,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Registrar exclusão de entidade
   */
  async registrarExclusao(
    usuarioId: string,
    entidade: string,
    entidadeId: string,
    dadosAnteriores: any,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'delete',
      entidade,
      entidade_id: entidadeId,
      dados_anteriores: dadosAnteriores,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Registrar acesso a dados sensíveis
   */
  async registrarAcessoDados(
    usuarioId: string,
    entidade: string,
    entidadeId: string,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'access_sensitive_data',
      entidade,
      entidade_id: entidadeId,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Registrar exportação de dados
   */
  async registrarExportacao(
    usuarioId: string,
    tipoExportacao: string,
    filtros: any,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'export_data',
      entidade: tipoExportacao,
      dados_novos: filtros,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Registrar alteração de permissões
   */
  async registrarAlteracaoPermissoes(
    usuarioId: string,
    usuarioAlterado: string,
    permissoesAnteriores: any,
    permissoesNovas: any,
    req?: any
  ) {
    return this.registrarAcao({
      usuario_id: usuarioId,
      acao: 'change_permissions',
      entidade: 'usuarios',
      entidade_id: usuarioAlterado,
      dados_anteriores: permissoesAnteriores,
      dados_novos: permissoesNovas,
      ip_address: req?.ip,
      user_agent: req?.headers?.['user-agent']
    });
  }

  /**
   * Buscar logs de auditoria com filtros
   */
  async buscarLogs(filtros: AuditFilters = {}) {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filtros.usuario_id) {
      whereClause += ` AND usuario_id = $${paramIndex}`;
      params.push(filtros.usuario_id);
      paramIndex++;
    }

    if (filtros.acao) {
      whereClause += ` AND acao = $${paramIndex}`;
      params.push(filtros.acao);
      paramIndex++;
    }

    if (filtros.entidade) {
      whereClause += ` AND entidade = $${paramIndex}`;
      params.push(filtros.entidade);
      paramIndex++;
    }

    if (filtros.entidade_id) {
      whereClause += ` AND entidade_id = $${paramIndex}`;
      params.push(filtros.entidade_id);
      paramIndex++;
    }

    if (filtros.dataInicio && filtros.dataFim) {
      whereClause += ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(filtros.dataInicio, filtros.dataFim);
      paramIndex += 2;
    }

    const limit = filtros.limit || 100;
    const offset = filtros.offset || 0;

    whereClause += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const logs = await prisma.$queryRawUnsafe(`
      SELECT
        l.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      WHERE ${whereClause}
    `, ...params);

    return logs;
  }

  /**
   * Obter histórico de uma entidade específica
   */
  async getHistoricoEntidade(entidade: string, entidadeId: string) {
    return await prisma.$queryRaw`
      SELECT
        l.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      WHERE l.entidade = ${entidade} AND l.entidade_id = ${entidadeId}
      ORDER BY l.created_at DESC
      LIMIT 100
    `;
  }

  /**
   * Obter atividades recentes de um usuário
   */
  async getAtividadesUsuario(usuarioId: string, limit: number = 50) {
    return await prisma.$queryRaw`
      SELECT * FROM logs_auditoria
      WHERE usuario_id = ${usuarioId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Estatísticas de auditoria
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
        COUNT(*) as total_acoes,
        COUNT(DISTINCT usuario_id) as usuarios_ativos,
        COUNT(CASE WHEN acao = 'login' THEN 1 END) as total_logins,
        COUNT(CASE WHEN acao = 'login_failed' THEN 1 END) as tentativas_falhas,
        COUNT(CASE WHEN acao = 'create' THEN 1 END) as total_criações,
        COUNT(CASE WHEN acao = 'update' THEN 1 END) as total_atualizacoes,
        COUNT(CASE WHEN acao = 'delete' THEN 1 END) as total_exclusoes,
        COUNT(CASE WHEN acao = 'access_sensitive_data' THEN 1 END) as acessos_sensiveis,
        COUNT(CASE WHEN acao = 'export_data' THEN 1 END) as exportacoes
      FROM logs_auditoria
      WHERE ${whereClause}
    `, ...params);

    return stats[0];
  }

  /**
   * Ações mais comuns por entidade
   */
  async getAcoesPorEntidade(entidade: string, dataInicio?: Date, dataFim?: Date) {
    let whereClause = `entidade = $1`;
    const params: any[] = [entidade];

    if (dataInicio && dataFim) {
      whereClause += ' AND created_at BETWEEN $2 AND $3';
      params.push(dataInicio, dataFim);
    }

    return await prisma.$queryRawUnsafe(`
      SELECT
        acao,
        COUNT(*) as quantidade,
        COUNT(DISTINCT usuario_id) as usuarios_distintos
      FROM logs_auditoria
      WHERE ${whereClause}
      GROUP BY acao
      ORDER BY quantidade DESC
    `, ...params);
  }

  /**
   * Usuários mais ativos
   */
  async getUsuariosMaisAtivos(limit: number = 10, dataInicio?: Date, dataFim?: Date) {
    let whereClause = '1=1';
    const params: any[] = [];

    if (dataInicio && dataFim) {
      whereClause += ' AND l.created_at BETWEEN $1 AND $2';
      params.push(dataInicio, dataFim);
    }

    params.push(limit);

    return await prisma.$queryRawUnsafe(`
      SELECT
        l.usuario_id,
        u.nome,
        u.email,
        COUNT(*) as total_acoes,
        MAX(l.created_at) as ultima_acao
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON u.id = l.usuario_id
      WHERE ${whereClause}
      GROUP BY l.usuario_id, u.nome, u.email
      ORDER BY total_acoes DESC
      LIMIT $${params.length}
    `, ...params);
  }

  /**
   * Acessos suspeitos (múltiplos IPs, tentativas falhas, etc)
   */
  async getAcessosSuspeitos(dataInicio?: Date, dataFim?: Date) {
    let whereClause = '1=1';
    const params: any[] = [];

    if (dataInicio && dataFim) {
      whereClause += ' AND created_at BETWEEN $1 AND $2';
      params.push(dataInicio, dataFim);
    }

    // Múltiplas tentativas de login falhadas
    const tentativasFalhas = await prisma.$queryRawUnsafe(`
      SELECT
        usuario_id,
        ip_address,
        COUNT(*) as tentativas,
        MAX(created_at) as ultima_tentativa
      FROM logs_auditoria
      WHERE ${whereClause} AND acao = 'login_failed'
      GROUP BY usuario_id, ip_address
      HAVING COUNT(*) >= 3
      ORDER BY tentativas DESC
    `, ...params);

    // Múltiplos IPs para o mesmo usuário
    const multiplosIPs = await prisma.$queryRawUnsafe(`
      SELECT
        usuario_id,
        COUNT(DISTINCT ip_address) as total_ips,
        array_agg(DISTINCT ip_address) as ips
      FROM logs_auditoria
      WHERE ${whereClause} AND acao = 'login'
      GROUP BY usuario_id
      HAVING COUNT(DISTINCT ip_address) > 3
      ORDER BY total_ips DESC
    `, ...params);

    return {
      tentativas_falhas: tentativasFalhas,
      multiplos_ips: multiplosIPs
    };
  }

  /**
   * Relatório de conformidade (para LGPD/auditoria)
   */
  async getRelatorioConformidade(dataInicio: Date, dataFim: Date) {
    const stats = await this.getEstatisticas(dataInicio, dataFim);
    const acessosSensiveis = await prisma.$queryRaw`
      SELECT
        usuario_id,
        entidade,
        COUNT(*) as total_acessos
      FROM logs_auditoria
      WHERE acao = 'access_sensitive_data'
        AND created_at BETWEEN ${dataInicio} AND ${dataFim}
      GROUP BY usuario_id, entidade
      ORDER BY total_acessos DESC
    `;

    const exportacoes = await prisma.$queryRaw`
      SELECT
        usuario_id,
        entidade as tipo_exportacao,
        COUNT(*) as total_exportacoes,
        MAX(created_at) as ultima_exportacao
      FROM logs_auditoria
      WHERE acao = 'export_data'
        AND created_at BETWEEN ${dataInicio} AND ${dataFim}
      GROUP BY usuario_id, entidade
      ORDER BY total_exportacoes DESC
    `;

    const alteracoesPermissoes = await prisma.$queryRaw`
      SELECT
        usuario_id,
        entidade_id as usuario_alterado,
        COUNT(*) as total_alteracoes
      FROM logs_auditoria
      WHERE acao = 'change_permissions'
        AND created_at BETWEEN ${dataInicio} AND ${dataFim}
      GROUP BY usuario_id, entidade_id
    `;

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      resumo: stats,
      acessos_dados_sensiveis: acessosSensiveis,
      exportacoes_realizadas: exportacoes,
      alteracoes_permissoes: alteracoesPermissoes
    };
  }

  /**
   * Limpar logs antigos (manutenção)
   */
  async limparLogsAntigos(diasRetencao: number = 365) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasRetencao);

    const resultado = await prisma.$queryRaw`
      DELETE FROM logs_auditoria
      WHERE created_at < ${dataLimite}
    `;

    return {
      sucesso: true,
      registros_removidos: resultado,
      data_limite: dataLimite
    };
  }
}

export default new AuditService();
