import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Plus, Edit, Trash2, Eye, Play, Pause, Settings, Zap, Filter, GitBranch, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Automacao {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'LEAD_NUTURING' | 'ONBOARDING' | 'REACTIVACAO' | 'ANIVERSARIO' | 'POS_VENDA' | 'CUSTOMIZADA';
  status: 'ATIVA' | 'PAUSADA' | 'TESTE' | 'CANCELADA';
  gatilho: {
    tipo: 'EVENTO' | 'TEMPO' | 'CONDICAO';
    configuracao: any;
  };
  acoes: Acao[];
  condicoes: Condicao[];
  metricas: {
    total_executada: number;
    total_sucesso: number;
    total_erro: number;
    taxa_sucesso: number;
    ultima_execucao?: string;
  };
  data_criacao: string;
  criado_por: string;
  tags: string[];
}

interface Acao {
  id: string;
  tipo: 'ENVIAR_EMAIL' | 'ENVIAR_SMS' | 'ENVIAR_WHATSAPP' | 'ATUALIZAR_LEAD' | 'CRIAR_TAREFA' | 'ADICIONAR_TAG' | 'REMOVER_TAG' | 'AGUARDAR_TEMPO' | 'CONDICIONAL';
  ordem: number;
  configuracao: any;
  delay_minutos: number;
}

interface Condicao {
  id: string;
  campo: string;
  operador: string;
  valor: string;
  acao_verdadeiro: string;
  acao_falso: string;
}

interface TemplateComunicacao {
  id: string;
  nome: string;
  tipo: 'EMAIL' | 'SMS' | 'WHATSAPP';
  assunto?: string;
  conteudo: string;
  variaveis: string[];
}

