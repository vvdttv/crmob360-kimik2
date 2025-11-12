# Documentação dos Portais - Cliente e Proprietário

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Portal do Cliente](#portal-do-cliente)
3. [Portal do Proprietário](#portal-do-proprietário)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [API Endpoints](#api-endpoints)
6. [Modelos de Dados](#modelos-de-dados)
7. [Autenticação](#autenticação)
8. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

Os **Portais de Cliente** e **Portais de Proprietário** são funcionalidades self-service que permitem que clientes e proprietários acessem informações específicas e realizem ações sem necessitar contato direto com a imobiliária.

### Características Principais

- ✅ Autenticação independente com JWT
- ✅ Dashboards personalizados
- ✅ Sistema de notificações em tempo real
- ✅ Gestão de documentos compartilhados
- ✅ Rastreamento de atividades
- ✅ Interface responsiva

---

## 🏠 Portal do Cliente

### Funcionalidades

#### 1. Autenticação
- Login com email e senha
- Sessões seguras com JWT
- Logout com invalidação de token

#### 2. Dashboard
Visualização de:
- Imóveis favoritos
- Visitas agendadas/realizadas
- Propostas enviadas (pendentes, aceitas, recusadas)
- Notificações não lidas
- Imóveis recomendados baseados no perfil

#### 3. Busca de Imóveis
- Listagem de imóveis disponíveis
- Filtros por:
  - Tipo de imóvel
  - Finalidade (venda/locação)
  - Cidade e bairro
  - Número de quartos
  - Faixa de preço
- Detalhes completos do imóvel
- Sistema de favoritos

#### 4. Agendamento de Visitas
- Agendar visitas presenciais ou online
- Visualizar histórico de visitas
- Cancelar visitas agendadas
- Avaliar visitas realizadas

#### 5. Propostas
- Enviar propostas de compra/locação
- Acompanhar status das propostas
- Visualizar histórico de propostas

#### 6. Notificações
- Notificações sobre:
  - Visitas confirmadas/canceladas
  - Propostas respondidas
  - Novos imóveis compatíveis
  - Mensagens da imobiliária
- Marcar notificações como lidas

#### 7. Documentos
- Visualizar documentos compartilhados
- Contratos e certidões
- Marcar documentos como visualizados

#### 8. Perfil de Busca
- Definir preferências de busca
- Sistema de recomendação inteligente

### Rotas Frontend

```
/portal-cliente/login            - Login
/portal-cliente/dashboard        - Dashboard principal
/portal-cliente/imoveis          - Buscar imóveis
/portal-cliente/favoritos        - Imóveis favoritos
/portal-cliente/visitas          - Minhas visitas
/portal-cliente/propostas        - Minhas propostas
/portal-cliente/documentos       - Documentos
/portal-cliente/notificacoes     - Notificações
/portal-cliente/perfil           - Configurações de perfil
```

---

## 🏢 Portal do Proprietário

### Funcionalidades

#### 1. Autenticação
- Login com email e senha (apenas proprietários cadastrados)
- Verificação de propriedade de imóveis
- Sessões seguras com JWT

#### 2. Dashboard
Visualização de:
- Total de imóveis cadastrados
- Imóveis por status (disponível, alugado, vendido)
- Visitas agendadas
- Propostas pendentes
- Receita mensal de aluguéis
- Próximos vencimentos

#### 3. Gestão de Imóveis
- Listar todos os imóveis do proprietário
- Visualizar detalhes completos de cada imóvel
- Acompanhar número de visualizações
- Ver propostas e visitas agendadas
- Filtros por status, tipo, cidade

#### 4. Propostas Recebidas
- Listar todas as propostas recebidas
- Visualizar detalhes do proponente
- Acompanhar status das propostas
- Histórico de propostas aceitas/recusadas

#### 5. Visitas Agendadas
- Visualizar todas as visitas agendadas
- Informações do cliente e corretor responsável
- Status das visitas (agendada, confirmada, realizada)
- Histórico de visitas realizadas

#### 6. Relatório Financeiro
- Receita total e por período
- Contas a receber
- Contas recebidas
- Valor de comissões
- Receita líquida
- Exportação de relatórios

#### 7. Contratos
- Listar contratos ativos
- Visualizar detalhes do contrato
- Informações do locatário e fiador
- Histórico de pagamentos
- Contratos encerrados

#### 8. Documentos
- Documentos dos imóveis
- Certidões e laudos
- Contratos assinados
- Filtrar por imóvel

#### 9. Notificações
- Novas propostas recebidas
- Visitas agendadas
- Vencimentos próximos
- Atualizações de contratos

### Rotas Frontend

```
/portal-proprietario/login       - Login
/portal-proprietario/dashboard   - Dashboard principal
/portal-proprietario/imoveis     - Meus imóveis
/portal-proprietario/propostas   - Propostas recebidas
/portal-proprietario/visitas     - Visitas agendadas
/portal-proprietario/financeiro  - Relatório financeiro
/portal-proprietario/contratos   - Contratos
/portal-proprietario/documentos  - Documentos
/portal-proprietario/notificacoes - Notificações
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### 1. Configurar Variáveis de Ambiente

**Backend** (`/backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/imobiliaria360
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_PORTAL_URL=http://localhost:3000/portal-cliente
OWNER_PORTAL_URL=http://localhost:3000/portal-proprietario
```

**Frontend** (`/frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_CLIENT_PORTAL_URL=/portal-cliente
REACT_APP_OWNER_PORTAL_URL=/portal-proprietario
```

### 2. Executar Migrações do Prisma

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 3. Criar Senha para Clientes/Proprietários

Os clientes e proprietários precisam de senha para acessar os portais. A senha é armazenada no campo `custom_fields.senha_hash`.

**Exemplo de script para criar senha**:

```typescript
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function criarSenhaCliente(clienteId: string, senha: string) {
  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.clientes.update({
    where: { id: clienteId },
    data: {
      custom_fields: {
        ...custom_fields,
        senha_hash: senhaHash
      }
    }
  });
}
```

### 4. Iniciar Aplicação

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

---

## 📡 API Endpoints

### Portal do Cliente

#### Autenticação
```
POST   /api/portal-cliente/login
POST   /api/portal-cliente/logout
```

#### Dashboard e Dados
```
GET    /api/portal-cliente/dashboard
GET    /api/portal-cliente/imoveis
GET    /api/portal-cliente/imoveis/:id
PUT    /api/portal-cliente/perfil-busca
```

#### Favoritos
```
GET    /api/portal-cliente/favoritos
POST   /api/portal-cliente/favoritos/:imovelId
DELETE /api/portal-cliente/favoritos/:imovelId
```

#### Visitas
```
GET    /api/portal-cliente/visitas
POST   /api/portal-cliente/visitas
DELETE /api/portal-cliente/visitas/:id
```

#### Propostas
```
GET    /api/portal-cliente/propostas
POST   /api/portal-cliente/propostas
```

#### Notificações
```
GET    /api/portal-cliente/notificacoes
PUT    /api/portal-cliente/notificacoes/:id/ler
```

#### Documentos
```
GET    /api/portal-cliente/documentos
PUT    /api/portal-cliente/documentos/:id/visualizar
```

### Portal do Proprietário

#### Autenticação
```
POST   /api/portal-proprietario/login
POST   /api/portal-proprietario/logout
```

#### Dashboard e Imóveis
```
GET    /api/portal-proprietario/dashboard
GET    /api/portal-proprietario/imoveis
GET    /api/portal-proprietario/imoveis/:id
```

#### Propostas
```
GET    /api/portal-proprietario/propostas
GET    /api/portal-proprietario/propostas/:id
```

#### Visitas
```
GET    /api/portal-proprietario/visitas
```

#### Financeiro
```
GET    /api/portal-proprietario/financeiro
```

#### Contratos
```
GET    /api/portal-proprietario/contratos
GET    /api/portal-proprietario/contratos/:id
```

#### Documentos
```
GET    /api/portal-proprietario/documentos
```

#### Notificações
```
GET    /api/portal-proprietario/notificacoes
PUT    /api/portal-proprietario/notificacoes/:id/ler
```

---

## 🗄️ Modelos de Dados

### portal_sessions
Gerencia as sessões ativas dos portais.

```prisma
model portal_sessions {
  id              String
  cliente_id      String
  tipo_portal     String    // 'cliente' ou 'proprietario'
  token_acesso    String
  refresh_token   String?
  ip_address      String?
  user_agent      String?
  ultimo_acesso   DateTime
  expira_em       DateTime
  ativo           Boolean
  created_at      DateTime
}
```

### imoveis_favoritos
Imóveis marcados como favoritos pelos clientes.

```prisma
model imoveis_favoritos {
  id         String
  cliente_id String
  imovel_id  String
  created_at DateTime
}
```

### agendamentos_visita
Visitas agendadas aos imóveis.

```prisma
model agendamentos_visita {
  id                  String
  imovel_id           String
  cliente_id          String
  corretor_id         String?
  data_hora           DateTime
  duracao_minutos     Int
  status              String    // agendado, confirmado, realizado, cancelado
  tipo_visita         String    // presencial, online
  observacoes         String?
  avaliacao_cliente   Int?
  comentario_cliente  String?
  cancelado_por       String?
  motivo_cancelamento String?
  created_at          DateTime
  updated_at          DateTime
}
```

### notificacoes_portal
Notificações para os portais.

```prisma
model notificacoes_portal {
  id         String
  cliente_id String
  tipo       String
  titulo     String
  mensagem   String
  link       String?
  lida       Boolean
  lida_em    DateTime?
  created_at DateTime
}
```

### portal_activities
Log de atividades nos portais.

```prisma
model portal_activities {
  id          String
  cliente_id  String
  tipo_portal String
  acao        String
  entidade    String?
  entidade_id String?
  detalhes    Json
  ip_address  String?
  user_agent  String?
  created_at  DateTime
}
```

### documentos_compartilhados
Documentos compartilhados com clientes/proprietários.

```prisma
model documentos_compartilhados {
  id                  String
  cliente_id          String
  imovel_id           String?
  contrato_id         String?
  tipo_documento      String
  titulo              String
  arquivo_url         String
  nome_arquivo        String
  tamanho_bytes       BigInt?
  mime_type           String?
  requer_assinatura   Boolean
  assinado            Boolean
  data_assinatura     DateTime?
  visualizado         Boolean
  visualizado_em      DateTime?
  compartilhado_por   String?
  created_at          DateTime
}
```

---

## 🔐 Autenticação

### Fluxo de Autenticação

1. **Login**:
   - Cliente/proprietário envia email e senha
   - Sistema verifica credenciais
   - Retorna token JWT + refresh token
   - Token válido por 1 hora
   - Refresh token válido por 7 dias

2. **Requisições Autenticadas**:
   - Incluir header: `Authorization: Bearer {token}`
   - Middleware valida token e sessão
   - Sessão atualizada a cada requisição

3. **Logout**:
   - Invalida token atual
   - Remove sessão do banco

### Exemplo de Login

```javascript
// Cliente
const response = await axios.post('/api/portal-cliente/login', {
  email: 'cliente@exemplo.com',
  senha: 'senha123'
});

const { token, refreshToken, cliente } = response.data.data;

// Proprietário
const response = await axios.post('/api/portal-proprietario/login', {
  email: 'proprietario@exemplo.com',
  senha: 'senha123'
});

const { token, refreshToken, proprietario } = response.data.data;
```

### Exemplo de Requisição Autenticada

```javascript
const response = await axios.get('/api/portal-cliente/dashboard', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## 💡 Exemplos de Uso

### 1. Criar Senha para Cliente

```typescript
import bcrypt from 'bcryptjs';

const senha = 'senha123';
const senhaHash = await bcrypt.hash(senha, 10);

await prisma.clientes.update({
  where: { id: clienteId },
  data: {
    custom_fields: {
      senha_hash: senhaHash
    }
  }
});
```

### 2. Cliente Favoritar Imóvel

```typescript
const response = await axios.post(
  `/api/portal-cliente/favoritos/${imovelId}`,
  {},
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### 3. Cliente Agendar Visita

```typescript
const response = await axios.post(
  '/api/portal-cliente/visitas',
  {
    imovel_id: 'uuid-do-imovel',
    data_hora: '2024-01-15T14:00:00',
    tipo_visita: 'presencial',
    observacoes: 'Gostaria de ver a área externa'
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### 4. Cliente Enviar Proposta

```typescript
const response = await axios.post(
  '/api/portal-cliente/propostas',
  {
    imovel_id: 'uuid-do-imovel',
    valor_proposta: 350000,
    valor_sinal: 35000,
    condicoes: 'Financiamento bancário em 30 anos'
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

### 5. Proprietário Visualizar Relatório Financeiro

```typescript
const response = await axios.get(
  '/api/portal-proprietario/financeiro?data_inicio=2024-01-01&data_fim=2024-12-31',
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const { resumo, contasReceber, comissoes } = response.data.data;
```

### 6. Criar Notificação para Cliente

```typescript
await prisma.notificacoes_portal.create({
  data: {
    cliente_id: clienteId,
    tipo: 'proposta_atualizada',
    titulo: 'Proposta Aceita!',
    mensagem: 'Sua proposta para o imóvel XYZ foi aceita pelo proprietário.',
    link: '/portal-cliente/propostas/uuid-da-proposta'
  }
});
```

---

## 🎨 Personalização

### Temas e Cores

Os portais utilizam cores diferentes para facilitar identificação:

- **Portal do Cliente**: Azul (`blue-600`, `blue-700`)
- **Portal do Proprietário**: Verde (`green-600`, `green-700`)

### Adicionando Novas Funcionalidades

1. **Backend**:
   - Adicionar método no Service
   - Adicionar método no Controller
   - Adicionar rota em `/backend/src/routes/index.ts`

2. **Frontend**:
   - Criar componente React
   - Adicionar rota no React Router
   - Conectar com API usando axios

---

## 🔧 Manutenção

### Limpeza de Sessões Expiradas

Criar um cron job para limpar sessões expiradas:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limparSessoesExpiradas() {
  await prisma.portal_sessions.deleteMany({
    where: {
      expira_em: {
        lt: new Date()
      }
    }
  });
}

// Executar diariamente
setInterval(limparSessoesExpiradas, 24 * 60 * 60 * 1000);
```

### Monitoramento de Atividades

Todas as ações nos portais são registradas na tabela `portal_activities` para auditoria e análise.

---

## 📞 Suporte

Para dúvidas ou suporte, entre em contato:
- **Email**: suporte@imobiliaria360.com
- **Telefone**: +55 11 9999-9999
- **WhatsApp**: +55 11 9999-9999

---

## 📄 Licença

© 2024 Imobiliária 360. Todos os direitos reservados.
