import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import apiService from '@/services/api';
import { DashboardData } from '@/types';

export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do dashboard
      const [
        crmData,
        imoveisData,
        processosData
      ] = await Promise.all([
        apiService.get('/dashboard/crm'),
        apiService.get('/dashboard/imoveis'),
        apiService.get('/dashboard/processos')
      ]);

      setDashboardData({
        ...crmData,
        ...imoveisData,
        ...processosData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: dashboardData?.totalClientes || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%',
      trendColor: 'text-green-600'
    },
    {
      title: 'Imóveis Disponíveis',
      value: dashboardData?.imoveisDisponiveis || 0,
      icon: Building,
      color: 'bg-green-500',
      trend: '+5%',
      trendColor: 'text-green-600'
    },
    {
      title: 'Taxa de Conversão',
      value: `${(dashboardData?.taxaConversao || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+2.3%',
      trendColor: 'text-green-600'
    },
    {
      title: 'Processos Ativos',
      value: dashboardData?.processosAtivos || 0,
      icon: Activity,
      color: 'bg-orange-500',
      trend: '+8%',
      trendColor: 'text-green-600'
    }
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'cliente',
      description: 'Novo lead cadastrado - Maria Silva',
      time: '2 minutos atrás',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: '2',
      type: 'imovel',
      description: 'Imóvel cod. IM1234 visitado',
      time: '15 minutos atrás',
      icon: Building,
      color: 'text-green-600'
    },
    {
      id: '3',
      type: 'processo',
      description: 'Processo de venda avançou para etapa "Proposta"',
      time: '1 hora atrás',
      icon: CheckCircle,
      color: 'text-purple-600'
    },
    {
      id: '4',
      type: 'financeiro',
      description: 'Comissão calculada - Venda #V456',
      time: '2 horas atrás',
      icon: DollarSign,
      color: 'text-orange-600'
    }
  ];

  const performanceChartData = [
    { month: 'Jan', leads: 45, vendas: 12, visitas: 89 },
    { month: 'Feb', leads: 52, vendas: 15, visitas: 95 },
    { month: 'Mar', leads: 48, vendas: 18, visitas: 102 },
    { month: 'Apr', leads: 61, vendas: 22, visitas: 118 },
    { month: 'May', leads: 55, vendas: 19, visitas: 108 },
    { month: 'Jun', leads: 67, vendas: 25, visitas: 125 },
  ];

  const statusDistribuition = [
    { name: 'Disponíveis', value: dashboardData?.imoveisDisponiveis || 0, color: '#10b981' },
    { name: 'Vendidos', value: dashboardData?.imoveisVendidos || 0, color: '#3b82f6' },
    { name: 'Alugados', value: dashboardData?.imoveisAlugados || 0, color: '#8b5cf6' },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral da sua imobiliária
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="1y">Último ano</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className={`text-sm mt-1 ${card.trendColor}`}>
                    {card.trend} em relação ao período anterior
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance de Vendas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="visitas" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos Imóveis */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status dos Imóveis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribuition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribuition.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Atividades Recentes
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100`}>
                  <Icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Ver todas as atividades
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Novo Cliente</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Building className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Novo Imóvel</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Agendar Visita</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nova Proposta</span>
          </button>
        </div>
      </div>
    </div>
  );
};