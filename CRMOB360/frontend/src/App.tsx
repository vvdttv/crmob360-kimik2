import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout/Layout';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Clientes } from '@/pages/CRM/Clientes';
import { Imoveis } from '@/pages/Imoveis/Imoveis';

// Financeiro
import Contas from '@/pages/Financeiro/Contas';
import Comissoes from '@/pages/Financeiro/Comissoes';
import DRE from '@/pages/Financeiro/DRE';

// Processos
import Templates from '@/pages/Processos/Templates';
import ProcessosAtivos from '@/pages/Processos/ProcessosAtivos';
import Tarefas from '@/pages/Processos/Tarefas';

// Marketing
import Campanhas from '@/pages/Marketing/Campanhas';
import Automacoes from '@/pages/Marketing/Automacoes';

// Relatórios
import Performance from '@/pages/Relatorios/Performance';
import Vendas from '@/pages/Relatorios/Vendas';
import Estoque from '@/pages/Relatorios/Estoque';

// IA
import LeadScoring from '@/pages/IA/LeadScoring';
import Matching from '@/pages/IA/Matching';
import Insights from '@/pages/IA/Insights';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Login Page Component
const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Imobiliária 360
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sistema de Gestão Imobiliária
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Login</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEmail('admin@imobiliaria360.com');
                  setPassword('admin123');
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Admin
              </button>
              <button
                onClick={() => {
                  setEmail('corretor@imobiliaria360.com');
                  setPassword('corretor123');
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Corretor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      
                      {/* CRM */}
                      <Route path="/crm/clientes" element={<Clientes />} />
                      
                      {/* Imóveis */}
                      <Route path="/imoveis" element={<Imoveis />} />
                      
                      {/* Financeiro */}
                      <Route path="/financeiro/contas" element={<Contas />} />
                      <Route path="/financeiro/comissoes" element={<Comissoes />} />
                      <Route path="/financeiro/dre" element={<DRE />} />
                      
                      {/* Processos */}
                      <Route path="/processos/templates" element={<Templates />} />
                      <Route path="/processos/ativos" element={<ProcessosAtivos />} />
                      <Route path="/processos/tarefas" element={<Tarefas />} />
                      
                      {/* Marketing */}
                      <Route path="/marketing/campanhas" element={<Campanhas />} />
                      <Route path="/marketing/automacoes" element={<Automacoes />} />
                      
                      {/* Relatórios */}
                      <Route path="/relatorios/performance" element={<Performance />} />
                      <Route path="/relatorios/vendas" element={<Vendas />} />
                      <Route path="/relatorios/estoque" element={<Estoque />} />
                      
                      {/* IA */}
                      <Route path="/ia/lead-scoring" element={<LeadScoring />} />
                      <Route path="/ia/matching" element={<Matching />} />
                      <Route path="/ia/insights" element={<Insights />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;