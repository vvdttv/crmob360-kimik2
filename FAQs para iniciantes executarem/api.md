# Contratos de API - Plataforma Imobiliária 360

## Visão Geral

A API utiliza RESTful design com OpenAPI 3.0 specification. Todos os endpoints seguem padrões RESTful com autenticação via JWT tokens.

**Base URL:** `https://api.imobiliaria360.com/v1`

**Autenticação:** Bearer Token no header `Authorization: Bearer {token}`

**Content-Type:** `application/json`

---

## 1. CRM Service (Módulo 1)

### Clientes e Leads

```yaml
paths:
  /clientes:
    get:
      summary: Listar clientes
      parameters:
        - name: status
          in: query
          schema: {type: string}
        - name: responsavel_id
          in: query
          schema: {type: string}
        - name: search
          in: query
          schema: {type: string}
      responses:
        200:
          description: Lista de clientes
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: {type: array, items: {$ref: '#/components/schemas/Cliente'}}
                  total: {type: integer}
                  page: {type: integer}
    
    post:
      summary: Criar novo cliente/lead
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/ClienteCreate'}
      responses:
        201:
          description: Cliente criado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Cliente'}

  /clientes/{id}:
    get:
      summary: Buscar cliente por ID
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Cliente encontrado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Cliente'}
    
    put:
      summary: Atualizar cliente
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/ClienteUpdate'}
      responses:
        200:
          description: Cliente atualizado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Cliente'}

  /clientes/{id}/atividades:
    get:
      summary: Listar atividades do cliente
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Lista de atividades
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/Atividade'}
    
    post:
      summary: Registrar nova atividade
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/AtividadeCreate'}
      responses:
        201:
          description: Atividade registrada
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Atividade'}

  /pipeline:
    get:
      summary: Listar leads no pipeline
      parameters:
        - name: funil_id
          in: query
          schema: {type: string}
        - name: etapa
          in: query
          schema: {type: string}
      responses:
        200:
          description: Pipeline de vendas
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/PipelineLead'}
    
    put:
      summary: Mover lead entre etapas
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                lead_id: {type: string}
                nova_etapa: {type: string}
                motivo: {type: string}
      responses:
        200:
          description: Lead movido com sucesso

  /funis:
    get:
      summary: Listar funis de venda
      responses:
        200:
          description: Lista de funis
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/FunilVenda'}
    
    post:
      summary: Criar novo funil
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/FunilVendaCreate'}
      responses:
        201:
          description: Funil criado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/FunilVenda'}

components:
  schemas:
    Cliente:
      type: object
      properties:
        id: {type: string}
        nome: {type: string}
        email: {type: string}
        telefone: {type: string}
        cpf_cnpj: {type: string}
        tipo_pessoa: {type: string}
        origem: {type: string}
        status_lead: {type: string}
        score_ia: {type: integer}
        perfil_busca: {type: object}
        responsavel_id: {type: string}
        responsavel: {$ref: '#/components/schemas/UsuarioResumo'}
        created_at: {type: string, format: date-time}
        ultimo_contato: {type: string, format: date-time}
        tags: {type: array, items: {type: string}}
        custom_fields: {type: object}
    
    ClienteCreate:
      type: object
      required: [nome, email]
      properties:
        nome: {type: string}
        email: {type: string}
        telefone: {type: string}
        cpf_cnpj: {type: string}
        origem: {type: string}
        perfil_busca: {type: object}
        responsavel_id: {type: string}
        tags: {type: array, items: {type: string}}
        custom_fields: {type: object}
    
    Atividade:
      type: object
      properties:
        id: {type: string}
        tipo: {type: string}
        descricao: {type: string}
        data_hora: {type: string, format: date-time}
        realizado_por: {$ref: '#/components/schemas/UsuarioResumo'}
        duracao_minutos: {type: integer}
        resultado: {type: string}
        proxima_acao: {type: string, format: date}
        anexos: {type: array, items: {type: object}}
    
    PipelineLead:
      type: object
      properties:
        id: {type: string}
        cliente: {$ref: '#/components/schemas/Cliente'}
        funil: {$ref: '#/components/schemas/FunilVenda'}
        etapa_atual: {type: string}
        valor_estimado: {type: number}
        data_entrada_etapa: {type: string, format: date-time}
        previsao_fechamento: {type: string, format: date}
        responsavel: {$ref: '#/components/schemas/UsuarioResumo'}
```

