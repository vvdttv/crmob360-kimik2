# 🚀 Guia de Início Rápido - 9MOB

> **Plataforma de Gestão Imobiliária 360°**

Este guia foi criado para **iniciantes** que desejam executar a aplicação 9MOB pela primeira vez.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Rápida](#instalação-rápida)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Executando a Aplicação](#executando-a-aplicação)
6. [Acessando o Sistema](#acessando-o-sistema)
7. [Problemas Comuns](#problemas-comuns)
8. [Próximos Passos](#próximos-passos)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado em seu computador:

### Obrigatórios:
- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **PostgreSQL 15+** - [Download aqui](https://www.postgresql.org/download/)
- **Git** - [Download aqui](https://git-scm.com/downloads)

### Opcionais (para desenvolvimento avançado):
- **Docker** - [Download aqui](https://www.docker.com/products/docker-desktop/)
- **Redis** - [Download aqui](https://redis.io/download/)
- **Apache Kafka** (apenas para funcionalidades avançadas)

---

## ⚡ Instalação Rápida

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/crmob360-kimik2.git
cd crmob360-kimik2/CRMOB360
```

### Passo 2: Instale as Dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

## 💾 Configuração do Banco de Dados

### Método 1: Criação Manual (Recomendado para Iniciantes)

1. **Abra o PostgreSQL** (pgAdmin ou terminal)

2. **Crie o banco de dados:**
```sql
CREATE DATABASE "9mob";
```

3. **Execute as migrations:**
```bash
cd backend
npx prisma migrate dev
```

4. **Execute a migration de funcionalidades avançadas:**
```bash
psql -U postgres -d 9mob -f prisma/migrations/add_advanced_features.sql
```

### Método 2: Usando Docker (Mais Rápido)

```bash
# Na pasta raiz CRMOB360
docker-compose up -d postgres
```

---

## 🔐 Variáveis de Ambiente

### Backend

1. **Copie o arquivo de exemplo:**
```bash
cd backend
cp .env.example .env
```

2. **Edite o arquivo `.env` com suas configurações:**

```env
# Banco de Dados
DATABASE_URL="postgresql://postgres:senha@localhost:5432/9mob?schema=public"

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_REFRESH_SECRET="seu-refresh-secret-super-seguro"

# Servidor
PORT=3000
NODE_ENV=development

# Redis (opcional para começar)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (opcional - configure depois)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### Frontend

1. **Copie o arquivo de exemplo:**
```bash
cd frontend
cp .env.example .env
```

2. **Edite o arquivo `.env`:**

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_PORTAL_CLIENTE_URL=http://localhost:3001/portal-cliente
REACT_APP_PORTAL_PROPRIETARIO_URL=http://localhost:3001/portal-proprietario
```

---

## 🚀 Executando a Aplicação

### Opção 1: Execução Simples

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Opção 2: Usando Docker (Recomendado)

```bash
# Na pasta raiz CRMOB360
docker-compose up
```

Isso irá iniciar:
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- Backend (porta 3000)
- Frontend (porta 3001)
- Nginx (porta 80)

---

## 🌐 Acessando o Sistema

Após iniciar a aplicação, você pode acessar:

### Sistema Principal (Imobiliária)
```
http://localhost:3001
```

**Credenciais padrão:**
- Email: `admin@9mob.com.br`
- Senha: `admin123` (altere após primeiro login!)

### Portal do Cliente
```
http://localhost:3001/portal-cliente
```

### Portal do Proprietário
```
http://localhost:3001/portal-proprietario
```

### API Backend
```
http://localhost:3000/api
```

**Documentação da API:**
```
http://localhost:3000/api-docs
```

---

## ❗ Problemas Comuns

### 1. Erro: "Cannot connect to database"

**Solução:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U postgres -d 9mob`

### 2. Erro: "Port 3000 already in use"

**Solução:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <número_do_pid> /F
```

### 3. Erro: "Module not found"

**Solução:**
```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### 4. Erro: "Prisma Client not generated"

**Solução:**
```bash
cd backend
npx prisma generate
```

### 5. Frontend não carrega dados

**Solução:**
- Verifique se o backend está rodando
- Confirme a URL da API no `.env` do frontend
- Verifique o console do navegador (F12)

### 6. Erro de CORS

**Solução:**
- O backend já está configurado para aceitar requisições do frontend
- Se estiver usando portas diferentes, atualize o CORS em `backend/src/index.ts`

---

## 📚 Próximos Passos

Após executar o sistema com sucesso, recomendamos:

### 1. Leia a Documentação Completa

- **[README.md](../README.md)** - Visão geral do projeto
- **[FUNCIONALIDADES.md](FUNCIONALIDADES.md)** - Todas as funcionalidades
- **[PORTAIS.md](PORTAIS.md)** - Guia dos portais de cliente e proprietário
- **[arquitetura.md](arquitetura.md)** - Arquitetura técnica
- **[database.md](database.md)** - Estrutura do banco de dados
- **[api.md](api.md)** - Documentação da API

### 2. Configure Integrações (Opcional)

#### WhatsApp Business API
Edite o `.env`:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_API_TOKEN=seu-token-aqui
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
```

#### Gateway de Pagamento (Asaas)
```env
PAYMENT_GATEWAY=asaas
PAYMENT_GATEWAY_API_KEY=sua-api-key-asaas
PAYMENT_GATEWAY_ENV=sandbox
```

#### Portais Imobiliários
```env
# Viva Real
VIVAREAL_API_KEY=sua-api-key

# Zap Imóveis
ZAPIMOVEIS_API_KEY=sua-api-key

# OLX
OLX_API_KEY=sua-api-key
```

### 3. Crie seu Primeiro Usuário

Acesse o sistema e vá em:
```
Configurações > Usuários > Novo Usuário
```

### 4. Importe Dados (se aplicável)

Se você tem dados de outro sistema, use os endpoints de importação:
```
POST /api/clientes/importar
POST /api/imoveis/importar
```

### 5. Configure Automações

Vá em:
```
Configurações > Automações > Nova Regra
```

Exemplos de automações úteis:
- Enviar WhatsApp quando novo lead entra
- Criar tarefa quando visita é agendada
- Notificar quando proposta é recebida

---

## 🆘 Precisa de Ajuda?

### Documentação
- Leia os arquivos na pasta `FAQs para iniciantes executarem/`
- Consulte a documentação da API em `/api-docs`

### Suporte
- Email: suporte@9mob.com.br
- Website: https://9mob.com.br

### Reportar Bugs
- Abra uma issue no GitHub
- Inclua logs de erro e passos para reproduzir

---

## ✅ Checklist de Verificação

Antes de reportar problemas, verifique:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] PostgreSQL rodando (`psql --version`)
- [ ] Banco de dados criado (`9mob`)
- [ ] Migrations executadas
- [ ] Arquivos `.env` configurados
- [ ] Dependências instaladas (`npm install`)
- [ ] Prisma Client gerado (`npx prisma generate`)
- [ ] Backend rodando (porta 3000)
- [ ] Frontend rodando (porta 3001)
- [ ] Sem erros no console

---

## 🎉 Pronto!

Você configurou com sucesso a plataforma 9MOB!

Explore as funcionalidades, cadastre imóveis, clientes e comece a usar o sistema.

**Boa sorte!** 🚀
