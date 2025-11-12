import { Router } from 'express';
import { CRMController } from '@/controllers/CRMController';
import { PropertyController } from '@/controllers/PropertyController';
import { FinanceController } from '@/controllers/FinanceController';
import { AIController } from '@/controllers/AIController';
import { ProcessController } from '@/controllers/ProcessController';
import { AuthController } from '@/controllers/AuthController';
import ClientPortalController from '@/controllers/ClientPortalController';
import OwnerPortalController from '@/controllers/OwnerPortalController';
import { authenticateToken, requirePermission } from '@/middleware/auth';
import { clienteAuth, proprietarioAuth } from '@/middleware/portalAuth';

const router = Router();

// Controllers
const crmController = new CRMController();
const propertyController = new PropertyController();
const financeController = new FinanceController();
const aiController = new AIController();
const processController = new ProcessController();
const authController = new AuthController();

// Rotas de autenticação
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authController.logout);

// ============================================
// PORTAL DO CLIENTE
// ============================================
// Rotas públicas do portal do cliente
router.post('/portal-cliente/login', ClientPortalController.login);

// Rotas protegidas do portal do cliente
router.post('/portal-cliente/logout', clienteAuth, ClientPortalController.logout);
router.get('/portal-cliente/dashboard', clienteAuth, ClientPortalController.getDashboard);

// Imóveis
router.get('/portal-cliente/imoveis', clienteAuth, ClientPortalController.listarImoveis);
router.get('/portal-cliente/imoveis/:id', clienteAuth, ClientPortalController.getImovelDetalhes);

// Favoritos
router.get('/portal-cliente/favoritos', clienteAuth, ClientPortalController.listarFavoritos);
router.post('/portal-cliente/favoritos/:imovelId', clienteAuth, ClientPortalController.adicionarFavorito);
router.delete('/portal-cliente/favoritos/:imovelId', clienteAuth, ClientPortalController.removerFavorito);

// Visitas
router.get('/portal-cliente/visitas', clienteAuth, ClientPortalController.listarVisitas);
router.post('/portal-cliente/visitas', clienteAuth, ClientPortalController.agendarVisita);
router.delete('/portal-cliente/visitas/:id', clienteAuth, ClientPortalController.cancelarVisita);

// Propostas
router.get('/portal-cliente/propostas', clienteAuth, ClientPortalController.listarPropostas);
router.post('/portal-cliente/propostas', clienteAuth, ClientPortalController.enviarProposta);

// Notificações
router.get('/portal-cliente/notificacoes', clienteAuth, ClientPortalController.listarNotificacoes);
router.put('/portal-cliente/notificacoes/:id/ler', clienteAuth, ClientPortalController.marcarNotificacaoLida);

// Documentos
router.get('/portal-cliente/documentos', clienteAuth, ClientPortalController.listarDocumentos);
router.put('/portal-cliente/documentos/:id/visualizar', clienteAuth, ClientPortalController.marcarDocumentoVisualizado);

// Perfil
router.put('/portal-cliente/perfil-busca', clienteAuth, ClientPortalController.atualizarPerfilBusca);

// ============================================
// PORTAL DO PROPRIETÁRIO
// ============================================
// Rotas públicas do portal do proprietário
router.post('/portal-proprietario/login', OwnerPortalController.login);

// Rotas protegidas do portal do proprietário
router.post('/portal-proprietario/logout', proprietarioAuth, OwnerPortalController.logout);
router.get('/portal-proprietario/dashboard', proprietarioAuth, OwnerPortalController.getDashboard);

// Imóveis
router.get('/portal-proprietario/imoveis', proprietarioAuth, OwnerPortalController.listarImoveis);
router.get('/portal-proprietario/imoveis/:id', proprietarioAuth, OwnerPortalController.getImovelDetalhes);

// Propostas
router.get('/portal-proprietario/propostas', proprietarioAuth, OwnerPortalController.listarPropostas);
router.get('/portal-proprietario/propostas/:id', proprietarioAuth, OwnerPortalController.getPropostaDetalhes);

// Visitas
router.get('/portal-proprietario/visitas', proprietarioAuth, OwnerPortalController.listarVisitas);

// Financeiro
router.get('/portal-proprietario/financeiro', proprietarioAuth, OwnerPortalController.getRelatorioFinanceiro);

// Contratos
router.get('/portal-proprietario/contratos', proprietarioAuth, OwnerPortalController.listarContratos);
router.get('/portal-proprietario/contratos/:id', proprietarioAuth, OwnerPortalController.getContratoDetalhes);

// Documentos
router.get('/portal-proprietario/documentos', proprietarioAuth, OwnerPortalController.listarDocumentos);

// Notificações
router.get('/portal-proprietario/notificacoes', proprietarioAuth, OwnerPortalController.listarNotificacoes);
router.put('/portal-proprietario/notificacoes/:id/ler', proprietarioAuth, OwnerPortalController.marcarNotificacaoLida);

// ============================================
// ROTAS DO SISTEMA PRINCIPAL (IMOBILIÁRIA)
// ============================================
// Rotas protegidas
router.use(authenticateToken);

// CRM - Clientes
router.get('/clientes', crmController.listarClientes);
router.get('/clientes/:id', crmController.buscarCliente);
router.post('/clientes', crmController.criarCliente);
router.put('/clientes/:id', crmController.atualizarCliente);
router.delete('/clientes/:id', crmController.deletarCliente);

// CRM - Atividades
router.get('/clientes/:id/atividades', crmController.listarAtividades);
router.post('/atividades', crmController.criarAtividade);

