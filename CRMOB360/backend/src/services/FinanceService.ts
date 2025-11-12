import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';
import { z } from 'zod';
import { addDays, addMonths, format, isAfter, isBefore } from 'date-fns';

// Schemas de validação
const createContaSchema = z.object({
  tipo: z.enum(['pagar', 'receber']),
  plano_conta_id: z.string().uuid(),
  centro_custo_id: z.string().uuid().optional(),
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor_original: z.number().positive('Valor deve ser positivo'),
  data_emissao: z.string().datetime(),
  data_vencimento: z.string().datetime(),
  cliente_id: z.string().uuid().optional(),
  contrato_id: z.string().uuid().optional(),
  imovel_id: z.string().uuid().optional(),
  gateway_pagamento: z.string().optional(),
});

const updateContaSchema = createContaSchema.partial();

const createComissaoSchema = z.object({
  venda_id: z.string().uuid().optional(),
  locacao_id: z.string().uuid().optional(),
  corretor_vendedor_id: z.string().uuid().optional(),
  corretor_captador_id: z.string().uuid().optional(),
  gerente_id: z.string().uuid().optional(),
  valor_total: z.number().positive('Valor total deve ser positivo'),
  percentual_imobiliaria: z.number().min(0).max(100).default(40),
  percentual_vendedor: z.number().min(0).max(100).default(40),
  percentual_captador: z.number().min(0).max(100).default(15),
  percentual_gerente: z.number().min(0).max(100).default(5),
});

