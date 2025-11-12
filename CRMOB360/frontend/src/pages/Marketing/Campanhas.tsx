import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Plus, Edit, Trash2, Eye, Play, Pause, Send, Filter, Target, TrendingUp, Users, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Campanha {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'MULTI_CANAL';
  status: 'RASCUNHO' | 'AGENDADA' | 'ATIVA' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA';
  segmentacao: any;
  conteudo: any;
  agendamento?: {
    tipo: 'IMEDIATO' | 'AGENDADO' | 'RECORRENTE';
    data_hora?: string;
    recorrencia?: string;
  };
  metricas: {
    enviados: number;
    entregues: number;
    abertos: number;
    cliques: number;
    respostas: number;
    taxa_conversao: number;
    custo_total: number;
    roi: number;
  };
  data_criacao: string;
  data_inicio?: string;
  data_fim?: string;
  criado_por: string;
  orcamento: number;
  publico_alvo: number;
}

interface Segmentacao {
  tipo: 'TODOS' | 'POR_PERFIL' | 'POR_COMPORTAMENTO' | 'POR_LOCALIZACAO' | 'POR_INTERESSE';
  criterios: any;
  tamanho_estimado: number;
}

const Campanhas: React.FC = () => {
  const { user } = useAuth();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMetricasModal, setShowMetricasModal] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'EMAIL' as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'MULTI_CANAL',
    orcamento: '',
    publico_alvo: '',
    segmentacao_tipo: 'TODOS' as 'TODOS' | 'POR_PERFIL' | 'POR_COMPORTAMENTO' | 'POR_LOCALIZACAO' | 'POR_INTERESSE',
    conteudo_assunto: '',
    conteudo_corpo: '',
    agendamento_tipo: 'IMEDIATO' as 'IMEDIATO' | 'AGENDADO' | 'RECORRENTE',
    agendamento_data_hora: '',
    agendamento_recorrencia: ''
  });

  useEffect(() => {
    loadCampanhas();
  }, []);

  const loadCampanhas = async () => {
    try {
      const response = await apiService.get('/marketing/campanhas', {
        params: filters
      });
      setCampanhas(response.data);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao,
        tipo: formData.tipo,
        orcamento: parseFloat(formData.orcamento),
        publico_alvo: parseInt(formData.publico_alvo),
        segmentacao: {
          tipo: formData.segmentacao_tipo,
          criterios: {}
        },
        conteudo: {
          assunto: formData.conteudo_assunto,
          corpo: formData.conteudo_corpo
        },
        agendamento: {
          tipo: formData.agendamento_tipo,
          data_hora: formData.agendamento_data_hora || undefined,
          recorrencia: formData.agendamento_recorrencia || undefined
        }
      };

      if (selectedCampanha) {
        await apiService.put(`/marketing/campanhas/${selectedCampanha.id}`, data);
      } else {
        await apiService.post('/marketing/campanhas', data);
      }
      
      setShowModal(false);
      resetForm();
      loadCampanhas();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
    }
  };

  const handleExecutar = async (campanhaId: string) => {
    try {
      await apiService.post(`/marketing/campanhas/${campanhaId}/executar`);
      loadCampanhas();
    } catch (error) {
      console.error('Erro ao executar campanha:', error);
    }
  };

  const handlePausar = async (campanhaId: string) => {
    try {
      await apiService.post(`/marketing/campanhas/${campanhaId}/pausar`);
      loadCampanhas();
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
    }
  };

  const handleCancelar = async (campanhaId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta campanha?')) {
      try {
        await apiService.post(`/marketing/campanhas/${campanhaId}/cancelar`);
        loadCampanhas();
      } catch (error) {
        console.error('Erro ao cancelar campanha:', error);
      }
    }
  };

  const handleDelete = async (campanhaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      try {
        await apiService.delete(`/marketing/campanhas/${campanhaId}`);
        loadCampanhas();
      } catch (error) {
        console.error('Erro ao excluir campanha:', error);
      }
    }
  };

  const openMetricasModal = (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    setShowMetricasModal(true);
  };

  const openEditModal = (campanha: Campanha) => {
    setSelectedCampanha(campanha);
    setFormData({
      nome: campanha.nome,
      descricao: campanha.descricao,
      tipo: campanha.tipo,
      orcamento: campanha.orcamento.toString(),
      publico_alvo: campanha.publico_alvo.toString(),
      segmentacao_tipo: campanha.segmentacao.tipo,
      conteudo_assunto: campanha.conteudo.assunto || '',
      conteudo_corpo: campanha.conteudo.corpo || '',
      agendamento_tipo: campanha.agendamento?.tipo || 'IMEDIATO',
      agendamento_data_hora: campanha.agendamento?.data_hora?.split('T')[0] || '',
      agendamento_recorrencia: campanha.agendamento?.recorrencia || ''
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setSelectedCampanha(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'EMAIL',
      orcamento: '',
      publico_alvo: '',
      segmentacao_tipo: 'TODOS',
      conteudo_assunto: '',
      conteudo_corpo: '',
      agendamento_tipo: 'IMEDIATO',
      agendamento_data_hora: '',
      agendamento_recorrencia: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVA': return 'text-green-600 bg-green-100';
      case 'PAUSADA': return 'text-yellow-600 bg-yellow-100';
      case 'CONCLUIDA': return 'text-blue-600 bg-blue-100';
      case 'CANCELADA': return 'text-red-600 bg-red-100';
      case 'RASCUNHO': return 'text-gray-600 bg-gray-100';
      case 'AGENDADA': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'EMAIL': return <Mail className="w-5 h-5" />;
      case 'SMS': return <MessageSquare className="w-5 h-5" />;
      case 'WHATSAPP': return <Smartphone className="w-5 h-5" />;
      case 'MULTI_CANAL': return <Users className="w-5 h-5" />;
      default: return <Mail className="w-5 h-5" />;
    }
  };

  // Dados para gráficos
  const campanhasPorStatus = [
    { nome: 'Ativas', valor: campanhas.filter(c => c.status === 'ATIVA').length },
    { nome: 'Concluídas', valor: campanhas.filter(c => c.status === 'CONCLUIDA').length },
    { nome: 'Pausadas', valor: campanhas.filter(c => c.status === 'PAUSADA').length },
    { nome: 'Rascunho', valor: campanhas.filter(c => c.status === 'RASCUNHO').length }
  ];

  const campanhasPorTipo = [
    { nome: 'Email', valor: campanhas.filter(c => c.tipo === 'EMAIL').length },
    { nome: 'SMS', valor: campanhas.filter(c => c.tipo === 'SMS').length },
    { nome: 'WhatsApp', valor: campanhas.filter(c => c.tipo === 'WHATSAPP').length },
    { nome: 'Multi-canal', valor: campanhas.filter(c => c.tipo === 'MULTI_CANAL').length }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

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
        <h1 className="text-3xl font-bold text-gray-900">Campanhas de Marketing</h1>
        <p className="text-gray-600 mt-2">Crie e gerencie campanhas multicanal</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Campanhas Ativas</p>
              <p className="text-2xl font-bold text-blue-600">
                {campanhas.filter(c => c.status === 'ATIVA').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enviados</p>
              <p className="text-2xl font-bold text-green-600">
                {campanhas.reduce((sum, c) => sum + c.metricas.enviados, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ROI Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                {campanhas.length > 0 ? 
                  (campanhas.reduce((sum, c) => sum + c.metricas.roi, 0) / campanhas.length).toFixed(1) : 0
                }%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa Abertura</p>
              <p className="text-2xl font-bold text-yellow-600">
                {campanhas.length > 0 ? 
                  (campanhas.reduce((sum, c) => {
                    const taxa = c.metricas.enviados > 0 ? (c.metricas.abertos / c.metricas.enviados) * 100 : 0;
                    return sum + taxa;
                  }, 0) / campanhas.length).toFixed(1) : 0
                }%
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="AGENDADA">Agendada</option>
            <option value="ATIVA">Ativa</option>
            <option value="PAUSADA">Pausada</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filters.tipo}
            onChange={(e) => setFilters({...filters, tipo: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Todos tipos</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MULTI_CANAL">Multi-canal</option>
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
          onClick={loadCampanhas}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campanhasPorStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nome, valor }) => `${nome}: ${valor}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {campanhasPorStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campanhasPorTipo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        {campanhas.map((campanha) => (
          <div key={campanha.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    {getTipoIcon(campanha.tipo)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{campanha.nome}</h3>
                    <p className="text-sm text-gray-600 mt-1">{campanha.descricao}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-sm text-gray-500">
                        Criada em: {formatDate(campanha.data_criacao)}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campanha.status)}`}>
                        {campanha.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {campanha.status === 'RASCUNHO' && (
                    <button
                      onClick={() => handleExecutar(campanha.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Executar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {campanha.status === 'ATIVA' && (
                    <button
                      onClick={() => handlePausar(campanha.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Pausar"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openMetricasModal(campanha)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Métricas"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(campanha)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancelar(campanha.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Métricas Resumidas */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{campanha.metricas.enviados.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{campanha.metricas.entregues.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Entregues</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{campanha.metricas.abertos.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Abertos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{campanha.metricas.cliques.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Cliques</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {campanha.metricas.enviados > 0 ? 
                      ((campanha.metricas.cliques / campanha.metricas.enviados) * 100).toFixed(1) : 0
                    }%
                  </div>
                  <div className="text-xs text-gray-600">CTR</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatCurrency(campanha.metricas.custo_total)}
                  </div>
                  <div className="text-xs text-gray-600">Custo</div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Tipo:</span> {campanha.tipo}
                </div>
                <div>
                  <span className="font-medium">Orçamento:</span> {formatCurrency(campanha.orcamento)}
                </div>
                <div>
                  <span className="font-medium">Público Alvo:</span> {campanha.publico_alvo.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Campanha */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedCampanha ? 'Editar Campanha' : 'Nova Campanha'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nome da Campanha</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="MULTI_CANAL">Multi-canal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Orçamento (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.orcamento}
                      onChange={(e) => setFormData({...formData, orcamento: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Público Alvo</label>
                    <input
                      type="number"
                      value={formData.publico_alvo}
                      onChange={(e) => setFormData({...formData, publico_alvo: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Segmentação</label>
                    <select
                      value={formData.segmentacao_tipo}
                      onChange={(e) => setFormData({...formData, segmentacao_tipo: e.target.value as any})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="TODOS">Todos os contatos</option>
                      <option value="POR_PERFIL">Por perfil</option>
                      <option value="POR_COMPORTAMENTO">Por comportamento</option>
                      <option value="POR_LOCALIZACAO">Por localização</option>
                      <option value="POR_INTERESSE">Por interesse</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Assunto</label>
                    <input
                      type="text"
                      value={formData.conteudo_assunto}
                      onChange={(e) => setFormData({...formData, conteudo_assunto: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Conteúdo da Mensagem</label>
                    <textarea
                      value={formData.conteudo_corpo}
                      onChange={(e) => setFormData({...formData, conteudo_corpo: e.target.value})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      rows={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agendamento</label>
                    <select
                      value={formData.agendamento_tipo}
                      onChange={(e) => setFormData({...formData, agendamento_tipo: e.target.value as any})}
                      className="mt-1 block w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="IMEDIATO">Imediato</option>
                      <option value="AGENDADO">Agendado</option>
                      <option value="RECORRENTE">Recorrente</option>
                    </select>
                  </div>

                  {formData.agendamento_tipo === 'AGENDADO' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data/Hora</label>
                      <input
                        type="datetime-local"
                        value={formData.agendamento_data_hora}
                        onChange={(e) => setFormData({...formData, agendamento_data_hora: e.target.value})}
                        className="mt-1 block w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  )}

                  {formData.agendamento_tipo === 'RECORRENTE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recorrência</label>
                      <select
                        value={formData.agendamento_recorrencia}
                        onChange={(e) => setFormData({...formData, agendamento_recorrencia: e.target.value})}
                        className="mt-1 block w-full border rounded-lg px-3 py-2"
                      >
                        <option value="">Selecione...</option>
                        <option value="DIARIA">Diária</option>
                        <option value="SEMANAL">Semanal</option>
                        <option value="MENSAL">Mensal</option>
                        <option value="ANUAL">Anual</option>
                      </select>
                    </div>
                  )}
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
                    {selectedCampanha ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Métricas */}
      {showMetricasModal && selectedCampanha && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Métricas da Campanha: {selectedCampanha.nome}
                </h3>
                <button
                  onClick={() => {
                    setShowMetricasModal(false);
                    setSelectedCampanha(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedCampanha.metricas.enviados.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Enviados</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCampanha.metricas.entregues.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Entregues</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedCampanha.metricas.abertos.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">Abertos</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedCampanha.metricas.cliques.toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-700">Cliques</div>
                </div>
              </div>

              {/* Taxas de Conversão */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Taxa de Entrega</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedCampanha.metricas.enviados > 0 ? 
                      ((selectedCampanha.metricas.entregues / selectedCampanha.metricas.enviados) * 100).toFixed(1) : 0
                    }%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Taxa de Abertura</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedCampanha.metricas.entregues > 0 ? 
                      ((selectedCampanha.metricas.abertos / selectedCampanha.metricas.entregues) * 100).toFixed(1) : 0
                    }%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Taxa de Cliques</h4>
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedCampanha.metricas.abertos > 0 ? 
                      ((selectedCampanha.metricas.cliques / selectedCampanha.metricas.abertos) * 100).toFixed(1) : 0
                    }%
                  </div>
                </div>
              </div>

              {/* ROI e Custo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Retorno sobre Investimento (ROI)</h4>
                  <div className="text-3xl font-bold text-green-600">
                    {selectedCampanha.metricas.roi.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Custo: {formatCurrency(selectedCampanha.metricas.custo_total)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Conversões</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedCampanha.metricas.taxa_conversao.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Respostas: {selectedCampanha.metricas.respostas}
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

export default Campanhas;