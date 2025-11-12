import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  UserCircle,
  Menu,
  X
} from 'lucide-react';
import { Notification } from '@/types';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  isSidebarOpen 
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock notifications - em produção, virão da API
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'info',
      title: 'Novo lead atribuído',
      message: 'Você tem um novo lead para atender',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Visita agendada',
      message: 'Visita agendada para amanhã às 14h',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900">
                Imobiliária 360
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <Link
                      to="/notificacoes"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => setShowNotifications(false)}
                    >
                      Ver todas as notificações
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nome}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircle size={24} />
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.nome}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.nome}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <UserCircle size={40} className="text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/perfil"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} className="mr-3" />
                      Meu Perfil
                    </Link>
                    
                    <Link
                      to="/configuracoes"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings size={16} className="mr-3" />
                      Configurações
                    </Link>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min atrás`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d atrás`;
}