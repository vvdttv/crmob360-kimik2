# Esquema de Banco de Dados - Plataforma Imobiliária 360

## Visão Geral

O banco de dados utiliza PostgreSQL como sistema principal, com Redis para cache e MongoDB para dados não estruturados. A arquitetura segue princípios de normalização até 3NF, com particionamento para tabelas grandes e índices otimizados para consultas.

## Tabelas Principais

### 1. Usuários e Autenticação

```sql
-- Tabela de Usuários (Módulos 1, 12)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo_usuario VARCHAR(50) NOT NULL, -- 'admin', 'corretor', 'gerente', 'financeiro'
    ativo BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP,
    config_notificacoes JSONB DEFAULT '{}'
);

-- Perfis de Acesso (Módulo 12)
CREATE TABLE perfis_acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    permissoes JSONB NOT NULL, -- JSON com todas as permissões
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relação Usuário-Perfil
CREATE TABLE usuario_perfil (
    usuario_id UUID REFERENCES usuarios(id),
    perfil_id UUID REFERENCES perfis_acesso(id),
    PRIMARY KEY (usuario_id, perfil_id)
);
```

### 2. Clientes e Leads (Módulo 1)

```sql
-- Tabela de Clientes/Leads
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    tipo_pessoa VARCHAR(20) DEFAULT 'fisica', -- 'fisica', 'juridica'
    origem VARCHAR(100), -- 'site', 'whatsapp', 'facebook', 'indicacao'
    status_lead VARCHAR(50) DEFAULT 'novo', -- 'novo', 'em_contato', 'visita_agendada', 'em_negociacao', 'convertido', 'perdido'
    score_ia INTEGER DEFAULT 0, -- Score de qualificação IA
    perfil_busca JSONB DEFAULT '{}', -- Preferências do cliente
    responsavel_id UUID REFERENCES usuarios(id),
    criado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_contato TIMESTAMP,
    tags TEXT[], -- Array de tags
    custom_fields JSONB DEFAULT '{}' -- Campos personalizados
);

-- Funil de Vendas
CREATE TABLE funis_venda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL, -- 'venda', 'locacao', 'captacao'
    etapas JSONB NOT NULL, -- Array de etapas com ordem
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pipeline/Leads no Funil
CREATE TABLE pipeline_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    funil_id UUID REFERENCES funis_venda(id),
    etapa_atual VARCHAR(100) NOT NULL,
    valor_estimado DECIMAL(15,2),
    data_entrada_etapa TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previsao_fechamento DATE,
    responsavel_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atividades/Interações
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    tipo VARCHAR(50) NOT NULL, -- 'ligacao', 'email', 'visita', 'whatsapp', 'nota'
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    realizado_por UUID REFERENCES usuarios(id),
    duracao_minutos INTEGER,
    resultado VARCHAR(50), -- 'sucesso', 'sem_contato', 'recado'
    proxima_acao DATE,
    anexos JSONB DEFAULT '[]'
);
```

### 3. Imóveis (Módulo 5)

```sql
-- Tabela de Imóveis
CREATE TABLE imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL, -- Código interno
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo_imovel VARCHAR(50) NOT NULL, -- 'apartamento', 'casa', 'sala_comercial'
    finalidade VARCHAR(20) NOT NULL, -- 'venda', 'locacao', 'venda_locacao'
    status VARCHAR(50) DEFAULT 'disponivel', -- 'disponivel', 'reservado', 'vendido', 'alugado', 'em_manutencao'
    proprietario_id UUID REFERENCES clientes(id),
    responsavel_id UUID REFERENCES usuarios(id),
    
    -- Endereço
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    
    -- Características
    area_total DECIMAL(10,2),
    area_util DECIMAL(10,2),
    quartos INTEGER,
    suites INTEGER,
    banheiros INTEGER,
    vagas_garagem INTEGER,
    andar INTEGER,
    valor_venda DECIMAL(15,2),
    valor_locacao DECIMAL(15,2),
    valor_condominio DECIMAL(12,2),
    valor_iptu DECIMAL(12,2),
    
    -- Configurações
    publicado_site BOOLEAN DEFAULT false,
    publicado_portais JSONB DEFAULT '{}', -- {'zap': true, 'imovelweb': false}
    fotos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    planta_baixa TEXT,
    
    -- Metadados
    visitas_count INTEGER DEFAULT 0,
    criado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'
);

-- Chaves e Documentos do Imóvel
CREATE TABLE imovel_chaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID REFERENCES imoveis(id),
    localizacao VARCHAR(255) NOT NULL, -- 'recepcao', 'corretor_x', 'portaria'
    status VARCHAR(50) DEFAULT 'disponivel', -- 'disponivel', 'emprestada', 'perdida'
    emprestada_para UUID REFERENCES usuarios(id),
    data_emprestimo TIMESTAMP,
    data_devolucao TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imovel_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID REFERENCES imoveis(id),
    tipo VARCHAR(100) NOT NULL, -- 'matricula', 'iptu', 'projeto'
    arquivo_url TEXT NOT NULL,
    nome_arquivo VARCHAR(255),
    tamanho_bytes BIGINT,
    mime_type VARCHAR(100),
    data_vencimento DATE,
    alerta_vencimento_dias INTEGER DEFAULT 30,
    uploaded_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Contratos e Administração (Módulo 8)

```sql
-- Contratos de Locação
CREATE TABLE contratos_locacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrato VARCHAR(50) UNIQUE NOT NULL,
    imovel_id UUID REFERENCES imoveis(id),
    locatario_id UUID REFERENCES clientes(id),
    fiador_id UUID REFERENCES clientes(id),
    
    -- Termos do contrato
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    prorrogacao_automatica BOOLEAN DEFAULT true,
    valor_aluguel DECIMAL(12,2) NOT NULL,
    valor_condominio DECIMAL(12,2) DEFAULT 0,
    dia_vencimento INTEGER NOT NULL,
    taxa_administracao DECIMAL(5,2) DEFAULT 10.0,
    
    -- Multas e juros
    multa_atraso_percentual DECIMAL(5,2) DEFAULT 2.0,
    juros_mora_percentual DECIMAL(5,2) DEFAULT 0.033,
    
    -- Status
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'encerrado', 'rescindido'
    motivo_encerramento TEXT,
    data_encerramento DATE,
    
    -- Documentação
    documento_url TEXT,
    assinado_digitalmente BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id)
);

