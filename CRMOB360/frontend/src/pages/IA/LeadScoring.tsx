import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Zap, Filter, Settings, Eye, RefreshCw, Download } from 'lucide-react';

interface LeadScore {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  score: number;
  nivel: 'ALTO' | 'MEDIO' | 'BAIXO';
  fatores: {
    perfil_completo: number;
    historico_interacoes: number;
    tempo_resposta: number;
    interesse_imoveis: number;
    orcamento_alinhado: number;
    urgencia_compra: number;
    origem_qualificada: number;
    documentacao_pronta: number;
  };
  recomendacoes: string[];
  data_calculo: string;
  ultima_atualizacao: string;
  status: 'ATIVO' | 'INATIVO' | 'CONVERTIDO';
  probabilidade_conversao: number;
  valor_estimado: number;
}

interface ConfigScoring {
  peso_perfil_completo: number;
  peso_historico_interacoes: number;
  peso_tempo_resposta: number;
  peso_interesse_imoveis: number;
  peso_orcamento_alinhado: number;
  peso_urgencia_compra: number;
  peso_origem_qualificada: number;
  peso_documentacao_pronta: number;
  limite_alto: number;
  limite_medio: number;
  fator_correcao: number;
}

const LeadScoring: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [config, setConfig] = useState<ConfigScoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadScore | null>(null);
  const [filters, setFilters] = useState({
    nivel: '',
    status: '',
    scoreMin: '',
    scoreMax: '',
    dataInicio: '',
    dataFim: ''
  });

  const [configForm, setConfigForm] = useState<ConfigScoring>({
    peso_perfil_completo: 0.15,
    peso_historico_interacoes: 0.20,
    peso_tempo_resposta: 0.10,
    peso_interesse_imoveis: 0.25,
    peso_orcamento_alinhado: 0.15,
    peso_urgencia_compra: 0.10,
    peso_origem_qualificada: 0.03,
    peso_documentacao_pronta: 0.02,
    limite_alto: 80,
    limite_medio: 60,
    fator_correcao: 1.0
  });

  useEffect(() => {
    loadLeadScores();
    loadConfig();
  }, [filters]);

  const loadLeadScores = async () => {
    try {
      const response = await apiService.get('/ia/lead-scoring', {
        params: filters
      });
      setLeads(response.data);
    } catch (error) {
      console.error('Erro ao carregar lead scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await apiService.get('/ia/lead-scoring/config');
      setConfig(response.data);
      setConfigForm(response.data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleRecalcular = async (leadId: string) => {
    try {
      await apiService.post(`/ia/lead-scoring/${leadId}/recalcular`);
      loadLeadScores();
    } catch (error) {
      console.error('Erro ao recalcular score:', error);
    }
  };

  const handleRecalcularTodos = async () => {
    try {
      await apiService.post('/ia/lead-scoring/recalcular-todos');
      loadLeadScores();
    } catch (error) {
      console.error('Erro ao recalcular todos:', error);
    }
  };

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.put('/ia/lead-scoring/config', configForm);
      setShowConfigModal(false);
      loadConfig();
      loadLeadScores();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const openLeadModal = (lead: LeadScore) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'ALTO': return 'text-green-600 bg-green-100';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-100';
      case 'BAIXO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'text-blue-600 bg-blue-100';
      case 'INATIVO': return 'text-gray-600 bg-gray-100';
      case 'CONVERTIDO': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Processar dados para gráficos
  const leadsPorNivel = [
    { nome: 'Alto', valor: leads.filter(l => l.nivel === 'ALTO').length },
    { nome: 'Médio', valor: leads.filter(l => l.nivel === 'MEDIO').length },
    { nome: 'Baixo', valor: leads.filter(l => l.nivel === 'BAIXO').length }
  ];

  const leadsPorStatus = [
    { nome: 'Ativo', valor: leads.filter(l => l.status === 'ATIVO').length },
    { nome: 'Inativo', valor: leads.filter(l => l.status === 'INATIVO').length },
    { nome: 'Convertido', valor: leads.filter(l => l.status === 'CONVERTIDO').length }
  ];

  const distribuicaoScores = leads.reduce((acc: any[], lead) => {
    const faixa = Math.floor(lead.score / 10) * 10;
    const existing = acc.find(item => item.faixa === `${faixa}-${faixa + 9}`);
    if (existing) {
      existing.quantidade += 1;
    } else {
      acc.push({ faixa: `${faixa}-${faixa + 9}`, quantidade: 1 });
    }
    return acc;
  }, []).sort((a, b) => parseInt(a.faixa) - parseInt(b.faixa));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
        <h1 className="text-3xl font-bold text-gray-900">Lead Scoring com IA</h1>
        <p className="text-gray-600 mt-2">Análise preditiva de qualificação de leads</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-blue-600">{leads.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Alto Nível</p>
              <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.nivel === 'ALTO').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa Conversão Estimada</p>
              <p className="text-2xl font-bold text-purple-600">
                {leads.length > 0 ? 
                  (leads.reduce((sum, l) => sum + l.probabilidade_conversao, 0) / leads.length).toFixed(1) : 0
                }%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Estimado Total</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(leads.reduce((sum, l) => sum + l.valor_estimado, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={handleRecalcularTodos}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalcular Todos
          </button>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </button>
        </div>
        <button
          onClick={() => {/* Implementar exportação */}}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribuição por Nível */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Nível</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadsPorNivel}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, valor }) => `${nome}: ${valor}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {leadsPorNivel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Scores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribuicaoScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="faixa" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Leads Ranqueados</h3>
            <div className="text-sm text-gray-600">
              {leads.length} lead(s) encontrado(s)
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probabilidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Estimado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{lead.cliente_nome}</div>
                    <div className="text-sm text-gray-500">{lead.cliente_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-bold text-gray-900">{lead.score.toFixed(1)}</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            lead.score >= 80 ? 'bg-green-500' :
                            lead.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(lead.score, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNivelColor(lead.nivel)}`}>
                      {lead.nivel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">
                      {lead.probabilidade_conversao.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(lead.valor_estimado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openLeadModal(lead)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRecalcular(lead.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Recalcular"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Configurações */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Configurações do Lead Scoring
              </h3>
              <form onSubmit={handleSalvarConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Perfil Completo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_perfil_completo}
                      onChange={(e) => setConfigForm({...configForm, peso_perfil_completo: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Histórico Interações</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_historico_interacoes}
                      onChange={(e) => setConfigForm({...configForm, peso_historico_interacoes: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Tempo Resposta</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_tempo_resposta}
                      onChange={(e) => setConfigForm({...configForm, peso_tempo_resposta: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Interesse Imóveis</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_interesse_imoveis}
                      onChange={(e) => setConfigForm({...configForm, peso_interesse_imoveis: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Orçamento Alinhado</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_orcamento_alinhado}
                      onChange={(e) => setConfigForm({...configForm, peso_orcamento_alinhado: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Peso - Urgência Compra</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={configForm.peso_urgencia_compra}
                      onChange={(e) => setConfigForm({...configForm, peso_urgencia_compra: parseFloat(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Limite Score Alto</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={configForm.limite_alto}
                      onChange={(e) => setConfigForm({...configForm, limite_alto: parseInt(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Limite Score Médio</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={configForm.limite_medio}
                      onChange={(e) => setConfigForm({...configForm, limite_medio: parseInt(e.target.value)})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Lead */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalhes do Lead: {selectedLead.cliente_nome}
                </h3>
                <button
                  onClick={() => {
                    setShowLeadModal(false);
                    setSelectedLead(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Score e Nível */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{selectedLead.score.toFixed(1)}</div>
                  <div className="text-sm text-blue-700">Score Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {selectedLead.probabilidade_conversao.toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Prob. Conversão</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatCurrency(selectedLead.valor_estimado)}
                  </div>
                  <div className="text-sm text-purple-700">Valor Estimado</div>
                </div>
              </div>

              {/* Fatores de Score */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fatores do Score</h4>
                <div className="space-y-3">
                  {Object.entries(selectedLead.fatores).map(([fator, valor]) => (
                    <div key={fator} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {fator.replace('_', ' ')}
                      </span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              valor >= 80 ? 'bg-green-500' :
                              valor >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${valor}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8">{valor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendações */}
              {selectedLead.recomendacoes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Recomendações</h4>
                  <div className="space-y-2">
                    {selectedLead.recomendacoes.map((recomendacao, index) => (
                      <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                        <Zap className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{recomendacao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações de Contato */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Informações de Contato</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{selectedLead.cliente_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefone:</span>
                    <span className="text-gray-900">{selectedLead.cliente_telefone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última Atualização:</span>
                    <span className="text-gray-900">{formatDate(selectedLead.ultima_atualizacao)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadScoring;