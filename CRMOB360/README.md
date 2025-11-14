# 9MOB - Plataforma de Gestão Imobiliária 360°

> **9MOB**: Nine + Mob = Imob | 3+6+0 = 9 | Gestão 360° completa

---

## 📚 **PRIMEIRO ACESSO? COMEÇE AQUI!**

**👉 [Documentação para Iniciantes - CLIQUE AQUI](../FAQs%20para%20iniciantes%20executarem/00-INICIO-RAPIDO.md)**

Se você está executando o 9MOB pela primeira vez:
- 📖 **[Guia de Início Rápido](../FAQs%20para%20iniciantes%20executarem/00-INICIO-RAPIDO.md)** - Instalação passo a passo
- ❓ **[FAQ - Perguntas Frequentes](../FAQs%20para%20iniciantes%20executarem/FAQ-PERGUNTAS-FREQUENTES.md)** - 50+ perguntas respondidas
- 📑 **[Índice da Documentação](../FAQs%20para%20iniciantes%20executarem/INDICE-DOCUMENTACAO.md)** - Todos os guias disponíveis

**Toda a documentação está organizada na pasta raiz:** [`FAQs para iniciantes executarem/`](../FAQs%20para%20iniciantes%20executarem/)

---

## 🚀 Visão Geral

**9MOB** é uma solução SaaS completa e integrada para gestão imobiliária, desenvolvida com arquitetura moderna e tecnologias de ponta. O sistema atende a todas as necessidades de uma imobiliária, desde a gestão de clientes e imóveis até análises preditivas com inteligência artificial.

### Por que 9MOB?

- **9** = 3 + 6 + 0 (soma dos dígitos de 360)
- **360°** = Visão completa e integrada de todo o negócio
- **MOB** = Imobiliária (Nine + Mob = NineMob = Imob)
- **Gestão 360°** = Cobertura completa de todos os processos imobiliários

---

## 🏗️ Arquitetura do Sistema

### Tecnologias Utilizadas

**Backend:**
- Node.js 18+ com TypeScript
- Express.js para APIs RESTful
- Prisma ORM para PostgreSQL
- JWT para autenticação
- Apache Kafka para mensageria
- Redis para cache e sessões
- Socket.io para real-time

**Frontend:**
- React 18 com TypeScript
- Tailwind CSS para estilização
- React Query para gerenciamento de estado
- Recharts para visualização de dados
- Context API para autenticação

**Banco de Dados:**
- PostgreSQL 14+ (banco principal)
- Redis (cache e sessões)

**Infraestrutura:**
- Docker para containerização
- Microserviços com comunicação via Kafka
- Arquitetura event-driven

---

## 📋 Módulos Implementados

### 1. 🎯 Módulo CRM (Customer Relationship Management)
- **Gestão de Clientes**: Cadastro completo, segmentação e histórico
- **Lead Scoring**: Qualificação automática com IA
- **Pipeline de Vendas**: Acompanhamento de oportunidades
- **Automação de Comunicação**: Emails, SMS e WhatsApp
- **Funis de Venda**: Gestão customizável de etapas
- **Atividades**: Registro completo de interações

### 2. 🏠 Módulo de Imóveis
- **Cadastro Completo**: Ficha técnica detalhada
- **Gestão de Documentos**: Contratos, laudos e certidões
- **Fotos e Vídeos**: Galeria multimídia
- **Integração com Portais**: Publicação automática (Viva Real, Zap Imóveis)
- **Gestão de Chaves**: Controle de empréstimo e devolução
- **Rastreamento de Visualizações**: Analytics de interesse

### 3. 💰 Módulo Financeiro
- **Contas a Pagar/Receber**: Gestão completa de fluxo de caixa
- **Comissões**: Cálculo automático e distribuição multi-parte
- **DRE**: Demonstração de resultados integrada
- **Conciliação Bancária**: Integração com bancos
- **Plano de Contas**: Estrutura hierárquica
- **Centros de Custo**: Controle departamental
- **Relatórios de Inadimplência**: Monitoramento de atrasos

