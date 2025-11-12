import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHome, FaFileContract, FaCalendar, FaDollarSign, FaChartLine, FaSignOutAlt } from 'react-icons/fa';

interface DashboardData {
  proprietario: {
    nome: string;
    email: string;
  };
  estatisticas: {
    totalImoveis: number;
    imoveisDisponiveis: number;
    imoveisAlugados: number;
    imoveisVendidos: number;
    visitasAgendadas: number;
    propostasPendentes: number;
    receitaMensal: number;
  };
  imoveisRecentes: any[];
}

const PortalProprietarioDashboard: React.FC = () => {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const token = localStorage.getItem('portal_proprietario_token');

      if (!token) {
        navigate('/portal-proprietario/login');
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/portal-proprietario/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDados(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      navigate('/portal-proprietario/login');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('portal_proprietario_token');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/portal-proprietario/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    localStorage.removeItem('portal_proprietario_token');
    localStorage.removeItem('portal_proprietario_user');
    navigate('/portal-proprietario/login');
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
      <div className="bg-green-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Portal do Proprietário</h1>
            <p className="text-green-100">Bem-vindo, {dados.proprietario.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition"
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
                <p className="text-gray-600 text-sm">Total de Imóveis</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dados.estatisticas.totalImoveis}
                </p>
              </div>
              <FaHome className="text-4xl text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Imóveis Alugados</p>
                <p className="text-3xl font-bold text-green-600">
                  {dados.estatisticas.imoveisAlugados}
                </p>
              </div>
              <FaHome className="text-4xl text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Propostas Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {dados.estatisticas.propostasPendentes}
                </p>
              </div>
              <FaFileContract className="text-4xl text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Receita Mensal</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {dados.estatisticas.receitaMensal.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>
              <FaDollarSign className="text-4xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaHome className="text-2xl text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Disponíveis</p>
                <p className="text-2xl font-bold">{dados.estatisticas.imoveisDisponiveis}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaChartLine className="text-2xl text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Vendidos</p>
                <p className="text-2xl font-bold">{dados.estatisticas.imoveisVendidos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <FaCalendar className="text-2xl text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Visitas Agendadas</p>
                <p className="text-2xl font-bold">{dados.estatisticas.visitasAgendadas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaHome className="text-3xl text-blue-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Meus Imóveis</h3>
            <p className="text-gray-600">Gerencie seus imóveis cadastrados</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaFileContract className="text-3xl text-green-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Contratos</h3>
            <p className="text-gray-600">Visualize contratos ativos</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaDollarSign className="text-3xl text-purple-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Financeiro</h3>
            <p className="text-gray-600">Relatórios e recebimentos</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaFileContract className="text-3xl text-yellow-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Propostas</h3>
            <p className="text-gray-600">Acompanhe propostas recebidas</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaCalendar className="text-3xl text-orange-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Visitas</h3>
            <p className="text-gray-600">Visitas agendadas aos imóveis</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left">
            <FaHome className="text-3xl text-indigo-600 mb-3" />
            <h3 className="text-xl font-semibold mb-2">Documentos</h3>
            <p className="text-gray-600">Documentos dos imóveis</p>
          </button>
        </div>

        {/* Imóveis Recentes */}
        {dados.imoveisRecentes && dados.imoveisRecentes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Seus Imóveis Recentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dados.imoveisRecentes.map((imovel: any) => (
                <div key={imovel.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{imovel.titulo}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      imovel.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                      imovel.status === 'alugado' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {imovel.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Código: {imovel.codigo}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    {imovel.cidade} - {imovel.bairro}
                  </p>
                  {imovel.valor_locacao && (
                    <p className="text-green-600 font-bold">
                      Aluguel: R$ {parseFloat(imovel.valor_locacao).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {imovel.valor_venda && (
                    <p className="text-blue-600 font-bold">
                      Venda: R$ {parseFloat(imovel.valor_venda).toLocaleString('pt-BR')}
                    </p>
                  )}
                  <button className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
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

export default PortalProprietarioDashboard;
