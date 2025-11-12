import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, Target, Zap, Filter, Eye, RefreshCw, Download, Star, TrendingUp } from 'lucide-react';

interface MatchingResult {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  imovel_id: string;
  imovel_titulo: string;
  score_compatibilidade: number;
  fatores_compatibilidade: {
    perfil_cliente: number;
    preferencias_localizacao: number;
    valor_orcamento: number;
    caracteristicas_imovel: number;
    historico_busca: number;
    timing_compra: number;
    perfil_investidor: number;
  };
  nivel_compatibilidade: 'EXCELENTE' | 'MUITO_BOM' | 'BOM' | 'REGULAR' | 'BAIXO';
  justificativa: string[];
  recomendacoes: string[];
  data_matching: string;
  ativo: boolean;
  feedback_cliente?: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
}

interface ClienteMatching {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  perfil: any;
  preferencias: any;
  orcamento_min: number;
  orcamento_max: number;
  imoveis_compatíveis: number;
  melhor_score: number;
}

const Matching: React.FC = () => {
  const { user } = useAuth();
  const [matchings, setMatchings] = useState<MatchingResult[]>([]);
  const [clientes, setClientes] = useState<ClienteMatching[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteMatching | null>(null);
  const [selectedMatching, setSelectedMatching] = useState<MatchingResult | null>(null);
  const [filters, setFilters] = useState({
    nivel: '',
    scoreMin: '',
    scoreMax: '',
    cliente: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    loadMatchings();
    loadClientes();
  }, [filters]);

  const loadMatchings = async () => {
    try {
      const response = await apiService.get('/ia/matching', {
        params: filters
      });
      setMatchings(response.data);
    } catch (error) {
      console.error('Erro ao carregar matchings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await apiService.get('/ia/matching/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleExecutarMatching = async (clienteId: string) => {
    try {
      await apiService.post('/ia/matching/executar', { cliente_id: clienteId });
      loadMatchings();
      loadClientes();
    } catch (error) {
      console.error('Erro ao executar matching:', error);
    }
  };

  const handleExecutarTodos = async () => {
    try {
      await apiService.post('/ia/matching/executar-todos');
      loadMatchings();
      loadClientes();
    } catch (error) {
      console.error('Erro ao executar todos:', error);
    }
  };

  const handleFeedback = async (matchingId: string, feedback: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO') => {
    try {
      await apiService.put(`/ia/matching/${matchingId}/feedback`, { feedback });
      loadMatchings();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  const openClienteModal = (cliente: ClienteMatching) => {
    setSelectedCliente(cliente);
    setShowClienteModal(true);
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'EXCELENTE': return 'text-green-600 bg-green-100';
      case 'MUITO_BOM': return 'text-blue-600 bg-blue-100';
      case 'BOM': return 'text-yellow-600 bg-yellow-100';
      case 'REGULAR': return 'text-orange-600 bg-orange-100';
      case 'BAIXO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStarRating = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Processar dados para gráficos
  const matchingsPorNivel = [
    { nome: 'Excelente', valor: matchings.filter(m => m.nivel_compatibilidade === 'EXCELENTE').length },
    { nome: 'Muito Bom', valor: matchings.filter(m => m.nivel_compatibilidade === 'MUITO_BOM').length },
    { nome: 'Bom', valor: matchings.filter(m => m.nivel_compatibilidade === 'BOM').length },
    { nome: 'Regular', valor: matchings.filter(m => m.nivel_compatibilidade === 'REGULAR').length },
    { nome: 'Baixo', valor: matchings.filter(m => m.nivel_compatibilidade === 'BAIXO').length }
  ];

  const distribuicaoScores = matchings.reduce((acc: any[], matching) => {
    const faixa = Math.floor(matching.score_compatibilidade / 10) * 10;
    const existing = acc.find(item => item.faixa === `${faixa}-${faixa + 9}`);
    if (existing) {
      existing.quantidade += 1;
    } else {
      acc.push({ faixa: `${faixa}-${faixa + 9}`, quantidade: 1 });
    }
    return acc;
  }, []).sort((a, b) => parseInt(a.faixa) - parseInt(b.faixa));

  const topMatchings = matchings
    .filter(m => m.score_compatibilidade >= 80)
    .sort((a, b) => b.score_compatibilidade - a.score_compatibilidade)
    .slice(0, 10);

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
        <h1 className="text-3xl font-bold text-gray-900">Matching Inteligente</h1>
        <p className="text-gray-600 mt-2">IA que conecta clientes com imóveis compatíveis</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-blue-600">{clientes.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Matchings Gerados</p>
              <p className="text-2xl font-bold text-green-600">{matchings.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Matchings Excelentes</p>
              <p className="text-2xl font-bold text-purple-600">
                {matchings.filter(m => m.nivel_compatibilidade === 'EXCELENTE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score Médio</p>
              <p className="text-2xl font-bold text-yellow-600">
                {matchings.length > 0 ? 
                  (matchings.reduce((sum, m) => sum + m.score_compatibilidade, 0) / matchings.length).toFixed(1) : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={handleExecutarTodos}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Executar Todos
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
            value={filters.nivel}
            onChange={(e) => setFilters({...filters, nivel: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos níveis</option>
            <option value="EXCELENTE">Excelente</option>
            <option value="MUITO_BOM">Muito Bom</option>
            <option value="BOM">Bom</option>
            <option value="REGULAR">Regular</option>
            <option value="BAIXO">Baixo</option>
          </select>

          <input
            type="number"
            value={filters.scoreMin}
            onChange={(e) => setFilters({...filters, scoreMin: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Score mínimo"
          />

          <input
            type="number"
            value={filters.scoreMax}
            onChange={(e) => setFilters({...filters, scoreMax: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Score máximo"
          />

          <input
            type="text"
            value={filters.cliente}
            onChange={(e) => setFilters({...filters, cliente: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Cliente"
          />

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
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribuição por Nível */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Nível de Compatibilidade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={matchingsPorNivel}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, valor }) => `${nome}: ${valor}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {matchingsPorNivel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Scores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Scores de Compatibilidade</h3>
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

      {/* Clientes para Matching */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Clientes para Matching</h3>
          <p className="text-sm text-gray-600 mt-1">Clientes aguardando compatibilização</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{cliente.nome}</h4>
                    <p className="text-sm text-gray-600">{cliente.email}</p>
                  </div>
                  <button
                    onClick={() => handleExecutarMatching(cliente.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Executar Matching"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orçamento:</span>
                    <span className="text-gray-900">
                      {formatCurrency(cliente.orcamento_min)} - {formatCurrency(cliente.orcamento_max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compatíveis:</span>
                    <span className="font-medium text-blue-600">{cliente.imoveis_compatíveis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Melhor Score:</span>
                    <span className="font-medium text-green-600">{cliente.melhor_score.toFixed(1)}</span>
                  </div>
                </div>
                <button
                  onClick={() => openClienteModal(cliente)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-900"
                >
                  Ver detalhes
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Matchings */}
      {topMatchings.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Top Matchings (Score >= 80)</h3>
            <p className="text-sm text-gray-600 mt-1">Matchings com excelente compatibilidade</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topMatchings.map((matching) => (
                <div key={matching.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900 mr-2">{matching.cliente_nome}</h4>
                        <div className="flex">
                          {getStarRating(matching.score_compatibilidade)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{matching.imovel_titulo}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(matching.nivel_compatibilidade)}`}>
                        {matching.nivel_compatibilidade.replace('_', ' ')}
                      </span>
                      <div className="text-lg font-bold text-blue-600 mt-1">
                        {matching.score_compatibilidade.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {matching.justificativa.slice(0, 2).map((just, index) => (
                      <div key={index} className="mb-1">• {just}</div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFeedback(matching.id, 'POSITIVO')}
                        className={`px-3 py-1 text-xs rounded ${
                          matching.feedback_cliente === 'POSITIVO' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleFeedback(matching.id, 'NEUTRO')}
                        className={`px-3 py-1 text-xs rounded ${
                          matching.feedback_cliente === 'NEUTRO' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                        }`}
                      >
                        😐
                      </button>
                      <button
                        onClick={() => handleFeedback(matching.id, 'NEGATIVO')}
                        className={`px-3 py-1 text-xs rounded ${
                          matching.feedback_cliente === 'NEGATIVO' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                        }`}
                      >
                        👎
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedMatching(matching)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Cliente */}
      {showClienteModal && selectedCliente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Perfil do Cliente: {selectedCliente.nome}
                </h3>
                <button
                  onClick={() => {
                    setShowClienteModal(false);
                    setSelectedCliente(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações de Contato</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900">{selectedCliente.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="text-gray-900">{selectedCliente.telefone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Preferências</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orçamento:</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedCliente.orcamento_min)} - {formatCurrency(selectedCliente.orcamento_max)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Imóveis Compatíveis:</span>
                      <span className="font-medium text-blue-600">{selectedCliente.imoveis_compatíveis}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Melhor Score:</span>
                      <span className="font-medium text-green-600">{selectedCliente.melhor_score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleExecutarMatching(selectedCliente.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Executar Matching
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes Matching */}
      {selectedMatching && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detalhes do Matching
                </h3>
                <button
                  onClick={() => setSelectedMatching(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Score e Fatores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedMatching.score_compatibilidade.toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-700">Score Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {selectedMatching.nivel_compatibilidade.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-green-700">Nível</div>
                </div>
              </div>

              {/* Fatores de Compatibilidade */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Fatores de Compatibilidade</h4>
                <div className="space-y-3">
                  {Object.entries(selectedMatching.fatores_compatibilidade).map(([fator, valor]) => (
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

              {/* Justificativas */}
              {selectedMatching.justificativa.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Análise de Compatibilidade</h4>
                  <div className="space-y-2">
                    {selectedMatching.justificativa.map((just, index) => (
                      <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                        <Target className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{just}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {selectedMatching.recomendacoes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Recomendações</h4>
                  <div className="space-y-2">
                    {selectedMatching.recomendacoes.map((rec, index) => (
                      <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                        <Zap className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
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

export default Matching;