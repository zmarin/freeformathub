#!/bin/bash

# FreeFormatHub Deployment Script
# This script builds the project and deploys it to Nginx

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/home/projects/freeformathub"
NGINX_ROOT="/var/www/freeformathub"
NGINX_CONFIG_SOURCE="$PROJECT_DIR/deployment/nginx/freeformathub.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/freeformathub"
NGINX_ENABLED="/etc/nginx/sites-enabled/freeformathub"
BACKUP_DIR="/var/backups/freeformathub"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Check if required commands exist
check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("nginx" "node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "$dep is not installed"
        fi
    done
    
    success "All dependencies found"
}

# Create backup of current deployment
create_backup() {
    if [[ -d "$NGINX_ROOT" ]]; then
        log "Creating backup of current deployment..."
        
        mkdir -p "$BACKUP_DIR"
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        
        tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C "$NGINX_ROOT" . 2>/dev/null || true
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR" && ls -t *.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm --
        
        success "Backup created: $backup_name.tar.gz"
    fi
}

# Install Node.js dependencies and build
build_project() {
    log "Building FreeFormatHub..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --only=production
    
    # Run tests
    log "Running tests..."
    npm run test:run
    
    # Build project
    log "Building project..."
    npm run build
    
    # Verify build
    if [[ ! -d "$PROJECT_DIR/dist" ]]; then
        error "Build failed - dist directory not found"
    fi
    
    success "Project built successfully"
}

# Deploy to Nginx
deploy_files() {
    log "Deploying files to Nginx..."
    
    # Create nginx directory
    mkdir -p "$NGINX_ROOT"
    
    # Copy built files
    cp -r "$PROJECT_DIR/dist"/* "$NGINX_ROOT/"
    
    # Set proper permissions
    chown -R www-data:www-data "$NGINX_ROOT"
    find "$NGINX_ROOT" -type d -exec chmod 755 {} \;
    find "$NGINX_ROOT" -type f -exec chmod 644 {} \;
    
    success "Files deployed to $NGINX_ROOT"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Copy Nginx configuration
    cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
    
    # Enable site
    if [[ ! -L "$NGINX_ENABLED" ]]; then
        ln -s "$NGINX_CONFIG_DEST" "$NGINX_ENABLED"
    fi
    
    # Test Nginx configuration
    if ! nginx -t; then
        error "Nginx configuration test failed"
    fi
    
    success "Nginx configured successfully"
}

# Restart Nginx
restart_nginx() {
    log "Restarting Nginx..."
    
    systemctl reload nginx
    
    if ! systemctl is-active --quiet nginx; then
        error "Nginx failed to start"
    fi
    
    success "Nginx restarted successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if site is accessible
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4600/ || echo "000")
    
    if [[ "$response" == "200" ]]; then
        success "Deployment verified - site is accessible at http://localhost:4600"
    else
        warning "Site returned HTTP $response - please check manually"
    fi
    
    # Show status
    systemctl status nginx --no-pager -l
}

# Show deployment info
show_info() {
    log "Deployment Information:"
    echo "  Site URL: http://localhost:4600"
    echo "  Document Root: $NGINX_ROOT"
    echo "  Nginx Config: $NGINX_CONFIG_DEST"
    echo "  Logs: /var/log/nginx/freeformathub_*.log"
    echo ""
    echo "Available tools:"
    echo "  - JSON Formatter: http://localhost:4600/json-formatter"
    echo "  - Base64 Encoder: http://localhost:4600/base64-encoder"
}

# Main deployment function
main() {
    log "Starting FreeFormatHub deployment..."
    
    check_permissions
    check_dependencies
    create_backup
    build_project
    deploy_files
    configure_nginx
    restart_nginx
    verify_deployment
    show_info
    
    success "Deployment completed successfully! 🚀"
}

# Handle script arguments
case "${1:-}" in
    "build")
        log "Building project only..."
        cd "$PROJECT_DIR"
        build_project
        ;;
    "deploy")
        log "Deploying without building..."
        check_permissions
        check_dependencies
        create_backup
        deploy_files
        configure_nginx
        restart_nginx
        verify_deployment
        ;;
    "restart")
        log "Restarting Nginx only..."
        check_permissions
        restart_nginx
        ;;
    "status")
        log "Checking deployment status..."
        verify_deployment
        ;;
    *)
        main
        ;;
esac