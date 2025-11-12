#!/bin/bash

# Script de implantação da Plataforma de Gestão Imobiliária 360
# Este script automatiza o processo de implantação em diferentes ambientes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    print_info "Verificando dependências..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Por favor, instale o Docker antes de continuar."
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose antes de continuar."
        exit 1
    fi
    
    # Verificar Node.js (para desenvolvimento)
    if [ "$ENVIRONMENT" = "development" ] && ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Por favor, instale o Node.js antes de continuar."
        exit 1
    fi
    
    print_success "Todas as dependências estão instaladas."
}

# Configurar ambiente
setup_environment() {
    print_info "Configurando ambiente..."
    
    # Copiar arquivo de ambiente se não existir
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Arquivo .env criado a partir do exemplo. Por favor, configure as variáveis de ambiente."
        else
            print_error "Arquivo .env.example não encontrado."
            exit 1
        fi
    fi
    
    # Criar diretórios necessários
    mkdir -p logs uploads nginx/ssl
    
    print_success "Ambiente configurado."
}

# Gerar SSL certificates (para desenvolvimento)
generate_ssl_certs() {
    print_info "Gerando certificados SSL para desenvolvimento..."
    
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
            -subj "/C=BR/ST=SP/L=SaoPaulo/O=Imobiliaria360/CN=localhost"
        print_success "Certificados SSL gerados."
    else
        print_info "Certificados SSL já existem."
    fi
}

# Construir e iniciar containers
build_and_start() {
    print_info "Construindo e iniciando containers..."
    
    # Parar containers existentes
    docker-compose down
    
    # Construir imagens
    docker-compose build
    
    # Iniciar serviços
    docker-compose up -d
    
    print_success "Containers iniciados com sucesso."
}

# Executar migrações do banco de dados
run_migrations() {
    print_info "Executando migrações do banco de dados..."
    
    # Aguardar banco de dados estar pronto
    sleep 10
    
    # Executar migrações
    docker-compose exec backend npx prisma migrate deploy
    
    # Gerar cliente Prisma
    docker-compose exec backend npx prisma generate
    
    # Seed inicial (opcional)
    if [ "$SEED_DATABASE" = "true" ]; then
        docker-compose exec backend npm run seed
    fi
    
    print_success "Migrações executadas com sucesso."
}

# Verificar saúde dos serviços
check_health() {
    print_info "Verificando saúde dos serviços..."
    
    # Aguardar serviços iniciarem
    sleep 15
    
    # Verificar backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend está saudável."
    else
        print_error "Backend não está respondendo."
        exit 1
    fi
    
    # Verificar frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend está saudável."
    else
        print_error "Frontend não está respondendo."
        exit 1
    fi
    
    print_success "Todos os serviços estão saudáveis."
}

# Configurar monitoramento
setup_monitoring() {
    print_info "Configurando monitoramento..."
    
    # Criar script de monitoramento
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoramento básico

echo "=== Status dos Serviços ==="
docker-compose ps

echo ""
echo "=== Logs Recentes ==="
docker-compose logs --tail=50

echo ""
echo "=== Uso de Recursos ==="
docker stats --no-stream
EOF
    
    chmod +x monitor.sh
    print_success "Monitoramento configurado."
}

# Menu principal
main_menu() {
    echo "=================================="
    echo "  Imobiliária 360 - Deploy Tool   "
    echo "=================================="
    echo ""
    echo "Selecione uma opção:"
    echo "1. Deploy completo (desenvolvimento)"
    echo "2. Deploy completo (produção)"
    echo "3. Atualizar aplicação"
    echo "4. Backup do banco de dados"
    echo "5. Restaurar banco de dados"
    echo "6. Logs dos serviços"
    echo "7. Parar todos os serviços"
    echo "8. Limpar ambiente"
    echo "9. Sair"
    echo ""
    
    read -p "Opção: " choice
    
    case $choice in
        1)
            ENVIRONMENT="development"
            SEED_DATABASE="true"
            deploy_development
            ;;
        2)
            ENVIRONMENT="production"
            SEED_DATABASE="false"
            deploy_production
            ;;
        3)
            update_application
            ;;
        4)
            backup_database
            ;;
        5)
            restore_database
            ;;
        6)
            show_logs
            ;;
        7)
            stop_services
            ;;
        8)
            cleanup_environment
            ;;
        9)
            exit 0
            ;;
        *)
            print_error "Opção inválida."
            main_menu
            ;;
    esac
}

# Deploy para desenvolvimento
deploy_development() {
    print_info "Iniciando deploy para desenvolvimento..."
    
    check_dependencies
    setup_environment
    generate_ssl_certs
    build_and_start
    run_migrations
    check_health
    setup_monitoring
    
    print_success "Deploy concluído com sucesso!"
    print_info "Acesse a aplicação em: https://localhost"
    print_info "API disponível em: https://localhost/api"
    print_info ""
    print_info "Credenciais de demo:"
    print_info "Admin: admin@imobiliaria360.com / admin123"
    print_info "Corretor: corretor@imobiliaria360.com / corretor123"
}

# Deploy para produção
deploy_production() {
    print_info "Iniciando deploy para produção..."
    
    # Verificações de segurança para produção
    if [ ! -f .env.production ]; then
        print_error "Arquivo .env.production não encontrado."
        exit 1
    fi
    
    # Usar variáveis de ambiente de produção
    cp .env.production .env
    
    # Verificar certificados SSL
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        print_error "Certificados SSL não encontrados para produção."
        exit 1
    fi
    
    check_dependencies
    setup_environment
    build_and_start
    run_migrations
    check_health
    setup_monitoring
    
    print_success "Deploy em produção concluído com sucesso!"
}

# Atualizar aplicação
update_application() {
    print_info "Atualizando aplicação..."
    
    # Parar serviços
    docker-compose down
    
    # Atualizar código
    git pull origin main
    
    # Reconstruir e iniciar
    build_and_start
    run_migrations
    check_health
    
    print_success "Aplicação atualizada com sucesso!"
}

# Backup do banco de dados
backup_database() {
    print_info "Criando backup do banco de dados..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_$timestamp.sql"
    
    docker-compose exec postgres pg_dump -U postgres imobiliaria360 > "backups/$backup_file"
    
    print_success "Backup criado: backups/$backup_file"
}

# Restaurar banco de dados
restore_database() {
    print_info "Restaurando banco de dados..."
    
    if [ -z "$1" ]; then
        print_error "Por favor, especifique o arquivo de backup."
        exit 1
    fi
    
    docker-compose exec -T postgres psql -U postgres imobiliaria360 < "$1"
    
    print_success "Banco de dados restaurado com sucesso!"
}

# Mostrar logs
show_logs() {
    print_info "Mostrando logs dos serviços..."
    
    docker-compose logs -f
}

# Parar serviços
stop_services() {
    print_info "Parando todos os serviços..."
    
    docker-compose down
    
    print_success "Todos os serviços foram parados."
}

# Limpar ambiente
cleanup_environment() {
    print_warning "Esta ação removerá todos os dados! Tem certeza? (s/N)"
    read -r confirm
    
    if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
        print_info "Limpando ambiente..."
        
        # Parar e remover containers
        docker-compose down -v
        
        # Remover imagens
        docker-compose rm -f
        docker rmi $(docker-compose images -q) 2>/dev/null || true
        
        # Limpar volumes
        docker volume prune -f
        
        # Limpar rede
        docker network prune -f
        
        print_success "Ambiente limpo com sucesso!"
    else
        print_info "Limpeza cancelada."
    fi
}

# Verificar se script está sendo executado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # Criar diretório de backups se não existir
    mkdir -p backups
    
    # Iniciar menu principal
    main_menu
fi