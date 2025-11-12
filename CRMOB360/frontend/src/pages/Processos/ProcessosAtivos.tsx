import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Play, Pause, RotateCcw, Eye, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Processo {
  id: string;
  template_id: string;
  template_nome: string;
  cliente_id: string;
  cliente_nome: string;
  imovel_id?: string;
  imovel_titulo?: string;
  status: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
  etapa_atual: string;
  etapa_ordem: number;
  progresso: number;
  data_inicio: string;
  data_previsao: string;
  data_conclusao?: string;
  responsavel_id: string;
  responsavel_nome: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  observacoes?: string;
  historico: Historico[];
}

interface Historico {
  id: string;
  etapa_nome: string;
  acao: string;
  usuario_nome: string;
  data: string;
  status: 'SUCESSO' | 'ERRO' | 'PENDENTE';
}

interface EtapaAtual {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'INICIAL' | 'INTERMEDIARIA' | 'FINAL';
  prazo_dias: number;
  acoes: any[];
}

const ProcessosAtivos: React.FC = () => {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAtual | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    responsavel: '',
    prioridade: '',
    cliente: '',
    template: ''
  });

  useEffect(() => {
    loadProcessos();
  }, []);

  const loadProcessos = async () => {
    try {
      const response = await apiService.get('/processos', {
        params: filters
      });
      setProcessos(response.data);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvancar = async (processoId: string) => {
    try {
      await apiService.post(`/processos/${processoId}/avancar`);
      loadProcessos();
      if (selectedProcesso?.id === processoId) {
        loadProcessoDetalhes(processoId);
      }
    } catch (error) {
      console.error('Erro ao avançar processo:', error);
    }
  };

  const handlePausar = async (processoId: string) => {
    try {
      await apiService.post(`/processos/${processoId}/pausar`);
      loadProcessos();
    } catch (error) {
      console.error('Erro ao pausar processo:', error);
    }
  };

  const handleRetomar = async (processoId: string) => {
    try {
      await apiService.post(`/processos/${processoId}/retomar`);
      loadProcessos();
    } catch (error) {
      console.error('Erro ao retomar processo:', error);
    }
  };

  const handleCancelar = async (processoId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar este processo?')) {
      try {
        await apiService.post(`/processos/${processoId}/cancelar`);
        loadProcessos();
        setSelectedProcesso(null);
      } catch (error) {
        console.error('Erro ao cancelar processo:', error);
      }
    }
  };

  const loadProcessoDetalhes = async (processoId: string) => {
    try {
      const processoResponse = await apiService.get(`/processos/${processoId}`);
      setSelectedProcesso(processoResponse.data);
      
      if (processoResponse.data.etapa_atual) {
        const etapaResponse = await apiService.get(`/processos/${processoId}/etapa-atual`);
        setEtapaAtual(etapaResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do processo:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'text-green-600 bg-green-100';
      case 'PAUSADO': return 'text-yellow-600 bg-yellow-100';
      case 'CONCLUIDO': return 'text-blue-600 bg-blue-100';
      case 'CANCELADO': return 'text-red-600 bg-red-100';
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

  const getProgressoColor = (progresso: number) => {
    if (progresso >= 80) return 'bg-green-500';
    if (progresso >= 50) return 'bg-blue-500';
    if (progresso >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
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
        <h1 className="text-3xl font-bold text-gray-900">Processos Ativos</h1>
        <p className="text-gray-600 mt-2">Acompanhe e gerencie processos em andamento</p>
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
            <option value="ATIVO">Ativo</option>
            <option value="PAUSADO">Pausado</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
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

          <input
            type="text"
            value={filters.responsavel}
            onChange={(e) => setFilters({...filters, responsavel: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Responsável"
          />

          <input
            type="text"
            value={filters.cliente}
            onChange={(e) => setFilters({...filters, cliente: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Cliente"
          />

          <input
            type="text"
            value={filters.template}
            onChange={(e) => setFilters({...filters, template: e.target.value})}
            className="border rounded-lg px-3 py-2"
            placeholder="Template"
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={loadProcessos}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Aplicar Filtros
        </button>
        <div className="text-sm text-gray-600">
          {processos.length} processo(s) encontrado(s)
        </div>
      </div>

      {/* Grid de Processos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {processos.map((processo) => (
          <div key={processo.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{processo.template_nome}</h3>
                  <p className="text-sm text-gray-600">{processo.cliente_nome}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(processo.status)}`}>
                    {processo.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(processo.prioridade)}`}>
                    {processo.prioridade}
                  </span>
                </div>
              </div>

              {/* Progresso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>{processo.progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressoColor(processo.progresso)}`}
                    style={{ width: `${processo.progresso}%` }}
                  ></div>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Etapa Atual:</span>
                  <span className="font-medium text-gray-900">{processo.etapa_atual}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsável:</span>
                  <span className="text-gray-900">{processo.responsavel_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Início:</span>
                  <span className="text-gray-900">{formatDate(processo.data_inicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Previsão:</span>
                  <span className="text-gray-900">{formatDate(processo.data_previsao)}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <button
                  onClick={() => loadProcessoDetalhes(processo.id)}
                  className="text-blue-600 hover:text-blue-900 text-sm flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detalhes
                </button>
                <div className="flex space-x-2">
                  {processo.status === 'ATIVO' && (
                    <button
                      onClick={() => handleAvancar(processo.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Avançar
                    </button>
                  )}
                  {processo.status === 'ATIVO' && (
                    <button
                      onClick={() => handlePausar(processo.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 flex items-center"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </button>
                  )}
                  {processo.status === 'PAUSADO' && (
                    <button
                      onClick={() => handleRetomar(processo.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Retomar
                    </button>
                  )}
                  {processo.status !== 'CANCELADO' && (
                    <button
                      onClick={() => handleCancelar(processo.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalhes */}
      {selectedProcesso && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProcesso.template_nome} - {selectedProcesso.cliente_nome}
                </h3>
                <button
                  onClick={() => {
                    setSelectedProcesso(null);
                    setEtapaAtual(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informações do Processo</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProcesso.status)}`}>
                        {selectedProcesso.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prioridade:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(selectedProcesso.prioridade)}`}>
                        {selectedProcesso.prioridade}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Responsável:</span>
                      <span className="text-gray-900">{selectedProcesso.responsavel_nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Etapa Atual:</span>
                      <span className="text-gray-900">{selectedProcesso.etapa_atual}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Datas Importantes</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Início:</span>
                      <span className="text-gray-900">{formatDate(selectedProcesso.data_inicio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Previsão:</span>
                      <span className="text-gray-900">{formatDate(selectedProcesso.data_previsao)}</span>
                    </div>
                    {selectedProcesso.data_conclusao && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conclusão:</span>
                        <span className="text-gray-900">{formatDate(selectedProcesso.data_conclusao)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Etapa Atual */}
              {etapaAtual && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Etapa Atual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-blue-900">{etapaAtual.nome}</h5>
                      <p className="text-sm text-blue-700 mt-1">{etapaAtual.descricao}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-700">
                        Tipo: <span className="font-medium">{etapaAtual.tipo}</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Prazo: <span className="font-medium">{etapaAtual.prazo_dias} dia(s)</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Ações: <span className="font-medium">{etapaAtual.acoes.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progresso */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso Total</span>
                  <span>{selectedProcesso.progresso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${getProgressoColor(selectedProcesso.progresso)}`}
                    style={{ width: `${selectedProcesso.progresso}%` }}
                  ></div>
                </div>
              </div>

              {/* Histórico */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Histórico de Atividades</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedProcesso.historico.map((historico) => (
                    <div key={historico.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium text-gray-900">{historico.etapa_nome}</h5>
                          <p className="text-sm text-gray-600 mt-1">{historico.acao}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Por {historico.usuario_nome} em {formatDate(historico.data)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          historico.status === 'SUCESSO' ? 'text-green-600 bg-green-100' :
                          historico.status === 'ERRO' ? 'text-red-600 bg-red-100' :
                          'text-yellow-600 bg-yellow-100'
                        }`}>
                          {historico.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessosAtivos;