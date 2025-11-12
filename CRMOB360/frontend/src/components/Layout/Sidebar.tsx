import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Users,
  Building,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  MessageSquare,
  Calendar,
  CheckSquare,
  Shield,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      path: '/',
      roles: ['admin', 'gerente', 'corretor', 'financeiro']
    },
    {
      title: 'CRM',
      icon: Users,
      path: '/crm',
      roles: ['admin', 'gerente', 'corretor'],
      submenu: [
        { title: 'Clientes', path: '/crm/clientes' },
        { title: 'Leads', path: '/crm/leads' },
        { title: 'Atividades', path: '/crm/atividades' },
        { title: 'Pipeline', path: '/crm/pipeline' },
      ]
    },
    {
      title: 'Imóveis',
      icon: Building,
      path: '/imoveis',
      roles: ['admin', 'gerente', 'corretor'],
      submenu: [
        { title: 'Lista de Imóveis', path: '/imoveis' },
        { title: 'Cadastrar Imóvel', path: '/imoveis/novo' },
        { title: 'Publicações', path: '/imoveis/publicacoes' },
        { title: 'Documentos', path: '/imoveis/documentos' },
      ]
    },
    {
      title: 'Financeiro',
      icon: DollarSign,
      path: '/financeiro',
      roles: ['admin', 'gerente', 'financeiro'],
      submenu: [
        { title: 'Contas a Pagar/Receber', path: '/financeiro/contas' },
        { title: 'Comissões', path: '/financeiro/comissoes' },
        { title: 'DRE', path: '/financeiro/dre' },
        { title: 'Relatórios', path: '/financeiro/relatorios' },
      ]
    },
    {
      title: 'Processos',
      icon: CheckSquare,
      path: '/processos',
      roles: ['admin', 'gerente', 'corretor'],
      submenu: [
        { title: 'Processos Ativos', path: '/processos' },
        { title: 'Minhas Tarefas', path: '/processos/tarefas' },
        { title: 'Templates', path: '/processos/templates' },
      ]
    },
    {
      title: 'Marketing',
      icon: MessageSquare,
      path: '/marketing',
      roles: ['admin', 'gerente'],
      submenu: [
        { title: 'Campanhas', path: '/marketing/campanhas' },
        { title: 'Automações', path: '/marketing/automacoes' },
        { title: 'Templates de Email', path: '/marketing/templates' },
      ]
    },
    {
      title: 'Relatórios',
      icon: BarChart3,
      path: '/relatorios',
      roles: ['admin', 'gerente'],
      submenu: [
        { title: 'Performance', path: '/relatorios/performance' },
        { title: 'Vendas', path: '/relatorios/vendas' },
        { title: 'Estoque', path: '/relatorios/estoque' },
        { title: 'Comissões', path: '/relatorios/comissoes' },
      ]
    },
    {
      title: 'IA & Analytics',
      icon: TrendingUp,
      path: '/ia',
      roles: ['admin', 'gerente'],
      submenu: [
        { title: 'Lead Scoring', path: '/ia/scoring' },
        { title: 'Matching', path: '/ia/matching' },
        { title: 'Insights', path: '/ia/insights' },
      ]
    },
    {
      title: 'Contratos',
      icon: FileText,
      path: '/contratos',
      roles: ['admin', 'gerente', 'financeiro'],
      submenu: [
        { title: 'Contratos de Locação', path: '/contratos/locacao' },
        { title: 'Propostas', path: '/contratos/propostas' },
        { title: 'Vistorias', path: '/contratos/vistorias' },
      ]
    },
    {
      title: 'Calendário',
      icon: Calendar,
      path: '/calendario',
      roles: ['admin', 'gerente', 'corretor']
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/configuracoes',
      roles: ['admin'],
      submenu: [
        { title: 'Geral', path: '/configuracoes/geral' },
        { title: 'Usuários', path: '/configuracoes/usuarios' },
        { title: 'Permissões', path: '/configuracoes/permissoes' },
        { title: 'Integrações', path: '/configuracoes/integracoes' },
      ]
    },
    {
      title: 'LGPD & Compliance',
      icon: Shield,
      path: '/lgpd',
      roles: ['admin'],
      submenu: [
        { title: 'Consentimentos', path: '/lgpd/consentimentos' },
        { title: 'Solicitações', path: '/lgpd/solicitacoes' },
        { title: 'Relatórios', path: '/lgpd/relatorios' },
      ]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.tipo))
  );

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-8 h-8 text-white" />
              <span className="text-white font-semibold text-lg">
                Imobiliária 360
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isItemActive = isActive(item.path);

              return (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isItemActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (!hasSubmenu) {
                        onClose();
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.title}
                  </Link>

                  {/* Submenu */}
                  {hasSubmenu && isItemActive && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.submenu?.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                            isActive(subItem.path)
                              ? 'text-primary-700 font-medium'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                          onClick={onClose}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nome}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nome}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.tipo}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};