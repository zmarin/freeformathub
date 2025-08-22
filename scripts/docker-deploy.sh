#!/bin/bash

# FreeFormatHub Docker Deployment Script
# Build and deploy using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    success "Dependencies check passed"
}

# Build and start containers
deploy() {
    log "Building and starting FreeFormatHub containers..."
    
    cd deployment/docker
    
    # Build and start main application
    docker-compose up -d --build freeformathub
    
    success "FreeFormatHub deployed successfully"
}

# Start with monitoring
deploy_with_monitoring() {
    log "Building and starting FreeFormatHub with monitoring..."
    
    cd deployment/docker
    
    # Build and start with monitoring profile
    docker-compose --profile monitoring up -d --build
    
    success "FreeFormatHub with monitoring deployed successfully"
}

# Start with all services
deploy_full() {
    log "Building and starting FreeFormatHub with all services..."
    
    cd deployment/docker
    
    # Build and start all profiles
    docker-compose --profile monitoring --profile caching up -d --build
    
    success "Full FreeFormatHub stack deployed successfully"
}

# Stop containers
stop() {
    log "Stopping FreeFormatHub containers..."
    
    cd deployment/docker
    docker-compose down
    
    success "Containers stopped"
}

# Restart containers
restart() {
    log "Restarting FreeFormatHub containers..."
    
    cd deployment/docker
    docker-compose restart
    
    success "Containers restarted"
}

# Show logs
logs() {
    cd deployment/docker
    docker-compose logs -f "${2:-freeformathub}"
}

# Show status
status() {
    log "Checking container status..."
    
    cd deployment/docker
    docker-compose ps
    
    echo ""
    log "Service URLs:"
    echo "  FreeFormatHub: http://localhost:4600"
    echo "  Health Check: http://localhost:4600/health"
    
    if docker-compose ps prometheus &> /dev/null; then
        echo "  Prometheus: http://localhost:4601"
    fi
    
    if docker-compose ps grafana &> /dev/null; then
        echo "  Grafana: http://localhost:4602 (admin/admin123)"
    fi
    
    if docker-compose ps redis &> /dev/null; then
        echo "  Redis: localhost:4603"
    fi
}

# Update containers
update() {
    log "Updating FreeFormatHub containers..."
    
    cd deployment/docker
    
    # Pull latest base images
    docker-compose pull
    
    # Rebuild and restart
    docker-compose up -d --build
    
    success "Containers updated"
}

# Clean up
cleanup() {
    log "Cleaning up Docker resources..."
    
    cd deployment/docker
    
    # Stop and remove containers
    docker-compose down -v
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (optional)
    if [[ "${1:-}" == "--volumes" ]]; then
        docker volume prune -f
    fi
    
    success "Cleanup completed"
}

# Show help
show_help() {
    echo "FreeFormatHub Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Deploy FreeFormatHub (basic)"
    echo "  deploy-monitor  Deploy with monitoring (Prometheus + Grafana)"
    echo "  deploy-full     Deploy with all services (monitoring + caching)"
    echo "  stop            Stop all containers"
    echo "  restart         Restart containers"
    echo "  logs [service]  Show logs (default: freeformathub)"
    echo "  status          Show container status and URLs"
    echo "  update          Update containers to latest"
    echo "  cleanup         Clean up containers and images"
    echo "  cleanup --volumes  Clean up everything including volumes"
    echo "  help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                    # Basic deployment"
    echo "  $0 deploy-monitor            # With monitoring"
    echo "  $0 logs freeformathub        # Show app logs"
    echo "  $0 logs grafana              # Show Grafana logs"
}

# Main function
main() {
    case "${1:-}" in
        "deploy")
            check_dependencies
            deploy
            status
            ;;
        "deploy-monitor")
            check_dependencies
            deploy_with_monitoring
            status
            ;;
        "deploy-full")
            check_dependencies
            deploy_full
            status
            ;;
        "stop")
            stop
            ;;
        "restart")
            restart
            status
            ;;
        "logs")
            logs "$@"
            ;;
        "status")
            status
            ;;
        "update")
            check_dependencies
            update
            status
            ;;
        "cleanup")
            cleanup "$2"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log "Starting basic deployment..."
            check_dependencies
            deploy
            status
            ;;
    esac
}

main "$@"