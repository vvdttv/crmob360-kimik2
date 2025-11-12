import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';
import { generateCode } from '@/utils/validators';
import { z } from 'zod';

// Schemas de validação
const createImovelSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo_imovel: z.enum(['apartamento', 'casa', 'sala_comercial', 'terreno', 'galpao']),
  finalidade: z.enum(['venda', 'locacao', 'venda_locacao']),
  proprietario_id: z.string().uuid().optional(),
  
  // Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  
  // Características
  area_total: z.number().positive().optional(),
  area_util: z.number().positive().optional(),
  quartos: z.number().int().nonnegative().optional(),
  suites: z.number().int().nonnegative().optional(),
  banheiros: z.number().int().nonnegative().optional(),
  vagas_garagem: z.number().int().nonnegative().optional(),
  andar: z.number().int().positive().optional(),
  
  // Valores
  valor_venda: z.number().positive().optional(),
  valor_locacao: z.number().positive().optional(),
  valor_condominio: z.number().nonnegative().optional(),
  valor_iptu: z.number().nonnegative().optional(),
  
  // Configurações
  publicado_site: z.boolean().default(false),
  publicado_portais: z.object({}).default({}),
  fotos: z.array(z.object({})).default([]),
  videos: z.array(z.object({})).default([]),
  planta_baixa: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.object({}).default({}),
});

const updateImovelSchema = createImovelSchema.partial();

export class PropertyService {
  async listarImoveis(filters: any) {
    const where: any = {};

    // Filtros básicos
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.tipo_imovel) {
      where.tipo_imovel = filters.tipo_imovel;
    }

    if (filters.finalidade) {
      where.finalidade = filters.finalidade;
    }

    if (filters.responsavel_id) {
      where.responsavel_id = filters.responsavel_id;
    }

    if (filters.proprietario_id) {
      where.proprietario_id = filters.proprietario_id;
    }

    // Filtro de preço
    if (filters.valor_min || filters.valor_max) {
      where.OR = [];
      
      if (filters.finalidade === 'venda' || filters.finalidade === 'venda_locacao') {
        where.OR.push({
          valor_venda: {
            gte: filters.valor_min,
            lte: filters.valor_max
          }
        });
      }
      
      if (filters.finalidade === 'locacao' || filters.finalidade === 'venda_locacao') {
        where.OR.push({
          valor_locacao: {
            gte: filters.valor_min,
            lte: filters.valor_max
          }
        });
      }
    }

    // Filtro de características
    if (filters.quartos) {
      where.quartos = { gte: filters.quartos };
    }

    if (filters.banheiros) {
      where.banheiros = { gte: filters.banheiros };
    }

    if (filters.vagas_garagem) {
      where.vagas_garagem = { gte: filters.vagas_garagem };
    }

    if (filters.area_min || filters.area_max) {
      where.area_util = {};
      if (filters.area_min) where.area_util.gte = filters.area_min;
      if (filters.area_max) where.area_util.lte = filters.area_max;
    }

    // Filtro de localização
    if (filters.bairro) {
      where.bairro = { contains: filters.bairro, mode: 'insensitive' };
    }

    if (filters.cidade) {
      where.cidade = { contains: filters.cidade, mode: 'insensitive' };
    }

    if (filters.uf) {
      where.uf = filters.uf.toUpperCase();
    }

