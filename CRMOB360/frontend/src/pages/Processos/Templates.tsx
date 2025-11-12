import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { Plus, Edit, Trash2, Eye, Play, Copy } from 'lucide-react';

interface Template {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  etapas: Etapa[];
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface Etapa {
  id: string;
  ordem: number;
  nome: string;
  descricao: string;
  tipo: 'INICIAL' | 'INTERMEDIARIA' | 'FINAL';
  responsavel: string;
  prazo_dias: number;
  acoes: Acao[];
  condicoes: Condicao[];
}

interface Acao {
  id: string;
  tipo: 'ENVIAR_EMAIL' | 'CRIAR_TAREFA' | 'ATUALIZAR_STATUS' | 'ENVIAR_NOTIFICACAO' | 'GERAR_DOCUMENTO';
  configuracao: any;
  ordem: number;
}

interface Condicao {
  id: string;
  campo: string;
  operador: string;
  valor: string;
  acao_sucesso: string;
  acao_falha: string;
}

const Templates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEtapaModal, setShowEtapaModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedEtapa, setSelectedEtapa] = useState<Etapa | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    ativo: true
  });

  const [etapaFormData, setEtapaFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'INTERMEDIARIA' as 'INICIAL' | 'INTERMEDIARIA' | 'FINAL',
    responsavel: '',
    prazo_dias: 1
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await apiService.get('/processos/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTemplate) {
        await apiService.put(`/processos/templates/${selectedTemplate.id}`, formData);
      } else {
        await apiService.post('/processos/templates', formData);
      }
      setShowModal(false);
      setFormData({ nome: '', descricao: '', categoria: '', ativo: true });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleEtapaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEtapa) {
        await apiService.put(`/processos/templates/${selectedTemplate?.id}/etapas/${selectedEtapa.id}`, etapaFormData);
      } else {
        await apiService.post(`/processos/templates/${selectedTemplate?.id}/etapas`, etapaFormData);
      }
      setShowEtapaModal(false);
      setEtapaFormData({ nome: '', descricao: '', tipo: 'INTERMEDIARIA', responsavel: '', prazo_dias: 1 });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        await apiService.delete(`/processos/templates/${id}`);
        loadTemplates();
      } catch (error) {
        console.error('Erro ao excluir template:', error);
      }
    }
  };

  const handleDeleteEtapa = async (templateId: string, etapaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta etapa?')) {
      try {
        await apiService.delete(`/processos/templates/${templateId}/etapas/${etapaId}`);
        loadTemplates();
      } catch (error) {
        console.error('Erro ao excluir etapa:', error);
      }
    }
  };

  const handleDuplicar = async (template: Template) => {
    try {
      await apiService.post(`/processos/templates/${template.id}/duplicar`);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
    }
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      nome: template.nome,
      descricao: template.descricao,
      categoria: template.categoria,
      ativo: template.ativo
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setSelectedTemplate(null);
    setFormData({ nome: '', descricao: '', categoria: '', ativo: true });
    setShowModal(true);
  };

  const openEtapaModal = (template: Template, etapa?: Etapa) => {
    setSelectedTemplate(template);
    setSelectedEtapa(etapa || null);
    setEtapaFormData({
      nome: etapa?.nome || '',
      descricao: etapa?.descricao || '',
      tipo: etapa?.tipo || 'INTERMEDIARIA',
      responsavel: etapa?.responsavel || '',
      prazo_dias: etapa?.prazo_dias || 1
    });
    setShowEtapaModal(true);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'INICIAL': return 'text-blue-600 bg-blue-100';
      case 'INTERMEDIARIA': return 'text-yellow-600 bg-yellow-100';
      case 'FINAL': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (ativo: boolean) => {
    return ativo ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
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
        <h1 className="text-3xl font-bold text-gray-900">Templates de Processos</h1>
        <p className="text-gray-600 mt-2">Gerencie templates de processos padronizados</p>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {templates.length} template(s) encontrado(s)
        </div>
        <button
          onClick={openNewModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </button>
      </div>

      {/* Lista de Templates */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.nome}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.descricao}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-sm text-gray-500">Categoria: {template.categoria}</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(template.ativo)}`}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEtapaModal(template)}
                    className="text-green-600 hover:text-green-900"
                    title="Adicionar Etapa"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicar(template)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Etapas */}
              {template.etapas.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Etapas ({template.etapas.length})</h4>
                  <div className="space-y-2">
                    {template.etapas
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((etapa) => (
                        <div key={etapa.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-500">{etapa.ordem}</span>
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">{etapa.nome}</h5>
                                <p className="text-xs text-gray-600">{etapa.descricao}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getTipoColor(etapa.tipo)}`}>
                                {etapa.tipo}
                              </span>
                              <span className="text-xs text-gray-500">
                                {etapa.prazo_dias} dia(s)
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => openEtapaModal(template, etapa)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar Etapa"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEtapa(template.id, etapa.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Excluir Etapa"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Ações da Etapa */}
                          {etapa.acoes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex flex-wrap gap-1">
                                {etapa.acoes.map((acao) => (
                                  <span key={acao.id} className="px-2 py-1 text-xs bg-white rounded border">
                                    {acao.tipo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Template */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedTemplate ? 'Editar Template' : 'Novo Template'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
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
                    required
                  />
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
                    <option value="VENDA">Venda</option>
                    <option value="LOCACAO">Locação</option>
                    <option value="DOCUMENTACAO">Documentação</option>
                    <option value="VISTORIA">Vistoria</option>
                    <option value="FINANCIAMENTO">Financiamento</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                    Template ativo
                  </label>
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
                    {selectedTemplate ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Etapa */}
      {showEtapaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedEtapa ? 'Editar Etapa' : 'Nova Etapa'}
              </h3>
              <form onSubmit={handleEtapaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={etapaFormData.nome}
                    onChange={(e) => setEtapaFormData({...etapaFormData, nome: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={etapaFormData.descricao}
                    onChange={(e) => setEtapaFormData({...etapaFormData, descricao: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={etapaFormData.tipo}
                    onChange={(e) => setEtapaFormData({...etapaFormData, tipo: e.target.value as 'INICIAL' | 'INTERMEDIARIA' | 'FINAL'})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="INICIAL">Inicial</option>
                    <option value="INTERMEDIARIA">Intermediária</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável</label>
                  <select
                    value={etapaFormData.responsavel}
                    onChange={(e) => setEtapaFormData({...etapaFormData, responsavel: e.target.value})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="CORRETOR">Corretor</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="JURIDICO">Jurídico</option>
                    <option value="CLIENTE">Cliente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prazo (dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={etapaFormData.prazo_dias}
                    onChange={(e) => setEtapaFormData({...etapaFormData, prazo_dias: parseInt(e.target.value)})}
                    className="mt-1 block w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEtapaModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedEtapa ? 'Atualizar' : 'Criar'}
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

export default Templates;