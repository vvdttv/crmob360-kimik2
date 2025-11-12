import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Home, DollarSign, Users, Calendar, Filter, Download, MapPin, Building } from 'lucide-react';

interface Venda {
  id: string;
  imovel_id: string;
  imovel_titulo: string;
  cliente_id: string;
  cliente_nome: string;
  corretor_id: string;
  corretor_nome: string;
  valor_venda: number;
  valor_comissao: number;
  percentual_comissao: number;
  data_venda: string;
  data_contrato: string;
  status: 'PENDENTE' | 'EM_NEGOCIACAO' | 'CONTRATO_ASSINADO' | 'CONCLUIDA' | 'CANCELADA';
  tipo_imovel: 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COBERTURA' | 'LOJA' | 'GALPAO';
  finalidade: 'RESIDENCIAL' | 'COMERCIAL';
  bairro: string;
  cidade: string;
  estado: string;
  forma_pagamento: string;
  financiamento: boolean;
  valor_financiado: number;
  observacoes?: string;
}

interface VendasPorTipo {
  tipo: string;
  quantidade: number;
  valor: number;
}

interface VendasPorRegiao {
  regiao: string;
  quantidade: number;
  valor: number;
}

interface VendasPorCorretor {
  corretor: string;
  quantidade: number;
  valor: number;
}

