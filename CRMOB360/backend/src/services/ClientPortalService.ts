import { PrismaClient, clientes, imoveis, propostas } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface LoginCredentials {
  email: string;
  senha: string;
}

interface ClientDashboard {
  cliente: Partial<clientes>;
  estatisticas: {
    imoveisFavoritos: number;
    visitas: {
      agendadas: number;
      realizadas: number;
    };
    propostas: {
      pendentes: number;
      aceitas: number;
      recusadas: number;
    };
    notificacoesNaoLidas: number;
  };
  imoveisRecomendados: any[];
  ultimasAtividades: any[];
}

export class ClientPortalService {
  /**
   * Autenticação de cliente no portal
   */
  async login(credentials: LoginCredentials, ip?: string, userAgent?: string) {
    const { email, senha } = credentials;

    // Buscar cliente pelo email
    const cliente = await prisma.clientes.findFirst({
      where: { email }
    });

    if (!cliente) {
      throw new Error('Email ou senha inválidos');
    }

    // Verificar senha (assumindo que o campo custom_fields.senha existe)
    const senhaHash = (cliente.custom_fields as any)?.senha_hash;
    if (!senhaHash) {
      throw new Error('Cliente não possui senha cadastrada. Entre em contato com a imobiliária.');
    }

    const senhaValida = await bcrypt.compare(senha, senhaHash);
    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // Gerar tokens JWT
    const token = jwt.sign(
      { clienteId: cliente.id, tipo: 'cliente' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { clienteId: cliente.id, tipo: 'cliente' },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Criar sessão
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1);

    await prisma.portal_sessions.create({
      data: {
        cliente_id: cliente.id,
        tipo_portal: 'cliente',
        token_acesso: token,
        refresh_token: refreshToken,
        ip_address: ip,
        user_agent: userAgent,
        expira_em: expiraEm
      }
    });

    // Registrar atividade
    await this.registrarAtividade(cliente.id, 'login', ip, userAgent);

    return {
      token,
      refreshToken,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone
      }
    };
  }

  /**
   * Logout do cliente
   */
  async logout(token: string) {
    await prisma.portal_sessions.updateMany({
      where: { token_acesso: token },
      data: { ativo: false }
    });
  }

  /**
   * Obter dashboard do cliente
   */
  async getDashboard(clienteId: string): Promise<ClientDashboard> {
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        score_ia: true,
        perfil_busca: true
      }
    });

    if (!cliente) {
      throw new Error('Cliente não encontrado');
    }

    // Estatísticas
    const [
      imoveisFavoritos,
      visitasAgendadas,
      visitasRealizadas,
      propostasPendentes,
      propostasAceitas,
      propostasRecusadas,
      notificacoesNaoLidas
    ] = await Promise.all([
      prisma.imoveis_favoritos.count({ where: { cliente_id: clienteId } }),
      prisma.agendamentos_visita.count({
        where: { cliente_id: clienteId, status: { in: ['agendado', 'confirmado'] } }
      }),
      prisma.agendamentos_visita.count({
        where: { cliente_id: clienteId, status: 'realizado' }
      }),
      prisma.propostas.count({
        where: { cliente_id: clienteId, status: 'pendente' }
      }),
      prisma.propostas.count({
        where: { cliente_id: clienteId, status: 'aceita' }
      }),
      prisma.propostas.count({
        where: { cliente_id: clienteId, status: 'recusada' }
      }),
      prisma.notificacoes_portal.count({
        where: { cliente_id: clienteId, lida: false }
      })
    ]);

    // Imóveis recomendados baseado no perfil
    const perfilBusca = cliente.perfil_busca as any || {};
    const imoveisRecomendados = await prisma.imoveis.findMany({
      where: {
        status: 'disponivel',
        ...(perfilBusca.tipo_imovel && { tipo_imovel: perfilBusca.tipo_imovel }),
        ...(perfilBusca.cidade && { cidade: perfilBusca.cidade }),
        ...(perfilBusca.valor_max && {
          OR: [
            { valor_venda: { lte: perfilBusca.valor_max } },
            { valor_locacao: { lte: perfilBusca.valor_max } }
          ]
        })
      },
      take: 6,
      orderBy: { created_at: 'desc' }
    });

    // Últimas atividades
    const ultimasAtividades = await prisma.portal_activities.findMany({
      where: { cliente_id: clienteId, tipo_portal: 'cliente' },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    return {
      cliente,
      estatisticas: {
        imoveisFavoritos,
        visitas: {
          agendadas: visitasAgendadas,
          realizadas: visitasRealizadas
        },
        propostas: {
          pendentes: propostasPendentes,
          aceitas: propostasAceitas,
          recusadas: propostasRecusadas
        },
        notificacoesNaoLidas
      },
      imoveisRecomendados,
      ultimasAtividades
    };
  }

  /**
   * Listar imóveis disponíveis com filtros
   */
  async listarImoveis(clienteId: string, filtros: any = {}) {
    const where: any = { status: 'disponivel' };

    if (filtros.tipo_imovel) where.tipo_imovel = filtros.tipo_imovel;
    if (filtros.finalidade) where.finalidade = filtros.finalidade;
    if (filtros.cidade) where.cidade = filtros.cidade;
    if (filtros.bairro) where.bairro = filtros.bairro;
    if (filtros.quartos_min) where.quartos = { gte: parseInt(filtros.quartos_min) };
    if (filtros.valor_min || filtros.valor_max) {
      const valorCondition: any = {};
      if (filtros.valor_min) valorCondition.gte = parseFloat(filtros.valor_min);
      if (filtros.valor_max) valorCondition.lte = parseFloat(filtros.valor_max);

      where.OR = [
        { valor_venda: valorCondition },
        { valor_locacao: valorCondition }
      ];
    }

    const imoveis = await prisma.imoveis.findMany({
      where,
      include: {
        proprietario: {
          select: { nome: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Verificar quais são favoritos
    const favoritos = await prisma.imoveis_favoritos.findMany({
      where: { cliente_id: clienteId },
      select: { imovel_id: true }
    });

    const favoritosIds = new Set(favoritos.map(f => f.imovel_id));

    return imoveis.map(imovel => ({
      ...imovel,
      favorito: favoritosIds.has(imovel.id)
    }));
  }

  /**
   * Obter detalhes de um imóvel
   */
  async getImovelDetalhes(clienteId: string, imovelId: string) {
    const imovel = await prisma.imoveis.findUnique({
      where: { id: imovelId },
      include: {
        proprietario: {
          select: { nome: true, telefone: true }
        },
        responsavel: {
          select: { nome: true, telefone: true, email: true }
        }
      }
    });

    if (!imovel) {
      throw new Error('Imóvel não encontrado');
    }

    // Verificar se é favorito
    const favorito = await prisma.imoveis_favoritos.findFirst({
      where: { cliente_id: clienteId, imovel_id: imovelId }
    });

    // Registrar visualização
    await this.registrarAtividade(
      clienteId,
      'visualizou_imovel',
      undefined,
      undefined,
      { entidade: 'imovel', entidade_id: imovelId }
    );

    // Incrementar contador de visitas
    await prisma.imoveis.update({
      where: { id: imovelId },
      data: { visitas_count: { increment: 1 } }
    });

    return {
      ...imovel,
      favorito: !!favorito
    };
  }

  /**
   * Adicionar imóvel aos favoritos
   */
  async adicionarFavorito(clienteId: string, imovelId: string) {
    const existe = await prisma.imoveis_favoritos.findFirst({
      where: { cliente_id: clienteId, imovel_id: imovelId }
    });

    if (existe) {
      throw new Error('Imóvel já está nos favoritos');
    }

    const favorito = await prisma.imoveis_favoritos.create({
      data: {
        cliente_id: clienteId,
        imovel_id: imovelId
      }
    });

    await this.registrarAtividade(
      clienteId,
      'adicionou_favorito',
      undefined,
      undefined,
      { entidade: 'imovel', entidade_id: imovelId }
    );

    return favorito;
  }

  /**
   * Remover imóvel dos favoritos
   */
  async removerFavorito(clienteId: string, imovelId: string) {
    await prisma.imoveis_favoritos.deleteMany({
      where: { cliente_id: clienteId, imovel_id: imovelId }
    });

    await this.registrarAtividade(
      clienteId,
      'removeu_favorito',
      undefined,
      undefined,
      { entidade: 'imovel', entidade_id: imovelId }
    );
  }

  /**
   * Listar imóveis favoritos
   */
  async listarFavoritos(clienteId: string) {
    const favoritos = await prisma.imoveis_favoritos.findMany({
      where: { cliente_id: clienteId },
      include: {
        imovel: {
          include: {
            proprietario: {
              select: { nome: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return favoritos.map(f => f.imovel);
  }

  /**
   * Agendar visita a um imóvel
   */
  async agendarVisita(clienteId: string, dados: any) {
    const { imovel_id, data_hora, tipo_visita, observacoes } = dados;

    // Verificar se já existe visita no mesmo horário
    const visitaExistente = await prisma.agendamentos_visita.findFirst({
      where: {
        imovel_id,
        data_hora: new Date(data_hora),
        status: { in: ['agendado', 'confirmado'] }
      }
    });

    if (visitaExistente) {
      throw new Error('Já existe uma visita agendada para este horário');
    }

    const visita = await prisma.agendamentos_visita.create({
      data: {
        imovel_id,
        cliente_id: clienteId,
        data_hora: new Date(data_hora),
        tipo_visita: tipo_visita || 'presencial',
        observacoes
      },
      include: {
        imovel: true
      }
    });

    await this.registrarAtividade(
      clienteId,
      'agendou_visita',
      undefined,
      undefined,
      { entidade: 'agendamento_visita', entidade_id: visita.id }
    );

    // Criar notificação
    await this.criarNotificacao(
      clienteId,
      'visita_confirmada',
      'Visita agendada com sucesso',
      `Sua visita ao imóvel foi agendada para ${new Date(data_hora).toLocaleString('pt-BR')}`,
      `/portal-cliente/visitas/${visita.id}`
    );

    return visita;
  }

  /**
   * Listar visitas do cliente
   */
  async listarVisitas(clienteId: string, status?: string) {
    const where: any = { cliente_id: clienteId };
    if (status) where.status = status;

    return await prisma.agendamentos_visita.findMany({
      where,
      include: {
        imovel: true,
        corretor: {
          select: { nome: true, telefone: true, email: true }
        }
      },
      orderBy: { data_hora: 'desc' }
    });
  }

  /**
   * Cancelar visita
   */
  async cancelarVisita(clienteId: string, visitaId: string, motivo?: string) {
    const visita = await prisma.agendamentos_visita.findUnique({
      where: { id: visitaId }
    });

    if (!visita || visita.cliente_id !== clienteId) {
      throw new Error('Visita não encontrada');
    }

    if (visita.status === 'realizado' || visita.status === 'cancelado') {
      throw new Error('Não é possível cancelar esta visita');
    }

    await prisma.agendamentos_visita.update({
      where: { id: visitaId },
      data: {
        status: 'cancelado',
        cancelado_por: 'cliente',
        motivo_cancelamento: motivo
      }
    });

    await this.registrarAtividade(
      clienteId,
      'cancelou_visita',
      undefined,
      undefined,
      { entidade: 'agendamento_visita', entidade_id: visitaId }
    );
  }

  /**
   * Enviar proposta para um imóvel
   */
  async enviarProposta(clienteId: string, dados: any) {
    const { imovel_id, valor_proposta, valor_sinal, condicoes } = dados;

    // Gerar número da proposta
    const count = await prisma.propostas.count();
    const numero_proposta = `PROP-${String(count + 1).padStart(6, '0')}`;

    const proposta = await prisma.propostas.create({
      data: {
        numero_proposta,
        tipo: 'venda',
        imovel_id,
        cliente_id: clienteId,
        valor_proposta: parseFloat(valor_proposta),
        valor_sinal: valor_sinal ? parseFloat(valor_sinal) : null,
        condicoes,
        status: 'pendente'
      },
      include: {
        imovel: true
      }
    });

    await this.registrarAtividade(
      clienteId,
      'enviou_proposta',
      undefined,
      undefined,
      { entidade: 'proposta', entidade_id: proposta.id }
    );

    await this.criarNotificacao(
      clienteId,
      'proposta_enviada',
      'Proposta enviada com sucesso',
      `Sua proposta para o imóvel ${proposta.imovel.codigo} foi enviada e está em análise`,
      `/portal-cliente/propostas/${proposta.id}`
    );

    return proposta;
  }

  /**
   * Listar propostas do cliente
   */
  async listarPropostas(clienteId: string) {
    return await prisma.propostas.findMany({
      where: { cliente_id: clienteId },
      include: {
        imovel: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Listar notificações
   */
  async listarNotificacoes(clienteId: string, apenasNaoLidas: boolean = false) {
    const where: any = { cliente_id: clienteId };
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
  async marcarNotificacaoLida(clienteId: string, notificacaoId: string) {
    await prisma.notificacoes_portal.updateMany({
      where: {
        id: notificacaoId,
        cliente_id: clienteId
      },
      data: {
        lida: true,
        lida_em: new Date()
      }
    });
  }

  /**
   * Listar documentos compartilhados
   */
  async listarDocumentos(clienteId: string) {
    return await prisma.documentos_compartilhados.findMany({
      where: { cliente_id: clienteId },
      include: {
        imovel: {
          select: { codigo: true, titulo: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Marcar documento como visualizado
   */
  async marcarDocumentoVisualizado(clienteId: string, documentoId: string) {
    await prisma.documentos_compartilhados.updateMany({
      where: {
        id: documentoId,
        cliente_id: clienteId,
        visualizado: false
      },
      data: {
        visualizado: true,
        visualizado_em: new Date()
      }
    });
  }

  /**
   * Atualizar perfil de busca
   */
  async atualizarPerfilBusca(clienteId: string, perfilBusca: any) {
    return await prisma.clientes.update({
      where: { id: clienteId },
      data: { perfil_busca: perfilBusca }
    });
  }

  /**
   * Registrar atividade do cliente no portal
   */
  private async registrarAtividade(
    clienteId: string,
    acao: string,
    ip?: string,
    userAgent?: string,
    extras?: any
  ) {
    await prisma.portal_activities.create({
      data: {
        cliente_id: clienteId,
        tipo_portal: 'cliente',
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
    clienteId: string,
    tipo: string,
    titulo: string,
    mensagem: string,
    link?: string
  ) {
    await prisma.notificacoes_portal.create({
      data: {
        cliente_id: clienteId,
        tipo,
        titulo,
        mensagem,
        link
      }
    });
  }
}

export default new ClientPortalService();
