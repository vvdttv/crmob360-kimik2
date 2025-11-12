// Tipos principais da aplicação

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'gerente' | 'corretor' | 'financeiro';
  avatar_url?: string;
  permissions?: string[];
  ultimo_acesso?: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  origem?: string;
  status_lead: 'novo' | 'em_contato' | 'visita_agendada' | 'em_negociacao' | 'convertido' | 'perdido';
  score_ia: number;
  perfil_busca?: any;
  responsavel?: User;
  criador?: User;
  created_at: Date;
  updated_at: Date;
  ultimo_contato?: Date;
  tags: string[];
  custom_fields?: any;
}

export interface Imovel {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  tipo_imovel: 'apartamento' | 'casa' | 'sala_comercial' | 'terreno' | 'galpao';
  finalidade: 'venda' | 'locacao' | 'venda_locacao';
  status: 'disponivel' | 'reservado' | 'vendido' | 'alugado' | 'em_manutencao';
  proprietario?: Cliente;
  responsavel?: User;
  endereco: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
  caracteristicas: {
    area_total?: number;
    area_util?: number;
    quartos?: number;
    suites?: number;
    banheiros?: number;
    vagas_garagem?: number;
    andar?: number;
  };
  valores: {
    valor_venda?: number;
    valor_locacao?: number;
    valor_condominio?: number;
    valor_iptu?: number;
  };
  publicado_site: boolean;
  publicado_portais: any;
  fotos: any[];
  videos: any[];
  planta_baixa?: string;
  visitas_count: number;
  created_at: Date;
  tags: string[];
  custom_fields?: any;
}

export interface PipelineLead {
  id: string;
  cliente: Cliente;
  funil: FunilVenda;
  etapa_atual: string;
  valor_estimado?: number;
  data_entrada_etapa: Date;
  previsao_fechamento?: Date;
  responsavel?: User;
  created_at: Date;
  updated_at: Date;
}

export interface FunilVenda {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'venda' | 'locacao' | 'captacao';
  etapas: any[];
  ativo: boolean;
  created_at: Date;
}

export interface Atividade {
  id: string;
  cliente_id: string;
  tipo: 'ligacao' | 'email' | 'visita' | 'whatsapp' | 'nota';
  descricao: string;
  data_hora: Date;
  realizado_por?: User;
  duracao_minutos?: number;
  resultado?: 'sucesso' | 'sem_contato' | 'recado';
  proxima_acao?: Date;
  anexos: any[];
}

export interface ContaFinanceira {
  id: string;
  numero_documento?: string;
  tipo: 'pagar' | 'receber';
  plano_conta: PlanoConta;
  centro_custo?: CentroCusto;
  descricao: string;
  valor_original: number;
  valor_pago: number;
  data_emissao: Date;
  data_vencimento: Date;
  data_pagamento?: Date;
  cliente?: Cliente;
  contrato?: ContratoLocacao;
  imovel?: Imovel;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  gateway_pagamento?: string;
  boleto_url?: string;
  boleto_codigo?: string;
  created_at: Date;
}

export interface PlanoConta {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  categoria?: string;
  parent?: PlanoConta;
  children?: PlanoConta[];
  ativo: boolean;
}

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface ContratoLocacao {
  id: string;
  numero_contrato: string;
  imovel: Imovel;
  locatario: Cliente;
  fiador?: Cliente;
  data_inicio: Date;
  data_fim: Date;
  prorrogacao_automatica: boolean;
  valor_aluguel: number;
  valor_condominio: number;
  dia_vencimento: number;
  taxa_administracao: number;
  multa_atraso_percentual: number;
  juros_mora_percentual: number;
  status: 'ativo' | 'encerrado' | 'rescindido';
  documento_url?: string;
  assinado_digitalmente: boolean;
  created_at: Date;
}

export interface Processo {
  id: string;
  template: TemplateProcesso;
  entidade_tipo: 'cliente' | 'imovel' | 'contrato' | 'proposta';
  entidade_id: string;
  status: 'ativo' | 'concluido' | 'cancelado';
  etapa_atual?: string;
  responsavel?: User;
  data_inicio: Date;
  data_conclusao?: Date;
  tarefas: TarefaProcesso[];
}

export interface TemplateProcesso {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'venda' | 'locacao' | 'manutencao' | 'captacao' | 'documentacao';
  etapas: any[];
  gatilhos: string[];
  ativo: boolean;
}

export interface TarefaProcesso {
  id: string;
  processo_id: string;
  titulo: string;
  descricao?: string;
  atribuido_para?: User;
  prazo?: Date;
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  concluida_em?: Date;
  anexos: any[];
  created_at: Date;
}

export interface Comissao {
  id: string;
  numero_comissao: string;
  tipo: 'venda' | 'locacao';
  venda_id?: string;
  locacao_id?: string;
  corretor_vendedor?: User;
  corretor_captador?: User;
  gerente?: User;
  valor_total: number;
  percentual_imobiliaria: number;
  percentual_vendedor: number;
  percentual_captador: number;
  percentual_gerente: number;
  valor_imobiliaria?: number;
  valor_vendedor?: number;
  valor_captador?: number;
  valor_gerente?: number;
  status: 'calculada' | 'aprovada' | 'paga' | 'cancelada';
  data_pagamento?: Date;
  created_at: Date;
}

export interface DashboardData {
  totalClientes: number;
  novosClientesMes: number;
  leadsAtivos: number;
  taxaConversao: number;
  atividadesMes: number;
  totalImoveis: number;
  imoveisDisponiveis: number;
  imoveisVendidos: number;
  imoveisAlugados: number;
  tempoMedioEstoque: number;
  ticketMedio: number;
  totalProcessos: number;
  processosAtivos: number;
  processosConcluidosMes: number;
  tarefasPendentes: number;
  tarefasAtrasadas: number;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  pages?: number;
  message?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginResponse {
  usuario: User;
  tokens: AuthTokens;
}

export interface FilterOptions {
  status?: string;
  tipo?: string;
  responsavel_id?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  skip?: number;
  take?: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}