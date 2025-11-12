import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Home, DollarSign, Target, Zap, Filter, Download, Brain, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
  id: string;
  tipo: 'VENDAS' | 'LEADS' | 'ESTOQUE' | 'MARKETING' | 'FINANCEIRO' | 'OPERACIONAL';
  categoria: 'OTIMIZACAO' | 'ALERTA' | 'OPORTUNIDADE' | 'TENDENCIA' | 'RISCO';
  titulo: string;
  descricao: string;
  impacto: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  probabilidade: number;
  dados_suporte: any;
  recomendacoes: string[];
  data_geracao: string;
  ativo: boolean;
  acionado_por?: string;
  metrica_anterior?: number;
  metrica_atual?: number;
  variacao_percentual?: number;
}

interface DashboardInsights {
  total_insights: number;
  insights_ativos: number;
  insights_acao: number;
  insights_criticos: number;
  taxa_acuracia: number;
  ganhos_estimados: number;
}

interface TendenciaMercado {
  periodo: string;
  tendencia_vendas: number;
  tendencia_leads: number;
  tendencia_precos: number;
  confianca: number;
}

const Insights: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dashboard, setDashboard] = useState<DashboardInsights | null>(null);
  const [tendencias, setTendencias] = useState<TendenciaMercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [filters, setFilters] = useState({
    tipo: '',
    categoria: '',
    impacto: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    loadInsights();
    loadDashboard();
    loadTendencias();
  }, [filters]);

  const loadInsights = async () => {
    try {
      const response = await apiService.get('/ia/insights', {
        params: filters
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await apiService.get('/ia/insights/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  };

  const loadTendencias = async () => {
    try {
      const response = await apiService.get('/ia/insights/tendencias');
      setTendencias(response.data);
    } catch (error) {
      console.error('Erro ao carregar tendências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArquivar = async (insightId: string) => {
    try {
      await apiService.put(`/ia/insights/${insightId}/arquivar`);
      loadInsights();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao arquivar insight:', error);
    }
  };

  const handleExecutarAcao = async (insightId: string) => {
    try {
      await apiService.post(`/ia/insights/${insightId}/executar`);
      loadInsights();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  const handleGerarInsights = async () => {
    try {
      await apiService.post('/ia/insights/gerar');
      loadInsights();
      loadDashboard();
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'OTIMIZACAO': return <Lightbulb className="w-5 h-5" />;
      case 'ALERTA': return <AlertTriangle className="w-5 h-5" />;
      case 'OPORTUNIDADE': return <Target className="w-5 h-5" />;
      case 'TENDENCIA': return <TrendingUp className="w-5 h-5" />;
      case 'RISCO': return <AlertTriangle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'OTIMIZACAO': return 'text-blue-600 bg-blue-100';
      case 'ALERTA': return 'text-red-600 bg-red-100';
      case 'OPORTUNIDADE': return 'text-green-600 bg-green-100';
      case 'TENDENCIA': return 'text-purple-600 bg-purple-100';
      case 'RISCO': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case 'CRITICO': return 'text-red-600 bg-red-100';
      case 'ALTO': return 'text-orange-600 bg-orange-100';
      case 'MEDIO': return 'text-yellow-600 bg-yellow-100';
      case 'BAIXO': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Processar dados para gráficos
  const insightsPorCategoria = [
    { nome: 'Otimização', valor: insights.filter(i => i.categoria === 'OTIMIZACAO').length },
    { nome: 'Alerta', valor: insights.filter(i => i.categoria === 'ALERTA').length },
    { nome: 'Oportunidade', valor: insights.filter(i => i.categoria === 'OPORTUNIDADE').length },
    { nome: 'Tendência', valor: insights.filter(i => i.categoria === 'TENDENCIA').length },
    { nome: 'Risco', valor: insights.filter(i => i.categoria === 'RISCO').length }
  ];

  const insightsPorImpacto = [
    { nome: 'Crítico', valor: insights.filter(i => i.impacto === 'CRITICO').length },
    { nome: 'Alto', valor: insights.filter(i => i.impacto === 'ALTO').length },
    { nome: 'Médio', valor: insights.filter(i => i.impacto === 'MEDIO').length },
    { nome: 'Baixo', valor: insights.filter(i => i.impacto === 'BAIXO').length }
  ];

  const insightsPorTipo = [
    { nome: 'Vendas', valor: insights.filter(i => i.tipo === 'VENDAS').length },
    { nome: 'Leads', valor: insights.filter(i => i.tipo === 'LEADS').length },
    { nome: 'Estoque', valor: insights.filter(i => i.tipo === 'ESTOQUE').length },
    { nome: 'Marketing', valor: insights.filter(i => i.tipo === 'MARKETING').length },
    { nome: 'Financeiro', valor: insights.filter(i => i.tipo === 'FINANCEIRO').length }
  ];

  const insightsRecentes = insights
    .filter(i => i.ativo)
    .sort((a, b) => new Date(b.data_geracao).getTime() - new Date(a.data_geracao).getTime())
    .slice(0, 10);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading || !dashboard) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Insights com IA</h1>
        <p className="text-gray-600 mt-2">Análises preditivas e recomendações inteligentes</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-blue-600">{dashboard.total_insights.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Insights Ativos</p>
              <p className="text-2xl font-bold text-green-600">{dashboard.insights_ativos.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Requerem Ação</p>
              <p className="text-2xl font-bold text-purple-600">{dashboard.insights_acao.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{dashboard.insights_criticos.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={handleGerarInsights}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Gerar Novos Insights
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="VENDAS">Vendas</option>
            <option value="LEADS">Leads</option>
            <option value="ESTOQUE">Estoque</option>
            <option value="MARKETING">Marketing</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="OPERACIONAL">Operacional</option>
          </select>

          <select
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas categorias</option>
            <option value="OTIMIZACAO">Otimização</option>
            <option value="ALERTA">Alerta</option>
            <option value="OPORTUNIDADE">Oportunidade</option>
            <option value="TENDENCIA">Tendência</option>
            <option value="RISCO">Risco</option>
          </select>

          <select
            value={filters.impacto}
            onChange={(e) => setFilters({...filters, impacto: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos impactos</option>
            <option value="CRITICO">Crítico</option>
            <option value="ALTO">Alto</option>
            <option value="MEDIO">Médio</option>
            <option value="BAIXO">Baixo</option>
          </select>

          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />

          <button
            onClick={loadInsights}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Insights por Categoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights por Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={insightsPorCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, valor }) => `${nome}: ${valor}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {insightsPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Insights por Impacto */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights por Impacto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={insightsPorImpacto}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights por Tipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights por Tipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={insightsPorTipo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="valor" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendências do Mercado */}
      {tendencias.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Tendências do Mercado</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendencias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tendencia_vendas" stroke="#3B82F6" name="Vendas" />
                <Line type="monotone" dataKey="tendencia_leads" stroke="#10B981" name="Leads" />
                <Line type="monotone" dataKey="tendencia_precos" stroke="#F59E0B" name="Preços" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lista de Insights */}
      <div className="space-y-4">
        {insightsRecentes.map((insight) => (
          <div key={insight.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${getCategoriaColor(insight.categoria).replace('text-', 'bg-').replace('600', '100')}`}>
                    {getCategoriaIcon(insight.categoria)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{insight.titulo}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoriaColor(insight.categoria)}`}>
                        {insight.categoria.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImpactoColor(insight.impacto)}`}>
                        {insight.impacto.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {insight.tipo.replace('_', ' ')} • {formatDate(insight.data_geracao)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {insight.ativo && (
                    <button
                      onClick={() => handleExecutarAcao(insight.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Executar Ação"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInsight(insight)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Ver Detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArquivar(insight.id)}
                    className="text-gray-600 hover:text-gray-900"
                    title="Arquivar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{insight.descricao}</p>

              {insight.variacao_percentual && (
                <div className="flex items-center mb-4">
                  <span className={`text-sm font-medium mr-2 ${
                    insight.variacao_percentual > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {insight.variacao_percentual > 0 ? '+' : ''}{insight.variacao_percentual.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600">
                    Variação: {insight.metrica_anterior?.toLocaleString()} → {insight.metrica_atual?.toLocaleString()}
                  </span>
                </div>
              )}

              {insight.recomendacoes.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Recomendações:</h4>
                  <div className="space-y-1">
                    {insight.recomendacoes.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start">
                        <Lightbulb className="w-3 h-3 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalhes Insight */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedInsight.titulo}
                </h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Informações do Insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Detalhes do Insight</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="text-gray-900">{selectedInsight.tipo.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categoria:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoriaColor(selectedInsight.categoria)}`}>
                        {selectedInsight.categoria.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impacto:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImpactoColor(selectedInsight.impacto)}`}>
                        {selectedInsight.impacto.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Probabilidade:</span>
                      <span className="text-gray-900">{selectedInsight.probabilidade}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gerado em:</span>
                      <span className="text-gray-900">{formatDate(selectedInsight.data_geracao)}</span>
                    </div>
                  </div>
                </div>

                {selectedInsight.variacao_percentual && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Métricas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Anterior:</span>
                        <span className="text-gray-900">{selectedInsight.metrica_anterior?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Atual:</span>
                        <span className="text-gray-900">{selectedInsight.metrica_atual?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Variação:</span>
                        <span className={`font-medium ${
                          selectedInsight.variacao_percentual > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedInsight.variacao_percentual > 0 ? '+' : ''}{selectedInsight.variacao_percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição Completa */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Análise Completa</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedInsight.descricao}</p>
                </div>
              </div>

              {/* Dados de Suporte */}
              {selectedInsight.dados_suporte && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Dados de Suporte</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedInsight.dados_suporte, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {selectedInsight.recomendacoes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Recomendações</h4>
                  <div className="space-y-2">
                    {selectedInsight.recomendacoes.map((rec, index) => (
                      <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end space-x-3">
                {selectedInsight.ativo && (
                  <button
                    onClick={() => handleExecutarAcao(selectedInsight.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Executar Ação
                  </button>
                )}
                <button
                  onClick={() => handleArquivar(selectedInsight.id)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Arquivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;