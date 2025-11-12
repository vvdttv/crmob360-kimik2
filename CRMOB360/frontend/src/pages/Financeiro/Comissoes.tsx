import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Filter, Plus, Edit, Trash2, Eye, Calculator } from 'lucide-react';

interface Comissao {
  id: string;
  venda_id: string;
  corretor_id: string;
  corretor_nome: string;
  valor_venda: number;
  percentual_comissao: number;
  valor_comissao: number;
  status: 'CALCULADA' | 'APROVADA' | 'PAGA';
  data_venda: string;
  data_calculo: string;
  data_pagamento?: string;
  forma_pagamento?: string;
  observacoes?: string;
}

interface ConfigComissao {
  id: string;
  tipo_venda: 'NOVO' | 'USADO' | 'LOCACAO';
  percentual_padrao: number;
  percentual_minimo: number;
  percentual_maximo: number;
  regras_adicionais?: any;
}

const Comissoes: React.FC = () => {
  const { user } = useAuth();
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [configs, setConfigs] = useState<ConfigComissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    corretor: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    venda_id: '',
    corretor_id: '',
    percentual_comissao: '',
    observacoes: ''
  });

  const [configFormData, setConfigFormData] = useState({
    tipo_venda: 'NOVO' as 'NOVO' | 'USADO' | 'LOCACAO',
    percentual_padrao: '',
    percentual_minimo: '',
    percentual_maximo: ''
  });

  useEffect(() => {
    loadComissoes();
    loadConfigs();
  }, []);

  const loadComissoes = async () => {
    try {
      const response = await apiService.get('/financeiro/comissoes', {
        params: filters
      });
      setComissoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await apiService.get('/financeiro/comissoes/configuracoes');
      setConfigs(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleCalcularComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.post('/financeiro/comissoes/calcular', {
        venda_id: formData.venda_id,
        corretor_id: formData.corretor_id,
        percentual_comissao: parseFloat(formData.percentual_comissao),
        observacoes: formData.observacoes
      });
      setShowModal(false);
      setFormData({
        venda_id: '',
        corretor_id: '',
        percentual_comissao: '',
        observacoes: ''
      });
      loadComissoes();
    } catch (error) {
      console.error('Erro ao calcular comissão:', error);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.post('/financeiro/comissoes/configuracoes', {
        tipo_venda: configFormData.tipo_venda,
        percentual_padrao: parseFloat(configFormData.percentual_padrao),
        percentual_minimo: parseFloat(configFormData.percentual_minimo),
        percentual_maximo: parseFloat(configFormData.percentual_maximo)
      });
      setShowConfigModal(false);
      setConfigFormData({
        tipo_venda: 'NOVO',
        percentual_padrao: '',
        percentual_minimo: '',
        percentual_maximo: ''
      });
      loadConfigs();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const handlePagarComissao = async (id: string) => {
    try {
      await apiService.post(`/financeiro/comissoes/${id}/pagar`);
      loadComissoes();
    } catch (error) {
      console.error('Erro ao pagar comissão:', error);
    }
  };

  const handleAprovarComissao = async (id: string) => {
    try {
      await apiService.post(`/financeiro/comissoes/${id}/aprovar`);
      loadComissoes();
    } catch (error) {
      console.error('Erro ao aprovar comissão:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGA': return 'text-green-600 bg-green-100';
      case 'APROVADA': return 'text-blue-600 bg-blue-100';
      case 'CALCULADA': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalComissoes = comissoes
    .filter(c => c.status === 'PAGA')
    .reduce((sum, c) => sum + c.valor_comissao, 0);

  const totalPendente = comissoes
    .filter(c => c.status !== 'PAGA')
    .reduce((sum, c) => sum + c.valor_comissao, 0);

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
        <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
        <p className="text-gray-600 mt-2">Gerencie as comissões dos corretores</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pago</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalComissoes)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pendente</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalComissoes + totalPendente)}</p>
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
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="CALCULADA">Calculada</option>
            <option value="APROVADA">Aprovada</option>
            <option value="PAGA">Paga</option>
          </select>

          <input
            type="text"
            value={filters.corretor}
            onChange={(e) => setFilters({...filters, corretor: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Nome do corretor"
          />

          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilters({...filters, dataInicio: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Data início"
          />

          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => setFilters({...filters, dataFim: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Data fim"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={loadComissoes}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Aplicar Filtros
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Configurações
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Comissão
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corretor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Comissão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comissoes.map((comissao) => (
                <tr key={comissao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{comissao.corretor_nome}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{comissao.venda_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(comissao.valor_venda)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {comissao.percentual_comissao}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(comissao.valor_comissao)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(comissao.data_venda)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(comissao.status)}`}>
                      {comissao.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {comissao.status === 'CALCULADA' && (
                        <button
                          onClick={() => handleAprovarComissao(comissao.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Aprovar
                        </button>
                      )}
                      {comissao.status === 'APROVADA' && (
                        <button
                          onClick={() => handlePagarComissao(comissao.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Pagar
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedComissao(comissao)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Calcular Comissão */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Calcular Comissão
              </h3>
              <form onSubmit={handleCalcularComissao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID da Venda</label>
                  <input
                    type="text"
                    value={formData.venda_id}
                    onChange={(e) => setFormData({...formData, venda_id: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">ID do Corretor</label>
                  <input
                    type="text"
                    value={formData.corretor_id}
                    onChange={(e) => setFormData({...formData, corretor_id: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentual de Comissão (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.percentual_comissao}
                    onChange={(e) => setFormData({...formData, percentual_comissao: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
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
                    Calcular
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurações */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Configurações de Comissão
              </h3>
              
              {/* Lista de Configurações Existentes */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Configurações Atuais</h4>
                <div className="space-y-2">
                  {configs.map(config => (
                    <div key={config.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{config.tipo_venda}</span>
                        <span className="text-sm text-gray-600">
                          {config.percentual_padrao}% (mín: {config.percentual_minimo}%, máx: {config.percentual_maximo}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário Nova Configuração */}
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Venda</label>
                  <select
                    value={configFormData.tipo_venda}
                    onChange={(e) => setConfigFormData({...configFormData, tipo_venda: e.target.value as 'NOVO' | 'USADO' | 'LOCACAO'})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="NOVO">Novo</option>
                    <option value="USADO">Usado</option>
                    <option value="LOCACAO">Locação</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Percentual Padrão</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configFormData.percentual_padrao}
                      onChange={(e) => setConfigFormData({...configFormData, percentual_padrao: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Percentual Mínimo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configFormData.percentual_minimo}
                      onChange={(e) => setConfigFormData({...configFormData, percentual_minimo: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Percentual Máximo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configFormData.percentual_maximo}
                      onChange={(e) => setConfigFormData({...configFormData, percentual_maximo: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {selectedComissao && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Detalhes da Comissão
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Corretor:</span>
                  <p className="text-sm text-gray-900">{selectedComissao.corretor_nome}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Valor da Venda:</span>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedComissao.valor_venda)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Percentual:</span>
                  <p className="text-sm text-gray-900">{selectedComissao.percentual_comissao}%</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Valor da Comissão:</span>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(selectedComissao.valor_comissao)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Data da Venda:</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedComissao.data_venda)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedComissao.status)}`}>
                    {selectedComissao.status}
                  </span>
                </div>
                {selectedComissao.observacoes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Observações:</span>
                    <p className="text-sm text-gray-900">{selectedComissao.observacoes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedComissao(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comissoes;