### 4. ⚙️ Módulo de Processos
- **Templates de Processos**: Padronização de fluxos
- **Automação de Tarefas**: Workflows personalizáveis
- **Acompanhamento em Tempo Real**: Dashboard de processos
- **Gestão de Tarefas**: Atribuição, prazos e prioridades
- **Gatilhos Automáticos**: Execução baseada em eventos

### 5. 📢 Módulo Marketing
- **Campanhas Multicanal**: Email, SMS, WhatsApp
- **Automação de Marketing**: Jornadas do cliente
- **Segmentação Avançada**: Baseada em comportamento
- **Análise de ROI**: Mensuração de resultados
- **Templates de Mensagens**: Comunicação padronizada

### 6. 📊 Módulo Relatórios e BI
- **Performance Geral**: KPIs da imobiliária
- **Relatórios de Vendas**: Análise detalhada por corretor/região
- **Gestão de Estoque**: Imóveis disponíveis
- **Dashboards Interativos**: Visualização em tempo real
- **Exportação**: PDF, Excel, CSV

### 7. 🤖 Módulo de IA (Inteligência Artificial)
- **Lead Scoring**: Predição de conversão com ML
- **Matching Inteligente**: Cliente x Imóvel
- **Insights Preditivos**: Análises automáticas
- **Recomendações**: Sugestões personalizadas
- **Análise de Conversas**: NLP para extrair perfis
- **Geração de Conteúdo**: Descrições automáticas de anúncios
- **Precificação Inteligente**: Sugestão de preços baseada em dados

### 8. 🔐 Módulo de LGPD
- **Gestão de Consentimentos**: Registro e controle
- **Direitos dos Titulares**: Acesso, correção, exclusão
- **Segurança de Dados**: Criptografia e anonimização
- **Auditoria e Compliance**: Relatórios de conformidade
- **Templates de Termos**: Versionamento de documentos

### 9. 👥 Portal do Cliente (NOVO!)
- **Autenticação Segura**: Login com JWT
- **Dashboard Personalizado**: Visão completa das interações
- **Busca de Imóveis**: Filtros avançados e recomendações
- **Sistema de Favoritos**: Salvar imóveis de interesse
- **Agendamento de Visitas**: Presencial ou online
- **Envio de Propostas**: Acompanhamento de status
- **Documentos**: Acesso a contratos e certidões
- **Notificações**: Atualizações em tempo real

### 10. 🏢 Portal do Proprietário (NOVO!)
- **Dashboard Financeiro**: Receitas, despesas e rentabilidade
- **Gestão de Imóveis**: Visualizar todos os imóveis cadastrados
- **Propostas Recebidas**: Acompanhar ofertas
- **Visitas Agendadas**: Monitorar interesse
- **Relatórios Financeiros**: Contas a receber e comissões
- **Contratos**: Visualizar locatários e termos
- **Documentos**: Acesso a toda documentação
- **Notificações**: Alertas de vencimentos e propostas

### 11. ⚙️ Módulo de Configurações
- **Gestão de Usuários**: Permissões e papéis (RBAC)
- **Perfis de Acesso**: Admin, Corretor, Gerente, Financeiro
- **Parâmetros do Sistema**: Configurações gerais
- **Integrações**: APIs e conectores
- **Personalização**: Temas e layouts

### 12. 🔗 Módulo de Integrações
- **Portais Imobiliários**: Viva Real, Zap Imóveis
- **Sistemas Financeiros**: Integração bancária
- **Ferramentas de Marketing**: Google Ads, Facebook
- **WhatsApp API**: Comunicação direta
- **Gateways de Pagamento**: Asaas e similares

### 13. 👨‍💼 Módulo de Administrador
- **Gestão de Tenant**: Multi-empresa (SaaS)
- **Monitoramento**: Performance e logs
- **Manutenção**: Rotinas administrativas
- **Auditoria**: Rastreamento completo de ações

---

## 🚀 Funcionalidades Avançadas

### Inteligência Artificial
- **Machine Learning**: Modelos preditivos treinados
- **NLP**: Processamento de linguagem natural
- **Análise Preditiva**: Previsões de mercado
- **Recomendações**: Sistema de sugestões contextuais

### Automação
- **Workflows Personalizáveis**: Fluxos adaptáveis
- **Triggers e Ações**: Eventos automatizados
- **Integração Sem Código**: Zapier/Make
- **Robôs de Processos**: RPA para tarefas repetitivas

### Analytics Avançado
- **Business Intelligence**: Dashboards interativos
- **Data Mining**: Descoberta de padrões
- **KPIs em Tempo Real**: Métricas ao vivo
- **Previsões**: Projeções baseadas em dados

---

## 📊 Dashboards e Relatórios

### Dashboard Principal
- KPIs em tempo real
- Gráficos interativos (Recharts)
- Alertas e notificações
- Acesso rápido a funcionalidades

### Relatórios Personalizados
- Vendas por corretor
- Performance por região
- Análise de estoque
- ROI de campanhas
- DRE (Demonstração de Resultados)

### Exportação de Dados
- PDF, Excel, CSV
- Agendamento de envio
- Templates personalizáveis
- Integração com BI externo

---

## 🔒 Segurança e Compliance

### Segurança de Dados
- Criptografia AES-256
- HTTPS/TLS 1.3
- Backup automático
- Auditoria de acessos
- Rate limiting

### LGPD/GDPR
- Gestão de consentimentos
- Direito ao esquecimento
- Portabilidade de dados
- Relatórios de conformidade

### Controle de Acesso
- Autenticação JWT com refresh tokens
- Permissões granulares (RBAC)
- Log de atividades
- Sessões seguras com expiração

---

## 🎯 Benefícios do 9MOB

### Eficiência Operacional
- ✅ Redução de 70% no tempo de tarefas repetitivas
- ✅ Automação de processos manuais
- ✅ Integração de sistemas
- ✅ Gestão unificada 360°

### Aumento de Vendas
- ✅ Lead scoring inteligente
- ✅ Matching preciso cliente-imóvel
- ✅ Follow-up automatizado
- ✅ Análise preditiva de conversão

### Melhoria na Experiência do Cliente
- ✅ Comunicação personalizada
- ✅ Resposta rápida
- ✅ Processo transparente
- ✅ Portais self-service
- ✅ Acompanhamento em tempo real

### Controle Financeiro
- ✅ Gestão integrada de receitas e despesas
- ✅ Previsão de receitas
- ✅ Análise de rentabilidade
- ✅ Redução de custos operacionais
- ✅ DRE automatizado

---

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (opcional mas recomendado)

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/vvdttv/crmob360-kimik2.git
cd crmob360-kimik2/CRMOB360

# Configure variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Instale as dependências
cd backend && npm install
cd ../frontend && npm install

# Execute as migrações
cd backend
npx prisma migrate dev
npx prisma generate

# Inicie o servidor (desenvolvimento)
npm run dev
```

### Docker (Recomendado)

```bash
# Construir e executar com Docker
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar containers
docker-compose down
```

### Serviços Docker

- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Kafka**: localhost:9092
- **Backend API**: localhost:3001
- **Frontend**: localhost:3000
- **Nginx**: localhost:80/443

---

## 📚 Documentação

### 🎯 Para Iniciantes
**👉 Toda documentação para iniciantes está na pasta raiz:** [`FAQs para iniciantes executarem/`](../FAQs%20para%20iniciantes%20executarem/)

- **[Guia de Início Rápido](../FAQs%20para%20iniciantes%20executarem/00-INICIO-RAPIDO.md)** - Comece aqui!
- **[FAQ Completo](../FAQs%20para%20iniciantes%20executarem/FAQ-PERGUNTAS-FREQUENTES.md)** - 50+ perguntas respondidas
- **[Índice da Documentação](../FAQs%20para%20iniciantes%20executarem/INDICE-DOCUMENTACAO.md)** - Navegue por todos os guias

### 📖 Documentação Técnica Avançada
- **[API Reference](../FAQs%20para%20iniciantes%20executarem/api.md)** - 50+ endpoints documentados
- **[Database Schema](../FAQs%20para%20iniciantes%20executarem/database.md)** - 40+ tabelas Prisma
- **[Architecture Guide](../FAQs%20para%20iniciantes%20executarem/arquitetura.md)** - Microserviços e event-driven
- **[Portal Documentation](../FAQs%20para%20iniciantes%20executarem/PORTAIS.md)** - Guia completo dos portais
- **[Funcionalidades Completas](../FAQs%20para%20iniciantes%20executarem/FUNCIONALIDADES.md)** - 13 módulos, 90+ features

### Estrutura do Projeto

```
crmob360-kimik2/                            # Repositório raiz
├── FAQs para iniciantes executarem/        # 📚 DOCUMENTAÇÃO COMPLETA
│   ├── 00-INICIO-RAPIDO.md                # Guia de instalação
│   ├── FAQ-PERGUNTAS-FREQUENTES.md        # 50+ perguntas
│   ├── INDICE-DOCUMENTACAO.md             # Índice geral
│   ├── FUNCIONALIDADES.md                 # Todas as features
│   ├── PORTAIS.md                         # Guia dos portais
│   ├── api.md                             # Documentação da API
│   ├── database.md                        # Schema do banco
│   ├── arquitetura.md                     # Arquitetura técnica
│   ├── backend.env.example                # Variáveis backend
│   └── frontend.env.example               # Variáveis frontend
└── CRMOB360/                              # Código da aplicação
    ├── backend/                           # API Node.js + Express
    │   ├── src/
    │   │   ├── controllers/               # 11 controllers
    │   │   ├── services/                  # 13 services
    │   │   ├── middleware/                # Auth, errors, logging
    │   │   ├── routes/                    # 70+ rotas
    │   │   └── utils/                     # Validators, helpers
    │   ├── prisma/
    │   │   ├── schema.prisma              # 40 models
    │   │   └── migrations/                # SQL migrations
    │   └── package.json
    ├── frontend/                          # React + TypeScript
    │   ├── src/
    │   │   ├── pages/                     # 30+ páginas
    │   │   ├── components/                # Componentes reutilizáveis
    │   │   ├── context/                   # Auth context
    │   │   └── services/                  # API client
    │   └── package.json
    ├── nginx/                             # Reverse proxy
    ├── docker-compose.yml                 # Orquestração completa
    └── README.md                          # Este arquivo
```

---

## 🔄 Workflow de Desenvolvimento

### Branch Strategy
- `main` - Produção
- `develop` - Desenvolvimento
- `feature/*` - Novas funcionalidades
- `bugfix/*` - Correções

### Commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adicionar portal do cliente
fix: corrigir cálculo de comissão
docs: atualizar README
refactor: reestruturar services
test: adicionar testes unitários
```

---

## 📞 Suporte

### Canais de Suporte
- **Email**: suporte@9mob.com.br
- **Telefone**: +55 11 9999-9999
- **WhatsApp**: +55 11 9999-9999
- **Help Desk**: https://suporte.9mob.com.br
- **GitHub Issues**: https://github.com/vvdttv/crmob360-kimik2/issues

### Horário de Atendimento
- Segunda a Sexta: 8h às 18h
- Sábado: 8h às 12h
- Plantão 24/7 para emergências

---

## 🌟 Reconhecimentos

- Equipe de desenvolvimento
- Comunidade open source
- Parceiros e clientes
- Contribuidores

---

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**9MOB** - Transformando o mercado imobiliário através da tecnologia e inovação.

*Gestão 360° | Inteligência Artificial | Automação Total*

© 2024 9MOB. Todos os direitos reservados.

**Nine + Mob = Imob | 3+6+0 = 9 | Visão 360°**

</div>