---

## 2. Property Service (Módulo 5)

```yaml
paths:
  /imoveis:
    get:
      summary: Listar imóveis
      parameters:
        - name: status
          in: query
          schema: {type: string}
        - name: tipo
          in: query
          schema: {type: string}
        - name: finalidade
          in: query
          schema: {type: string}
        - name: bairro
          in: query
          schema: {type: string}
        - name: valor_min
          in: query
          schema: {type: number}
        - name: valor_max
          in: query
          schema: {type: number}
        - name: quartos
          in: query
          schema: {type: integer}
      responses:
        200:
          description: Lista de imóveis
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: {type: array, items: {$ref: '#/components/schemas/Imovel'}}
                  total: {type: integer}
    
    post:
      summary: Criar novo imóvel
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/ImovelCreate'}
      responses:
        201:
          description: Imóvel criado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Imovel'}

  /imoveis/{id}:
    get:
      summary: Buscar imóvel por ID
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Imóvel encontrado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Imovel'}
    
    put:
      summary: Atualizar imóvel
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/ImovelUpdate'}
      responses:
        200:
          description: Imóvel atualizado
          content:
            application/json:
              schema: {$ref: '#/components/schemas/Imovel'}

  /imoveis/{id}/publicar:
    post:
      summary: Publicar imóvel em portais
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                portais: {type: array, items: {type: string}}
                data_exclusividade: {type: string, format: date}
      responses:
        200:
          description: Imóvel publicado com sucesso

  /imoveis/{id}/visitas:
    get:
      summary: Listar visitas do imóvel
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Lista de visitas
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/VisitaImovel'}
    
    post:
      summary: Agendar visita
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cliente_id: {type: string}
                data_hora: {type: string, format: date-time}
                corretor_id: {type: string}
                duracao_minutos: {type: integer}
                observacoes: {type: string}
      responses:
        201:
          description: Visita agendada

components:
  schemas:
    Imovel:
      type: object
      properties:
        id: {type: string}
        codigo: {type: string}
        titulo: {type: string}
        descricao: {type: string}
        tipo_imovel: {type: string}
        finalidade: {type: string}
        status: {type: string}
        endereco: {type: object}
        caracteristicas: {type: object}
        valores: {type: object}
        proprietario: {$ref: '#/components/schemas/ClienteResumo'}
        responsavel: {$ref: '#/components/schemas/UsuarioResumo'}
        fotos: {type: array, items: {type: object}}
        publicado_site: {type: boolean}
        publicado_portais: {type: object}
        visitas_count: {type: integer}
        created_at: {type: string, format: date-time}
        tags: {type: array, items: {type: string}}
        custom_fields: {type: object}
```

---

## 3. Finance Service (Módulo 9)

```yaml
paths:
  /financeiro/contas:
    get:
      summary: Listar contas a pagar/receber
      parameters:
        - name: tipo
          in: query
          schema: {type: string}
        - name: status
          in: query
          schema: {type: string}
        - name: data_inicio
          in: query
          schema: {type: string, format: date}
        - name: data_fim
          in: query
          schema: {type: string, format: date}
      responses:
        200:
          description: Lista de contas
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: {type: array, items: {$ref: '#/components/schemas/ContaFinanceira'}}
                  total: {type: integer}
    
    post:
      summary: Criar conta a pagar/receber
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/ContaFinanceiraCreate'}
      responses:
        201:
          description: Conta criada

  /financeiro/dre:
    get:
      summary: Gerar DRE (Demonstração de Resultado)
      parameters:
        - name: mes
          in: query
          required: true
          schema: {type: integer}
        - name: ano
          in: query
          required: true
          schema: {type: integer}
      responses:
        200:
          description: DRE do período
          content:
            application/json:
              schema: {$ref: '#/components/schemas/DRE'}

  /financeiro/comissoes:
    get:
      summary: Listar comissões
      parameters:
        - name: corretor_id
          in: query
          schema: {type: string}
        - name: status
          in: query
          schema: {type: string}
        - name: mes_referencia
          in: query
          schema: {type: string}
      responses:
        200:
          description: Lista de comissões
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/Comissao'}
    
    post:
      summary: Calcular comissão
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                venda_id: {type: string}
                regra_id: {type: string}
      responses:
        201:
          description: Comissão calculada

components:
  schemas:
    ContaFinanceira:
      type: object
      properties:
        id: {type: string}
        numero_documento: {type: string}
        tipo: {type: string}
        descricao: {type: string}
        valor_original: {type: number}
        valor_pago: {type: number}
        data_emissao: {type: string, format: date}
        data_vencimento: {type: string, format: date}
        data_pagamento: {type: string, format: date}
        status: {type: string}
        plano_conta: {type: object}
        centro_custo: {type: object}
        cliente: {$ref: '#/components/schemas/ClienteResumo'}
        boleto_url: {type: string}
        gateway_pagamento: {type: string}
    
    Comissao:
      type: object
      properties:
        id: {type: string}
        numero_comissao: {type: string}
        tipo: {type: string}
        corretor_vendedor: {$ref: '#/components/schemas/UsuarioResumo'}
        corretor_captador: {$ref: '#/components/schemas/UsuarioResumo'}
        gerente: {$ref: '#/components/schemas/UsuarioResumo'}
        valor_total: {type: number}
        valor_vendedor: {type: number}
        valor_captador: {type: number}
        valor_gerente: {type: number}
        valor_imobiliaria: {type: number}
        status: {type: string}
        data_pagamento: {type: string, format: date}
    
    DRE:
      type: object
      properties:
        periodo: {type: string}
        receitas: {type: object}
        despesas: {type: object}
        resultado_bruto: {type: number}
        resultado_operacional: {type: number}
        resultado_liquido: {type: number}
        comparativo_mes_anterior: {type: object}
```

---

## 4. AI Service (Módulo 4)

```yaml
paths:
  /ia/score-lead:
    post:
      summary: Calcular score de qualificação do lead
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cliente_id: {type: string}
      responses:
        200:
          description: Score calculado
          content:
            application/json:
              schema:
                type: object
                properties:
                  score: {type: integer}
                  classificacao: {type: string}
                  fatores: {type: object}

  /ia/match-imoveis:
    post:
      summary: Buscar imóveis compatíveis com perfil do cliente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cliente_id: {type: string}
                limite: {type: integer, default: 10}
      responses:
        200:
          description: Imóveis compatíveis
          content:
            application/json:
              schema:
                type: object
                properties:
                  matches: {type: array, items: {$ref: '#/components/schemas/ImovelMatch'}}

  /ia/gerar-descricao:
    post:
      summary: Gerar descrição de anúncio com IA
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                imovel_id: {type: string}
                tom_voz: {type: string}
                palavras_chave: {type: array, items: {type: string}}
      responses:
        200:
          description: Descrição gerada
          content:
            application/json:
              schema:
                type: object
                properties:
                  titulo: {type: string}
                  descricao: {type: string}
                  otimizada_para_seo: {type: boolean}

components:
  schemas:
    ImovelMatch:
      type: object
      properties:
        imovel: {$ref: '#/components/schemas/Imovel'}
        score_compatibilidade: {type: number}
        motivos: {type: array, items: {type: string}}
```

---

## 5. Compliance Service (Módulo 13 - LGPD)

```yaml
paths:
  /lgpd/consentimento:
    post:
      summary: Registrar consentimento LGPD
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cliente_id: {type: string}
                template_termo_id: {type: string}
                permissoes: {type: object}
                ip_origem: {type: string}
                canal_origem: {type: string}
      responses:
        201:
          description: Consentimento registrado

  /lgpd/consentimento/{cliente_id}:
    get:
      summary: Verificar consentimentos do cliente
      parameters:
        - name: cliente_id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Status dos consentimentos
          content:
            application/json:
              schema:
                type: object
                properties:
                  cliente_id: {type: string}
                  consentimentos: {type: array, items: {type: object}}
                  pode_email_mkt: {type: boolean}
                  pode_whatsapp_mkt: {type: boolean}
                  pode_ia_perfil: {type: boolean}

  /lgpd/solicitacao:
    post:
      summary: Criar solicitação de direito do titular
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                cliente_id: {type: string}
                tipo_solicitacao: {type: string}
                motivo: {type: string}
      responses:
        201:
          description: Solicitação criada

  /lgpd/exportar-dados/{cliente_id}:
    get:
      summary: Exportar dados do cliente (portabilidade)
      parameters:
        - name: cliente_id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Dados exportados
          content:
            application/json:
              schema:
                type: object
                properties:
                  dados_pessoais: {type: object}
                  historico_atividades: {type: array}
                  contratos: {type: array}
                  financeiro: {type: array}
```

---

## 6. Process Service (Módulo 6)

```yaml
paths:
  /processos/templates:
    get:
      summary: Listar templates de processo
      responses:
        200:
          description: Lista de templates
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/TemplateProcesso'}
    
    post:
      summary: Criar template de processo
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/TemplateProcessoCreate'}
      responses:
        201:
          description: Template criado

  /processos:
    get:
      summary: Listar processos ativos
      parameters:
        - name: status
          in: query
          schema: {type: string}
        - name: responsavel_id
          in: query
          schema: {type: string}
      responses:
        200:
          description: Lista de processos
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/Processo'}
    
    post:
      summary: Iniciar novo processo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                template_id: {type: string}
                entidade_tipo: {type: string}
                entidade_id: {type: string}
                responsavel_id: {type: string}
      responses:
        201:
          description: Processo iniciado

  /processos/{id}/tarefas:
    get:
      summary: Listar tarefas do processo
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: string}
      responses:
        200:
          description: Lista de tarefas
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/TarefaProcesso'}

  /tarefas/minhas:
    get:
      summary: Listar minhas tarefas pendentes
      responses:
        200:
          description: Minhas tarefas
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/TarefaProcesso'}

components:
  schemas:
    TemplateProcesso:
      type: object
      properties:
        id: {type: string}
        nome: {type: string}
        descricao: {type: string}
        tipo: {type: string}
        etapas: {type: array, items: {type: object}}
        gatilhos: {type: array, items: {type: string}}
        ativo: {type: boolean}
    
    Processo:
      type: object
      properties:
        id: {type: string}
        template: {$ref: '#/components/schemas/TemplateProcesso'}
        entidade_tipo: {type: string}
        entidade_id: {type: string}
        status: {type: string}
        etapa_atual: {type: string}
        responsavel: {$ref: '#/components/schemas/UsuarioResumo'}
        data_inicio: {type: string, format: date-time}
        data_conclusao: {type: string, format: date-time}
    
    TarefaProcesso:
      type: object
      properties:
        id: {type: string}
        titulo: {type: string}
        descricao: {type: string}
        processo: {$ref: '#/components/schemas/Processo'}
        atribuido_para: {$ref: '#/components/schemas/UsuarioResumo'}
        prazo: {type: string, format: date}
        prioridade: {type: string}
        status: {type: string}
        concluida_em: {type: string, format: date-time}
```

---

## 7. Admin Service (Configurações)

```yaml
paths:
  /configuracoes:
    get:
      summary: Listar configurações do sistema
      responses:
        200:
          description: Configurações
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/Configuracao'}
    
    post:
      summary: Criar/atualizar configuração
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                chave: {type: string}
                valor: {type: object}
                descricao: {type: string}
                categoria: {type: string}
      responses:
        200:
          description: Configuração salva

  /perfis-acesso:
    get:
      summary: Listar perfis de acesso
      responses:
        200:
          description: Perfis de acesso
          content:
            application/json:
              schema:
                type: array
                items: {$ref: '#/components/schemas/PerfilAcesso'}
    
    post:
      summary: Criar perfil de acesso
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                nome: {type: string}
                descricao: {type: string}
                permissoes: {type: object}
      responses:
        201:
          description: Perfil criado

components:
  schemas:
    Configuracao:
      type: object
      properties:
        chave: {type: string}
        valor: {type: object}
        descricao: {type: string}
        categoria: {type: string}
        created_at: {type: string, format: date-time}
        updated_at: {type: string, format: date-time}
    
    PerfilAcesso:
      type: object
      properties:
        id: {type: string}
        nome: {type: string}
        descricao: {type: string}
        permissoes: {type: object}
        created_at: {type: string, format: date-time}
```

---

## 8. BI Service (Módulo 11)

```yaml
paths:
  /bi/dashboard:
    get:
      summary: Obter dados do dashboard principal
      parameters:
        - name: periodo
          in: query
          schema: {type: string, enum: [7d, 30d, 90d, 1y]}
      responses:
        200:
          description: Dados do dashboard
          content:
            application/json:
              schema:
                type: object
                properties:
                  kpis: {type: object}
                  graficos: {type: object}
                  metas: {type: object}

  /bi/relatorios/corretores:
    get:
      summary: Relatório de performance de corretores
      parameters:
        - name: mes
          in: query
          schema: {type: integer}
        - name: ano
          in: query
          schema: {type: integer}
      responses:
        200:
          description: Relatório de corretores
          content:
            application/json:
              schema:
                type: array
                items: {type: object}

  /bi/relatorios/fontes:
    get:
      summary: Relatório de eficácia de fontes de lead
      parameters:
        - name: periodo
          in: query
          schema: {type: string}
      responses:
        200:
          description: Eficácia por fonte
          content:
            application/json:
              schema:
                type: array
                items: {type: object}

  /bi/relatorios/estoque:
    get:
      summary: Relatório de saúde do estoque
      responses:
        200:
          description: Análise do estoque
          content:
            application/json:
              schema:
                type: object
                properties:
                  tempo_medio_estoque: {type: number}
                  taxa_conversao: {type: number}
                  distribuicao_preco: {type: object}
                  imoveis_parados: {type: array}
```

---

## Webhooks e Eventos

```yaml
paths:
  /webhooks/whatsapp:
    post:
      summary: Webhook para mensagens WhatsApp
      requestBody:
        required: true
        content:
          application/json:
            schema: {type: object}
      responses:
        200:
          description: Evento processado

  /webhooks/pagamento:
    post:
      summary: Webhook para confirmação de pagamento
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                transacao_id: {type: string}
                status: {type: string}
                valor: {type: number}
      responses:
        200:
          description: Pagamento processado
```

---

## Componentes Comuns

```yaml
components:
  schemas:
    UsuarioResumo:
      type: object
      properties:
        id: {type: string}
        nome: {type: string}
        email: {type: string}
        avatar_url: {type: string}
    
    ClienteResumo:
      type: object
      properties:
        id: {type: string}
        nome: {type: string}
        email: {type: string}
        telefone: {type: string}
    
    Error:
      type: object
      properties:
        error: {type: string}
        message: {type: string}
        details: {type: array, items: {type: object}}
        timestamp: {type: string, format: date-time}
        request_id: {type: string}
  
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

---

## Status Codes

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado
- `403` - Acesso proibido
- `404` - Recurso não encontrado
- `422` - Validação falhou
- `429` - Muitas requisições
- `500` - Erro interno do servidor

Esta documentação de API cobre todos os módulos da plataforma e segue as melhores práticas de design RESTful.