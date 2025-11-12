import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Plus, Edit, Trash2, Check, X, Clock, AlertCircle, Filter, Calendar, User } from 'lucide-react';

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'COMUM' | 'URGENTE' | 'IMPORTANTE';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  responsavel_id: string;
  responsavel_nome: string;
  criador_id: string;
  criador_nome: string;
  processo_id?: string;
  processo_nome?: string;
  data_criacao: string;
  data_vencimento: string;
  data_conclusao?: string;
  categoria: string;
  tags: string[];
  observacoes?: string;
  anexos?: any[];
}

interface CategoriaTarefa {
  id: string;
  nome: string;
  cor: string;
  ativa: boolean;
}

const Tarefas: React.FC = () => {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<Tarefa | null>(null);
  const [viewMode, setViewMode] = useState<'lista' | 'quadro'>('lista');
  const [filters, setFilters] = useState({
    status: '',
    prioridade: '',
    responsavel: '',
    categoria: '',
    dataVencimento: '',
    tipo: ''
  });

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'COMUM' as 'COMUM' | 'URGENTE' | 'IMPORTANTE',
    prioridade: 'MEDIA' as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE',
    responsavel_id: '',
    categoria: '',
    data_vencimento: '',
    processo_id: '',
    tags: '',
    observacoes: ''
  });

  const [categoriaFormData, setCategoriaFormData] = useState({
    nome: '',
    cor: '#3B82F6'
  });

  useEffect(() => {
    loadTarefas();
    loadCategorias();
  }, []);

  const loadTarefas = async () => {
    try {
      const response = await apiService.get('/processos/tarefas', {
        params: filters
      });
      setTarefas(response.data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await apiService.get('/processos/tarefas/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      if (selectedTarefa) {
        await apiService.put(`/processos/tarefas/${selectedTarefa.id}`, data);
      } else {
        await apiService.post('/processos/tarefas', data);
      }
      
      setShowModal(false);
      setFormData({
        titulo: '',
        descricao: '',
        tipo: 'COMUM',
        prioridade: 'MEDIA',
        responsavel_id: '',
        categoria: '',
        data_vencimento: '',
        processo_id: '',
        tags: '',
        observacoes: ''
      });
      loadTarefas();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleCategoriaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.post('/processos/tarefas/categorias', categoriaFormData);
      setShowCategoriaModal(false);
      setCategoriaFormData({ nome: '', cor: '#3B82F6' });
      loadCategorias();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const handleStatusChange = async (tarefaId: string, novoStatus: string) => {
    try {
      await apiService.put(`/processos/tarefas/${tarefaId}/status`, { status: novoStatus });
      loadTarefas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await apiService.delete(`/processos/tarefas/${id}`);
        loadTarefas();
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
      }
    }
  };

  const openEditModal = (tarefa: Tarefa) => {
    setSelectedTarefa(tarefa);
    setFormData({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      tipo: tarefa.tipo,
      prioridade: tarefa.prioridade,
      responsavel_id: tarefa.responsavel_id,
      categoria: tarefa.categoria,
      data_vencimento: tarefa.data_vencimento.split('T')[0],
      processo_id: tarefa.processo_id || '',
      tags: tarefa.tags.join(', '),
      observacoes: tarefa.observacoes || ''
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setSelectedTarefa(null);
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'COMUM',
      prioridade: 'MEDIA',
      responsavel_id: '',
      categoria: '',
      data_vencimento: '',
      processo_id: '',
      tags: '',
      observacoes: ''
    });
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA': return 'text-green-600 bg-green-100';
      case 'EM_ANDAMENTO': return 'text-blue-600 bg-blue-100';
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELADA': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'text-red-600 bg-red-100';
      case 'ALTA': return 'text-orange-600 bg-orange-100';
      case 'MEDIA': return 'text-yellow-600 bg-yellow-100';
      case 'BAIXA': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'URGENTE': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'IMPORTANTE': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <Calendar className="w-4 h-4 text-blue-500" />;
    }
  };

  const tarefasFiltradas = tarefas.filter(tarefa => {
    if (filters.status && tarefa.status !== filters.status) return false;
    if (filters.prioridade && tarefa.prioridade !== filters.prioridade) return false;
    if (filters.responsavel && !tarefa.responsavel_nome.toLowerCase().includes(filters.responsavel.toLowerCase())) return false;
    if (filters.categoria && tarefa.categoria !== filters.categoria) return false;
    if (filters.tipo && tarefa.tipo !== filters.tipo) return false;
    if (filters.dataVencimento) {
      const hoje = new Date();
      const vencimento = new Date(tarefa.data_vencimento);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filters.dataVencimento === 'atrasadas' && diffDays >= 0) return false;
      if (filters.dataVencimento === 'hoje' && diffDays !== 0) return false;
      if (filters.dataVencimento === 'esta_semana' && (diffDays < 0 || diffDays > 7)) return false;
    }
    return true;
  });

  const tarefasPorStatus = {
    PENDENTE: tarefasFiltradas.filter(t => t.status === 'PENDENTE'),
    EM_ANDAMENTO: tarefasFiltradas.filter(t => t.status === 'EM_ANDAMENTO'),
    CONCLUIDA: tarefasFiltradas.filter(t => t.status === 'CONCLUIDA'),
    CANCELADA: tarefasFiltradas.filter(t => t.status === 'CANCELADA')
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
        <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
        <p className="text-gray-600 mt-2">Gerencie suas tarefas e atividades</p>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode('lista')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('quadro')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'quadro' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Quadro
          </button>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCategoriaModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Categorias
          </button>
          <button
            onClick={openNewModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filters.prioridade}
            onChange={(e) => setFilters({...filters, prioridade: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>

          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="COMUM">Comum</option>
            <option value="URGENTE">Urgente</option>
            <option value="IMPORTANTE">Importante</option>
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
            type="text"
            value={filters.responsavel}
            onChange={(e) => setFilters({...filters, responsavel: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Responsável"
          />

          <select
            value={filters.dataVencimento}
            onChange={(e) => setFilters({...filters, dataVencimento: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todas datas</option>
            <option value="atrasadas">Atrasadas</option>
            <option value="hoje">Vence Hoje</option>
            <option value="esta_semana">Esta Semana</option>
          </select>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={loadTarefas}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Visualização em Lista */}
      {viewMode === 'lista' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tarefasFiltradas.map((tarefa) => (
                  <tr key={tarefa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getTipoIcon(tarefa.tipo)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tarefa.titulo}</div>
                          {tarefa.processo_nome && (
                            <div className="text-sm text-gray-500">{tarefa.processo_nome}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{tarefa.tipo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrioridadeColor(tarefa.prioridade)}`}>
                        {tarefa.prioridade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{tarefa.responsavel_nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(tarefa.data_vencimento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={tarefa.status}
                        onChange={(e) => handleStatusChange(tarefa.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full border-0 py-1 px-2 ${getStatusColor(tarefa.status)}`}
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(tarefa)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tarefa.id)}
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
      )}

      {/* Visualização em Quadro */}
      {viewMode === 'quadro' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Object.entries(tarefasPorStatus).map(([status, tarefasStatus]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">
                  {status === 'PENDENTE' && 'Pendentes'}
                  {status === 'EM_ANDAMENTO' && 'Em Andamento'}
                  {status === 'CONCLUIDA' && 'Concluídas'}
                  {status === 'CANCELADA' && 'Canceladas'}
                </h3>
                <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full">
                  {tarefasStatus.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {tarefasStatus.map((tarefa) => (
                  <div key={tarefa.id} className="bg-white rounded-lg p-3 shadow hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{tarefa.titulo}</h4>
                      {getTipoIcon(tarefa.tipo)}
                    </div>
                    
                    {tarefa.descricao && (
                      <p className="text-xs text-gray-600 mb-2">{tarefa.descricao}</p>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span className={`px-2 py-1 rounded-full ${getPrioridadeColor(tarefa.prioridade)}`}>
                        {tarefa.prioridade}
                      </span>
                      <span>{formatDate(tarefa.data_vencimento)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="w-3 h-3 mr-1" />
                        {tarefa.responsavel_nome}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openEditModal(tarefa)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(tarefa.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tarefa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedTarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as 'COMUM' | 'URGENTE' | 'IMPORTANTE'})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="COMUM">Comum</option>
                      <option value="URGENTE">Urgente</option>
                      <option value="IMPORTANTE">Importante</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                    <select
                      value={formData.prioridade}
                      onChange={(e) => setFormData({...formData, prioridade: e.target.value as 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Responsável</label>
                    <input
                      type="text"
                      value={formData.responsavel_id}
                      onChange={(e) => setFormData({...formData, responsavel_id: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      placeholder="ID do responsável"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Sem categoria</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                    <input
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processo (Opcional)</label>
                    <input
                      type="text"
                      value={formData.processo_id}
                      onChange={(e) => setFormData({...formData, processo_id: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      placeholder="ID do processo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    placeholder="tag1, tag2, tag3"
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
                    {selectedTarefa ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categorias */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Gerenciar Categorias
              </h3>
              
              {/* Lista de Categorias */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Categorias Existentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categorias.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-2" 
                          style={{ backgroundColor: cat.cor }}
                        ></div>
                        <span className="text-sm">{cat.nome}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${cat.ativa ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                        {cat.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário Nova Categoria */}
              <form onSubmit={handleCategoriaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                  <input
                    type="text"
                    value={categoriaFormData.nome}
                    onChange={(e) => setCategoriaFormData({...categoriaFormData, nome: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Cor</label>
                  <input
                    type="color"
                    value={categoriaFormData.cor}
                    onChange={(e) => setCategoriaFormData({...categoriaFormData, cor: e.target.value})}
                    className="mt-1 block w-full h-10 border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCategoriaModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Adicionar Categoria
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

export default Tarefas;