export class FinanceService {
  // Contas a Pagar/Receber
  async listarContas(filters: any) {
    const where: any = {};

    if (filters.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plano_conta_id) {
      where.plano_conta_id = filters.plano_conta_id;
    }

    if (filters.centro_custo_id) {
      where.centro_custo_id = filters.centro_custo_id;
    }

    if (filters.cliente_id) {
      where.cliente_id = filters.cliente_id;
    }

    if (filters.data_inicio || filters.data_fim) {
      where.data_vencimento = {};
      if (filters.data_inicio) {
        where.data_vencimento.gte = new Date(filters.data_inicio);
      }
      if (filters.data_fim) {
        where.data_vencimento.lte = new Date(filters.data_fim);
      }
    }

    const [contas, total] = await Promise.all([
      prisma.contas_financeiras.findMany({
        where,
        include: {
          plano_conta: true,
          centro_custo: true,
          cliente: {
            select: { id: true, nome: true, email: true, telefone: true }
          },
          contrato: {
            include: {
              imovel: {
                select: { id: true, titulo: true, codigo: true }
              }
            }
          },
          imovel: {
            select: { id: true, titulo: true, codigo: true }
          }
        },
        orderBy: { data_vencimento: 'asc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
      }),
      prisma.contas_financeiras.count({ where })
    ]);

    return {
      data: contas,
      total,
      page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
      pages: Math.ceil(total / (filters.take || 50))
    };
  }

  async buscarConta(id: string) {
    const conta = await prisma.contas_financeiras.findUnique({
      where: { id },
      include: {
        plano_conta: true,
        centro_custo: true,
        cliente: true,
        contrato: {
          include: {
            imovel: true
          }
        },
        imovel: true
      }
    });

    if (!conta) {
      throw new AppError('Conta não encontrada', 404);
    }

    return conta;
  }

  async criarConta(data: any, userId: string) {
    const validatedData = createContaSchema.parse(data);

    // Validar data de vencimento
    if (isBefore(new Date(validatedData.data_vencimento), new Date(validatedData.data_emissao))) {
      throw new AppError('Data de vencimento não pode ser anterior à data de emissão', 400);
    }

    // Verificar se plano de conta existe
    const planoConta = await prisma.plano_contas.findUnique({
      where: { id: validatedData.plano_conta_id }
    });

    if (!planoConta) {
      throw new AppError('Plano de conta não encontrado', 404);
    }

    // Verificar centro de custo se fornecido
    if (validatedData.centro_custo_id) {
      const centroCusto = await prisma.centros_custo.findUnique({
        where: { id: validatedData.centro_custo_id }
      });

      if (!centroCusto) {
        throw new AppError('Centro de custo não encontrado', 404);
      }
    }

    // Gerar número de documento
    const numeroDocumento = this.gerarNumeroDocumento();

    const conta = await prisma.contas_financeiras.create({
      data: {
        ...validatedData,
        numero_documento: numeroDocumento,
        criado_por: userId,
      },
      include: {
        plano_conta: true,
        centro_custo: true,
        cliente: true,
        contrato: {
          include: {
            imovel: true
          }
        },
        imovel: true
      }
    });

    return conta;
  }

  async atualizarConta(id: string, data: any) {
    const validatedData = updateContaSchema.parse(data);

    const conta = await prisma.contas_financeiras.update({
      where: { id },
      data: validatedData,
      include: {
        plano_conta: true,
        centro_custo: true,
        cliente: true,
        contrato: {
          include: {
            imovel: true
          }
        },
        imovel: true
      }
    });

    return conta;
  }

  async baixarConta(id: string, valorPago: number, dataPagamento?: Date) {
    const conta = await prisma.contas_financeiras.findUnique({
      where: { id }
    });

    if (!conta) {
      throw new AppError('Conta não encontrada', 404);
    }

    if (conta.status === 'pago') {
      throw new AppError('Conta já está paga', 400);
    }

    const novoValorPago = conta.valor_pago + valorPago;
    const status = novoValorPago >= conta.valor_original ? 'pago' : 'parcial';

    const updatedConta = await prisma.contas_financeiras.update({
      where: { id },
      data: {
        valor_pago: novoValorPago,
        data_pagamento: dataPagamento || new Date(),
        status
      },
      include: {
        plano_conta: true,
        centro_custo: true,
        cliente: true,
        contrato: {
          include: {
            imovel: true
          }
        },
        imovel: true
      }
    });

    return updatedConta;
  }

  async deletarConta(id: string) {
    const conta = await prisma.contas_financeiras.findUnique({
      where: { id }
    });

    if (!conta) {
      throw new AppError('Conta não encontrada', 404);
    }

    if (conta.status === 'pago') {
      throw new AppError('Não é possível deletar conta paga', 400);
    }

    await prisma.contas_financeiras.delete({
      where: { id }
    });
  }

  // Plano de Contas
  async listarPlanoContas() {
    return prisma.plano_contas.findMany({
      where: { ativo: true },
      include: {
        parent: true,
        children: true
      },
      orderBy: { codigo: 'asc' }
    });
  }

  async criarPlanoConta(data: any) {
    return prisma.plano_contas.create({
      data,
      include: {
        parent: true,
        children: true
      }
    });
  }

  // Centros de Custo
  async listarCentrosCusto() {
    return prisma.centros_custo.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });
  }

  async criarCentroCusto(data: any) {
    return prisma.centros_custo.create({
      data
    });
  }

  // Comissões
  async listarComissoes(filters: any) {
    const where: any = {};

    if (filters.corretor_id) {
      where.OR = [
        { corretor_vendedor_id: filters.corretor_id },
        { corretor_captador_id: filters.corretor_id },
        { gerente_id: filters.corretor_id }
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.mes_referencia) {
      const [ano, mes] = filters.mes_referencia.split('-');
      where.created_at = {
        gte: new Date(parseInt(ano), parseInt(mes) - 1, 1),
        lt: new Date(parseInt(ano), parseInt(mes), 1)
      };
    }

    return prisma.comissoes.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: filters.skip || 0,
      take: filters.take || 20,
    });
  }

  async calcularComissao(data: any, userId: string) {
    const validatedData = createComissaoSchema.parse(data);

    // Verificar se existe venda ou locação
    if (!validatedData.venda_id && !validatedData.locacao_id) {
      throw new AppError('É necessário informar venda_id ou locacao_id', 400);
    }

    // Verificar se já existe comissão para esta venda/locação
    const existingComissao = await prisma.comissoes.findFirst({
      where: {
        OR: [
          { venda_id: validatedData.venda_id },
          { locacao_id: validatedData.locacao_id }
        ].filter(Boolean)
      }
    });

    if (existingComissao) {
      throw new AppError('Comissão já calculada para esta operação', 409);
    }

    // Calcular valores individuais
    const valorImobiliaria = (validatedData.valor_total * validatedData.percentual_imobiliaria) / 100;
    const valorVendedor = (validatedData.valor_total * validatedData.percentual_vendedor) / 100;
    const valorCaptador = (validatedData.valor_total * validatedData.percentual_captador) / 100;
    const valorGerente = (validatedData.valor_total * validatedData.percentual_gerente) / 100;

    // Gerar número da comissão
    const numeroComissao = this.gerarNumeroComissao();

    const comissao = await prisma.comissoes.create({
      data: {
        ...validatedData,
        numero_comissao: numeroComissao,
        valor_imobiliaria,
        valor_vendedor,
        valor_captador,
        valor_gerente,
        calculada_por: userId
      }
    });

    // Criar contas a pagar para cada corretor
    await this.criarContasComissao(comissao);

    return comissao;
  }

  private async criarContasComissao(comissao: any) {
    const contas = [];

    // Buscar plano de conta para comissões
    const planoContaComissao = await prisma.plano_contas.findFirst({
      where: { 
        nome: { contains: 'comissão', mode: 'insensitive' },
        tipo: 'despesa'
      }
    });

    if (!planoContaComissao) {
      throw new AppError('Plano de conta para comissões não encontrado', 404);
    }

    // Criar conta para corretor vendedor
    if (comissao.corretor_vendedor_id && comissao.valor_vendedor > 0) {
      contas.push({
        tipo: 'pagar',
        plano_conta_id: planoContaComissao.id,
        descricao: `Comissão - Corretor Vendedor - ${comissao.numero_comissao}`,
        valor_original: comissao.valor_vendedor,
        data_emissao: new Date(),
        data_vencimento: addDays(new Date(), 5), // D+5
        criado_por: comissao.calculada_por
      });
    }

    // Criar conta para corretor captador
    if (comissao.corretor_captador_id && comissao.valor_captador > 0) {
      contas.push({
        tipo: 'pagar',
        plano_conta_id: planoContaComissao.id,
        descricao: `Comissão - Corretor Captador - ${comissao.numero_comissao}`,
        valor_original: comissao.valor_captador,
        data_emissao: new Date(),
        data_vencimento: addDays(new Date(), 5),
        criado_por: comissao.calculada_por
      });
    }

    // Criar conta para gerente
    if (comissao.gerente_id && comissao.valor_gerente > 0) {
      contas.push({
        tipo: 'pagar',
        plano_conta_id: planoContaComissao.id,
        descricao: `Comissão - Gerente - ${comissao.numero_comissao}`,
        valor_original: comissao.valor_gerente,
        data_emissao: new Date(),
        data_vencimento: addDays(new Date(), 5),
        criado_por: comissao.calculada_por
      });
    }

    // Criar todas as contas
    for (const contaData of contas) {
      await prisma.contas_financeiras.create({
        data: contaData
      });
    }
  }

  // DRE (Demonstração de Resultado)
  async gerarDRE(mes: number, ano: number) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const contas = await prisma.contas_financeiras.findMany({
      where: {
        data_emissao: {
          gte: dataInicio,
          lte: dataFim
        }
      },
      include: {
        plano_conta: true
      }
    });

    // Agrupar por tipo e categoria
    const receitas = contas.filter(c => c.plano_conta.tipo === 'receita');
    const despesas = contas.filter(c => c.plano_conta.tipo === 'despesa');

    const totalReceitas = receitas.reduce((sum, conta) => sum + conta.valor_original, 0);
    const totalDespesas = despesas.reduce((sum, conta) => sum + conta.valor_original, 0);

    // Agrupar por categoria
    const receitasPorCategoria = this.agruparPorCategoria(receitas);
    const despesasPorCategoria = this.agruparPorCategoria(despesas);

    // Comparativo com mês anterior
    const mesAnterior = new Date(ano, mes - 2, 1);
    const mesAnteriorFim = new Date(ano, mes - 1, 0);
    
    const contasMesAnterior = await prisma.contas_financeiras.findMany({
      where: {
        data_emissao: {
          gte: mesAnterior,
          lte: mesAnteriorFim
        }
      },
      include: {
        plano_conta: true
      }
    });

    const receitasMesAnterior = contasMesAnterior
      .filter(c => c.plano_conta.tipo === 'receita')
      .reduce((sum, conta) => sum + conta.valor_original, 0);
    
    const despesasMesAnterior = contasMesAnterior
      .filter(c => c.plano_conta.tipo === 'despesa')
      .reduce((sum, conta) => sum + conta.valor_original, 0);

    return {
      periodo: `${mes}/${ano}`,
      receitas: {
        total: totalReceitas,
        por_categoria: receitasPorCategoria
      },
      despesas: {
        total: totalDespesas,
        por_categoria: despesasPorCategoria
      },
      resultado_bruto: totalReceitas - totalDespesas,
      comparativo_mes_anterior: {
        receitas: receitasMesAnterior,
        despesas: despesasMesAnterior,
        variacao_receitas: receitasMesAnterior > 0 ? ((totalReceitas - receitasMesAnterior) / receitasMesAnterior) * 100 : 0,
        variacao_despesas: despesasMesAnterior > 0 ? ((totalDespesas - despesasMesAnterior) / despesasMesAnterior) * 100 : 0
      }
    };
  }

  private agruparPorCategoria(contas: any[]): any {
    const agrupado: any = {};
    
    for (const conta of contas) {
      const categoria = conta.plano_conta.categoria || 'outros';
      if (!agrupado[categoria]) {
        agrupado[categoria] = {
          total: 0,
          contas: []
        };
      }
      
      agrupado[categoria].total += conta.valor_original;
      agrupado[categoria].contas.push(conta);
    }
    
    return agrupado;
  }

  // Métodos auxiliares
  private gerarNumeroDocumento(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DOC${timestamp.slice(-6)}${random}`;
  }

  private gerarNumeroComissao(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `COM${timestamp.slice(-6)}${random}`;
  }

  // Relatórios
  async getInadimplencia() {
    const hoje = new Date();
    
    const contasAtrasadas = await prisma.contas_financeiras.findMany({
      where: {
        data_vencimento: { lt: hoje },
        status: { in: ['pendente', 'parcial'] },
        tipo: 'receber'
      },
      include: {
        cliente: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        contrato: {
          include: {
            imovel: {
              select: { id: true, titulo: true, codigo: true }
            }
          }
        }
      },
      orderBy: { data_vencimento: 'asc' }
    });

    const totalAtrasado = contasAtrasadas.reduce((sum, conta) => 
      sum + (conta.valor_original - conta.valor_pago), 0);

    return {
      total_contas: contasAtrasadas.length,
      total_atrasado: totalAtrasado,
      contas: contasAtrasadas
    };
  }

  async getRecebimentosPrevistos(filters: any) {
    const where: any = {
      tipo: 'receber',
      status: { in: ['pendente', 'parcial'] }
    };

    if (filters.data_inicio || filters.data_fim) {
      where.data_vencimento = {};
      if (filters.data_inicio) {
        where.data_vencimento.gte = new Date(filters.data_inicio);
      }
      if (filters.data_fim) {
        where.data_vencimento.lte = new Date(filters.data_fim);
      }
    }

    const contas = await prisma.contas_financeiras.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        contrato: {
          include: {
            imovel: {
              select: { id: true, titulo: true, codigo: true }
            }
          }
        }
      },
      orderBy: { data_vencimento: 'asc' }
    });

    const totalPrevisto = contas.reduce((sum, conta) => 
      sum + (conta.valor_original - conta.valor_pago), 0);

    return {
      total_contas: contas.length,
      total_previsto: totalPrevisto,
      contas
    };
  }
}