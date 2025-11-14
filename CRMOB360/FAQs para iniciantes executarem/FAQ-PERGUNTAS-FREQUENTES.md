# ❓ FAQ - Perguntas Frequentes

## Índice

- [Instalação e Configuração](#instalação-e-configuração)
- [Banco de Dados](#banco-de-dados)
- [Autenticação e Usuários](#autenticação-e-usuários)
- [Funcionalidades](#funcionalidades)
- [Integrações](#integrações)
- [Deploy e Produção](#deploy-e-produção)
- [Troubleshooting](#troubleshooting)

---

## 📦 Instalação e Configuração

### P: Qual versão do Node.js preciso?
**R:** Node.js 18.0 ou superior. Recomendamos a versão LTS mais recente.

Verifique sua versão:
```bash
node --version
```

### P: Preciso instalar Docker?
**R:** Não é obrigatório. Docker facilita o setup, mas você pode rodar tudo localmente com Node.js e PostgreSQL instalados diretamente.

### P: Como sei se a instalação foi bem-sucedida?
**R:** Execute:
```bash
cd backend
npm run dev
```
Se você ver `Server running on port 3000`, está funcionando!

### P: Posso usar Windows?
**R:** Sim! O 9MOB funciona em Windows, Linux e macOS. No Windows, recomendamos usar Git Bash ou WSL2.

---

## 💾 Banco de Dados

### P: Que banco de dados o 9MOB usa?
**R:** PostgreSQL 15 ou superior.

### P: Preciso criar as tabelas manualmente?
**R:** Não! Use o Prisma:
```bash
npx prisma migrate dev
```
Depois execute a migration de funcionalidades avançadas:
```bash
psql -U postgres -d 9mob -f prisma/migrations/add_advanced_features.sql
```

### P: Como faço backup do banco?
**R:**
```bash
pg_dump -U postgres 9mob > backup_9mob_$(date +%Y%m%d).sql
```

### P: Como restauro um backup?
**R:**
```bash
psql -U postgres -d 9mob < backup_9mob_20231113.sql
```

### P: Posso usar outro banco de dados?
**R:** Atualmente, apenas PostgreSQL é suportado devido às features específicas usadas (JSONB, funções específicas, etc).

### P: Erro "database 9mob does not exist"
**R:** Você precisa criar o banco primeiro:
```sql
CREATE DATABASE "9mob";
```

---

## 🔐 Autenticação e Usuários

### P: Qual o usuário padrão do sistema?
**R:**
- Email: `admin@9mob.com.br`
- Senha: `admin123`

**IMPORTANTE:** Altere a senha após o primeiro login!

### P: Como crio novos usuários?
**R:** Acesse:
```
Sistema Principal > Configurações > Usuários > Novo Usuário
```
Ou via API:
```bash
POST /api/usuarios
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "senha": "senha123",
  "tipo_usuario": "corretor"
}
```

### P: Quais tipos de usuário existem?
**R:**
- **admin** - Acesso total ao sistema
- **gerente** - Gestão de equipe e relatórios
- **corretor** - Gestão de leads e imóveis
- **financeiro** - Acesso ao módulo financeiro
- **assistente** - Acesso limitado

### P: Esqueci minha senha, e agora?
**R:** Use o endpoint de reset:
```bash
POST /api/auth/forgot-password
{
  "email": "seu-email@exemplo.com"
}
```

### P: O sistema tem autenticação de 2 fatores?
**R:** Sim, mas ainda não foi implementado na versão atual. Está planejado para futuras releases.

---

## ⚙️ Funcionalidades

### P: Quantos módulos o 9MOB tem?
**R:** 13 módulos principais:
1. CRM
2. Imóveis
3. Financeiro
4. Processos
5. IA/ML
6. LGPD
7. Portal do Cliente
8. Portal do Proprietário
9. Marketing
10. WhatsApp
11. Pagamentos
12. Portais Externos
13. Automação

### P: Como cadastro um imóvel?
**R:**
```
Imóveis > Novo Imóvel
```
Preencha os dados e clique em Salvar.

### P: Como funciona o scoring de leads?
**R:** O sistema usa IA para pontuar leads de 0-100 baseado em:
- Perfil de busca
- Histórico de interações
- Probabilidade de conversão
- Orçamento compatível

### P: Posso personalizar os campos?
**R:** Sim! Use `custom_fields` (JSON) em clientes, imóveis e contratos.

### P: O sistema envia emails automaticamente?
**R:** Sim, configure SMTP no `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

---

## 🔌 Integrações

### P: Quais portais imobiliários são suportados?
**R:**
- Viva Real
- Zap Imóveis
- OLX

### P: Como configuro o WhatsApp Business?
**R:**
1. Obtenha credenciais no Meta for Developers
2. Configure no `.env`:
```env
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_API_TOKEN=seu-token
WHATSAPP_PHONE_NUMBER_ID=seu-id
```

### P: Qual gateway de pagamento é usado?
**R:** Asaas por padrão, mas é extensível para outros (PagSeguro, Mercado Pago).

### P: Como publico imóveis nos portais?
**R:** Via API:
```bash
POST /api/imoveis/:id/publicar
{
  "portais": ["vivareal", "zapimoveis", "olx"]
}
```

### P: As integrações têm custo?
**R:** As APIs dos portais e gateways podem ter custos próprios. Consulte cada plataforma.

---

## 🚀 Deploy e Produção

### P: Como faço deploy em produção?
**R:** Temos guias específicos para:
- AWS (EC2, RDS, S3)
- Google Cloud
- Azure
- DigitalOcean
- Heroku

Consulte `deploy-guide.md` (em breve).

### P: Preciso de HTTPS?
**R:** Sim! Para produção, sempre use HTTPS. Configure com:
- Let's Encrypt (gratuito)
- Cloudflare
- Certificado SSL próprio

### P: Qual o servidor recomendado?
**R:** Mínimo recomendado:
- 2 vCPUs
- 4GB RAM
- 40GB SSD
- Ubuntu 22.04 LTS

### P: Como configuro domínio próprio?
**R:**
1. Aponte DNS para seu servidor
2. Configure Nginx:
```nginx
server {
    server_name seu-dominio.com.br;
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

### P: Preciso de Redis em produção?
**R:** Altamente recomendado para:
- Cache de sessões
- Filas de jobs
- Performance melhorada

---

## 🔧 Troubleshooting

### P: Erro "ECONNREFUSED" ao iniciar backend
**R:** PostgreSQL não está rodando. Inicie:
```bash
# Linux
sudo service postgresql start

# macOS
brew services start postgresql

# Windows
net start postgresql-x64-15
```

### P: Erro "Port already in use"
**R:** Outra aplicação está usando a porta. Mude no `.env`:
```env
PORT=3001
```

### P: Frontend não conecta no backend
**R:** Verifique CORS. Em `backend/src/index.ts`, confirme:
```typescript
app.use(cors({
  origin: 'http://localhost:3001'
}));
```

### P: Erro "Cannot find module"
**R:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### P: Prisma não encontra o banco
**R:** Verifique `DATABASE_URL` no `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/9mob?schema=public"
```

### P: Sistema lento
**R:** Verifique:
1. Índices do banco (migrations criam automaticamente)
2. Redis configurado
3. Queries otimizadas
4. Recursos do servidor

### P: Erro ao fazer upload de imagens
**R:** Configure diretório de uploads:
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### P: Webhook não está funcionando
**R:**
1. URL pública acessível (use ngrok para testes)
2. Verifique logs do backend
3. Confirme token de verificação

### P: Email não envia
**R:**
1. Teste credenciais SMTP
2. Gmail requer "senha de app" (não sua senha normal)
3. Verifique firewall (porta 587)

---

## 📱 Portais de Cliente e Proprietário

### P: Como clientes acessam o portal?
**R:** Envie link de acesso:
```
http://seu-dominio.com.br/portal-cliente
```
Eles fazem login com email e senha.

### P: Como criar acesso para cliente?
**R:** Ao cadastrar cliente, marque "Criar acesso ao portal" e envie email com credenciais.

### P: Clientes podem agendar visitas?
**R:** Sim! No Portal do Cliente:
```
Imóveis > Ver Detalhes > Agendar Visita
```

### P: Proprietários veem quanto receberam?
**R:** Sim! Dashboard do Portal do Proprietário mostra:
- Receita mensal
- Aluguéis recebidos
- Contas pendentes
- Relatórios financeiros

---

## 🤖 Automação

### P: Como criar automação?
**R:** Via interface:
```
Configurações > Automações > Nova Regra
```

Ou via API:
```bash
POST /api/automacao/regras
{
  "nome": "Boas-vindas novo lead",
  "trigger_tipo": "novo_lead",
  "acoes": [
    {
      "tipo": "enviar_whatsapp",
      "config": {
        "mensagem": "Olá {{nome}}, bem-vindo!"
      }
    }
  ]
}
```

### P: Quais triggers estão disponíveis?
**R:**
- `novo_lead` - Novo cliente cadastrado
- `visita_agendada` - Visita marcada
- `proposta_recebida` - Proposta enviada
- `pagamento_recebido` - Pagamento confirmado
- `conta_vencendo` - Conta próxima do vencimento

### P: Quantas ações posso ter em uma regra?
**R:** Ilimitadas! Você pode encadear múltiplas ações em sequência.

---

## 💰 Financeiro

### P: Como gero boletos?
**R:**
```bash
POST /api/pagamentos/boleto
{
  "valor": 1500.00,
  "vencimento": "2024-12-01",
  "cliente_id": "uuid-do-cliente",
  "descricao": "Aluguel Novembro"
}
```

### P: Aceita PIX?
**R:** Sim! Use:
```bash
POST /api/pagamentos/pix
```

### P: Como vejo relatório financeiro (DRE)?
**R:**
```
Financeiro > Relatórios > DRE
```
Ou via API:
```bash
GET /api/financeiro/dre?mes=11&ano=2024
```

### P: Calcula comissões automaticamente?
**R:** Sim! Configure percentual no perfil do corretor e o sistema calcula na finalização da venda/locação.

---

## 📊 Relatórios e Analytics

### P: Quais relatórios estão disponíveis?
**R:**
- Dashboard CRM
- Estoque de imóveis
- Relatório financeiro (DRE)
- Inadimplência
- Performance de corretores
- Funil de vendas
- Métricas de portais

### P: Posso exportar dados?
**R:** Sim! Formatos disponíveis:
- Excel (.xlsx)
- CSV
- PDF
- JSON (via API)

### P: Como vejo métricas em tempo real?
**R:** Dashboard principal atualiza automaticamente. Use WebSockets para dados live.

---

## 🔒 Segurança e LGPD

### P: O sistema é compatível com LGPD?
**R:** Sim! Possui:
- Registro de consentimento
- Anonimização de dados
- Direito ao esquecimento
- Auditoria completa
- Exportação de dados pessoais

### P: Como funciona o sistema de auditoria?
**R:** Todas ações são logadas automaticamente:
- Quem fez
- O que fez
- Quando fez
- De onde (IP)
- Dados antes/depois

Acesse em:
```
Configurações > Auditoria > Logs
```

### P: Senhas são criptografadas?
**R:** Sim, usando bcrypt com salt rounds 12.

---

## 📞 Suporte

### P: Como obter suporte?
**R:**
- **Email:** suporte@9mob.com.br
- **Website:** https://9mob.com.br
- **Documentação:** Pasta `FAQs para iniciantes executarem/`

### P: Existe treinamento disponível?
**R:** Sim, oferecemos:
- Vídeos tutoriais
- Documentação completa
- Treinamento online (consulte valores)
- Consultoria técnica

### P: Posso contratar desenvolvimento customizado?
**R:** Sim! Entre em contato para orçamento personalizado.

---

## 🌟 Dicas e Boas Práticas

### Dica 1: Faça backups regulares
```bash
# Cron job diário
0 2 * * * pg_dump -U postgres 9mob > /backups/9mob_$(date +\%Y\%m\%d).sql
```

### Dica 2: Monitore logs
```bash
# Backend logs
tail -f backend/logs/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Dica 3: Use variáveis de ambiente
Nunca commite credenciais! Use `.env` e adicione ao `.gitignore`.

### Dica 4: Configure automações úteis
- Boas-vindas para novos leads
- Lembrete de visitas agendadas
- Alerta de contas vencendo
- Notificação de novas propostas

### Dica 5: Atualize regularmente
```bash
git pull
npm install
npx prisma migrate dev
```

---

**Não encontrou sua pergunta?**

Entre em contato: suporte@9mob.com.br