-- Propostas
CREATE TABLE propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_proposta VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'venda', 'locacao'
    imovel_id UUID REFERENCES imoveis(id),
    cliente_id UUID REFERENCES clientes(id),
    corretor_id UUID REFERENCES usuarios(id),
    
    -- Valores
    valor_proposta DECIMAL(15,2) NOT NULL,
    valor_sinal DECIMAL(15,2),
    condicoes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'aceita', 'recusada', 'cancelada'
    data_resposta DATE,
    motivo_recusa TEXT,
    
    -- Documentação
    documento_url TEXT,
    assinado_digitalmente BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Financeiro (Módulo 9)

```sql
-- Plano de Contas
CREATE TABLE plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'receita', 'despesa'
    categoria VARCHAR(50), -- 'venda', 'locacao', 'administrativo', 'comissao'
    parent_id UUID REFERENCES plano_contas(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Centros de Custo
CREATE TABLE centros_custo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contas a Pagar/Receber
CREATE TABLE contas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_documento VARCHAR(50),
    tipo VARCHAR(20) NOT NULL, -- 'pagar', 'receber'
    plano_conta_id UUID REFERENCES plano_contas(id),
    centro_custo_id UUID REFERENCES centros_custo(id),
    
    -- Dados do pagamento
    descricao TEXT NOT NULL,
    valor_original DECIMAL(15,2) NOT NULL,
    valor_pago DECIMAL(15,2) DEFAULT 0,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    
    -- Relacionamentos
    cliente_id UUID REFERENCES clientes(id),
    contrato_id UUID REFERENCES contratos_locacao(id),
    imovel_id UUID REFERENCES imoveis(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado', 'cancelado'
    
    -- Gateway de pagamento
    gateway_pagamento VARCHAR(50),
    boleto_url TEXT,
    boleto_codigo VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id)
);

-- Comissões
CREATE TABLE comissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_comissao VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'venda', 'locacao'
    
    -- Origem
    venda_id UUID REFERENCES propostas(id),
    locacao_id UUID REFERENCES contratos_locacao(id),
    
    -- Corretores
    corretor_vendedor_id UUID REFERENCES usuarios(id),
    corretor_captador_id UUID REFERENCES usuarios(id),
    gerente_id UUID REFERENCES usuarios(id),
    
    -- Valores
    valor_total DECIMAL(15,2) NOT NULL,
    percentual_imobiliaria DECIMAL(5,2) DEFAULT 40.0,
    percentual_vendedor DECIMAL(5,2) DEFAULT 40.0,
    percentual_captador DECIMAL(5,2) DEFAULT 15.0,
    percentual_gerente DECIMAL(5,2) DEFAULT 5.0,
    
    valor_imobiliaria DECIMAL(15,2),
    valor_vendedor DECIMAL(15,2),
    valor_captador DECIMAL(15,2),
    valor_gerente DECIMAL(15,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'calculada', -- 'calculada', 'aprovada', 'paga', 'cancelada'
    data_pagamento DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculada_por UUID REFERENCES usuarios(id)
);
```

### 6. LGPD e Conformidade (Módulo 13)

