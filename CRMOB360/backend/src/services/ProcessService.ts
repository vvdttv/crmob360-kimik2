import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';
import { z } from 'zod';

// Schemas de validação
const createTemplateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['venda', 'locacao', 'manutencao', 'captacao', 'documentacao']),
  etapas: z.array(z.object({
    titulo: z.string().min(1, 'Título da etapa é obrigatório'),
    descricao: z.string().optional(),
    ordem: z.number().int().positive(),
    atribuido_para: z.string().uuid().optional(),
    prazo_dias: z.number().int().positive().optional(),
    obrigatorio: z.boolean().default(true)
  })),
  gatilhos: z.array(z.string()).optional()
});

const createProcessoSchema = z.object({
  template_id: z.string().uuid(),
  entidade_tipo: z.enum(['cliente', 'imovel', 'contrato', 'proposta']),
  entidade_id: z.string().uuid(),
  responsavel_id: z.string().uuid().optional()
});

const createTarefaSchema = z.object({
  processo_id: z.string().uuid(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  atribuido_para: z.string().uuid().optional(),
  prazo: z.string().datetime().optional(),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal')
});

export class ProcessService {
  // Templates de Processo
  async listarTemplates(filters?: any) {
    const where: any = { ativo: true };

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    return prisma.templates_processo.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: filters?.skip || 0,
      take: filters?.take || 20
    });
  }

  async buscarTemplate(id: string) {
    const template = await prisma.templates_processo.findUnique({
      where: { id }
    });

    if (!template) {
      throw new AppError('Template não encontrado', 404);
    }

    return template;
  }

  async criarTemplate(data: any, userId: string) {
    const validatedData = createTemplateSchema.parse(data);

    // Validar que etapas têm ordem única
    const ordens = validatedData.etapas.map(e => e.ordem);
    const ordensUnicas = new Set(ordens);
    
    if (ordensUnicas.size !== ordens.length) {
      throw new AppError('Ordens das etapas devem ser únicas', 400);
    }

    // Ordenar etapas
    const etapasOrdenadas = validatedData.etapas.sort((a, b) => a.ordem - b.ordem);

    return prisma.templates_processo.create({
      data: {
        ...validatedData,
        etapas: etapasOrdenadas
      }
    });
  }

  async atualizarTemplate(id: string, data: any) {
    const validatedData = createTemplateSchema.partial().parse(data);

    if (validatedData.etapas) {
      // Validar ordens únicas
      const ordens = validatedData.etapas.map(e => e.ordem);
      const ordensUnicas = new Set(ordens);
      
      if (ordensUnicas.size !== ordens.length) {
        throw new AppError('Ordens das etapas devem ser únicas', 400);
      }

      validatedData.etapas = validatedData.etapas.sort((a, b) => a.ordem - b.ordem);
    }

    return prisma.templates_processo.update({
      where: { id },
      data: validatedData
    });
  }

  async deletarTemplate(id: string) {
    // Verificar se há processos ativos usando este template
    const processosAtivos = await prisma.processos.count({
      where: {
        template_id: id,
        status: 'ativo'
      }
    });

    if (processosAtivos > 0) {
      throw new AppError('Não é possível deletar template com processos ativos', 400);
    }

    await prisma.templates_processo.update({
      where: { id },
      data: { ativo: false }
    });
  }

  // Processos
  async listarProcessos(filters?: any) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.responsavel_id) {
      where.responsavel_id = filters.responsavel_id;
    }

    if (filters?.entidade_tipo) {
      where.entidade_tipo = filters.entidade_tipo;
    }

    if (filters?.template_id) {
      where.template_id = filters.template_id;
    }

    const [processos, total] = await Promise.all([
      prisma.processos.findMany({
        where,
        include: {
          template: true,
          responsavel: {
            select: { id: true, nome: true, email: true }
          },
          tarefas: {
            include: {
              atribuido: {
                select: { id: true, nome: true, email: true }
              }
            },
            orderBy: { created_at: 'asc' }
          }
        },
        orderBy: { data_inicio: 'desc' },
        skip: filters?.skip || 0,
        take: filters?.take || 20,
      }),
      prisma.processos.count({ where })
    ]);

    return {
      data: processos,
      total,
      page: Math.floor((filters?.skip || 0) / (filters?.take || 20)) + 1,
      pages: Math.ceil(total / (filters?.take || 20))
    };
  }

  async buscarProcesso(id: string) {
    const processo = await prisma.processos.findUnique({
      where: { id },
      include: {
        template: true,
        responsavel: true,
        tarefas: {
          include: {
            atribuido: true
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!processo) {
      throw new AppError('Processo não encontrado', 404);
    }

    return processo;
  }

  async iniciarProcesso(data: any, userId: string) {
    const validatedData = createProcessoSchema.parse(data);

    // Verificar se template existe
    const template = await prisma.templates_processo.findUnique({
      where: { id: validatedData.template_id }
    });

    if (!template) {
      throw new AppError('Template não encontrado', 404);
    }

    // Verificar se já existe processo ativo para esta entidade
    const processoExistente = await prisma.processos.findFirst({
      where: {
        entidade_tipo: validatedData.entidade_tipo,
        entidade_id: validatedData.entidade_id,
        status: 'ativo'
      }
    });

    if (processoExistente) {
      throw new AppError('Já existe um processo ativo para esta entidade', 409);
    }

    // Criar processo
    const processo = await prisma.processos.create({
      data: {
        ...validatedData,
        responsavel_id: validatedData.responsavel_id || userId
      },
      include: {
        template: true,
        responsavel: true
      }
    });

    // Criar tarefas baseadas no template
    await this.criarTarefasDoTemplate(processo.id, template, userId);

    return processo;
  }

  private async criarTarefasDoTemplate(processoId: string, template: any, userId: string) {
    const etapas = template.etapas as any[];

    for (const etapa of etapas) {
      const prazo = etapa.prazo_dias ? 
        new Date(Date.now() + (etapa.prazo_dias * 24 * 60 * 60 * 1000)) : 
        undefined;

      await prisma.tarefas_processo.create({
        data: {
          processo_id: processoId,
          titulo: etapa.titulo,
          descricao: etapa.descricao,
          atribuido_para: etapa.atribuido_para || userId,
          prazo,
          prioridade: etapa.obrigatorio ? 'alta' : 'normal'
        }
      });
    }
  }

  async avancarProcesso(processoId: string, userId: string) {
    const processo = await prisma.processos.findUnique({
      where: { id: processoId },
      include: {
        template: true,
        tarefas: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!processo) {
      throw new AppError('Processo não encontrado', 404);
    }

    // Encontrar próxima tarefa pendente
    const tarefasPendentes = processo.tarefas.filter(t => t.status === 'pendente');
    
    if (tarefasPendentes.length === 0) {
      // Processo concluído
      await prisma.processos.update({
        where: { id: processoId },
        data: {
          status: 'concluido',
          data_conclusao: new Date()
        }
      });
      
      return { status: 'concluido', message: 'Processo concluído com sucesso' };
    }

    // Atualizar etapa atual
    const proximaTarefa = tarefasPendentes[0];
    
    await prisma.processos.update({
      where: { id: processoId },
      data: {
        etapa_atual: proximaTarefa.titulo
      }
    });

    return {
      status: 'ativo',
      etapa_atual: proximaTarefa.titulo,
      tarefas_pendentes: tarefasPendentes.length
    };
  }

  async cancelarProcesso(processoId: string, motivo: string, userId: string) {
    const processo = await prisma.processos.findUnique({
      where: { id: processoId }
    });

    if (!processo) {
      throw new AppError('Processo não encontrado', 404);
    }

    await prisma.processos.update({
      where: { id: processoId },
      data: {
        status: 'cancelado',
        data_conclusao: new Date()
      }
    });

    // Cancelar tarefas pendentes
    await prisma.tarefas_processo.updateMany({
      where: {
        processo_id: processoId,
        status: 'pendente'
      },
      data: {
        status: 'cancelada'
      }
    });

    // Registrar atividade
    const cliente = await this.getEntidadeDoProcesso(processo);
    if (cliente) {
      await prisma.atividades.create({
        data: {
          cliente_id: cliente.id,
          tipo: 'nota',
          descricao: `Processo ${processoId} cancelado: ${motivo}`,
          realizado_por: userId
        }
      });
    }

    return { message: 'Processo cancelado com sucesso' };
  }

  private async getEntidadeDoProcesso(processo: any) {
    switch (processo.entidade_tipo) {
      case 'cliente':
        return prisma.clientes.findUnique({
          where: { id: processo.entidade_id }
        });
      case 'imovel':
        const imovel = await prisma.imoveis.findUnique({
          where: { id: processo.entidade_id }
        });
        return imovel?.proprietario_id ? 
          prisma.clientes.findUnique({ where: { id: imovel.proprietario_id } }) : 
          null;
      default:
        return null;
    }
  }

  // Tarefas
  async listarTarefas(filters?: any) {
    const where: any = {};

    if (filters?.processo_id) {
      where.processo_id = filters.processo_id;
    }

    if (filters?.atribuido_para) {
      where.atribuido_para = filters.atribuido_para;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.prioridade) {
      where.prioridade = filters.prioridade;
    }

    if (filters?.prazo_vencido) {
      where.prazo = { lt: new Date() };
      where.status = { not: 'concluida' };
    }

    return prisma.tarefas_processo.findMany({
      where,
      include: {
        processo: {
          include: {
            template: true
          }
        },
        atribuido: {
          select: { id: true, nome: true, email: true, avatar_url: true }
        }
      },
      orderBy: [
        { prioridade: 'desc' },
        { prazo: 'asc' },
        { created_at: 'asc' }
      ],
      skip: filters?.skip || 0,
      take: filters?.take || 50
    });
  }

  async listarMinhasTarefas(userId: string, filters?: any) {
    const where: any = {
      atribuido_para: userId
    };

    if (filters?.status && filters.status !== 'todas') {
      where.status = filters.status;
    }

    if (filters?.prioridade && filters.prioridade !== 'todas') {
      where.prioridade = filters.prioridade;
    }

    return prisma.tarefas_processo.findMany({
      where,
      include: {
        processo: {
          include: {
            template: true,
            responsavel: true
          }
        }
      },
      orderBy: [
        { prioridade: 'desc' },
        { prazo: 'asc' },
        { created_at: 'asc' }
      ]
    });
  }

  async criarTarefa(data: any, userId: string) {
    const validatedData = createTarefaSchema.parse(data);

    // Verificar se processo existe
    const processo = await prisma.processos.findUnique({
      where: { id: validatedData.processo_id }
    });

    if (!processo) {
      throw new AppError('Processo não encontrado', 404);
    }

    return prisma.tarefas_processo.create({
      data: validatedData,
      include: {
        processo: {
          include: {
            template: true
          }
        },
        atribuido: {
          select: { id: true, nome: true, email: true }
        }
      }
    });
  }

  async atualizarTarefa(id: string, data: any) {
    const tarefa = await prisma.tarefas_processo.findUnique({
      where: { id }
    });

    if (!tarefa) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tarefa.status === 'concluida') {
      throw new AppError('Não é possível editar tarefa concluída', 400);
    }

    return prisma.tarefas_processo.update({
      where: { id },
      data,
      include: {
        processo: {
          include: {
            template: true
          }
        },
        atribuido: true
      }
    });
  }

  async concluirTarefa(id: string, userId: string) {
    const tarefa = await prisma.tarefas_processo.findUnique({
      where: { id },
      include: {
        processo: true
      }
    });

    if (!tarefa) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tarefa.status === 'concluida') {
      throw new AppError('Tarefa já está concluída', 400);
    }

    // Atualizar tarefa
    const tarefaAtualizada = await prisma.tarefas_processo.update({
      where: { id },
      data: {
        status: 'concluida',
        concluida_em: new Date()
      },
      include: {
        processo: {
          include: {
            template: true
          }
        },
        atribuido: true
      }
    });

    // Verificar se é a última tarefa do processo
    const tarefasPendentes = await prisma.tarefas_processo.count({
      where: {
        processo_id: tarefa.processo_id,
        status: { not: 'concluida' }
      }
    });

    if (tarefasPendentes === 0) {
      // Concluir processo
      await prisma.processos.update({
        where: { id: tarefa.processo_id },
        data: {
          status: 'concluido',
          data_conclusao: new Date()
        }
      });
    } else {
      // Avançar para próxima etapa
      await this.avancarProcesso(tarefa.processo_id, userId);
    }

    return tarefaAtualizada;
  }

  async deletarTarefa(id: string) {
    const tarefa = await prisma.tarefas_processo.findUnique({
      where: { id }
    });

    if (!tarefa) {
      throw new AppError('Tarefa não encontrada', 404);
    }

    if (tarefa.status === 'concluida') {
      throw new AppError('Não é possível deletar tarefa concluída', 400);
    }

    await prisma.tarefas_processo.delete({
      where: { id }
    });
  }

  // Gatilhos de Automação
  async processarGatilho(evento: string, dados: any) {
    // Buscar templates que respondem a este gatilho
    const templates = await prisma.templates_processo.findMany({
      where: {
        gatilhos: {
          array_contains: evento
        },
        ativo: true
      }
    });

    const processosCriados = [];

    for (const template of templates) {
      try {
        const processo = await this.iniciarProcessoPorGatilho(template, dados);
        processosCriados.push(processo);
      } catch (error) {
        console.error(`Erro ao iniciar processo para template ${template.id}:`, error);
      }
    }

    return processosCriados;
  }

  private async iniciarProcessoPorGatilho(template: any, dados: any) {
    let entidadeTipo: string;
    let entidadeId: string;
    let responsavelId: string;

    // Determinar entidade baseada no evento
    switch (dados.tipo) {
      case 'lead_criado':
        entidadeTipo = 'cliente';
        entidadeId = dados.cliente_id;
        responsavelId = dados.responsavel_id;
        break;
      case 'imovel_cadastrado':
        entidadeTipo = 'imovel';
        entidadeId = dados.imovel_id;
        responsavelId = dados.criado_por;
        break;
      case 'venda_realizada':
        entidadeTipo = 'cliente';
        entidadeId = dados.cliente_id;
        responsavelId = dados.corretor_id;
        break;
      default:
        throw new AppError('Tipo de evento não reconhecido', 400);
    }

    return prisma.processos.create({
      data: {
        template_id: template.id,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        responsavel_id: responsavelId
      },
      include: {
        template: true,
        responsavel: true
      }
    });
  }

  // Dashboard e Analytics
  async getProcessosDashboard() {
    const [
      totalProcessos,
      processosAtivos,
      processosConcluidosMes,
      tarefasPendentes,
      tarefasAtrasadas,
      templatesMaisUsados
    ] = await Promise.all([
      prisma.processos.count(),
      prisma.processos.count({ where: { status: 'ativo' } }),
      prisma.processos.count({
        where: {
          status: 'concluido',
          data_conclusao: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.tarefas_processo.count({ where: { status: 'pendente' } }),
      prisma.tarefas_processo.count({
        where: {
          status: 'pendente',
          prazo: { lt: new Date() }
        }
      }),
      this.getTemplatesMaisUsados()
    ]);

    return {
      totalProcessos,
      processosAtivos,
      processosConcluidosMes,
      tarefasPendentes,
      tarefasAtrasadas,
      templatesMaisUsados
    };
  }

  private async getTemplatesMaisUsados() {
    const templates = await prisma.processos.groupBy({
      by: ['template_id'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const templatesComNomes = await Promise.all(
      templates.map(async (t) => {
        const template = await prisma.templates_processo.findUnique({
          where: { id: t.template_id },
          select: { nome: true, tipo: true }
        });
        
        return {
          ...template,
          quantidade: t._count.id
        };
      })
    );

    return templatesComNomes;
  }

  async getEficienciaProcessos() {
    // Calcular tempo médio de conclusão por tipo de processo
    const processosConcluidos = await prisma.processos.findMany({
      where: {
        status: 'concluido',
        data_conclusao: { not: null }
      },
      include: {
        template: true
      }
    });

    const eficienciaPorTipo: any = {};

    for (const processo of processosConcluidos) {
      const tipo = processo.template.tipo;
      
      if (!eficienciaPorTipo[tipo]) {
        eficienciaPorTipo[tipo] = {
          total: 0,
          tempoTotal: 0,
          tempoMedio: 0
        };
      }

      const tempoConclusao = processo.data_conclusao!.getTime() - processo.data_inicio.getTime();
      
      eficienciaPorTipo[tipo].total++;
      eficienciaPorTipo[tipo].tempoTotal += tempoConclusao;
    }

    // Calcular tempo médio em dias
    for (const tipo in eficienciaPorTipo) {
      const dados = eficienciaPorTipo[tipo];
      dados.tempoMedio = Math.round(dados.tempoTotal / dados.total / (1000 * 60 * 60 * 24));
    }

    return eficienciaPorTipo;
  }
}