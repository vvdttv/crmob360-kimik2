-- Migration: Funcionalidades Avançadas 9MOB
-- Criado em: 2024
-- Descrição: Adiciona tabelas para Marketing, WhatsApp, Pagamentos, Portais e Auditoria

-- ============================================
-- MÓDULO DE MARKETING
-- ============================================

-- Campanhas de Marketing
CREATE TABLE IF NOT EXISTS campanhas_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- email, sms, whatsapp
  assunto VARCHAR(500),
  mensagem TEXT NOT NULL,
  segmentacao JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'rascunho', -- rascunho, agendada, enviando, enviada, cancelada
  agendamento TIMESTAMPTZ,
  data_envio TIMESTAMPTZ,
  template_id UUID,
  total_envios INTEGER DEFAULT 0,
  total_enviados INTEGER DEFAULT 0,
  total_erros INTEGER DEFAULT 0,
  criado_por UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campanhas_status ON campanhas_marketing(status);
CREATE INDEX idx_campanhas_tipo ON campanhas_marketing(tipo);

-- Templates de Mensagem
CREATE TABLE IF NOT EXISTS templates_mensagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- email, sms, whatsapp
  assunto VARCHAR(500),
  conteudo TEXT NOT NULL,
  variaveis JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_tipo ON templates_mensagem(tipo);

-- Envios de Campanha
CREATE TABLE IF NOT EXISTS envios_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviado, erro
  erro TEXT,
  aberto BOOLEAN DEFAULT false,
  data_abertura TIMESTAMPTZ,
  clicado BOOLEAN DEFAULT false,
  data_clique TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_envios_campanha ON envios_campanha(campanha_id);
CREATE INDEX idx_envios_cliente ON envios_campanha(cliente_id);
CREATE INDEX idx_envios_status ON envios_campanha(status);

-- Cliques em Campanhas
CREATE TABLE IF NOT EXISTS cliques_campanha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id UUID NOT NULL,
  link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cliques_envio ON cliques_campanha(envio_id);

-- ============================================
-- WHATSAPP
-- ============================================

-- Mensagens WhatsApp
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(255),
  telefone VARCHAR(20) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- text, template, image, document, audio, video
  conteudo TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, enviada, entregue, lida, recebida, erro, failed
  erro TEXT,
  direcao VARCHAR(20) DEFAULT 'saida', -- saida, entrada
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_telefone ON mensagens_whatsapp(telefone);
CREATE INDEX idx_whatsapp_status ON mensagens_whatsapp(status);
CREATE INDEX idx_whatsapp_message_id ON mensagens_whatsapp(message_id);

-- ============================================
-- PAGAMENTOS
-- ============================================

-- Transações de Pagamento
CREATE TABLE IF NOT EXISTS transacoes_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID,
  gateway VARCHAR(50) NOT NULL, -- asaas, pagseguro, mercadopago
  gateway_payment_id VARCHAR(255),
  valor DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, received, overdue, refunded, cancelled
  tipo VARCHAR(50), -- boleto, pix, credit_card, debit_card
  metadados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transacoes_conta ON transacoes_pagamento(conta_id);
CREATE INDEX idx_transacoes_gateway_payment ON transacoes_pagamento(gateway_payment_id);
CREATE INDEX idx_transacoes_status ON transacoes_pagamento(status);

-- ============================================
-- PUBLICAÇÃO EM PORTAIS
-- ============================================

-- Integrações com Portais
CREATE TABLE IF NOT EXISTS portal_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL, -- vivareal, zapimoveis, olx
  ativo BOOLEAN DEFAULT true,
  credenciais JSONB NOT NULL, -- api_key, secret, etc (criptografado)
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publicações em Portais
CREATE TABLE IF NOT EXISTS publicacoes_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id UUID NOT NULL,
  portal_id UUID NOT NULL,
  portal_listing_id VARCHAR(255), -- ID do anúncio no portal
  status VARCHAR(50) DEFAULT 'publicado', -- publicado, pausado, removido, erro
  data_publicacao TIMESTAMPTZ,
  data_remocao TIMESTAMPTZ,
  erro TEXT,
  visualizacoes INTEGER DEFAULT 0,
  leads_gerados INTEGER DEFAULT 0,
  ultima_sincronizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publicacoes_imovel ON publicacoes_portal(imovel_id);
CREATE INDEX idx_publicacoes_portal ON publicacoes_portal(portal_id);
CREATE INDEX idx_publicacoes_status ON publicacoes_portal(status);

-- Leads capturados dos portais
CREATE TABLE IF NOT EXISTS leads_portais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacao_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  mensagem TEXT,
  origem VARCHAR(100), -- vivareal, zapimoveis, etc
  cliente_id UUID, -- Se já foi convertido em cliente
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_portais_publicacao ON leads_portais(publicacao_id);
CREATE INDEX idx_leads_portais_cliente ON leads_portais(cliente_id);

-- ============================================
-- AUDITORIA
-- ============================================

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID,
  acao VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, etc
  entidade VARCHAR(100), -- clientes, imoveis, contas_financeiras, etc
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_acao ON logs_auditoria(acao);
CREATE INDEX idx_logs_entidade ON logs_auditoria(entidade, entidade_id);
CREATE INDEX idx_logs_created ON logs_auditoria(created_at);

-- ============================================
-- NOTIFICAÇÕES AVANÇADAS
-- ============================================

-- Notificações do Sistema
CREATE TABLE IF NOT EXISTS notificacoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- info, warning, error, success
  categoria VARCHAR(50), -- tarefa, processo, financeiro, lead, etc
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link VARCHAR(500),
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMPTZ,
  acao_principal JSONB, -- {label: 'Ver', url: '/...'}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON notificacoes_sistema(usuario_id, lida);
CREATE INDEX idx_notif_created ON notificacoes_sistema(created_at);

-- ============================================
-- DASHBOARDS E ANALYTICS
-- ============================================

-- Métricas do Sistema (snapshot diário)
CREATE TABLE IF NOT EXISTS metricas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  total_clientes INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  total_imoveis INTEGER DEFAULT 0,
  imoveis_disponiveis INTEGER DEFAULT 0,
  total_visitas INTEGER DEFAULT 0,
  total_propostas INTEGER DEFAULT 0,
  receita_dia DECIMAL(15,2) DEFAULT 0,
  despesa_dia DECIMAL(15,2) DEFAULT 0,
  metricas_extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_metricas_data ON metricas_sistema(data);

-- ============================================
-- CONFIGURAÇÕES AVANÇADAS
-- ============================================

-- Configurações de Integração
CREATE TABLE IF NOT EXISTS config_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- email, whatsapp, payment, portal
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT false,
  credenciais JSONB NOT NULL,
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_config_tipo ON config_integracoes(tipo);

-- ============================================
-- WEBHOOKS
-- ============================================

-- Registro de Webhooks Recebidos
CREATE TABLE IF NOT EXISTS webhooks_recebidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem VARCHAR(100) NOT NULL, -- whatsapp, asaas, vivareal, etc
  evento VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT false,
  processado_em TIMESTAMPTZ,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_origem ON webhooks_recebidos(origem);
CREATE INDEX idx_webhooks_processado ON webhooks_recebidos(processado);

-- ============================================
-- AUTOMAÇÕES
-- ============================================

-- Regras de Automação
CREATE TABLE IF NOT EXISTS regras_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  trigger_tipo VARCHAR(100) NOT NULL, -- novo_lead, visita_agendada, proposta_recebida, etc
  trigger_condicoes JSONB DEFAULT '{}',
  acoes JSONB NOT NULL, -- [{tipo: 'enviar_email', config: {...}}, ...]
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automacao_trigger ON regras_automacao(trigger_tipo);

-- Execuções de Automação
CREATE TABLE IF NOT EXISTS execucoes_automacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id UUID NOT NULL,
  entidade_tipo VARCHAR(100),
  entidade_id UUID,
  status VARCHAR(50) DEFAULT 'executando', -- executando, concluida, erro
  resultado JSONB,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  concluida_em TIMESTAMPTZ
);

CREATE INDEX idx_execucoes_regra ON execucoes_automacao(regra_id);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE campanhas_marketing IS 'Campanhas de marketing multicanal';
COMMENT ON TABLE templates_mensagem IS 'Templates reutilizáveis para campanhas';
COMMENT ON TABLE mensagens_whatsapp IS 'Histórico de mensagens do WhatsApp Business';
COMMENT ON TABLE transacoes_pagamento IS 'Transações de pagamento via gateway';
COMMENT ON TABLE publicacoes_portal IS 'Publicações de imóveis em portais externos';
COMMENT ON TABLE logs_auditoria IS 'Logs completos de auditoria do sistema';
COMMENT ON TABLE notificacoes_sistema IS 'Notificações para usuários do sistema';
COMMENT ON TABLE metricas_sistema IS 'Snapshot diário de métricas principais';
COMMENT ON TABLE regras_automacao IS 'Regras de automação configuráveis';
