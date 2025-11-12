import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, MapPin, Building, DollarSign, Filter, Download, TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface ImovelEstoque {
  id: string;
  titulo: string;
  tipo: 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'COBERTURA' | 'LOJA' | 'GALPAO';
  finalidade: 'RESIDENCIAL' | 'COMERCIAL';
  status: 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO' | 'ALUGADO' | 'MANUTENCAO';
  valor: number;
  valor_condominio?: number;
  valor_iptu?: number;
  area_total: number;
  area_util?: number;
  quartos?: number;
  suites?: number;
  banheiros?: number;
  vagas?: number;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  proprietario_id: string;
  proprietario_nome: string;
  corretor_id?: string;
  corretor_nome?: string;
  data_cadastro: string;
  data_atualizacao: string;
  tempo_estoque: number; // em dias
  valor_estimado_aluguel?: number;
  roi_estimado?: number;
}

interface EstoqueAnalise {
  total_imoveis: number;
  valor_total_estoque: number;
  media_valor: number;
  tempo_medio_estoque: number;
  taxa_ocupacao: number;
  valor_medio_aluguel: number;
  roi_medio: number;
}

interface EstoquePorTipo {
  tipo: string;
  quantidade: number;
  valor: number;
  media_valor: number;
}

interface EstoquePorRegiao {
  regiao: string;
  quantidade: number;
  valor: number;
}

interface EstoquePorStatus {
  status: string;
  quantidade: number;
  percentual: number;
}

const Estoque: React.FC = () => {
  const { user } = useAuth();
  const [imoveis, setImoveis] = useState<ImovelEstoque[]>([]);
  const [analise, setAnalise] = useState<EstoqueAnalise | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    finalidade: '',
    status: '',
    bairro: '',
    cidade: '',
    valorMin: '',
    valorMax: '',
    tempoEstoque: ''
  });
  const [viewMode, setViewMode] = useState<'RESUMO' | 'DETALHADO'>('RESUMO');

  useEffect(() => {
    loadEstoque();
  }, [filters]);

  const loadEstoque = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.get('/relatorios/estoque', {
        params: {
          tipo: filters.tipo,
          finalidade: filters.finalidade,
          status: filters.status,
          bairro: filters.bairro,
          cidade: filters.cidade,
          valor_min: filters.valorMin,
          valor_max: filters.valorMax,
          tempo_estoque: filters.tempoEstoque
        }
      });
      
      setImoveis(response.data.imoveis);
      setAnalise(response.data.analise);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get('/relatorios/estoque/exportar', {
        params: {
          tipo: filters.tipo,
          finalidade: filters.finalidade,
          status: filters.status,
          bairro: filters.bairro,
          cidade: filters.cidade,
          valor_min: filters.valorMin,
          valor_max: filters.valorMax,
          tempo_estoque: filters.tempoEstoque
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estoque_imoveis_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  // Processar dados para gráficos
  const estoquePorTipo = imoveis.reduce((acc: EstoquePorTipo[], imovel) => {
    const existing = acc.find(item => item.tipo === imovel.tipo);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += imovel.valor;
    } else {
      acc.push({ 
        tipo: imovel.tipo, 
        quantidade: 1, 
        valor: imovel.valor,
        media_valor: imovel.valor
      });
    }
    return acc;
  }, []);

  // Calcular médias
  estoquePorTipo.forEach(item => {
    item.media_valor = item.valor / item.quantidade;
  });

  const estoquePorRegiao = imoveis.reduce((acc: EstoquePorRegiao[], imovel) => {
    const regiao = `${imovel.bairro}, ${imovel.cidade}`;
    const existing = acc.find(item => item.regiao === regiao);
    if (existing) {
      existing.quantidade += 1;
      existing.valor += imovel.valor;
    } else {
      acc.push({ regiao, quantidade: 1, valor: imovel.valor });
    }
    return acc;
  }, []);

  estoquePorRegiao.sort((a, b) => b.quantidade - a.quantidade);

  const estoquePorStatus = imoveis.reduce((acc: EstoquePorStatus[], imovel) => {
    const existing = acc.find(item => item.status === imovel.status);
    if (existing) {
      existing.quantidade += 1;
    } else {
      acc.push({ status: imovel.status, quantidade: 1, percentual: 0 });
    }
    return acc;
  }, []);

  // Calcular percentuais
  const totalImoveis = imoveis.length;
  estoquePorStatus.forEach(item => {
    item.percentual = totalImoveis > 0 ? (item.quantidade / totalImoveis) * 100 : 0;
  });

  // Imóveis com mais tempo em estoque
  const imoveisLongoPrazo = imoveis
    .filter(imovel => imovel.tempo_estoque > 180)
    .sort((a, b) => b.tempo_estoque - a.tempo_estoque)
    .slice(0, 10);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading || !analise) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Relatório de Estoque</h1>
        <p className="text-gray-600 mt-2">Análise detalhada do estoque de imóveis</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Imóveis</p>
              <p className="text-2xl font-bold text-blue-600">{analise.total_imoveis.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total Estoque</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(analise.valor_total_estoque)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Médio</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(analise.media_valor)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo Médio Estoque</p>
              <p className="text-2xl font-bold text-yellow-600">{Math.round(analise.tempo_medio_estoque)} dias</p>
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
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

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="RESERVADO">Reservado</option>
            <option value="VENDIDO">Vendido</option>
            <option value="ALUGADO">Alugado</option>
            <option value="MANUTENCAO">Manutenção</option>
          </select>

          <input
            type="text"
            value={filters.cidade}
            onChange={(e) => setFilters({...filters, cidade: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Cidade"
          />
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-t">
          <input
            type="number"
            value={filters.valorMin}
            onChange={(e) => setFilters({...filters, valorMin: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Valor mínimo"
          />
          <input
            type="number"
            value={filters.valorMax}
            onChange={(e) => setFilters({...filters, valorMax: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Valor máximo"
          />
          <select
            value={filters.tempoEstoque}
            onChange={(e) => setFilters({...filters, tempoEstoque: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Tempo em estoque</option>
            <option value="0-30">Até 30 dias</option>
            <option value="31-90">31 a 90 dias</option>
            <option value="91-180">91 a 180 dias</option>
            <option value="181+">Mais de 180 dias</option>
          </select>
          <button
            onClick={loadEstoque}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
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

      {/* View Resumo */}
      {viewMode === 'RESUMO' && (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Estoque por Tipo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estoque por Tipo de Imóvel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estoquePorTipo}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {estoquePorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Estoque por Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estoque por Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estoquePorStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'Quantidade']} />
                  <Bar dataKey="quantidade" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Valores por Tipo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Valor Médio por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={estoquePorTipo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="tipo" type="category" width={100} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Valor Médio']} />
                  <Bar dataKey="media_valor" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Regiões */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Regiões</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {estoquePorRegiao.slice(0, 10).map((regiao, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">{regiao.regiao}</div>
                        <div className="text-sm text-gray-600">{regiao.quantidade} imóveis</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatCurrency(regiao.valor)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Imóveis com Mais Tempo em Estoque */}
          {imoveisLongoPrazo.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Imóveis com Mais Tempo em Estoque</h3>
              <div className="space-y-3">
                {imoveisLongoPrazo.map((imovel) => (
                  <div key={imovel.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{imovel.titulo}</div>
                      <div className="text-sm text-gray-600">
                        {imovel.tipo} • {imovel.bairro}, {imovel.cidade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{imovel.tempo_estoque} dias</div>
                      <div className="text-sm text-gray-600">{formatCurrency(imovel.valor)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* View Detalhado */}
      {viewMode === 'DETALHADO' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Imóveis em Estoque</h3>
            <p className="text-sm text-gray-600 mt-1">{totalImoveis} imóveis encontrados</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imóvel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tempo Estoque</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imoveis.map((imovel) => (
                  <tr key={imovel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{imovel.titulo}</div>
                      <div className="text-sm text-gray-600">
                        {imovel.quartos && `${imovel.quartos} quartos`} • 
                        {imovel.vagas && `${imovel.vagas} vagas`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{imovel.tipo}</span>
                      <div className="text-xs text-gray-500">{imovel.finalidade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600">{formatCurrency(imovel.valor)}</span>
                      {imovel.valor_condominio && (
                        <div className="text-xs text-gray-500">Condomínio: {formatCurrency(imovel.valor_condominio)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {imovel.area_total}m²
                      {imovel.area_util && (
                        <div className="text-xs text-gray-500">Útil: {imovel.area_util}m²</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {imovel.bairro}, {imovel.cidade}
                      </div>
                      <div className="text-sm text-gray-500">{imovel.estado}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        imovel.status === 'DISPONIVEL' ? 'text-green-600 bg-green-100' :
                        imovel.status === 'RESERVADO' ? 'text-yellow-600 bg-yellow-100' :
                        imovel.status === 'VENDIDO' ? 'text-blue-600 bg-blue-100' :
                        imovel.status === 'ALUGADO' ? 'text-purple-600 bg-purple-100' :
                        'text-gray-600 bg-gray-100'
                      }`}>
                        {imovel.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{imovel.tempo_estoque} dias</div>
                      {imovel.tempo_estoque > 180 && (
                        <div className="text-xs text-red-600">Longo prazo</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
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

export default Estoque;