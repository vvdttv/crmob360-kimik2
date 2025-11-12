import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';
import { validateCPF, validateCNPJ, validateEmail, formatCPF, formatCNPJ } from '@/utils/validators';
import { z } from 'zod';

// Schemas de validação Zod
const createClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  tipo_pessoa: z.enum(['fisica', 'juridica']).default('fisica'),
  origem: z.string().optional(),
  perfil_busca: z.object({}).optional(),
  responsavel_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.object({}).optional(),
});

const updateClienteSchema = createClienteSchema.partial();

const createAtividadeSchema = z.object({
  cliente_id: z.string().uuid(),
  tipo: z.enum(['ligacao', 'email', 'visita', 'whatsapp', 'nota']),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  duracao_minutos: z.number().positive().optional(),
  resultado: z.enum(['sucesso', 'sem_contato', 'recado']).optional(),
  proxima_acao: z.string().datetime().optional(),
  anexos: z.array(z.object({})).optional(),
});

export class CRMService {
  // Clientes
  async listarClientes(filters: any) {
    const where: any = {};

    if (filters.status) {
      where.status_lead = filters.status;
    }

    if (filters.responsavel_id) {
      where.responsavel_id = filters.responsavel_id;
    }

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { telefone: { contains: filters.search, mode: 'insensitive' } },
        { cpf_cnpj: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where,
        include: {
          responsavel: {
            select: { id: true, nome: true, email: true }
          },
          criador: {
            select: { id: true, nome: true, email: true }
          }
        },
        orderBy: { updated_at: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 20,
      }),
      prisma.clientes.count({ where })
    ]);

    return {
      data: clientes,
      total,
      page: Math.floor((filters.skip || 0) / (filters.take || 20)) + 1,
      pages: Math.ceil(total / (filters.take || 20))
    };
  }

  async buscarCliente(id: string) {
    const cliente = await prisma.clientes.findUnique({
      where: { id },
      include: {
        responsavel: true,
        criador: true,
        atividades: {
          include: {
            usuario: true
          },
          orderBy: { data_hora: 'desc' }
        },
        pipeline_leads: {
          include: {
            funil: true
          }
        }
      }
    });

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return cliente;
  }

  async criarCliente(data: any, userId: string) {
    // Validar dados
    const validatedData = createClienteSchema.parse(data);

    // Validar CPF/CNPJ se fornecido
    if (validatedData.cpf_cnpj) {
      const cleanDoc = validatedData.cpf_cnpj.replace(/[^\d]/g, '');
      
      if (validatedData.tipo_pessoa === 'fisica') {
        if (!validateCPF(cleanDoc)) {
          throw new AppError('CPF inválido', 400);
        }
        validatedData.cpf_cnpj = formatCPF(cleanDoc);
      } else {
        if (!validateCNPJ(cleanDoc)) {
          throw new AppError('CNPJ inválido', 400);
        }
        validatedData.cpf_cnpj = formatCNPJ(cleanDoc);
      }
    }

    // Validar email se fornecido
    if (validatedData.email && !validateEmail(validatedData.email)) {
      throw new AppError('Email inválido', 400);
    }

    // Verificar se já existe cliente com mesmo email ou documento
    const existingCliente = await prisma.clientes.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { cpf_cnpj: validatedData.cpf_cnpj }
        ]
      }
    });

    if (existingCliente) {
      throw new AppError('Cliente já existe com este email ou documento', 409);
    }

    // Criar cliente
    const cliente = await prisma.clientes.create({
      data: {
        ...validatedData,
        criado_por: userId,
      },
      include: {
        responsavel: true,
        criador: true
      }
    });

    // Criar lead no pipeline padrão se for um novo lead
    if (cliente.status_lead === 'novo') {
      await this.criarLeadPipeline(cliente.id, userId);
    }

    return cliente;
  }

  async atualizarCliente(id: string, data: any) {
    const validatedData = updateClienteSchema.parse(data);

    // Validar CPF/CNPJ se fornecido
    if (validatedData.cpf_cnpj) {
      const cleanDoc = validatedData.cpf_cnpj.replace(/[^\d]/g, '');
      
      if (validatedData.tipo_pessoa === 'fisica') {
        if (!validateCPF(cleanDoc)) {
          throw new AppError('CPF inválido', 400);
        }
        validatedData.cpf_cnpj = formatCPF(cleanDoc);
      } else {
        if (!validateCNPJ(cleanDoc)) {
          throw new AppError('CNPJ inválido', 400);
        }
        validatedData.cpf_cnpj = formatCNPJ(cleanDoc);
      }
    }

    // Validar email se fornecido
    if (validatedData.email && !validateEmail(validatedData.email)) {
      throw new AppError('Email inválido', 400);
    }

    const cliente = await prisma.clientes.update({
      where: { id },
      data: validatedData,
      include: {
        responsavel: true,
        criador: true
      }
    });

    return cliente;
  }

  async deletarCliente(id: string) {
    // Verificar se cliente tem relacionamentos ativos
    const cliente = await prisma.clientes.findUnique({
      where: { id },
      include: {
        imoveis_proprietario: {
          where: { status: { not: 'vendido' } }
        },
        contratos_locatario: {
          where: { status: 'ativo' }
        },
        pipeline_leads: {
          where: { 
            etapa_atual: { not: { in: ['convertido', 'perdido'] } }
          }
        }
      }
    });

    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (cliente.imoveis_proprietario.length > 0 || 
        cliente.contratos_locatario.length > 0 ||
        cliente.pipeline_leads.length > 0) {
      throw new AppError('Cliente não pode ser deletado pois tem relacionamentos ativos', 400);
    }

    await prisma.clientes.delete({
      where: { id }
    });
  }

  // Pipeline
  async criarLeadPipeline(clienteId: string, userId: string) {
    // Buscar funil padrão
    const funilPadrao = await prisma.funis_venda.findFirst({
      where: { tipo: 'venda', ativo: true },
      orderBy: { created_at: 'asc' }
    });

    if (!funilPadrao) {
      throw new AppError('Nenhum funil de venda ativo encontrado', 400);
    }

    // Verificar se já existe lead para este cliente
    const existingLead = await prisma.pipeline_leads.findFirst({
      where: { cliente_id: clienteId }
    });

    if (existingLead) {
      return existingLead;
    }

    const primeiraEtapa = funilPadrao.etapas && Array.isArray(funilPadrao.etapas) && funilPadrao.etapas.length > 0 
      ? funilPadrao.etapas[0] 
      : 'novo';

    return prisma.pipeline_leads.create({
      data: {
        cliente_id: clienteId,
        funil_id: funilPadrao.id,
        etapa_atual: typeof primeiraEtapa === 'string' ? primeiraEtapa : primeiraEtapa.nome || 'novo',
        responsavel_id: userId,
      },
      include: {
        cliente: true,
        funil: true,
        responsavel: true
      }
    });
  }

  async moverLead(leadId: string, novaEtapa: string, userId: string, motivo?: string) {
    const lead = await prisma.pipeline_leads.findUnique({
      where: { id: leadId },
      include: {
        cliente: true,
        funil: true
      }
    });

    if (!lead) {
      throw new AppError('Lead não encontrado', 404);
    }

    // Validar se a etapa existe no funil
    const etapas = lead.funil.etapas as any[];
    const etapaExiste = etapas.some(etapa => 
      (typeof etapa === 'string' && etapa === novaEtapa) ||
      (typeof etapa === 'object' && etapa.nome === novaEtapa)
    );

    if (!etapaExiste) {
      throw new AppError('Etapa inválida para este funil', 400);
    }

    // Atualizar lead
    const updatedLead = await prisma.pipeline_leads.update({
      where: { id: leadId },
      data: {
        etapa_atual: novaEtapa,
        updated_at: new Date(),
        responsavel_id: userId
      },
      include: {
        cliente: true,
        funil: true,
        responsavel: true
      }
    });

    // Registrar atividade
    await this.criarAtividade({
      cliente_id: lead.cliente_id,
      tipo: 'nota',
      descricao: `Lead movido para etapa "${novaEtapa}"${motivo ? `: ${motivo}` : ''}`,
      realizado_por: userId
    });

    return updatedLead;
  }

  // Atividades
  async listarAtividades(clienteId?: string, filters?: any) {
    const where: any = {};

    if (clienteId) {
      where.cliente_id = clienteId;
    }

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.realizado_por) {
      where.realizado_por = filters.realizado_por;
    }

    if (filters.data_inicio || filters.data_fim) {
      where.data_hora = {};
      if (filters.data_inicio) {
        where.data_hora.gte = new Date(filters.data_inicio);
      }
      if (filters.data_fim) {
        where.data_hora.lte = new Date(filters.data_fim);
      }
    }

    return prisma.atividades.findMany({
      where,
      include: {
        cliente: true,
        usuario: true
      },
      orderBy: { data_hora: 'desc' },
      skip: filters.skip || 0,
      take: filters.take || 50
    });
  }

  async criarAtividade(data: any) {
    const validatedData = createAtividadeSchema.parse(data);

    return prisma.atividades.create({
      data: validatedData,
      include: {
        cliente: true,
        usuario: true
      }
    });
  }

  // Funis de Venda
  async listarFunis() {
    return prisma.funis_venda.findMany({
      where: { ativo: true },
      orderBy: { created_at: 'asc' }
    });
  }

  async criarFunil(data: any) {
    return prisma.funis_venda.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo,
        etapas: data.etapas || ['novo', 'contato', 'visita', 'proposta', 'negociacao', 'fechado']
      }
    });
  }

  // Dashboard/Analytics
  async getDashboardData(userId?: string) {
    const where: any = {};
    
    if (userId) {
      where.responsavel_id = userId;
    }

    const [
      totalClientes,
      novosClientesMes,
      leadsAtivos,
      taxaConversao,
      atividadesMes
    ] = await Promise.all([
      prisma.clientes.count({ where }),
      prisma.clientes.count({
        where: {
          ...where,
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.pipeline_leads.count({
        where: {
          ...where,
          etapa_atual: { not: { in: ['convertido', 'perdido'] } }
        }
      }),
      this.calcularTaxaConversao(where),
      prisma.atividades.count({
        where: {
          realizado_por: userId,
          data_hora: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return {
      totalClientes,
      novosClientesMes,
      leadsAtivos,
      taxaConversao,
      atividadesMes
    };
  }

  private async calcularTaxaConversao(where: any): Promise<number> {
    const totalLeads = await prisma.pipeline_leads.count({ where });
    const leadsConvertidos = await prisma.pipeline_leads.count({
      where: {
        ...where,
        etapa_atual: 'convertido'
      }
    });

    return totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0;
  }
}