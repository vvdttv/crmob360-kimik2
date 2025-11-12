import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  Tag,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Cliente, ApiResponse } from '@/types';
import apiService from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadClientes();
  }, [searchTerm, statusFilter, currentPage]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ApiResponse<Cliente[]>>('/clientes', {
        params: {
          search: searchTerm,
          status: statusFilter,
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage
        }
      });
      
      setClientes(response.data);
      setTotalPages(response.pages || 1);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await apiService.delete(`/clientes/${id}`);
        loadClientes();
      } catch (error) {
        console.error('Error deleting cliente:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'novo': 'bg-blue-100 text-blue-800',
      'em_contato': 'bg-yellow-100 text-yellow-800',
      'visita_agendada': 'bg-purple-100 text-purple-800',
      'em_negociacao': 'bg-orange-100 text-orange-800',
      'convertido': 'bg-green-100 text-green-800',
      'perdido': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'novo': 'Novo',
      'em_contato': 'Em Contato',
      'visita_agendada': 'Visita Agendada',
      'em_negociacao': 'Em Negociação',
      'convertido': 'Convertido',
      'perdido': 'Perdido'
    };
    return labels[status] || status;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus clientes e leads
          </p>
        </div>
        
        <Link
          to="/crm/clientes/novo"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Cliente
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="em_contato">Em Contato</option>
              <option value="visita_agendada">Visita Agendada</option>
              <option value="em_negociacao">Em Negociação</option>
              <option value="convertido">Convertido</option>
              <option value="perdido">Perdido</option>
            </select>
            
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} className="mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Clientes List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score IA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-800">
                            {cliente.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {cliente.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          {cliente.cpf_cnpj && ` • ${cliente.cpf_cnpj}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {cliente.email && (
                        <div className="flex items-center mb-1">
                          <Mail size={14} className="mr-1 text-gray-400" />
                          {cliente.email}
                        </div>
                      )}
                      {cliente.telefone && (
                        <div className="flex items-center">
                          <Phone size={14} className="mr-1 text-gray-400" />
                          {cliente.telefone}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cliente.status_lead)}`}>
                      {getStatusLabel(cliente.status_lead)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp size={16} className={`mr-1 ${getScoreColor(cliente.score_ia)}`} />
                      <span className={`text-sm font-medium ${getScoreColor(cliente.score_ia)}`}>
                        {cliente.score_ia}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.responsavel?.nome || 'Não atribuído'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.ultimo_contato ? (
                      format(new Date(cliente.ultimo_contato), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    ) : (
                      'Nunca'
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/crm/clientes/${cliente.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/crm/clientes/${cliente.id}/editar`}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(cliente.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {clientes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter 
              ? 'Tente ajustar seus filtros de busca'
              : 'Comece cadastrando seu primeiro cliente'
            }
          </p>
          <Link
            to="/crm/clientes/novo"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Cadastrar Cliente
          </Link>
        </div>
      )}
    </div>
  );
};