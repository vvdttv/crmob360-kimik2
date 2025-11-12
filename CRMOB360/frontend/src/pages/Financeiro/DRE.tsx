import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DREData {
  receitas: {
    operacionais: number;
    financeiras: number;
    total: number;
  };
  despesas: {
    custos: number;
    operacionais: number;
    financeiras: number;
    total: number;
  };
  resultado: {
    bruto: number;
    operacional: number;
    liquido: number;
  };
  margem: {
    bruta: number;
    operacional: number;
    liquida: number;
  };
  comparativo: {
    mesAnterior: {
      receitas: number;
      despesas: number;
      resultado: number;
    };
    anoAnterior: {
      receitas: number;
      despesas: number;
      resultado: number;
    };
  };
}

interface CategoriaResumo {
  categoria: string;
  valor: number;
  percentual: number;
}

const DRE: React.FC = () => {
  const { user } = useAuth();
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [receitasCategorias, setReceitasCategorias] = useState<CategoriaResumo[]>([]);
  const [despesasCategorias, setDespesasCategorias] = useState<CategoriaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  const [comparativoData, setComparativoData] = useState<any[]>([]);

  useEffect(() => {
    loadDRE();
  }, [periodo]);

  const loadDRE = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/financeiro/dre', {
        params: {
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      
      setDreData(response.data);
      
      // Carregar dados detalhados por categoria
      const receitasResponse = await apiService.get('/financeiro/dre/receitas-por-categoria', {
        params: {
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      
      const despesasResponse = await apiService.get('/financeiro/dre/despesas-por-categoria', {
        params: {
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      
      setReceitasCategorias(receitasResponse.data);
      setDespesasCategorias(despesasResponse.data);
      
      // Carregar dados comparativos
      loadComparativo();
      
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparativo = async () => {
    try {
      const response = await apiService.get('/financeiro/dre/comparativo', {
        params: {
          mes: periodo.mes,
          ano: periodo.ano
        }
      });
      setComparativoData(response.data);
    } catch (error) {
      console.error('Erro ao carregar comparativo:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get('/financeiro/dre/exportar', {
        params: {
          mes: periodo.mes,
          ano: periodo.ano
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DRE_${periodo.mes}_${periodo.ano}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar DRE:', error);
    }
  };

  const getResultadoColor = (valor: number) => {
    return valor >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getMargemColor = (valor: number) => {
    if (valor >= 20) return 'text-green-600';
    if (valor >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading || !dreData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Demonstração de Resultados (DRE)</h1>
        <p className="text-gray-600 mt-2">Análise financeira detalhada do período</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
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
          </div>
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(dreData.receitas.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas Total</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(dreData.despesas.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resultado Líquido</p>
              <p className={`text-2xl font-bold ${getResultadoColor(dreData.resultado.liquido)}`}>
                {formatCurrency(dreData.resultado.liquido)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Margem Líquida</p>
              <p className={`text-2xl font-bold ${getMargemColor(dreData.margem.liquida)}`}>
                {dreData.margem.liquida.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DRE Detalhado */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demonstração Detalhada</h3>
          
          {/* Receitas */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-green-600 mb-3">RECEITAS</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Receitas Operacionais</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dreData.receitas.operacionais)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Receitas Financeiras</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dreData.receitas.financeiras)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-900">TOTAL DE RECEITAS</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(dreData.receitas.total)}</span>
              </div>
            </div>
          </div>

          {/* Despesas */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-red-600 mb-3">DESPESAS</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Custos dos Serviços</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dreData.despesas.custos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Despesas Operacionais</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dreData.despesas.operacionais)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Despesas Financeiras</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(dreData.despesas.financeiras)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-900">TOTAL DE DESPESAS</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(dreData.despesas.total)}</span>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-blue-600 mb-3">RESULTADOS</h4>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Resultado Bruto</span>
                <span className={`text-sm font-medium ${getResultadoColor(dreData.resultado.bruto)}`}>
                  {formatCurrency(dreData.resultado.bruto)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Resultado Operacional</span>
                <span className={`text-sm font-medium ${getResultadoColor(dreData.resultado.operacional)}`}>
                  {formatCurrency(dreData.resultado.operacional)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-900">RESULTADO LÍQUIDO</span>
                <span className={`text-sm font-bold ${getResultadoColor(dreData.resultado.liquido)}`}>
                  {formatCurrency(dreData.resultado.liquido)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Receitas por Categoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receitas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitasCategorias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="valor" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Despesas por Categoria */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={despesasCategorias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="valor" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparativo */}
      {comparativoData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparativoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#10B981" name="Receitas" />
              <Line type="monotone" dataKey="despesas" stroke="#EF4444" name="Despesas" />
              <Line type="monotone" dataKey="resultado" stroke="#3B82F6" name="Resultado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análise de Margens */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise de Margens</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{dreData.margem.bruta.toFixed(2)}%</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getMargemColor(dreData.margem.bruta)}`}>
              Margem Bruta
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {(dreData.margem.bruta >= 20) ? 'Excelente' : (dreData.margem.bruta >= 10) ? 'Boa' : 'Atenção'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{dreData.margem.operacional.toFixed(2)}%</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getMargemColor(dreData.margem.operacional)}`}>
              Margem Operacional
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {(dreData.margem.operacional >= 15) ? 'Excelente' : (dreData.margem.operacional >= 8) ? 'Boa' : 'Atenção'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{dreData.margem.liquida.toFixed(2)}%</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getMargemColor(dreData.margem.liquida)}`}>
              Margem Líquida
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {(dreData.margem.liquida >= 10) ? 'Excelente' : (dreData.margem.liquida >= 5) ? 'Boa' : 'Atenção'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DRE;