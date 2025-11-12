import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Filter, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';

interface Conta {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  cliente_id?: string;
  imovel_id?: string;
  forma_pagamento?: string;
  comprovante_url?: string;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  cor: string;
}

const Contas: React.FC = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState<Conta | null>(null);
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    categoria: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    tipo: 'RECEITA' as 'RECEITA' | 'DESPESA',
    categoria: '',
    descricao: '',
    valor: '',
    data_vencimento: '',
    forma_pagamento: '',
    cliente_id: '',
    imovel_id: ''
  });

  useEffect(() => {
    loadContas();
    loadCategorias();
  }, []);

  const loadContas = async () => {
    try {
      const response = await apiService.get('/financeiro/contas', {
        params: filters
      });
      setContas(response.data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await apiService.get('/financeiro/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedConta) {
        await apiService.put(`/financeiro/contas/${selectedConta.id}`, {
          ...formData,
          valor: parseFloat(formData.valor)
        });
      } else {
        await apiService.post('/financeiro/contas', {
          ...formData,
          valor: parseFloat(formData.valor)
        });
      }
      setShowModal(false);
      setFormData({
        tipo: 'RECEITA',
        categoria: '',
        descricao: '',
        valor: '',
        data_vencimento: '',
        forma_pagamento: '',
        cliente_id: '',
        imovel_id: ''
      });
      loadContas();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await apiService.delete(`/financeiro/contas/${id}`);
        loadContas();
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
      }
    }
  };

  const handleBaixar = async (id: string) => {
    try {
      await apiService.post(`/financeiro/contas/${id}/baixar`);
      loadContas();
    } catch (error) {
      console.error('Erro ao baixar conta:', error);
    }
  };

  const openEditModal = (conta: Conta) => {
    setSelectedConta(conta);
    setFormData({
      tipo: conta.tipo,
      categoria: conta.categoria,
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      data_vencimento: conta.data_vencimento.split('T')[0],
      forma_pagamento: conta.forma_pagamento || '',
      cliente_id: conta.cliente_id || '',
      imovel_id: conta.imovel_id || ''
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setSelectedConta(null);
    setFormData({
      tipo: 'RECEITA',
      categoria: '',
      descricao: '',
      valor: '',
      data_vencimento: '',
      forma_pagamento: '',
      cliente_id: '',
      imovel_id: ''
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO': return 'text-green-600 bg-green-100';
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-100';
      case 'ATRASADO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600';
  };

  const totalReceitas = contas
    .filter(c => c.tipo === 'RECEITA' && c.status === 'PAGO')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalDespesas = contas
    .filter(c => c.tipo === 'DESPESA' && c.status === 'PAGO')
    .reduce((sum, c) => sum + c.valor, 0);

  const saldo = totalReceitas - totalDespesas;

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
        <h1 className="text-3xl font-bold text-gray-900">Contas a Pagar/Receber</h1>
        <p className="text-gray-600 mt-2">Gerencie suas receitas e despesas</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldo)}
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="ATRASADO">Atrasado</option>
          </select>

          <select
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nome}>{cat.nome}</option>
            ))}
          </select>

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
          onClick={loadContas}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contas.map((conta) => (
                <tr key={conta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${getTipoColor(conta.tipo)}`}>
                      {conta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{conta.descricao}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{conta.categoria}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getTipoColor(conta.tipo)}`}>
                      {formatCurrency(conta.valor)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(conta.data_vencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conta.status)}`}>
                      {conta.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(conta)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {conta.status === 'PENDENTE' && (
                        <button
                          onClick={() => handleBaixar(conta.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(conta.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedConta ? 'Editar Conta' : 'Nova Conta'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as 'RECEITA' | 'DESPESA'})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="RECEITA">Receita</option>
                      <option value="DESPESA">Despesa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Selecione...</option>
                      {categorias
                        .filter(cat => cat.tipo === formData.tipo)
                        .map(cat => (
                          <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                    <input
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                    <select
                      value={formData.forma_pagamento}
                      onChange={(e) => setFormData({...formData, forma_pagamento: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Selecione...</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                      <option value="BOLETO">Boleto</option>
                      <option value="PIX">PIX</option>
                      <option value="TRANSFERENCIA">Transferência Bancária</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cliente (Opcional)</label>
                    <input
                      type="text"
                      value={formData.cliente_id}
                      onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      placeholder="ID do Cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Imóvel (Opcional)</label>
                    <input
                      type="text"
                      value={formData.imovel_id}
                      onChange={(e) => setFormData({...formData, imovel_id: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      placeholder="ID do Imóvel"
                    />
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
                    {selectedConta ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contas;