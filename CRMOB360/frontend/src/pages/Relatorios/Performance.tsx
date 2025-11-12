import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, Filter, Download } from 'lucide-react';

interface PerformanceData {
  periodo: string;
  leads_gerados: number;
  leads_convertidos: number;
  taxa_conversao: number;
  vendas_realizadas: number;
  valor_vendas: number;
  ticket_medio: number;
  imoveis_cadastrados: number;
  imoveis_vendidos: number;
  visitas_realizadas: number;
  tempo_medio_venda: number;
  satisfacao_cliente: number;
}

interface CorretorPerformance {
  corretor_id: string;
  corretor_nome: string;
  vendas_quantidade: number;
  vendas_valor: number;
  leads_atendidos: number;
  leads_convertidos: number;
  taxa_conversao: number;
  ticket_medio: number;
  comissao_total: number;
  ranking: number;
}

interface EquipePerformance {
  equipe_id: string;
  equipe_nome: string;
  corretores_count: number;
  vendas_quantidade: number;
  vendas_valor: number;
  meta_mensal: number;
  percentual_meta: number;
}

const Performance: React.FC = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [corretoresPerformance, setCorretoresPerformance] = useState<CorretorPerformance[]>([]);
  const [equipesPerformance, setEquipesPerformance] = useState<EquipePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    tipo: 'MENSAL',
    dataInicio: '',
    dataFim: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  const [viewMode, setViewMode] = useState<'GERAL' | 'CORRETORES' | 'EQUIPES'>('GERAL');

  useEffect(() => {
    loadPerformanceData();
  }, [periodo]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados gerais de performance
      const response = await apiService.get('/relatorios/performance', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      setPerformanceData(response.data);

      // Carregar performance dos corretores
      const corretoresResponse = await apiService.get('/relatorios/performance/corretores', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      setCorretoresPerformance(corretoresResponse.data);

      // Carregar performance das equipes
      const equipesResponse = await apiService.get('/relatorios/performance/equipes', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      setEquipesPerformance(equipesResponse.data);

    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get('/relatorios/performance/exportar', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano,
          view_mode: viewMode
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance_${viewMode.toLowerCase()}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  // Cálculos dos totais
  const totalLeads = performanceData.reduce((sum, p) => sum + p.leads_gerados, 0);
  const totalVendas = performanceData.reduce((sum, p) => sum + p.vendas_realizadas, 0);
  const totalValor = performanceData.reduce((sum, p) => sum + p.valor_vendas, 0);
  const mediaConversao = performanceData.length > 0 ? 
    performanceData.reduce((sum, p) => sum + p.taxa_conversao, 0) / performanceData.length : 0;

  // Preparar dados para gráficos
  const graficoVendas = performanceData.map(p => ({
    periodo: p.periodo,
    vendas: p.vendas_realizadas,
    valor: p.valor_vendas / 1000 // Em milhares
  }));

  const graficoConversao = performanceData.map(p => ({
    periodo: p.periodo,
    taxa: p.taxa_conversao
  }));

  const graficoLeads = performanceData.map(p => ({
    periodo: p.periodo,
    gerados: p.leads_gerados,
    convertidos: p.leads_convertidos
  }));

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
        <h1 className="text-3xl font-bold text-gray-900">Relatório de Performance</h1>
        <p className="text-gray-600 mt-2">Análise detalhada do desempenho da imobiliária</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={periodo.tipo}
              onChange={(e) => setPeriodo({...periodo, tipo: e.target.value})}
              className="border rounded-lg px-3 py-2"
            >
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
              <option value="PERSONALIZADO">Personalizado</option>
            </select>
          </div>

          {periodo.tipo === 'MENSAL' && (
            <>
              <select
                value={periodo.mes}
                onChange={(e) => setPeriodo({...periodo, mes: parseInt(e.target.value)})}
                className="border rounded-lg px-3 py-2"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(mes => (
                  <option key={mes} value={mes}>
                    {new Date(2000, mes - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={periodo.ano}
                onChange={(e) => setPeriodo({...periodo, ano: parseInt(e.target.value)})}
                className="border rounded-lg px-3 py-2"
              >
                {[2022, 2023, 2024, 2025].map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setViewMode('GERAL')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'GERAL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Geral
            </button>
            <button
              onClick={() => setViewMode('CORRETORES')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'CORRETORES' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Corretores
            </button>
            <button
              onClick={() => setViewMode('EQUIPES')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'EQUIPES' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Equipes
            </button>
          </div>

          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* View Geral */}
      {viewMode === 'GERAL' && (
        <>
          {/* Cards de Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-600">{totalLeads.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vendas Realizadas</p>
                  <p className="text-2xl font-bold text-green-600">{totalVendas.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalValor)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
                  <p className="text-2xl font-bold text-yellow-600">{mediaConversao.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Vendas por Período */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Período</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graficoVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vendas" fill="#3B82F6" name="Quantidade de Vendas" />
                  <Bar dataKey="valor" fill="#10B981" name="Valor (milhares)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Taxa de Conversão */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Conversão</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graficoConversao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                  <Line type="monotone" dataKey="taxa" stroke="#8B5CF6" name="Taxa de Conversão (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Gerados vs Convertidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graficoLeads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gerados" stroke="#3B82F6" name="Leads Gerados" />
                  <Line type="monotone" dataKey="convertidos" stroke="#10B981" name="Leads Convertidos" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas Adicionais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Adicionais</h3>
              <div className="space-y-4">
                {performanceData.slice(-6).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{item.periodo}</div>
                      <div className="text-sm text-gray-600">
                        {item.imoveis_cadastrados} imóveis • {item.visitas_realizadas} visitas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(item.valor_vendas)}</div>
                      <div className="text-sm text-gray-600">{item.vendas_realizadas} vendas</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Corretores */}
      {viewMode === 'CORRETORES' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Performance dos Corretores</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corretor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Vendas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Médio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {corretoresPerformance.map((corretor) => (
                  <tr key={corretor.corretor_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        corretor.ranking === 1 ? 'bg-yellow-500' :
                        corretor.ranking === 2 ? 'bg-gray-400' :
                        corretor.ranking === 3 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {corretor.ranking}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{corretor.corretor_nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{corretor.vendas_quantidade}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">{formatCurrency(corretor.vendas_valor)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {corretor.leads_convertidos}/{corretor.leads_atendidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{corretor.taxa_conversao.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatCurrency(corretor.ticket_medio)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-purple-600">{formatCurrency(corretor.comissao_total)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Equipes */}
      {viewMode === 'EQUIPES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {equipesPerformance.map((equipe) => (
            <div key={equipe.equipe_id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{equipe.equipe_nome}</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{equipe.corretores_count} corretores</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vendas Realizadas</span>
                  <span className="font-bold text-blue-600">{equipe.vendas_quantidade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor Total</span>
                  <span className="font-bold text-green-600">{formatCurrency(equipe.vendas_valor)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Meta Mensal</span>
                  <span className="font-bold text-gray-900">{formatCurrency(equipe.meta_mensal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Atingimento da Meta</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          equipe.percentual_meta >= 100 ? 'bg-green-500' :
                          equipe.percentual_meta >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(equipe.percentual_meta, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`font-bold ${
                      equipe.percentual_meta >= 100 ? 'text-green-600' :
                      equipe.percentual_meta >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {equipe.percentual_meta.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Performance;