const Automacoes: React.FC = () => {
  const { user } = useAuth();
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [templates, setTemplates] = useState<TemplateComunicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [selectedAutomacao, setSelectedAutomacao] = useState<Automacao | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    tipo: '',
    dataCriacao: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'LEAD_NUTURING' as 'LEAD_NUTURING' | 'ONBOARDING' | 'REACTIVACAO' | 'ANIVERSARIO' | 'POS_VENDA' | 'CUSTOMIZADA',
    gatilho_tipo: 'EVENTO' as 'EVENTO' | 'TEMPO' | 'CONDICAO',
    gatilho_config: '',
    tags: ''
  });

  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [condicoes, setCondicoes] = useState<Condicao[]>([]);

  useEffect(() => {
    loadAutomacoes();
    loadTemplates();
  }, []);

  const loadAutomacoes = async () => {
    try {
      const response = await apiService.get('/marketing/automacoes', {
        params: filters
      });
      setAutomacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar automações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.get('/marketing/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao,
        tipo: formData.tipo,
        gatilho: {
          tipo: formData.gatilho_tipo,
          configuracao: JSON.parse(formData.gatilho_config || '{}')
        },
        acoes: acoes,
        condicoes: condicoes,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      if (selectedAutomacao) {
        await apiService.put(`/marketing/automacoes/${selectedAutomacao.id}`, data);
      } else {
        await apiService.post('/marketing/automacoes', data);
      }
      
      setShowModal(false);
      resetForm();
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
    }
  };

  const handleAtivar = async (automacaoId: string) => {
    try {
      await apiService.post(`/marketing/automacoes/${automacaoId}/ativar`);
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao ativar automação:', error);
    }
  };

  const handlePausar = async (automacaoId: string) => {
    try {
      await apiService.post(`/marketing/automacoes/${automacaoId}/pausar`);
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao pausar automação:', error);
    }
  };

  const handleTestar = async (automacaoId: string) => {
    try {
      await apiService.post(`/marketing/automacoes/${automacaoId}/testar`);
      loadAutomacoes();
    } catch (error) {
      console.error('Erro ao testar automação:', error);
    }
  };

  const handleDelete = async (automacaoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta automação?')) {
      try {
        await apiService.delete(`/marketing/automacoes/${automacaoId}`);
        loadAutomacoes();
      } catch (error) {
        console.error('Erro ao excluir automação:', error);
      }
    }
  };

  const openDetalhesModal = (automacao: Automacao) => {
    setSelectedAutomacao(automacao);
    setShowDetalhesModal(true);
  };

  const openEditModal = (automacao: Automacao) => {
    setSelectedAutomacao(automacao);
    setFormData({
      nome: automacao.nome,
      descricao: automacao.descricao,
      tipo: automacao.tipo,
      gatilho_tipo: automacao.gatilho.tipo,
      gatilho_config: JSON.stringify(automacao.gatilho.configuracao),
      tags: automacao.tags.join(', ')
    });
    setAcoes(automacao.acoes);
    setCondicoes(automacao.condicoes);
    setShowModal(true);
  };

  const openNewModal = () => {
    setSelectedAutomacao(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'LEAD_NUTURING',
      gatilho_tipo: 'EVENTO',
      gatilho_config: '',
      tags: ''
    });
    setAcoes([]);
    setCondicoes([]);
  };

  const adicionarAcao = () => {
    const novaAcao: Acao = {
      id: `acao_${Date.now()}`,
      tipo: 'ENVIAR_EMAIL',
      ordem: acoes.length + 1,
      configuracao: {},
      delay_minutos: 0
    };
    setAcoes([...acoes, novaAcao]);
  };

  const adicionarCondicao = () => {
    const novaCondicao: Condicao = {
      id: `condicao_${Date.now()}`,
      campo: '',
      operador: 'IGUAL',
      valor: '',
      acao_verdadeiro: '',
      acao_falso: ''
    };
    setCondicoes([...condicoes, novaCondicao]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVA': return 'text-green-600 bg-green-100';
      case 'PAUSADA': return 'text-yellow-600 bg-yellow-100';
      case 'TESTE': return 'text-blue-600 bg-blue-100';
      case 'CANCELADA': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'LEAD_NUTURING': return <Zap className="w-5 h-5" />;
      case 'ONBOARDING': return <Users className="w-5 h-5" />;
      case 'REACTIVACAO': return <Clock className="w-5 h-5" />;
      case 'ANIVERSARIO': return <Settings className="w-5 h-5" />;
      case 'POS_VENDA': return <CheckCircle className="w-5 h-5" />;
      default: return <GitBranch className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'LEAD_NUTURING': return 'Nutrição de Leads';
      case 'ONBOARDING': return 'Onboarding';
      case 'REACTIVACAO': return 'Reativação';
      case 'ANIVERSARIO': return 'Aniversário';
      case 'POS_VENDA': return 'Pós-venda';
      default: return 'Customizada';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Automações de Marketing</h1>
        <p className="text-gray-600 mt-2">Crie fluxos automatizados para nutrir leads e relacionamento</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ativas</p>
              <p className="text-2xl font-bold text-green-600">
                {automacoes.filter(a => a.status === 'ATIVA').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Executadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {automacoes.reduce((sum, a) => sum + a.metricas.total_executada, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-purple-600">
                {automacoes.length > 0 ? 
                  (automacoes.reduce((sum, a) => sum + a.metricas.taxa_sucesso, 0) / automacoes.length).toFixed(1) : 0
                }%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Em Teste</p>
              <p className="text-2xl font-bold text-yellow-600">
                {automacoes.filter(a => a.status === 'TESTE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="ATIVA">Ativa</option>
            <option value="PAUSADA">Pausada</option>
            <option value="TESTE">Teste</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="LEAD_NUTURING">Nutrição de Leads</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="REACTIVACAO">Reativação</option>
            <option value="ANIVERSARIO">Aniversário</option>
            <option value="POS_VENDA">Pós-venda</option>
            <option value="CUSTOMIZADA">Customizada</option>
          </select>

          <input
            type="date"
            value={filters.dataCriacao}
            onChange={(e) => setFilters({...filters, dataCriacao: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Data criação"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={loadAutomacoes}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </button>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-4">
        {automacoes.map((automacao) => (
          <div key={automacao.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    {getTipoIcon(automacao.tipo)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{automacao.nome}</h3>
                    <p className="text-sm text-gray-600 mt-1">{automacao.descricao}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">
                        Tipo: {getTipoLabel(automacao.tipo)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Criada em: {formatDate(automacao.data_criacao)}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(automacao.status)}`}>
                        {automacao.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {automacao.status === 'PAUSADA' && (
                    <button
                      onClick={() => handleAtivar(automacao.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Ativar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {automacao.status === 'ATIVA' && (
                    <button
                      onClick={() => handlePausar(automacao.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Pausar"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleTestar(automacao.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Testar"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDetalhesModal(automacao)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(automacao)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(automacao.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Métricas Resumidas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{automacao.metricas.total_executada.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Execuções</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{automacao.metricas.total_sucesso.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Sucessos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{automacao.metricas.total_erro.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Erros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{automacao.metricas.taxa_sucesso.toFixed(1)}%</div>
                  <div className="text-xs text-gray-600">Taxa Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {automacao.metricas.ultima_execucao ? formatDate(automacao.metricas.ultima_execucao) : 'Nunca'}
                  </div>
                  <div className="text-xs text-gray-600">Última Execução</div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Gatilho:</span> {automacao.gatilho.tipo}
                </div>
                <div>
                  <span className="font-medium">Ações:</span> {automacao.acoes.length}
                </div>
                <div>
                  <span className="font-medium">Condições:</span> {automacao.condicoes.length}
                </div>
              </div>

              {/* Tags */}
              {automacao.tags.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {automacao.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Automação */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedAutomacao ? 'Editar Automação' : 'Nova Automação'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nome da Automação</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="LEAD_NUTURING">Nutrição de Leads</option>
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="REACTIVACAO">Reativação</option>
                      <option value="ANIVERSARIO">Aniversário</option>
                      <option value="POS_VENDA">Pós-venda</option>
                      <option value="CUSTOMIZADA">Customizada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gatilho</label>
                    <select
                      value={formData.gatilho_tipo}
                      onChange={(e) => setFormData({...formData, gatilho_tipo: e.target.value as any})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="EVENTO">Evento</option>
                      <option value="TEMPO">Tempo</option>
                      <option value="CONDICAO">Condição</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Configuração do Gatilho (JSON)</label>
                    <textarea
                      value={formData.gatilho_config}
                      onChange={(e) => setFormData({...formData, gatilho_config: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2 font-mono text-sm"
                      rows={4}
                      placeholder='{"evento": "lead_criado", "origem": "site"}'
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      placeholder="lead, nutricao, email"
                    />
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Ações da Automação</h4>
                    <button
                      type="button"
                      onClick={adicionarAcao}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Ação
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {acoes.map((acao, index) => (
                      <div key={acao.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Tipo</label>
                            <select
                              value={acao.tipo}
                              onChange={(e) => {
                                const novasAcoes = [...acoes];
                                novasAcoes[index].tipo = e.target.value as any;
                                setAcoes(novasAcoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value="ENVIAR_EMAIL">Enviar Email</option>
                              <option value="ENVIAR_SMS">Enviar SMS</option>
                              <option value="ENVIAR_WHATSAPP">Enviar WhatsApp</option>
                              <option value="ATUALIZAR_LEAD">Atualizar Lead</option>
                              <option value="CRIAR_TAREFA">Criar Tarefa</option>
                              <option value="ADICIONAR_TAG">Adicionar Tag</option>
                              <option value="REMOVER_TAG">Remover Tag</option>
                              <option value="AGUARDAR_TEMPO">Aguardar Tempo</option>
                              <option value="CONDICIONAL">Condicional</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Delay (min)</label>
                            <input
                              type="number"
                              value={acao.delay_minutos}
                              onChange={(e) => {
                                const novasAcoes = [...acoes];
                                novasAcoes[index].delay_minutos = parseInt(e.target.value) || 0;
                                setAcoes(novasAcoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Configuração (JSON)</label>
                            <input
                              type="text"
                              value={JSON.stringify(acao.configuracao)}
                              onChange={(e) => {
                                try {
                                  const novasAcoes = [...acoes];
                                  novasAcoes[index].configuracao = JSON.parse(e.target.value);
                                  setAcoes(novasAcoes);
                                } catch {}
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm font-mono"
                              placeholder='{"template_id": "123"}'
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAcoes(acoes.filter((_, i) => i !== index))}
                          className="mt-2 text-red-600 hover:text-red-900 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condições */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Condições</h4>
                    <button
                      type="button"
                      onClick={adicionarCondicao}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Condição
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {condicoes.map((condicao, index) => (
                      <div key={condicao.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Campo</label>
                            <input
                              type="text"
                              value={condicao.campo}
                              onChange={(e) => {
                                const novasCondicoes = [...condicoes];
                                novasCondicoes[index].campo = e.target.value;
                                setCondicoes(novasCondicoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                              placeholder="lead.status"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Operador</label>
                            <select
                              value={condicao.operador}
                              onChange={(e) => {
                                const novasCondicoes = [...condicoes];
                                novasCondicoes[index].operador = e.target.value;
                                setCondicoes(novasCondicoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value="IGUAL">Igual</option>
                              <option value="DIFERENTE">Diferente</option>
                              <option value="MAIOR">Maior</option>
                              <option value="MENOR">Menor</option>
                              <option value="CONTEM">Contém</option>
                              <option value="NAO_CONTEM">Não Contém</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Valor</label>
                            <input
                              type="text"
                              value={condicao.valor}
                              onChange={(e) => {
                                const novasCondicoes = [...condicoes];
                                novasCondicoes[index].valor = e.target.value;
                                setCondicoes(novasCondicoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                              placeholder="ativo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Se Verdadeiro</label>
                            <input
                              type="text"
                              value={condicao.acao_verdadeiro}
                              onChange={(e) => {
                                const novasCondicoes = [...condicoes];
                                novasCondicoes[index].acao_verdadeiro = e.target.value;
                                setCondicoes(novasCondicoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                              placeholder="enviar_email"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Se Falso</label>
                            <input
                              type="text"
                              value={condicao.acao_falso}
                              onChange={(e) => {
                                const novasCondicoes = [...condicoes];
                                novasCondicoes[index].acao_falso = e.target.value;
                                setCondicoes(novasCondicoes);
                              }}
                              className="mt-1 block w-full border rounded px-2 py-1 text-sm"
                              placeholder="aguardar"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCondicoes(condicoes.filter((_, i) => i !== index))}
                          className="mt-2 text-red-600 hover:text-red-900 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedAutomacao ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {showDetalhesModal && selectedAutomacao && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalhes da Automação: {selectedAutomacao.nome}
                </h3>
                <button
                  onClick={() => {
                    setShowDetalhesModal(false);
                    setSelectedAutomacao(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações da Automação</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAutomacao.status)}`}>
                        {selectedAutomacao.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="text-gray-900">{getTipoLabel(selectedAutomacao.tipo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gatilho:</span>
                      <span className="text-gray-900">{selectedAutomacao.gatilho.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Criada em:</span>
                      <span className="text-gray-900">{formatDate(selectedAutomacao.data_criacao)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Métricas de Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Executadas:</span>
                      <span className="font-medium text-gray-900">{selectedAutomacao.metricas.total_executada.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sucessos:</span>
                      <span className="font-medium text-green-600">{selectedAutomacao.metricas.total_sucesso.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Erros:</span>
                      <span className="font-medium text-red-600">{selectedAutomacao.metricas.total_erro.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxa de Sucesso:</span>
                      <span className="font-medium text-blue-600">{selectedAutomacao.metricas.taxa_sucesso.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fluxo da Automação */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fluxo da Automação</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {/* Gatilho */}
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                        <Zap className="w-4 h-4 inline mr-2" />
                        Gatilho: {selectedAutomacao.gatilho.tipo}
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="w-px h-4 bg-gray-300"></div>
                    </div>

                    {/* Ações */}
                    {selectedAutomacao.acoes.map((acao, index) => (
                      <div key={acao.id} className="flex items-center">
                        <div className="bg-white border-2 border-gray-200 px-3 py-2 rounded-lg flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{acao.ordem}. {acao.tipo}</span>
                              {acao.delay_minutos > 0 && (
                                <span className="text-sm text-gray-600 ml-2">
                                  (+{acao.delay_minutos} min)
                                </span>
                              )}
                            </div>
                            <Clock className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        {index < selectedAutomacao.acoes.length - 1 && (
                          <div className="flex justify-center mt-2">
                            <div className="w-px h-4 bg-gray-300"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Condições */}
              {selectedAutomacao.condicoes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Condições</h4>
                  <div className="space-y-2">
                    {selectedAutomacao.condicoes.map((condicao) => (
                      <div key={condicao.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{condicao.campo}</span>
                            <span className="text-gray-600 mx-2">{condicao.operador}</span>
                            <span className="font-medium">{condicao.valor}</span>
                          </div>
                          <GitBranch className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Se verdadeiro: {condicao.acao_verdadeiro} | Se falso: {condicao.acao_falso}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedAutomacao.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAutomacao.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automacoes;