    // Filtro de busca textual
    if (filters.search) {
      where.OR = [
        { titulo: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
        { bairro: { contains: filters.search, mode: 'insensitive' } },
        { cidade: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [imoveis, total] = await Promise.all([
      prisma.imoveis.findMany({
        where,
        include: {
          proprietario: {
            select: { id: true, nome: true, email: true, telefone: true }
          },
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
      prisma.imoveis.count({ where })
    ]);

    return {
      data: imoveis,
      total,
      page: Math.floor((filters.skip || 0) / (filters.take || 20)) + 1,
      pages: Math.ceil(total / (filters.take || 20))
    };
  }

  async buscarImovel(id: string) {
    const imovel = await prisma.imoveis.findUnique({
      where: { id },
      include: {
        proprietario: true,
        responsavel: true,
        criador: true,
        chaves: {
          include: {
            usuario: true
          }
        },
        documentos: {
          include: {
            usuario: true
          }
        }
      }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    return imovel;
  }

  async buscarImovelPorCodigo(codigo: string) {
    const imovel = await prisma.imoveis.findUnique({
      where: { codigo },
      include: {
        proprietario: true,
        responsavel: true,
        criador: true
      }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    return imovel;
  }

  async criarImovel(data: any, userId: string) {
    const validatedData = createImovelSchema.parse(data);

    // Verificar se proprietário existe
    if (validatedData.proprietario_id) {
      const proprietario = await prisma.clientes.findUnique({
        where: { id: validatedData.proprietario_id }
      });

      if (!proprietario) {
        throw new AppError('Proprietário não encontrado', 404);
      }
    }

    // Gerar código único
    let codigo = generateCode('IM', 6);
    let tentativas = 0;
    
    while (tentativas < 10) {
      const existing = await prisma.imoveis.findUnique({
        where: { codigo }
      });
      
      if (!existing) break;
      
      codigo = generateCode('IM', 6);
      tentativas++;
    }

    if (tentativas >= 10) {
      throw new AppError('Não foi possível gerar código único', 500);
    }

    // Criar imóvel
    const imovel = await prisma.imoveis.create({
      data: {
        ...validatedData,
        codigo,
        criado_por: userId,
      },
      include: {
        proprietario: true,
        responsavel: true,
        criador: true
      }
    });

    return imovel;
  }

  async atualizarImovel(id: string, data: any) {
    const validatedData = updateImovelSchema.parse(data);

    // Verificar se proprietário existe
    if (validatedData.proprietario_id) {
      const proprietario = await prisma.clientes.findUnique({
        where: { id: validatedData.proprietario_id }
      });

      if (!proprietario) {
        throw new AppError('Proprietário não encontrado', 404);
      }
    }

    const imovel = await prisma.imoveis.update({
      where: { id },
      data: validatedData,
      include: {
        proprietario: true,
        responsavel: true,
        criador: true
      }
    });

    return imovel;
  }

  async deletarImovel(id: string) {
    // Verificar se imóvel tem relacionamentos ativos
    const imovel = await prisma.imoveis.findUnique({
      where: { id },
      include: {
        contratos: {
          where: { status: 'ativo' }
        },
        propostas: {
          where: { status: { in: ['pendente', 'aceita'] } }
        }
      }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    if (imovel.contratos.length > 0 || imovel.propostas.length > 0) {
      throw new AppError('Imóvel não pode ser deletado pois tem relacionamentos ativos', 400);
    }

    await prisma.imoveis.delete({
      where: { id }
    });
  }

  // Publicação em portais
  async publicarImovel(id: string, portais: string[], userId: string) {
    const imovel = await prisma.imoveis.findUnique({
      where: { id }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    const publicadoPortais: any = {};
    
    portais.forEach(portal => {
      publicadoPortais[portal] = true;
    });

    const updatedImovel = await prisma.imoveis.update({
      where: { id },
      data: {
        publicado_portais: {
          ...imovel.publicado_portais,
          ...publicadoPortais
        }
      }
    });

    // Registrar atividade
    await prisma.atividades.create({
      data: {
        cliente_id: imovel.proprietario_id || '',
        tipo: 'nota',
        descricao: `Imóvel ${imovel.codigo} publicado em: ${portais.join(', ')}`,
        realizado_por: userId
      }
    });

    return updatedImovel;
  }

  // Chaves
  async listarChaves(imovelId?: string) {
    const where: any = {};
    
    if (imovelId) {
      where.imovel_id = imovelId;
    }

    return prisma.imovel_chaves.findMany({
      where,
      include: {
        imovel: {
          select: { id: true, titulo: true, codigo: true }
        },
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async emprestarChave(imovelId: string, usuarioId: string) {
    const chave = await prisma.imovel_chaves.findFirst({
      where: {
        imovel_id: imovelId,
        status: 'disponivel'
      }
    });

    if (!chave) {
      throw new AppError('Chave não disponível', 400);
    }

    return prisma.imovel_chaves.update({
      where: { id: chave.id },
      data: {
        status: 'emprestada',
        emprestada_para: usuarioId,
        data_emprestimo: new Date()
      },
      include: {
        imovel: true,
        usuario: true
      }
    });
  }

  async devolverChave(imovelId: string, usuarioId: string) {
    const chave = await prisma.imovel_chaves.findFirst({
      where: {
        imovel_id: imovelId,
        status: 'emprestada',
        emprestada_para: usuarioId
      }
    });

    if (!chave) {
      throw new AppError('Chave não encontrada ou não está com este usuário', 400);
    }

    return prisma.imovel_chaves.update({
      where: { id: chave.id },
      data: {
        status: 'disponivel',
        emprestada_para: null,
        data_emprestimo: null,
        data_devolucao: new Date()
      },
      include: {
        imovel: true,
        usuario: true
      }
    });
  }

  // Documentos
  async listarDocumentos(imovelId?: string) {
    const where: any = {};
    
    if (imovelId) {
      where.imovel_id = imovelId;
    }

    // Verificar documentos próximos do vencimento
    const hoje = new Date();
    const alertaVencimento = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias

    return prisma.imovel_documentos.findMany({
      where: {
        ...where,
        OR: [
          { data_vencimento: null },
          { data_vencimento: { gte: hoje } }
        ]
      },
      include: {
        imovel: {
          select: { id: true, titulo: true, codigo: true }
        },
        usuario: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { data_vencimento: 'asc' }
    });
  }

  async criarDocumento(data: any, userId: string) {
    return prisma.imovel_documentos.create({
      data: {
        ...data,
        uploaded_por: userId
      },
      include: {
        imovel: true,
        usuario: true
      }
    });
  }

  // Analytics
  async getEstoqueAnalytics() {
    const [
      totalImoveis,
      imoveisDisponiveis,
      imoveisVendidos,
      imoveisAlugados,
      tempoMedioEstoque,
      ticketMedio
    ] = await Promise.all([
      prisma.imoveis.count(),
      prisma.imoveis.count({ where: { status: 'disponivel' } }),
      prisma.imoveis.count({ where: { status: 'vendido' } }),
      prisma.imoveis.count({ where: { status: 'alugado' } }),
      this.calcularTempoMedioEstoque(),
      this.calcularTicketMedio()
    ]);

    return {
      totalImoveis,
      imoveisDisponiveis,
      imoveisVendidos,
      imoveisAlugados,
      tempoMedioEstoque,
      ticketMedio
    };
  }

  private async calcularTempoMedioEstoque(): Promise<number> {
    // Implementar cálculo baseado em histórico de vendas/locações
    // Por enquanto, retornar valor de exemplo
    return 45; // dias
  }

  private async calcularTicketMedio(): Promise<number> {
    const imoveisVenda = await prisma.imoveis.findMany({
      where: { 
        status: 'disponivel',
        valor_venda: { not: null }
      },
      select: { valor_venda: true }
    });

    if (imoveisVenda.length === 0) return 0;

    const total = imoveisVenda.reduce((sum, imovel) => sum + (imovel.valor_venda || 0), 0);
    return total / imoveisVenda.length;
  }

  // Matching de imóveis com clientes
  async buscarImoveisCompativeis(clienteId: string, limite: number = 10) {
    const cliente = await prisma.clientes.findUnique({
      where: { id },
      select: { perfil_busca: true }
    });

    if (!cliente || !cliente.perfil_busca) {
      throw new AppError('Perfil de busca não encontrado', 404);
    }

    const perfil = cliente.perfil_busca as any;
    const where: any = { status: 'disponivel' };

    // Aplicar filtros do perfil
    if (perfil.tipo_imovel) {
      where.tipo_imovel = perfil.tipo_imovel;
    }

    if (perfil.bairros && perfil.bairros.length > 0) {
      where.bairro = { in: perfil.bairros };
    }

    if (perfil.valor_maximo) {
      where.OR = [
        { valor_venda: { lte: perfil.valor_maximo } },
        { valor_locacao: { lte: perfil.valor_maximo } }
      ];
    }

    if (perfil.quartos_min) {
      where.quartos = { gte: perfil.quartos_min };
    }

    const imoveis = await prisma.imoveis.findMany({
      where,
      include: {
        proprietario: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        responsavel: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { updated_at: 'desc' },
      take: limite
    });

    // Calcular score de compatibilidade
    const imoveisComScore = imoveis.map(imovel => ({
      ...imovel,
      score_compatibilidade: this.calcularScoreCompatibilidade(imovel, perfil)
    }));

    // Ordenar por score
    return imoveisComScore.sort((a, b) => b.score_compatibilidade - a.score_compatibilidade);
  }

  private calcularScoreCompatibilidade(imovel: any, perfil: any): number {
    let score = 0;
    let fatores = 0;

    // Tipo de imóvel
    if (perfil.tipo_imovel && imovel.tipo_imovel === perfil.tipo_imovel) {
      score += 30;
    }
    fatores += 30;

    // Bairro
    if (perfil.bairros && perfil.bairros.includes(imovel.bairro)) {
      score += 25;
    }
    fatores += 25;

    // Preço
    if (perfil.valor_maximo) {
      const valor = imovel.valor_venda || imovel.valor_locacao || 0;
      if (valor <= perfil.valor_maximo) {
        score += 25;
      }
    }
    fatores += 25;

    // Quartos
    if (perfil.quartos_min && imovel.quartos >= perfil.quartos_min) {
      score += 20;
    }
    fatores += 20;

    return fatores > 0 ? (score / fatores) * 100 : 0;
  }
}