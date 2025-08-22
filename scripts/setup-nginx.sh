#!/bin/bash

# FreeFormatHub Nginx Setup Script
# Sets up Nginx on Ubuntu/Debian systems for FreeFormatHub

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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Detect OS
detect_os() {
    if [[ -f /etc/debian_version ]]; then
        OS="debian"
        success "Detected Debian/Ubuntu system"
    elif [[ -f /etc/redhat-release ]]; then
        OS="rhel"
        success "Detected RHEL/CentOS system"
    else
        warning "Unknown OS detected - proceeding with Debian commands"
        OS="debian"
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    case $OS in
        "debian")
            apt update
            apt upgrade -y
            ;;
        "rhel")
            yum update -y
            ;;
    esac
    
    success "System updated"
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    
    case $OS in
        "debian")
            apt install -y nginx
            ;;
        "rhel")
            yum install -y nginx
            ;;
    esac
    
    # Enable and start Nginx
    systemctl enable nginx
    systemctl start nginx
    
    success "Nginx installed and started"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js..."
    
    case $OS in
        "debian")
            # Install Node.js 20.x
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt install -y nodejs
            ;;
        "rhel")
            # Install Node.js 20.x
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y nodejs
            ;;
    esac
    
    success "Node.js installed: $(node --version)"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian with UFW
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw allow 4600/tcp  # FreeFormatHub
        ufw --force enable
        success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        # RHEL/CentOS with firewalld
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=4600/tcp
        firewall-cmd --reload
        success "Firewalld configured"
    else
        warning "No firewall detected - please configure manually"
    fi
}

# Create directories
create_directories() {
    log "Creating directories..."
    
    mkdir -p /var/www/freeformathub
    mkdir -p /var/log/nginx
    mkdir -p /var/backups/freeformathub
    
    chown -R www-data:www-data /var/www/freeformathub
    
    success "Directories created"
}

# Configure Nginx performance
tune_nginx() {
    log "Tuning Nginx performance..."
    
    # Backup original config
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Create optimized nginx.conf
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 20M;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=main:10m rate=10r/s;
    limit_req_status 429;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

    success "Nginx performance tuned"
}

# Create SSL directories (for future use)
setup_ssl_dirs() {
    log "Setting up SSL directories..."
    
    mkdir -p /etc/nginx/ssl
    chmod 700 /etc/nginx/ssl
    
    success "SSL directories created"
}

# Create systemd service for auto-deployment (optional)
create_deploy_service() {
    log "Creating deployment service..."
    
    cat > /etc/systemd/system/freeformathub-deploy.service << EOF
[Unit]
Description=FreeFormatHub Auto Deploy
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/home/projects/freeformathub
ExecStart=/home/projects/freeformathub/scripts/deploy.sh
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable freeformathub-deploy.service
    
    success "Auto-deploy service created"
}

# Show final information
show_final_info() {
    log "Setup Complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Navigate to your project directory:"
    echo "   cd /home/projects/freeformathub"
    echo ""
    echo "2. Deploy FreeFormatHub:"
    echo "   sudo ./scripts/deploy.sh"
    echo ""
    echo "3. Access your site:"
    echo "   http://your-server-ip:4600"
    echo "   http://localhost:4600 (if local)"
    echo ""
    echo "Useful commands:"
    echo "  sudo ./scripts/deploy.sh build    # Build only"
    echo "  sudo ./scripts/deploy.sh deploy   # Deploy only"
    echo "  sudo ./scripts/deploy.sh restart  # Restart Nginx"
    echo "  sudo ./scripts/deploy.sh status   # Check status"
    echo ""
    echo "Logs:"
    echo "  sudo tail -f /var/log/nginx/freeformathub_access.log"
    echo "  sudo tail -f /var/log/nginx/freeformathub_error.log"
}

# Main setup function
main() {
    log "Starting FreeFormatHub Nginx setup..."
    
    check_root
    detect_os
    update_system
    install_nginx
    install_nodejs
    setup_firewall
    create_directories
    tune_nginx
    setup_ssl_dirs
    create_deploy_service
    
    success "Nginx setup completed successfully!"
    show_final_info
}

main "$@"