const Vendas: React.FC = () => {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    tipo: 'MENSAL',
    dataInicio: '',
    dataFim: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  const [filters, setFilters] = useState({
    status: '',
    tipoImovel: '',
    finalidade: '',
    corretor: '',
    cidade: ''
  });
  const [viewMode, setViewMode] = useState<'RESUMO' | 'DETALHADO'>('RESUMO');

  useEffect(() => {
    loadVendas();
  }, [periodo, filters]);

  const loadVendas = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/relatorios/vendas', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano,
          status: filters.status,
          tipo_imovel: filters.tipoImovel,
          finalidade: filters.finalidade,
          corretor: filters.corretor,
          cidade: filters.cidade
        }
      });
      setVendas(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get('/relatorios/vendas/exportar', {
        params: {
          tipo_periodo: periodo.tipo,
          data_inicio: periodo.dataInicio,
          data_fim: periodo.dataFim,
          mes: periodo.mes,
          ano: periodo.ano,
          status: filters.status,
          tipo_imovel: filters.tipoImovel,
          finalidade: filters.finalidade,
          corretor: filters.corretor,
          cidade: filters.cidade
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_vendas_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  // Processar dados para gráficos
  const vendasPorTipo = vendas.reduce((acc: VendasPorTipo[], venda) => {
    const existing = acc.find(item => item.tipo === venda.tipo_imovel);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += venda.valor_venda;
    } else {
      acc.push({ tipo: venda.tipo_imovel, quantidade: 1, valor: venda.valor_venda });
    }
    return acc;
  }, []);

  const vendasPorRegiao = vendas.reduce((acc: VendasPorRegiao[], venda) => {
    const regiao = `${venda.bairro}, ${venda.cidade}`;
    const existing = acc.find(item => item.regiao === regiao);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += venda.valor_venda;
    } else {
      acc.push({ regiao, quantidade: 1, valor: venda.valor_venda });
    }
    return acc;
  }, []);

  const vendasPorCorretor = vendas.reduce((acc: VendasPorCorretor[], venda) => {
    const existing = acc.find(item => item.corretor === venda.corretor_nome);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += venda.valor_venda;
    } else {
      acc.push({ corretor: venda.corretor_nome, quantidade: 1, valor: venda.valor_venda });
    }
    return acc;
  }, []);

  // Ordenar por valor
  vendasPorRegiao.sort((a, b) => b.valor - a.valor);
  vendasPorCorretor.sort((a, b) => b.valor - a.valor);

  // Cálculos dos totais
  const totalVendas = vendas.length;
  const totalValor = vendas.reduce((sum, venda) => sum + venda.valor_venda, 0);
  const totalComissao = vendas.reduce((sum, venda) => sum + venda.valor_comissao, 0);
  const mediaValor = totalVendas > 0 ? totalValor / totalVendas : 0;
  const vendasConcluidas = vendas.filter(v => v.status === 'CONCLUIDA').length;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
        <h1 className="text-3xl font-bold text-gray-900">Relatório de Vendas</h1>
        <p className="text-gray-600 mt-2">Análise detalhada das vendas e negociações</p>
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
              onClick={() => setViewMode('RESUMO')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'RESUMO' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Resumo
            </button>
            <button
              onClick={() => setViewMode('DETALHADO')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'DETALHADO' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Detalhado
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

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Filtros</h3>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_NEGOCIACAO">Em Negociação</option>
            <option value="CONTRATO_ASSINADO">Contrato Assinado</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filters.tipoImovel}
            onChange={(e) => setFilters({...filters, tipoImovel: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="CASA">Casa</option>
            <option value="APARTAMENTO">Apartamento</option>
            <option value="TERRENO">Terreno</option>
            <option value="COBERTURA">Cobertura</option>
            <option value="LOJA">Loja</option>
            <option value="GALPAO">Galpão</option>
          </select>

          <select
            value={filters.finalidade}
            onChange={(e) => setFilters({...filters, finalidade: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas finalidades</option>
            <option value="RESIDENCIAL">Residencial</option>
            <option value="COMERCIAL">Comercial</option>
          </select>

          <input
            type="text"
            value={filters.corretor}
            onChange={(e) => setFilters({...filters, corretor: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Corretor"
          />

          <input
            type="text"
            value={filters.cidade}
            onChange={(e) => setFilters({...filters, cidade: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Cidade"
          />
        </div>
        <div className="p-4 border-t">
          <button
            onClick={loadVendas}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* View Resumo */}
      {viewMode === 'RESUMO' && (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vendas</p>
                  <p className="text-2xl font-bold text-blue-600">{totalVendas.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValor)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vendas Concluídas</p>
                  <p className="text-2xl font-bold text-purple-600">{vendasConcluidas.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Comissões</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalComissao)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Vendas por Tipo de Imóvel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Tipo de Imóvel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vendasPorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {vendasPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Vendas por Região */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Região (Top 10)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendasPorRegiao.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="regiao" type="category" width={150} />
                  <Tooltip formatter={(value: any) => [value, 'Quantidade']} />
                  <Bar dataKey="quantidade" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Corretores */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Corretores</h3>
              <div className="space-y-3">
                {vendasPorCorretor.slice(0, 5).map((corretor, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{corretor.corretor}</div>
                        <div className="text-sm text-gray-600">{corretor.quantidade} vendas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(corretor.valor)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estatísticas Adicionais */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket Médio</span>
                  <span className="font-bold text-blue-600">{formatCurrency(mediaValor)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa de Sucesso</span>
                  <span className="font-bold text-green-600">
                    {totalVendas > 0 ? ((vendasConcluidas / totalVendas) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comissão Média</span>
                  <span className="font-bold text-purple-600">
                    {totalVendas > 0 ? formatCurrency(totalComissao / totalVendas) : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Imóveis Vendidos</span>
                  <span className="font-bold text-orange-600">{totalVendas}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Detalhado */}
      {viewMode === 'DETALHADO' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Vendas Detalhadas</h3>
            <p className="text-sm text-gray-600 mt-1">{totalVendas} vendas encontradas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imóvel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corretor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{venda.imovel_titulo}</div>
                      <div className="text-sm text-gray-500">{venda.tipo_imovel} • {venda.finalidade}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{venda.cliente_nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{venda.corretor_nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">{formatCurrency(venda.valor_venda)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-purple-600">{formatCurrency(venda.valor_comissao)}</span>
                      <div className="text-xs text-gray-500">{venda.percentual_comissao}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(venda.data_venda)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        venda.status === 'CONCLUIDA' ? 'text-green-600 bg-green-100' :
                        venda.status === 'EM_NEGOCIACAO' ? 'text-yellow-600 bg-yellow-100' :
                        venda.status === 'CONTRATO_ASSINADO' ? 'text-blue-600 bg-blue-100' :
                        venda.status === 'CANCELADA' ? 'text-red-600 bg-red-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {venda.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {venda.bairro}, {venda.cidade}
                      </div>
                      <div className="text-sm text-gray-500">{venda.estado}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendas;