import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaHeart, FaCalendar, FaFileAlt, FaBell, FaSignOutAlt } from 'react-icons/fa';

interface DashboardData {
  cliente: {
    nome: string;
    email: string;
  };
  estatisticas: {
    imoveisFavoritos: number;
    visitas: {
      agendadas: number;
      realizadas: number;
    };
    propostas: {
      pendentes: number;
      aceitas: number;
      recusadas: number;
    };
    notificacoesNaoLidas: number;
  };
  imoveisRecomendados: any[];
}

const PortalClienteDashboard: React.FC = () => {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const token = localStorage.getItem('portal_cliente_token');

      if (!token) {
        navigate('/portal-cliente/login');
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/portal-cliente/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDados(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      navigate('/portal-cliente/login');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('portal_cliente_token');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/portal-cliente/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    localStorage.removeItem('portal_cliente_token');
    localStorage.removeItem('portal_cliente_user');
    navigate('/portal-cliente/login');
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Portal do Cliente</h1>
            <p className="text-blue-100">Bem-vindo, {dados.cliente.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition"
          >
            <FaSignOutAlt />
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Favoritos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dados.estatisticas.imoveisFavoritos}
                </p>
              </div>
              <FaHeart className="text-4xl text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Visitas Agendadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {dados.estatisticas.visitas.agendadas}
                </p>
              </div>
              <FaCalendar className="text-4xl text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Propostas Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {dados.estatisticas.propostas.pendentes}
                </p>
              </div>
              <FaFileAlt className="text-4xl text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Notificações</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dados.estatisticas.notificacoesNaoLidas}
                </p>
              </div>
              <FaBell className="text-4xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaHome className="text-3xl text-blue-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Buscar Imóveis</h3>
            <p className="text-gray-600">Encontre o imóvel ideal para você</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaHeart className="text-3xl text-red-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Meus Favoritos</h3>
            <p className="text-gray-600">Imóveis que você salvou</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaCalendar className="text-3xl text-green-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Minhas Visitas</h3>
            <p className="text-gray-600">Visitas agendadas e realizadas</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaFileAlt className="text-3xl text-yellow-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Minhas Propostas</h3>
            <p className="text-gray-600">Acompanhe suas propostas</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaFileAlt className="text-3xl text-indigo-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Documentos</h3>
            <p className="text-gray-600">Contratos e documentos</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaBell className="text-3xl text-purple-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Notificações</h3>
            <p className="text-gray-600">Mensagens e atualizações</p>
          </button>
        </div>

        {/* Imóveis Recomendados */}
        {dados.imoveisRecomendados && dados.imoveisRecomendados.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Imóveis Recomendados para Você</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dados.imoveisRecomendados.slice(0, 6).map((imovel: any) => (
                <div key={imovel.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <h3 className="font-semibold text-lg mb-2">{imovel.titulo}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {imovel.cidade} - {imovel.bairro}
                  </p>
                  <p className="text-blue-600 font-bold">
                    {imovel.finalidade === 'venda'
                      ? `R$ ${parseFloat(imovel.valor_venda).toLocaleString('pt-BR')}`
                      : `R$ ${parseFloat(imovel.valor_locacao).toLocaleString('pt-BR')}/mês`
                    }
                  </p>
                  <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                    Ver Detalhes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalClienteDashboard;
