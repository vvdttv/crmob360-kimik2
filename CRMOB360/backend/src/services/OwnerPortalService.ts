import { PrismaClient, clientes, imoveis } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface LoginCredentials {
  email: string;
  senha: string;
}

interface OwnerDashboard {
  proprietario: Partial<clientes>;
  estatisticas: {
    totalImoveis: number;
    imoveisDisponiveis: number;
    imoveisAlugados: number;
    imoveisVendidos: number;
    visitasAgendadas: number;
    propostasPendentes: number;
    receitaMensal: number;
  };
  imoveisRecentes: any[];
  ultimasAtividades: any[];
  proximosVencimentos: any[];
}

export class OwnerPortalService {
  /**
   * Autenticação de proprietário no portal
   */
  async login(credentials: LoginCredentials, ip?: string, userAgent?: string) {
    const { email, senha } = credentials;

    // Buscar proprietário pelo email
    const proprietario = await prisma.clientes.findFirst({
      where: { email }
    });

    if (!proprietario) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar se possui imóveis (é proprietário)
    const temImoveis = await prisma.imoveis.count({
      where: { proprietario_id: proprietario.id }
    });

    if (temImoveis === 0) {
      throw new Error('Acesso negado. Você não é um proprietário cadastrado.');
    }

    // Verificar senha
    const senhaHash = (proprietario.custom_fields as any)?.senha_hash;
    if (!senhaHash) {
      throw new Error('Proprietário não possui senha cadastrada. Entre em contato com a imobiliária.');
    }

    const senhaValida = await bcrypt.compare(senha, senhaHash);
    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar tokens JWT
    const token = jwt.sign(
      { clienteId: proprietario.id, tipo: 'proprietario' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { clienteId: proprietario.id, tipo: 'proprietario' },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Criar sessão
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1);

    await prisma.portal_sessions.create({
      data: {
        cliente_id: proprietario.id,
        tipo_portal: 'proprietario',
        token_acesso: token,
        refresh_token: refreshToken,
        ip_address: ip,
        user_agent: userAgent,
        expira_em: expiraEm
      }
    });

    // Registrar atividade
    await this.registrarAtividade(proprietario.id, 'login', ip, userAgent);

    return {
      token,
      refreshToken,
      proprietario: {
        id: proprietario.id,
        nome: proprietario.nome,
        email: proprietario.email,
        telefone: proprietario.telefone
      }
    };
  }

  /**
   * Logout do proprietário
   */
  async logout(token: string) {
    await prisma.portal_sessions.updateMany({
      where: { token_acesso: token },
      data: { ativo: false }
    });
  }

  /**
   * Obter dashboard do proprietário
   */
  async getDashboard(proprietarioId: string): Promise<OwnerDashboard> {
    const proprietario = await prisma.clientes.findUnique({
      where: { id: proprietarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cpf_cnpj: true
      }
    });

    if (!proprietario) {
      throw new Error('Proprietário não encontrado');
    }

    // Buscar todos os imóveis do proprietário
    const imoveis = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId }
    });

    const imoveisIds = imoveis.map(i => i.id);

    // Estatísticas
    const [
      totalImoveis,
      imoveisDisponiveis,
      imoveisAlugados,
      imoveisVendidos,
      visitasAgendadas,
      propostasPendentes
    ] = await Promise.all([
      prisma.imoveis.count({ where: { proprietario_id: proprietarioId } }),
      prisma.imoveis.count({
        where: { proprietario_id: proprietarioId, status: 'disponivel' }
      }),
      prisma.imoveis.count({
        where: { proprietario_id: proprietarioId, status: 'alugado' }
      }),
      prisma.imoveis.count({
        where: { proprietario_id: proprietarioId, status: 'vendido' }
      }),
      prisma.agendamentos_visita.count({
        where: {
          imovel_id: { in: imoveisIds },
          status: { in: ['agendado', 'confirmado'] }
        }
      }),
      prisma.propostas.count({
        where: {
          imovel_id: { in: imoveisIds },
          status: 'pendente'
        }
      })
    ]);

    // Calcular receita mensal (contratos ativos)
    const contratosAtivos = await prisma.contratos_locacao.findMany({
      where: {
        imovel_id: { in: imoveisIds },
        status: 'ativo'
      },
      select: { valor_aluguel: true }
    });

    const receitaMensal = contratosAtivos.reduce(
      (sum, c) => sum + parseFloat(c.valor_aluguel.toString()),
      0
    );

    // Imóveis recentes
    const imoveisRecentes = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        responsavel: {
          select: { nome: true, telefone: true }
        }
      }
    });

    // Últimas atividades
    const ultimasAtividades = await prisma.portal_activities.findMany({
      where: { cliente_id: proprietarioId, tipo_portal: 'proprietario' },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Próximos vencimentos (contratos)
    const dataAtual = new Date();
    const proximoMes = new Date();
    proximoMes.setMonth(proximoMes.getMonth() + 1);

    const proximosVencimentos = await prisma.contas_financeiras.findMany({
      where: {
        imovel_id: { in: imoveisIds },
        tipo: 'receber',
        status: 'pendente',
        data_vencimento: {
          gte: dataAtual,
          lte: proximoMes
        }
      },
      orderBy: { data_vencimento: 'asc' },
      take: 5,
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        }
      }
    });

    return {
      proprietario,
      estatisticas: {
        totalImoveis,
        imoveisDisponiveis,
        imoveisAlugados,
        imoveisVendidos,
        visitasAgendadas,
        propostasPendentes,
        receitaMensal
      },
      imoveisRecentes,
      ultimasAtividades,
      proximosVencimentos
    };
  }

  /**
   * Listar imóveis do proprietário
   */
  async listarImoveis(proprietarioId: string, filtros: any = {}) {
    const where: any = { proprietario_id: proprietarioId };

    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo_imovel) where.tipo_imovel = filtros.tipo_imovel;
    if (filtros.cidade) where.cidade = filtros.cidade;

    return await prisma.imoveis.findMany({
      where,
      include: {
        responsavel: {
          select: { nome: true, telefone: true, email: true }
        },
        _count: {
          select: {
            propostas: true,
            agendamentos_visita: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obter detalhes de um imóvel
   */
  async getImovelDetalhes(proprietarioId: string, imovelId: string) {
    const imovel = await prisma.imoveis.findFirst({
      where: {
        id: imovelId,
        proprietario_id: proprietarioId
      },
      include: {
        responsavel: {
          select: { nome: true, telefone: true, email: true }
        },
        contratos: {
          where: { status: 'ativo' },
          include: {
            locatario: {
              select: { nome: true, telefone: true, email: true }
            }
          }
        },
        documentos: {
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            propostas: true,
            agendamentos_visita: true
          }
        }
      }
    });

    if (!imovel) {
      throw new Error('Imóvel não encontrado ou você não tem permissão para visualizá-lo');
    }

    await this.registrarAtividade(
      proprietarioId,
      'visualizou_imovel',
      undefined,
      undefined,
      { entidade: 'imovel', entidade_id: imovelId }
    );

    return imovel;
  }

  /**
   * Listar propostas recebidas
   */
  async listarPropostas(proprietarioId: string, status?: string) {
    // Buscar imóveis do proprietário
    const imoveis = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId },
      select: { id: true }
    });

    const imoveisIds = imoveis.map(i => i.id);

    const where: any = { imovel_id: { in: imoveisIds } };
    if (status) where.status = status;

    return await prisma.propostas.findMany({
      where,
      include: {
        imovel: {
          select: { codigo: true, titulo: true, endereco_completo: true }
        },
        cliente: {
          select: { nome: true, telefone: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obter detalhes de uma proposta
   */
  async getPropostaDetalhes(proprietarioId: string, propostaId: string) {
    const proposta = await prisma.propostas.findUnique({
      where: { id: propostaId },
      include: {
        imovel: true,
        cliente: {
          select: { nome: true, telefone: true, email: true, cpf_cnpj: true }
        }
      }
    });

    if (!proposta || proposta.imovel.proprietario_id !== proprietarioId) {
      throw new Error('Proposta não encontrada ou você não tem permissão para visualizá-la');
    }

    return proposta;
  }

  /**
   * Listar visitas agendadas
   */
  async listarVisitas(proprietarioId: string, status?: string) {
    // Buscar imóveis do proprietário
    const imoveis = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId },
      select: { id: true }
    });

    const imoveisIds = imoveis.map(i => i.id);

    const where: any = { imovel_id: { in: imoveisIds } };
    if (status) where.status = status;

    return await prisma.agendamentos_visita.findMany({
      where,
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        },
        cliente: {
          select: { nome: true, telefone: true }
        },
        corretor: {
          select: { nome: true, telefone: true }
        }
      },
      orderBy: { data_hora: 'desc' }
    });
  }

  /**
   * Obter relatório financeiro
   */
  async getRelatorioFinanceiro(
    proprietarioId: string,
    dataInicio?: string,
    dataFim?: string
  ) {
    // Buscar imóveis do proprietário
    const imoveis = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId },
      select: { id: true }
    });

    const imoveisIds = imoveis.map(i => i.id);

    const where: any = { imovel_id: { in: imoveisIds } };

    if (dataInicio && dataFim) {
      where.created_at = {
        gte: new Date(dataInicio),
        lte: new Date(dataFim)
      };
    }

    // Contas a receber
    const contasReceber = await prisma.contas_financeiras.findMany({
      where: {
        ...where,
        tipo: 'receber'
      },
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        }
      },
      orderBy: { data_vencimento: 'desc' }
    });

    // Calcular totais
    const totalReceber = contasReceber.reduce(
      (sum, c) => sum + parseFloat(c.valor_original.toString()),
      0
    );

    const totalRecebido = contasReceber
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + parseFloat(c.valor_pago.toString()), 0);

    const totalPendente = contasReceber
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + parseFloat(c.valor_original.toString()), 0);

    // Comissões pagas
    const comissoes = await prisma.comissoes.findMany({
      where: {
        OR: imoveisIds.map(id => ({
          venda_id: id
        }))
      }
    });

    const totalComissoes = comissoes.reduce(
      (sum, c) => sum + parseFloat(c.valor_imobiliaria?.toString() || '0'),
      0
    );

    return {
      periodo: {
        dataInicio: dataInicio || null,
        dataFim: dataFim || null
      },
      resumo: {
        totalReceber,
        totalRecebido,
        totalPendente,
        totalComissoes,
        receitaLiquida: totalRecebido - totalComissoes
      },
      contasReceber,
      comissoes
    };
  }

  /**
   * Listar contratos ativos
   */
  async listarContratos(proprietarioId: string, status?: string) {
    // Buscar imóveis do proprietário
    const imoveis = await prisma.imoveis.findMany({
      where: { proprietario_id: proprietarioId },
      select: { id: true }
    });

    const imoveisIds = imoveis.map(i => i.id);

    const where: any = { imovel_id: { in: imoveisIds } };
    if (status) where.status = status;

    return await prisma.contratos_locacao.findMany({
      where,
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        },
        locatario: {
          select: { nome: true, telefone: true, email: true }
        },
        fiador: {
          select: { nome: true, telefone: true }
        }
      },
      orderBy: { data_inicio: 'desc' }
    });
  }

  /**
   * Obter detalhes de um contrato
   */
  async getContratoDetalhes(proprietarioId: string, contratoId: string) {
    const contrato = await prisma.contratos_locacao.findUnique({
      where: { id: contratoId },
      include: {
        imovel: true,
        locatario: true,
        fiador: true
      }
    });

    if (!contrato || contrato.imovel.proprietario_id !== proprietarioId) {
      throw new Error('Contrato não encontrado ou você não tem permissão para visualizá-lo');
    }

    // Buscar contas relacionadas
    const contas = await prisma.contas_financeiras.findMany({
      where: { contrato_id: contratoId },
      orderBy: { data_vencimento: 'desc' }
    });

    return {
      ...contrato,
      contas
    };
  }

  /**
   * Listar documentos dos imóveis
   */
  async listarDocumentos(proprietarioId: string, imovelId?: string) {
    const where: any = { cliente_id: proprietarioId };
    if (imovelId) where.imovel_id = imovelId;

    return await prisma.documentos_compartilhados.findMany({
      where,
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        },
        compartilhou: {
          select: { nome: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Listar notificações
   */
  async listarNotificacoes(proprietarioId: string, apenasNaoLidas: boolean = false) {
    const where: any = { cliente_id: proprietarioId };
    if (apenasNaoLidas) where.lida = false;

    return await prisma.notificacoes_portal.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50
    });
  }

  /**
   * Marcar notificação como lida
   */
  async marcarNotificacaoLida(proprietarioId: string, notificacaoId: string) {
    await prisma.notificacoes_portal.updateMany({
      where: {
        id: notificacaoId,
        cliente_id: proprietarioId
      },
      data: {
        lida: true,
        lida_em: new Date()
      }
    });
  }

  /**
   * Registrar atividade do proprietário no portal
   */
  private async registrarAtividade(
    proprietarioId: string,
    acao: string,
    ip?: string,
    userAgent?: string,
    extras?: any
  ) {
    await prisma.portal_activities.create({
      data: {
        cliente_id: proprietarioId,
        tipo_portal: 'proprietario',
        acao,
        ip_address: ip,
        user_agent: userAgent,
        ...extras
      }
    });
  }

  /**
   * Criar notificação
   */
  private async criarNotificacao(
    proprietarioId: string,
    tipo: string,
    titulo: string,
    mensagem: string,
    link?: string
  ) {
    await prisma.notificacoes_portal.create({
      data: {
        cliente_id: proprietarioId,
        tipo,
        titulo,
        mensagem,
        link
      }
    });
  }
}

export default new OwnerPortalService();
