import prisma from '@/config/database';
import { AppError } from '@/utils/AppError';
import { z } from 'zod';

// Interfaces para IA
interface LeadProfile {
  tipo_imovel?: string;
  finalidade?: 'venda' | 'locacao';
  bairros?: string[];
  valor_minimo?: number;
  valor_maximo?: number;
  quartos_min?: number;
  quartos_max?: number;
  area_min?: number;
  area_max?: number;
  caracteristicas?: string[];
}

interface LeadScoringFactors {
  origem: number;
  tempo_resposta: number;
  interacoes: number;
  perfil_completo: number;
  orcamento_alinhado: number;
  visitas_agendadas: number;
  documentacao: number;
}

export class AIProcessingService {
  // Lead Scoring Preditivo
  async calcularScoreLead(clienteId: string): Promise<{
    score: number;
    classificacao: string;
    fatores: LeadScoringFactors;
    sugestoes: string[];
  }> {
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      include: {
        atividades: {
          orderBy: { data_hora: 'desc' },
          take: 20
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

    const fatores: LeadScoringFactors = {
      origem: this.calcularScoreOrigem(cliente.origem),
      tempo_resposta: await this.calcularScoreTempoResposta(clienteId),
      interacoes: this.calcularScoreInteracoes(cliente.atividades),
      perfil_completo: this.calcularScorePerfil(cliente),
      orcamento_alinhado: await this.calcularScoreOrcamento(cliente),
      visitas_agendadas: await this.calcularScoreVisitas(clienteId),
      documentacao: await this.calcularScoreDocumentacao(clienteId)
    };

    // Calcular score ponderado
    const pesos = {
      origem: 0.15,
      tempo_resposta: 0.20,
      interacoes: 0.15,
      perfil_completo: 0.15,
      orcamento_alinhado: 0.20,
      visitas_agendadas: 0.10,
      documentacao: 0.05
    };

    let score = 0;
    for (const [fator, valor] of Object.entries(fatores)) {
      score += valor * (pesos[fator as keyof LeadScoringFactors] || 0);
    }

    const classificacao = this.classificarLead(score);
    const sugestoes = this.gerarSugestoes(score, fatores);

    // Atualizar score no banco
    await prisma.clientes.update({
      where: { id: clienteId },
      data: { score_ia: Math.round(score) }
    });

    return {
      score: Math.round(score),
      classificacao,
      fatores,
      sugestoes
    };
  }

  private calcularScoreOrigem(origem?: string): number {
    const scoresOrigem: { [key: string]: number } = {
      'indicacao': 100,
      'site_proprio': 80,
      'whatsapp': 70,
      'facebook': 60,
      'google_ads': 50,
      'portal_imobiliario': 40,
      'outros': 30
    };

    return scoresOrigem[origem || 'outros'] || 30;
  }

  private async calcularScoreTempoResposta(clienteId: string): Promise<number> {
    const atividades = await prisma.atividades.findMany({
      where: {
        cliente_id: clienteId,
        tipo: { in: ['ligacao', 'email', 'whatsapp'] }
      },
      orderBy: { data_hora: 'desc' },
      take: 5
    });

    if (atividades.length === 0) return 50; // Score neutro

    // Verificar tempo de resposta médio
    // Implementação simplificada - em produção, usar análise mais sofisticada
    const temResposta = atividades.some(a => a.resultado === 'sucesso');
    return temResposta ? 90 : 30;
  }

  private calcularScoreInteracoes(atividades: any[]): number {
    const numInteracoes = atividades.length;
    
    if (numInteracoes >= 10) return 100;
    if (numInteracoes >= 5) return 80;
    if (numInteracoes >= 3) return 60;
    if (numInteracoes >= 1) return 40;
    return 20;
  }

  private calcularScorePerfil(cliente: any): number {
    let score = 0;
    let camposPreenchidos = 0;
    let camposTotais = 0;

    // Verificar campos básicos
    if (cliente.nome) { camposPreenchidos++; camposTotais++; }
    if (cliente.email) { camposPreenchidos++; camposTotais++; }
    if (cliente.telefone) { camposPreenchidos++; camposTotais++; }
    if (cliente.cpf_cnpj) { camposPreenchidos++; camposTotais++; }
    
    // Verificar perfil de busca
    if (cliente.perfil_busca && Object.keys(cliente.perfil_busca).length > 0) {
      camposPreenchidos += Object.keys(cliente.perfil_busca).length;
      camposTotais += 5; // Assumindo 5 campos principais no perfil
    }

    score = camposTotais > 0 ? (camposPreenchidos / camposTotais) * 100 : 0;
    return Math.round(score);
  }

  private async calcularScoreOrcamento(cliente: any): Promise<number> {
    const perfil = cliente.perfil_busca as LeadProfile;
    
    if (!perfil || !perfil.valor_maximo) {
      return 50; // Score neutro
    }

    // Buscar imóveis compatíveis
    const imoveisCompativeis = await this.buscarImoveisCompativeis(cliente.id, 20);
    
    if (imoveisCompativeis.length === 0) {
      return 30; // Score baixo
    }

    const scoreMedio = imoveisCompativeis.reduce((sum, imovel) => 
      sum + (imovel.score_compatibilidade || 0), 0) / imoveisCompativeis.length;
    
    return Math.round(scoreMedio);
  }

  private async calcularScoreVisitas(clienteId: string): Promise<number> {
    const visitas = await prisma.atividades.count({
      where: {
        cliente_id: clienteId,
        tipo: 'visita'
      }
    });

    if (visitas >= 3) return 100;
    if (visitas >= 2) return 80;
    if (visitas >= 1) return 60;
    return 40;
  }

  private async calcularScoreDocumentacao(clienteId: string): Promise<number> {
    // Verificar se cliente tem documentação completa
    // Implementação simplificada
    return 70; // Score intermediário
  }

  private classificarLead(score: number): string {
    if (score >= 80) return 'Quente';
    if (score >= 60) return 'Morno';
    if (score >= 40) return 'Frio';
    return 'Congelado';
  }

  private gerarSugestoes(score: number, fatores: LeadScoringFactors): string[] {
    const sugestoes: string[] = [];

    if (fatores.perfil_completo < 60) {
      sugestoes.push('Complete o perfil do cliente com mais informações');
    }

    if (fatores.interacoes < 40) {
      sugestoes.push('Aumente a frequência de contato com o cliente');
    }

    if (fatores.visitas_agendadas < 60) {
      sugestoes.push('Agende visitas para aumentar o engajamento');
    }

    if (fatores.tempo_resposta < 60) {
      sugestoes.push('Melhore o tempo de resposta às comunicações');
    }

    if (score < 60) {
      sugestoes.push('Considere incluir o lead em campanhas de nutrição');
    }

    return sugestoes;
  }

  // Matching de imóveis
  async buscarImoveisCompativeis(clienteId: string, limite: number = 10) {
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      select: { perfil_busca: true }
    });

    if (!cliente || !cliente.perfil_busca) {
      return [];
    }

    const perfil = cliente.perfil_busca as LeadProfile;
    
    // Buscar imóveis com filtros
    const where: any = { status: 'disponivel' };

    if (perfil.tipo_imovel) {
      where.tipo_imovel = perfil.tipo_imovel;
    }

    if (perfil.finalidade) {
      where.finalidade = perfil.finalidade;
    }

    if (perfil.bairros && perfil.bairros.length > 0) {
      where.bairro = { in: perfil.bairros };
    }

    if (perfil.valor_minimo || perfil.valor_maximo) {
      where.OR = [];
      
      if (perfil.valor_minimo) {
        where.OR.push(
          { valor_venda: { gte: perfil.valor_minimo } },
          { valor_locacao: { gte: perfil.valor_minimo } }
        );
      }
      
      if (perfil.valor_maximo) {
        where.OR.push(
          { valor_venda: { lte: perfil.valor_maximo } },
          { valor_locacao: { lte: perfil.valor_maximo } }
        );
      }
    }

    if (perfil.quartos_min) {
      where.quartos = { gte: perfil.quartos_min };
    }

    if (perfil.quartos_max) {
      where.quartos = { ...where.quartos, lte: perfil.quartos_max };
    }

    if (perfil.area_min) {
      where.area_util = { gte: perfil.area_min };
    }

    if (perfil.area_max) {
      where.area_util = { ...where.area_util, lte: perfil.area_max };
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
    const imoveisComScore = imoveis.map(imovel => {
      const score = this.calcularScoreCompatibilidade(imovel, perfil);
      const motivos = this.gerarMotivosCompatibilidade(imovel, perfil, score);
      
      return {
        ...imovel,
        score_compatibilidade: score,
        motivos
      };
    });

    // Ordenar por score
    return imoveisComScore.sort((a, b) => b.score_compatibilidade - a.score_compatibilidade);
  }

  private calcularScoreCompatibilidade(imovel: any, perfil: LeadProfile): number {
    let score = 0;
    let maxScore = 0;

    // Tipo de imóvel (peso 25%)
    maxScore += 25;
    if (perfil.tipo_imovel && imovel.tipo_imovel === perfil.tipo_imovel) {
      score += 25;
    }

    // Finalidade (peso 20%)
    maxScore += 20;
    if (perfil.finalidade && imovel.finalidade === perfil.finalidade) {
      score += 20;
    } else if (perfil.finalidade && imovel.finalidade === 'venda_locacao') {
      score += 15;
    }

    // Bairro (peso 20%)
    maxScore += 20;
    if (perfil.bairros && perfil.bairros.includes(imovel.bairro)) {
      score += 20;
    }

    // Preço (peso 15%)
    maxScore += 15;
    const valor = imovel.valor_venda || imovel.valor_locacao || 0;
    if (perfil.valor_minimo && perfil.valor_maximo) {
      if (valor >= perfil.valor_minimo && valor <= perfil.valor_maximo) {
        score += 15;
      }
    } else if (perfil.valor_maximo && valor <= perfil.valor_maximo) {
      score += 15;
    } else if (perfil.valor_minimo && valor >= perfil.valor_minimo) {
      score += 15;
    }

    // Quartos (peso 10%)
    maxScore += 10;
    if (perfil.quartos_min && perfil.quartos_max) {
      if (imovel.quartos >= perfil.quartos_min && imovel.quartos <= perfil.quartos_max) {
        score += 10;
      }
    } else if (perfil.quartos_min && imovel.quartos >= perfil.quartos_min) {
      score += 10;
    }

    // Área (peso 10%)
    maxScore += 10;
    if (perfil.area_min && perfil.area_max) {
      if (imovel.area_util >= perfil.area_min && imovel.area_util <= perfil.area_max) {
        score += 10;
      }
    } else if (perfil.area_min && imovel.area_util >= perfil.area_min) {
      score += 10;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  private gerarMotivosCompatibilidade(imovel: any, perfil: LeadProfile, score: number): string[] {
    const motivos: string[] = [];

    if (perfil.tipo_imovel && imovel.tipo_imovel === perfil.tipo_imovel) {
      motivos.push(`Tipo de imóvel: ${imovel.tipo_imovel}`);
    }

    if (perfil.bairros && perfil.bairros.includes(imovel.bairro)) {
      motivos.push(`Localização: ${imovel.bairro}`);
    }

    if (perfil.valor_minimo || perfil.valor_maximo) {
      const valor = imovel.valor_venda || imovel.valor_locacao || 0;
      motivos.push(`Preço: R$ ${valor.toLocaleString('pt-BR')}`);
    }

    if (imovel.quartos) {
      motivos.push(`${imovel.quartos} quarto(s)`);
    }

    if (imovel.area_util) {
      motivos.push(`${imovel.area_util}m² de área útil`);
    }

    return motivos;
  }

  // Geração de descrições
  async gerarDescricaoAnuncio(imovelId: string, tomVoz: string, palavrasChave: string[]): Promise<{
    titulo: string;
    descricao: string;
    otimizada_para_seo: boolean;
    palavras_chave_incluidas: string[];
  }> {
    const imovel = await prisma.imoveis.findUnique({
      where: { id: imovelId },
      include: {
        proprietario: true
      }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    // Gerar título baseado no tipo e características
    const titulo = this.gerarTitulo(imovel, tomVoz);
    
    // Gerar descrição detalhada
    const descricao = this.gerarDescricao(imovel, tomVoz, palavrasChave);
    
    // Verificar SEO
    const otimizada = this.verificarSEO(titulo, descricao, palavrasChave);
    
    // Identificar palavras-chave incluídas
    const palavrasIncluidas = this.identificarPalavrasChave(descricao, palavrasChave);

    return {
      titulo,
      descricao,
      otimizada_para_seo: otimizada,
      palavras_chave_incluidas: palavrasIncluidas
    };
  }

  private gerarTitulo(imovel: any, tomVoz: string): string {
    let titulo = '';

    switch (tomVoz) {
      case 'formal':
        titulo = `${imovel.tipo_imovel} de ${imovel.quartos} quartos em ${imovel.bairro}`;
        break;
      case 'descontraido':
        titulo = `Linda ${imovel.tipo_imovel} com ${imovel.quartos} quartos no coração de ${imovel.bairro}`;
        break;
      case 'luxuoso':
        titulo = `Exclusiva ${imovel.tipo_imovel} de alto padrão em ${imovel.bairro}`;
        break;
      default:
        titulo = `${imovel.tipo_imovel} ${imovel.quartos} quartos - ${imovel.bairro}`;
    }

    return titulo;
  }

  private gerarDescricao(imovel: any, tomVoz: string, palavrasChave: string[]): string {
    let descricao = '';

    // Introdução
    switch (tomVoz) {
      case 'formal':
        descricao = `Apresentamos este excelente ${imovel.tipo_imovel} localizado estrategicamente em ${imovel.bairro}. `;
        break;
      case 'descontraido':
        descricao = `Seja bem-vindo a este incrível ${imovel.tipo_imovel} que pode ser o seu novo lar! Localizado no charmoso bairro de ${imovel.bairro}. `;
        break;
      case 'luxuoso':
        descricao = `Descubba o epítome do luxo e sofisticação neste extraordinário ${imovel.tipo_imovel} em ${imovel.bairro}. `;
        break;
      default:
        descricao = `Ótimo ${imovel.tipo_imovel} disponível em ${imovel.bairro}. `;
    }

    // Características
    if (imovel.quartos) {
      descricao += `Com ${imovel.quartos} quarto(s)`;
      if (imovel.suites) {
        descricao += `, sendo ${imovel.suites} suíte(s)`;
      }
      descricao += '. ';
    }

    if (imovel.banheiros) {
      descricao += `${imovel.banheiros} banheiro(s). `;
    }

    if (imovel.vagas_garagem) {
      descricao += `${imovel.vagas_garagem} vaga(s) de garagem. `;
    }

    if (imovel.area_util) {
      descricao += `Área útil de ${imovel.area_util}m². `;
    }

    if (imovel.area_total) {
      descricao += `Área total de ${imovel.area_total}m². `;
    }

    // Valores
    if (imovel.valor_venda) {
      descricao += `Valor de venda: R$ ${imovel.valor_venda.toLocaleString('pt-BR')}. `;
    }

    if (imovel.valor_locacao) {
      descricao += `Valor de locação: R$ ${imovel.valor_locacao.toLocaleString('pt-BR')}. `;
    }

    if (imovel.valor_condominio) {
      descricao += `Condomínio: R$ ${imovel.valor_condominio.toLocaleString('pt-BR')}. `;
    }

    // Finalização
    switch (tomVoz) {
      case 'formal':
        descricao += 'Agende sua visita e conheça este excelente investimento.';
        break;
      case 'descontraido':
        descricao += 'Não perca esta oportunidade! Entre em contato e agende sua visita hoje mesmo.';
        break;
      case 'luxuoso':
        descricao += 'Uma oportunidade única para quem busca o melhor em qualidade de vida.';
        break;
      default:
        descricao += 'Agende sua visita!';
    }

    return descricao;
  }

  private verificarSEO(titulo: string, descricao: string, palavrasChave: string[]): boolean {
    const textoCompleto = `${titulo} ${descricao}`.toLowerCase();
    
    // Verificar se pelo menos 50% das palavras-chave estão presentes
    const palavrasPresentes = palavrasChave.filter(palavra => 
      textoCompleto.includes(palavra.toLowerCase())
    );
    
    return (palavrasPresentes.length / palavrasChave.length) >= 0.5;
  }

  private identificarPalavrasChave(texto: string, palavrasChave: string[]): string[] {
    const textoLower = texto.toLowerCase();
    return palavrasChave.filter(palavra => 
      textoLower.includes(palavra.toLowerCase())
    );
  }

  // Precificação Inteligente (AVM)
  async calcularPrecoSugerido(imovelId: string): Promise<{
    valor_sugerido: number;
    faixa_minima: number;
    faixa_maxima: number;
    confianca: number;
    fatores: any[];
  }> {
    const imovel = await prisma.imoveis.findUnique({
      where: { id: imovelId }
    });

    if (!imovel) {
      throw new AppError('Imóvel não encontrado', 404);
    }

    // Buscar imóveis similares
    const imoveisSimilares = await prisma.imoveis.findMany({
      where: {
        id: { not: imovelId },
        tipo_imovel: imovel.tipo_imovel,
        bairro: imovel.bairro,
        status: { in: ['vendido', 'alugado'] }
      },
      orderBy: { updated_at: 'desc' },
      take: 10
    });

    // Calcular preço baseado em imóveis similares
    let valorBase = 0;
    let numComparacoes = 0;

    for (const similar of imoveisSimilares) {
      const valor = similar.valor_venda || similar.valor_locacao || 0;
      if (valor > 0) {
        valorBase += valor;
        numComparacoes++;
      }
    }

    if (numComparacoes > 0) {
      valorBase = valorBase / numComparacoes;
    } else {
      // Usar valor de mercado genérico
      valorBase = this.getValorMercadoGenerico(imovel.tipo_imovel, imovel.bairro);
    }

    // Ajustar por características
    const ajustes = this.calcularAjustes(imovel);
    const valorAjustado = valorBase * (1 + ajustes.totalPercentual);

    // Calcular faixas
    const faixaMinima = valorAjustado * 0.9;
    const faixaMaxima = valorAjustado * 1.1;

    // Calcular confiança baseada no número de comparáveis
    const confianca = Math.min(90, 50 + (numComparacoes * 10));

    return {
      valor_sugerido: Math.round(valorAjustado),
      faixa_minima: Math.round(faixaMinima),
      faixa_maxima: Math.round(faixaMaxima),
      confianca,
      fatores: ajustes.fatores
    };
  }

  private getValorMercadoGenerico(tipoImovel: string, bairro?: string): number {
    // Valores genéricos por tipo de imóvel
    const valores: { [key: string]: number } = {
      'apartamento': 350000,
      'casa': 450000,
      'sala_comercial': 200000,
      'terreno': 150000,
      'galpao': 500000
    };

    return valores[tipoImovel] || 300000;
  }

  private calcularAjustes(imovel: any): { totalPercentual: number; fatores: any[] } {
    let totalPercentual = 0;
    const fatores: any[] = [];

    // Ajuste por área
    if (imovel.area_util) {
      if (imovel.area_util > 150) {
        totalPercentual += 0.05;
        fatores.push({ tipo: 'área', descricao: 'Área acima da média', percentual: 5 });
      } else if (imovel.area_util < 50) {
        totalPercentual -= 0.05;
        fatores.push({ tipo: 'área', descricao: 'Área abaixo da média', percentual: -5 });
      }
    }

    // Ajuste por quartos
    if (imovel.quartos) {
      if (imovel.quartos >= 4) {
        totalPercentual += 0.03;
        fatores.push({ tipo: 'quartos', descricao: '4+ quartos', percentual: 3 });
      }
    }

    // Ajuste por suítes
    if (imovel.suites && imovel.suites >= 2) {
      totalPercentual += 0.02;
      fatores.push({ tipo: 'suítes', descricao: '2+ suítes', percentual: 2 });
    }

    // Ajuste por vagas
    if (imovel.vagas_garagem && imovel.vagas_garagem >= 2) {
      totalPercentual += 0.02;
      fatores.push({ tipo: 'vagas', descricao: '2+ vagas', percentual: 2 });
    }

    return { totalPercentual, fatores };
  }

  // Análise de Conversas
  async analisarConversa(clienteId: string): Promise<{
    sentimento: string;
    intencao: string;
    topicos: string[];
    urgencia: number;
    sugestoes_acao: string[];
  }> {
    const atividades = await prisma.atividades.findMany({
      where: {
        cliente_id: clienteId,
        tipo: { in: ['whatsapp', 'email', 'ligacao'] }
      },
      orderBy: { data_hora: 'desc' },
      take: 10
    });

    if (atividades.length === 0) {
      return {
        sentimento: 'neutro',
        intencao: 'sem_informacao',
        topicos: [],
        urgencia: 0,
        sugestoes_acao: ['Aguardar próximo contato']
      };
    }

    // Análise simplificada - em produção, usar NLP avançado
    const analises = atividades.map(atividade => this.analisarTexto(atividade.descricao));

    // Consolidar análises
    const sentimento = this.consolidarSentimentos(analises);
    const intencao = this.identificarIntencao(analises);
    const topicos = this.identificarTopicos(analises);
    const urgencia = this.calcularUrgencia(analises);

    const sugestoes = this.gerarSugestoesAcao(sentimento, intencao, urgencia);

    return {
      sentimento,
      intencao,
      topicos,
      urgencia,
      sugestoes_acao: sugestoes
    };
  }

  private analisarTexto(texto: string): any {
    const textoLower = texto.toLowerCase();
    
    // Análise de sentimento simples
    const palavrasPositivas = ['ótimo', 'excelente', 'maravilhoso', 'perfeito', 'bom', 'gostei', 'interessado'];
    const palavrasNegativas = ['ruim', 'terrivel', 'horrível', 'problema', 'reclamação', 'cancelar'];
    const palavrasNeutras = ['informação', 'dúvida', 'pergunta', 'saber'];

    let scoreSentimento = 0;
    
    palavrasPositivas.forEach(palavra => {
      if (textoLower.includes(palavra)) scoreSentimento++;
    });
    
    palavrasNegativas.forEach(palavra => {
      if (textoLower.includes(palavra)) scoreSentimento--;
    });

    let sentimento = 'neutro';
    if (scoreSentimento > 0) sentimento = 'positivo';
    if (scoreSentimento < 0) sentimento = 'negativo';

    // Identificar intenção
    let intencao = 'informacao';
    if (textoLower.includes('visita') || textoLower.includes('ver')) intencao = 'agendar_visita';
    if (textoLower.includes('proposta') || textoLower.includes('oferecer')) intencao = 'fazer_proposta';
    if (textoLower.includes('reclamação') || textoLower.includes('problema')) intencao = 'reclamar';

    return {
      sentimento,
      intencao,
      texto
    };
  }

  private consolidarSentimentos(analises: any[]): string {
    const sentimentos = analises.map(a => a.sentimento);
    const contagem = sentimentos.reduce((acc, sentimento) => {
      acc[sentimento] = (acc[sentimento] || 0) + 1;
      return acc;
    }, {} as any);

    if (contagem.negativo > contagem.positivo) return 'negativo';
    if (contagem.positivo > contagem.negativo) return 'positivo';
    return 'neutro';
  }

  private identificarIntencao(analises: any[]): string {
    const intencoes = analises.map(a => a.intencao);
    const contagem = intencoes.reduce((acc, intencao) => {
      acc[intencao] = (acc[intencao] || 0) + 1;
      return acc;
    }, {} as any);

    return Object.keys(contagem).reduce((a, b) => 
      contagem[a] > contagem[b] ? a : b
    );
  }

  private identificarTopicos(analises: any[]): string[] {
    // Identificar tópicos principais das conversas
    const topicos = ['preço', 'localização', 'características', 'documentação', 'financiamento'];
    const topicosEncontrados: string[] = [];

    for (const analise of analises) {
      const texto = analise.texto.toLowerCase();
      
      if (texto.includes('preço') || texto.includes('valor') || texto.includes('preço')) {
        if (!topicosEncontrados.includes('preço')) topicosEncontrados.push('preço');
      }
      
      if (texto.includes('local') || texto.includes('bairro') || texto.includes('vizinhança')) {
        if (!topicosEncontrados.includes('localização')) topicosEncontrados.push('localização');
      }
      
      if (texto.includes('quarto') || texto.includes('área') || texto.includes('vaga')) {
        if (!topicosEncontrados.includes('características')) topicosEncontrados.push('características');
      }
    }

    return topicosEncontrados;
  }

  private calcularUrgencia(analises: any[]): number {
    // Calcular urgência baseada em palavras-chave e frequência
    const palavrasUrgencia = ['urgente', 'rápido', 'imediatamente', 'hoje', 'agora'];
    let scoreUrgencia = 0;

    for (const analise of analises) {
      const texto = analise.texto.toLowerCase();
      
      for (const palavra of palavrasUrgencia) {
        if (texto.includes(palavra)) {
          scoreUrgencia += 10;
        }
      }
    }

    return Math.min(100, scoreUrgencia);
  }

  private gerarSugestoesAcao(sentimento: string, intencao: string, urgencia: number): string[] {
    const sugestoes: string[] = [];

    if (sentimento === 'negativo') {
      sugestoes.push('Entrar em contato imediatamente para resolver a questão');
      sugestoes.push('Escalar para gerente se necessário');
    }

    if (intencao === 'agendar_visita') {
      sugestoes.push('Propor datas disponíveis para visita');
      sugestoes.push('Enviar informações sobre o imóvel');
    }

    if (intencao === 'fazer_proposta') {
      sugestoes.push('Preparar documentação para proposta');
      sugestoes.push('Agendar reunião para detalhes');
    }

    if (urgencia > 50) {
      sugestoes.push('Priorizar atendimento - urgência detectada');
    }

    if (sugestoes.length === 0) {
      sugestoes.push('Manter contato e acompanhar evolução');
    }

    return sugestoes;
  }

  // Extração de perfil de busca
  async extrairPerfilBusca(clienteId: string, texto: string): Promise<LeadProfile> {
    const perfilAtual = await prisma.clientes.findUnique({
      where: { id: clienteId },
      select: { perfil_busca: true }
    });

    const perfil: LeadProfile = (perfilAtual?.perfil_busca as LeadProfile) || {};

    // Extrair informações do texto
    const textoLower = texto.toLowerCase();

    // Tipo de imóvel
    const tiposImovel = ['apartamento', 'casa', 'sala_comercial', 'terreno', 'galpao'];
    for (const tipo of tiposImovel) {
      if (textoLower.includes(tipo)) {
        perfil.tipo_imovel = tipo;
        break;
      }
    }

    // Finalidade
    if (textoLower.includes('comprar') || textoLower.includes('compra')) {
      perfil.finalidade = 'venda';
    } else if (textoLower.includes('alugar') || textoLower.includes('locação')) {
      perfil.finalidade = 'locacao';
    }

    // Bairros (extrair de lista ou contexto)
    const bairros = this.extrairBairros(texto);
    if (bairros.length > 0) {
      perfil.bairros = [...new Set([...(perfil.bairros || []), ...bairros])];
    }

    // Valores
    const valores = this.extrairValores(texto);
    if (valores.min) perfil.valor_minimo = valores.min;
    if (valores.max) perfil.valor_maximo = valores.max;

    // Quartos
    const quartos = this.extrairQuartos(texto);
    if (quartos.min) perfil.quartos_min = quartos.min;
    if (quartos.max) perfil.quartos_max = quartos.max;

    // Área
    const area = this.extrairArea(texto);
    if (area.min) perfil.area_min = area.min;
    if (area.max) perfil.area_max = area.max;

    // Atualizar perfil no banco
    await prisma.clientes.update({
      where: { id: clienteId },
      data: { perfil_busca: perfil }
    });

    return perfil;
  }

  private extrairBairros(texto: string): string[] {
    // Implementação simplificada - em produção, usar NLP ou API de geolocalização
    const bairros = [];
    const palavras = texto.split(' ');
    
    for (let i = 0; i < palavras.length; i++) {
      const palavra = palavras[i].toLowerCase();
      if (palavra.includes('bairro') && i + 1 < palavras.length) {
        bairros.push(palavras[i + 1]);
      }
    }
    
    return bairros;
  }

  private extrairValores(texto: string): { min?: number; max?: number } {
    const regexValor = /(\d+(?:\.\d{3})*(?:,\d{2})?)/g;
    const valores = [];
    let match;

    while ((match = regexValor.exec(texto)) !== null) {
      const valor = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      if (valor > 1000) valores.push(valor);
    }

    return {
      min: Math.min(...valores),
      max: Math.max(...valores)
    };
  }

  private extrairQuartos(texto: string): { min?: number; max?: number } {
    const regexQuartos = /(\d+)\s*quarto/gi;
    const quartos = [];
    let match;

    while ((match = regexQuartos.exec(texto)) !== null) {
      quartos.push(parseInt(match[1]));
    }

    return {
      min: Math.min(...quartos),
      max: Math.max(...quartos)
    };
  }

  private extrairArea(texto: string): { min?: number; max?: number } {
    const regexArea = /(\d+)\s*m[²²]/g;
    const areas = [];
    let match;

    while ((match = regexArea.exec(texto)) !== null) {
      areas.push(parseInt(match[1]));
    }

    return {
      min: Math.min(...areas),
      max: Math.max(...areas)
    };
  }
}