// CRM - Pipeline
router.get('/pipeline', crmController.listarPipeline);
router.put('/pipeline/mover', crmController.moverLead);

// CRM - Funis
router.get('/funis', crmController.listarFunis);
router.post('/funis', requirePermission('admin'), crmController.criarFunil);

// Imóveis
router.get('/imoveis', propertyController.listarImoveis);
router.get('/imoveis/:id', propertyController.buscarImovel);
router.get('/imoveis/codigo/:codigo', propertyController.buscarImovelPorCodigo);
router.post('/imoveis', propertyController.criarImovel);
router.put('/imoveis/:id', propertyController.atualizarImovel);
router.delete('/imoveis/:id', propertyController.deletarImovel);

// Publicação de Imóveis
router.post('/imoveis/:id/publicar', propertyController.publicarImovel);

// Chaves
router.get('/imoveis/:id/chaves', propertyController.listarChaves);
router.post('/imoveis/:id/emprestar-chave', propertyController.emprestarChave);
router.post('/imoveis/:id/devolver-chave', propertyController.devolverChave);

// Documentos
router.get('/imoveis/:id/documentos', propertyController.listarDocumentos);
router.post('/documentos', propertyController.criarDocumento);

// Financeiro - Contas
router.get('/financeiro/contas', financeController.listarContas);
router.get('/financeiro/contas/:id', financeController.buscarConta);
router.post('/financeiro/contas', financeController.criarConta);
router.put('/financeiro/contas/:id', financeController.atualizarConta);
router.post('/financeiro/contas/:id/baixar', financeController.baixarConta);
router.delete('/financeiro/contas/:id', financeController.deletarConta);

// Financeiro - Plano de Contas
router.get('/financeiro/plano-contas', financeController.listarPlanoContas);
router.post('/financeiro/plano-contas', requirePermission('admin'), financeController.criarPlanoConta);

// Financeiro - Centros de Custo
router.get('/financeiro/centros-custo', financeController.listarCentrosCusto);
router.post('/financeiro/centros-custo', requirePermission('admin'), financeController.criarCentroCusto);

// Financeiro - Comissões
router.get('/financeiro/comissoes', financeController.listarComissoes);
router.post('/financeiro/comissoes', financeController.calcularComissao);

// Financeiro - DRE
router.get('/financeiro/dre', financeController.gerarDRE);

// Financeiro - Relatórios
router.get('/financeiro/inadimplencia', financeController.getInadimplencia);
router.get('/financeiro/recebimentos-previstos', financeController.getRecebimentosPrevistos);

// IA - Lead Scoring
router.get('/ia/clientes/:cliente_id/score', aiController.calcularScoreLead);

// IA - Matching
router.get('/ia/clientes/:cliente_id/imoveis-compativeis', aiController.buscarImoveisCompativeis);

// IA - Geração de Conteúdo
router.post('/ia/imoveis/:imovel_id/descricao', aiController.gerarDescricaoAnuncio);

// IA - Precificação
router.get('/ia/imoveis/:imovel_id/preco-sugerido', aiController.calcularPrecoSugerido);

// IA - Análise de Conversas
router.get('/ia/clientes/:cliente_id/analisar-conversa', aiController.analisarConversa);

// IA - Extração de Perfil
router.post('/ia/clientes/:cliente_id/extrair-perfil', aiController.extrairPerfilBusca);

// Processos - Templates
router.get('/processos/templates', processController.listarTemplates);
router.get('/processos/templates/:id', processController.buscarTemplate);
router.post('/processos/templates', requirePermission('admin'), processController.criarTemplate);
router.put('/processos/templates/:id', requirePermission('admin'), processController.atualizarTemplate);
router.delete('/processos/templates/:id', requirePermission('admin'), processController.deletarTemplate);

// Processos
router.get('/processos', processController.listarProcessos);
router.get('/processos/:id', processController.buscarProcesso);
router.post('/processos', processController.iniciarProcesso);
router.put('/processos/:id/avancar', processController.avancarProcesso);
router.put('/processos/:id/cancelar', processController.cancelarProcesso);

// Processos - Tarefas
router.get('/processos/:id/tarefas', processController.listarTarefas);
router.get('/tarefas/minhas', processController.listarMinhasTarefas);
router.post('/tarefas', processController.criarTarefa);
router.put('/tarefas/:id', processController.atualizarTarefa);
router.put('/tarefas/:id/concluir', processController.concluirTarefa);
router.delete('/tarefas/:id', processController.deletarTarefa);

// Dashboards
router.get('/dashboard/crm', crmController.getDashboard);
router.get('/dashboard/imoveis', propertyController.getEstoqueAnalytics);
router.get('/dashboard/processos', processController.getProcessosDashboard);

// Configurações
router.get('/configuracoes', requirePermission('admin'), async (req, res, next) => {
  try {
    // Implementar controller de configurações
    res.json({ message: 'Implementar' });
  } catch (error) {
    next(error);
  }
});

// LGPD
router.get('/lgpd/consentimento/:cliente_id', requirePermission('admin'), async (req, res, next) => {
  try {
    // Implementar controller LGPD
    res.json({ message: 'Implementar' });
  } catch (error) {
    next(error);
  }
});

// Webhooks
router.post('/webhooks/whatsapp', async (req, res, next) => {
  try {
    // Implementar webhook WhatsApp
    res.json({ message: 'Webhook processado' });
  } catch (error) {
    next(error);
  }
});

router.post('/webhooks/pagamento', async (req, res, next) => {
  try {
    // Implementar webhook pagamento
    res.json({ message: 'Webhook processado' });
  } catch (error) {
    next(error);
  }
});

export default router;