```sql
-- Tabela de Consentimentos LGPD (Obrigatória)
CREATE TABLE log_consentimento_lgpd (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID REFERENCES clientes(id),
    timestamp_consentimento TIMESTAMPTZ NOT NULL,
    texto_consentimento_hash VARCHAR(64) NOT NULL, -- SHA256
    id_template_termo UUID,
    ip_origem INET,
    canal_origem VARCHAR(100),
    permissao_email_mkt BOOLEAN DEFAULT false,
    permissao_whatsapp_mkt BOOLEAN DEFAULT false,
    permissao_ia_perfil BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates de Termos
CREATE TABLE templates_termos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'formulario_site', 'contrato', 'app_vistoria'
    versao INTEGER DEFAULT 1,
    texto_conteudo TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitações de Direitos do Titular
CREATE TABLE solicitacoes_lgpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    tipo_solicitacao VARCHAR(50) NOT NULL, -- 'acesso', 'portabilidade', 'exclusao', 'correcao'
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'atendida', 'negada'
    motivo_negacao TEXT,
    data_atendimento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Configurações e Automação

```sql
-- Templates de Processo (Módulo 6)
CREATE TABLE templates_processo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) NOT NULL, -- 'venda', 'locacao', 'manutencao'
    etapas JSONB NOT NULL, -- Array de etapas do processo
    gatilhos JSONB DEFAULT '[]', -- Eventos que disparam este processo
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Instâncias de Processo
CREATE TABLE processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates_processo(id),
    entidade_tipo VARCHAR(50), -- 'cliente', 'imovel', 'contrato'
    entidade_id UUID,
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'concluido', 'cancelado'
    etapa_atual VARCHAR(100),
    responsavel_id UUID REFERENCES usuarios(id),
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP
);

-- Tarefas de Processo
CREATE TABLE tarefas_processo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID REFERENCES processos(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    atribuido_para UUID REFERENCES usuarios(id),
    prazo DATE,
    prioridade VARCHAR(20) DEFAULT 'normal', -- 'baixa', 'normal', 'alta', 'urgente'
    status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluida', 'cancelada'
    concluida_em TIMESTAMP,
    anexos JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurações do Sistema
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50), -- 'geral', 'financeiro', 'marketing', 'lgpd'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Índices e Performance

```sql
-- Índices para consultas frequentes
CREATE INDEX idx_clientes_status ON clientes(status_lead);
CREATE INDEX idx_clientes_responsavel ON clientes(responsavel_id);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_clientes_email ON clientes(email);

CREATE INDEX idx_imoveis_status ON imoveis(status);
CREATE INDEX idx_imoveis_tipo ON imoveis(tipo_imovel);
CREATE INDEX idx_imoveis_finalidade ON imoveis(finalidade);
CREATE INDEX idx_imoveis_responsavel ON imoveis(responsavel_id);

CREATE INDEX idx_pipeline_etapa ON pipeline_leads(etapa_atual);
CREATE INDEX idx_pipeline_responsavel ON pipeline_leads(responsavel_id);

CREATE INDEX idx_contas_vencimento ON contas_financeiras(data_vencimento);
CREATE INDEX idx_contas_status ON contas_financeiras(status);

-- Índices para LGPD
CREATE INDEX idx_consentimento_cliente ON log_consentimento_lgpd(id_cliente);
CREATE INDEX idx_consentimento_timestamp ON log_consentimento_lgpd(timestamp_consentimento);

-- Índices JSONB
CREATE INDEX idx_clientes_perfil ON clientes USING GIN(perfil_busca);
CREATE INDEX idx_imoveis_custom ON imoveis USING GIN(custom_fields);
```

## Particionamento

```sql
-- Particionar tabela de logs por ano
CREATE TABLE log_atividades (
    id UUID DEFAULT gen_random_uuid(),
    usuario_id UUID,
    acao VARCHAR(100),
    entidade_tipo VARCHAR(50),
    entidade_id UUID,
    dados JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ano INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM timestamp)) STORED
) PARTITION BY LIST (ano);

-- Criar partições para os próximos 5 anos
CREATE TABLE log_atividades_2024 PARTITION OF log_atividades FOR VALUES IN (2024);
CREATE TABLE log_atividades_2025 PARTITION OF log_atividades FOR VALUES IN (2025);
CREATE TABLE log_atividades_2026 PARTITION OF log_atividades FOR VALUES IN (2026);
```

## Segurança e Backup

1. **Criptografia:** Campos sensíveis (CPF, telefone) podem ser criptografados
2. **Backup:** Backups automatizados diários com retenção de 30 dias
3. **Replicação:** Replicação assíncrona para disaster recovery
4. **Auditoria:** Triggers para registrar todas as modificações

Este esquema suporta todos os 13 módulos da plataforma com integridade referencial, performance otimizada e conformidade com LGPD.