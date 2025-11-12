import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  MapPin,
  Home,
  DollarSign,
  Bed,
  Car,
  Ruler,
  Tag,
  Building
} from 'lucide-react';
import { Imovel, ApiResponse } from '@/types';
import apiService from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

export const Imoveis: React.FC = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadImoveis();
  }, [searchTerm, tipoFilter, statusFilter, currentPage]);

  const loadImoveis = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ApiResponse<Imovel[]>>('/imoveis', {
        params: {
          search: searchTerm,
          tipo_imovel: tipoFilter,
          status: statusFilter,
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage
        }
      });
      
      setImoveis(response.data);
      setTotalPages(response.pages || 1);
    } catch (error) {
      console.error('Error loading imoveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      try {
        await apiService.delete(`/imoveis/${id}`);
        loadImoveis();
      } catch (error) {
        console.error('Error deleting imovel:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'disponivel': 'bg-green-100 text-green-800',
      'reservado': 'bg-yellow-100 text-yellow-800',
      'vendido': 'bg-blue-100 text-blue-800',
      'alugado': 'bg-purple-100 text-purple-800',
      'em_manutencao': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'disponivel': 'Disponível',
      'reservado': 'Reservado',
      'vendido': 'Vendido',
      'alugado': 'Alugado',
      'em_manutencao': 'Em Manutenção'
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'apartamento': 'Apartamento',
      'casa': 'Casa',
      'sala_comercial': 'Sala Comercial',
      'terreno': 'Terreno',
      'galpao': 'Galpão'
    };
    return labels[tipo] || tipo;
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
          <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seu portfólio de imóveis
          </p>
        </div>
        
        <Link
          to="/imoveis/novo"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Imóvel
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
                placeholder="Buscar imóveis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="sala_comercial">Sala Comercial</option>
              <option value="terreno">Terreno</option>
              <option value="galpao">Galpão</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
              <option value="alugado">Alugado</option>
              <option value="em_manutencao">Em Manutenção</option>
            </select>
            
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} className="mr-2" />
              Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Imóveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {imoveis.map((imovel) => (
          <div key={imovel.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagem do Imóvel */}
            <div className="relative h-48 bg-gray-200">
              {imovel.fotos && imovel.fotos.length > 0 ? (
                <img
                  src={imovel.fotos[0]}
                  alt={imovel.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Building className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(imovel.status)}`}>
                  {getStatusLabel(imovel.status)}
                </span>
              </div>
              
              {/* Código do Imóvel */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-black bg-opacity-50 text-white rounded">
                  {imovel.codigo}
                </span>
              </div>
            </div>

            {/* Informações do Imóvel */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {imovel.titulo}
                </h3>
                <span className="text-sm text-gray-500 capitalize ml-2">
                  {getTipoLabel(imovel.tipo_imovel)}
                </span>
              </div>
              
              {imovel.endereco.bairro && (
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPin size={16} className="mr-1" />
                  {imovel.endereco.bairro}
                  {imovel.endereco.cidade && `, ${imovel.endereco.cidade}`}
                </div>
              )}

              {/* Características */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
                {imovel.caracteristicas.quartos && (
                  <div className="flex items-center">
                    <Bed size={16} className="mr-1" />
                    {imovel.caracteristicas.quartos} quartos
                  </div>
                )}
                
                {imovel.caracteristicas.vagas_garagem && (
                  <div className="flex items-center">
                    <Car size={16} className="mr-1" />
                    {imovel.caracteristicas.vagas_garagem} vagas
                  </div>
                )}
                
                {imovel.caracteristicas.area_util && (
                  <div className="flex items-center">
                    <Ruler size={16} className="mr-1" />
                    {imovel.caracteristicas.area_util}m²
                  </div>
                )}
                
                <div className="flex items-center">
                  <Eye size={16} className="mr-1" />
                  {imovel.visitas_count} visitas
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-1 mb-4">
                {imovel.valores.valor_venda && (
                  <div className="text-lg font-bold text-green-600">
                    Venda: {formatCurrency(imovel.valores.valor_venda)}
                  </div>
                )}
                
                {imovel.valores.valor_locacao && (
                  <div className="text-lg font-bold text-blue-600">
                    Aluguel: {formatCurrency(imovel.valores.valor_locacao)}
                  </div>
                )}
              </div>

              {/* Proprietário e Responsável */}
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                {imovel.proprietario && (
                  <div>
                    Proprietário: {imovel.proprietario.nome}
                  </div>
                )}
                
                {imovel.responsavel && (
                  <div>
                    Responsável: {imovel.responsavel.nome}
                  </div>
                )}
              </div>

              {/* Tags */}
              {imovel.tags && imovel.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {imovel.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                    >
                      <Tag size={12} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                  {imovel.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{imovel.tags.length - 3} mais
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Link
                  to={`/imoveis/${imovel.id}`}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <Eye size={18} className="mr-1" />
                  Ver Detalhes
                </Link>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/imoveis/${imovel.id}/editar`}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(imovel.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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

      {/* Empty State */}
      {imoveis.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum imóvel encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || tipoFilter || statusFilter
              ? 'Tente ajustar seus filtros de busca'
              : 'Comece cadastrando seu primeiro imóvel'
            }
          </p>
          <Link
            to="/imoveis/novo"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Cadastrar Imóvel
          </Link>
        </div>
      )}
    </div>
  );
};