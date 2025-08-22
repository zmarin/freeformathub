#!/bin/bash

# FreeFormatHub Production Deployment Script
# Complete setup with Nginx, SSL, and monitoring

set -e

DOMAIN="${1:-}"
EMAIL="${2:-}"
ENABLE_MONITORING="${3:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

header() {
    echo -e "${PURPLE}$1${NC}"
}

show_usage() {
    header "FreeFormatHub Production Deployment"
    echo ""
    echo "Usage: $0 <domain> [email] [enable_monitoring]"
    echo ""
    echo "Arguments:"
    echo "  domain           - Your domain (e.g., freeformathub.com)"
    echo "  email            - Email for SSL certificate (optional)"
    echo "  enable_monitoring- Enable monitoring stack (true/false, default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 freeformathub.com"
    echo "  $0 freeformathub.com admin@freeformathub.com"
    echo "  $0 freeformathub.com admin@freeformathub.com true"
    echo ""
    echo "This script will:"
    echo "  ✅ Setup system (Nginx, Node.js, Certbot)"
    echo "  ✅ Deploy FreeFormatHub application"
    echo "  ✅ Configure SSL with Let's Encrypt"
    echo "  ✅ Setup automatic SSL renewal"
    echo "  ✅ Configure security headers and firewall"
    echo "  ✅ Optional: Setup monitoring (Prometheus + Grafana)"
    echo ""
}

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    if [[ -z "$DOMAIN" ]]; then
        show_usage
        exit 1
    fi
    
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    if [[ -z "$EMAIL" ]]; then
        EMAIL="admin@$DOMAIN"
        warning "Using default email: $EMAIL"
    fi
    
    # Check if domain points to this server
    local server_ip=$(curl -s -4 icanhazip.com 2>/dev/null || echo "unknown")
    local domain_ip=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || echo "unknown")
    
    log "Server IP: $server_ip"
    log "Domain IP: $domain_ip"
    
    if [[ "$server_ip" != "unknown" && "$domain_ip" != "$server_ip" ]]; then
        warning "Domain $DOMAIN may not point to this server"
        warning "Please ensure your DNS is configured correctly"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment aborted"
        fi
    fi
    
    success "Pre-flight checks completed"
}

# Setup system and dependencies
setup_system() {
    header "🔧 SETTING UP SYSTEM"
    log "Setting up system dependencies..."
    
    # Run the system setup script
    if [[ -f "scripts/setup-nginx.sh" ]]; then
        log "Running system setup..."
        ./scripts/setup-nginx.sh
    else
        error "System setup script not found. Please run from project root."
    fi
    
    success "System setup completed"
}

# Deploy application with SSL
deploy_with_ssl() {
    header "🚀 DEPLOYING WITH SSL"
    log "Deploying FreeFormatHub with SSL configuration..."
    
    # Run the SSL deployment script
    if [[ -f "scripts/ssl-deploy.sh" ]]; then
        log "Running SSL deployment..."
        ./scripts/ssl-deploy.sh "$DOMAIN" "$EMAIL"
    else
        error "SSL deployment script not found"
    fi
    
    success "SSL deployment completed"
}

# Setup monitoring stack (optional)
setup_monitoring() {
    if [[ "$ENABLE_MONITORING" != "true" ]]; then
        log "Monitoring disabled, skipping..."
        return 0
    fi
    
    header "📊 SETTING UP MONITORING"
    log "Setting up Prometheus and Grafana..."
    
    # Install Docker and Docker Compose if not available
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        rm get-docker.sh
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Create monitoring configuration
    mkdir -p /opt/freeformathub-monitoring/{prometheus,grafana}
    
    # Prometheus config
    cat > /opt/freeformathub-monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['host.docker.internal:80']
    metrics_path: /nginx_status
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
    
    # Grafana datasource
    mkdir -p /opt/freeformathub-monitoring/grafana/provisioning/{datasources,dashboards}
    cat > /opt/freeformathub-monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
EOF
    
    # Docker Compose for monitoring
    cat > /opt/freeformathub-monitoring/docker-compose.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: freeformathub-prometheus
    restart: unless-stopped
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: freeformathub-grafana
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=freeformathub2024
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=$DOMAIN
      - GF_SERVER_ROOT_URL=https://$DOMAIN/grafana/
      - GF_SERVER_SERVE_FROM_SUB_PATH=true
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning

  node-exporter:
    image: prom/node-exporter:latest
    container_name: freeformathub-node-exporter
    restart: unless-stopped
    ports:
      - "127.0.0.1:9100:9100"
    command:
      - '--path.rootfs=/host'
    volumes:
      - /:/host:ro,rslave

volumes:
  prometheus-data:
  grafana-data:
EOF
    
    # Start monitoring stack
    cd /opt/freeformathub-monitoring
    docker-compose up -d
    
    # Add Grafana proxy to Nginx
    create_monitoring_nginx_config
    
    success "Monitoring stack deployed"
}

# Create Nginx config for monitoring
create_monitoring_nginx_config() {
    log "Adding monitoring endpoints to Nginx..."
    
    # Add monitoring location blocks to existing config
    local nginx_config="/etc/nginx/sites-available/freeformathub"
    
    # Create backup
    cp "$nginx_config" "${nginx_config}.backup"
    
    # Add monitoring locations before the main location block
    sed -i '/location \/ {/i\
    # Monitoring endpoints\
    location /grafana/ {\
        proxy_pass http://127.0.0.1:3000/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
    \
    location /prometheus/ {\
        proxy_pass http://127.0.0.1:9090/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        # Basic auth for security\
        auth_basic "Monitoring";\
        auth_basic_user_file /etc/nginx/.htpasswd;\
    }\
' "$nginx_config"
    
    # Create basic auth for Prometheus
    htpasswd -bc /etc/nginx/.htpasswd admin "freeformathub2024"
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    
    success "Monitoring endpoints configured"
}

# Setup additional security
setup_additional_security() {
    header "🛡️ CONFIGURING ADDITIONAL SECURITY"
    log "Setting up additional security measures..."
    
    # Install fail2ban
    if [[ -f /etc/debian_version ]]; then
        apt update && apt install -y fail2ban
    elif [[ -f /etc/redhat-release ]]; then
        yum install -y fail2ban
    fi
    
    # Configure fail2ban for Nginx
    cat > /etc/fail2ban/jail.d/nginx.conf << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/freeformathub_error.log
maxretry = 5
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/freeformathub_access.log
maxretry = 6
bantime = 86400

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
port = http,https
logpath = /var/log/nginx/freeformathub_error.log
maxretry = 10
bantime = 600
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    # Setup log rotation
    cat > /etc/logrotate.d/freeformathub << EOF
/var/log/nginx/freeformathub_*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \`cat /var/run/nginx.pid\`
        fi
    endscript
}
EOF
    
    success "Additional security configured"
}

# Create maintenance scripts
create_maintenance_scripts() {
    header "🔧 CREATING MAINTENANCE SCRIPTS"
    log "Creating maintenance and monitoring scripts..."
    
    mkdir -p /opt/freeformathub/scripts
    
    # Update script
    cat > /opt/freeformathub/scripts/update.sh << 'EOF'
#!/bin/bash
set -e

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting FreeFormatHub update..."

cd /home/projects/freeformathub

# Pull latest changes (if git repo)
if [[ -d .git ]]; then
    git pull origin main
fi

# Update and rebuild
npm ci --only=production
npm run test:run
npm run build

# Deploy new version
sudo ./scripts/deploy.sh deploy

log "Update completed successfully"
EOF
    
    # Backup script
    cat > /opt/freeformathub/scripts/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/freeformathub-full"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /var/www/freeformathub .

# Backup nginx config
cp /etc/nginx/sites-available/freeformathub "$BACKUP_DIR/nginx_$DATE.conf"

# Backup SSL certificates
if [[ -d /etc/letsencrypt/live ]]; then
    tar -czf "$BACKUP_DIR/ssl_$DATE.tar.gz" -C /etc/letsencrypt .
fi

# Cleanup old backups (keep 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.conf" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF
    
    # Health check script
    cat > /opt/freeformathub/scripts/health-check.sh << EOF
#!/bin/bash

DOMAIN="$DOMAIN"
ERRORS=0

# Check HTTPS
if ! curl -sf "https://\$DOMAIN/health" > /dev/null; then
    echo "ERROR: HTTPS health check failed"
    ((ERRORS++))
fi

# Check SSL certificate
if ! openssl s_client -servername "\$DOMAIN" -connect "\$DOMAIN:443" -verify_return_error < /dev/null > /dev/null 2>&1; then
    echo "ERROR: SSL certificate invalid"
    ((ERRORS++))
fi

# Check Nginx
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: Nginx is not running"
    ((ERRORS++))
fi

if [[ \$ERRORS -eq 0 ]]; then
    echo "All checks passed"
    exit 0
else
    echo "Found \$ERRORS errors"
    exit 1
fi
EOF
    
    # Make scripts executable
    chmod +x /opt/freeformathub/scripts/*.sh
    
    # Setup cron jobs
    cat > /etc/cron.d/freeformathub << EOF
# FreeFormatHub maintenance tasks
0 2 * * * root /opt/freeformathub/scripts/backup.sh
*/10 * * * * root /opt/freeformathub/scripts/health-check.sh
EOF
    
    success "Maintenance scripts created"
}

# Final verification and information
final_verification() {
    header "🔍 FINAL VERIFICATION"
    log "Running final verification checks..."
    
    # Wait for services
    sleep 10
    
    local checks_passed=0
    local total_checks=5
    
    # Check 1: HTTPS accessibility
    if curl -sf "https://$DOMAIN/health" > /dev/null; then
        success "✅ HTTPS site accessible"
        ((checks_passed++))
    else
        error "❌ HTTPS site not accessible"
    fi
    
    # Check 2: SSL certificate
    if openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" -verify_return_error < /dev/null > /dev/null 2>&1; then
        success "✅ SSL certificate valid"
        ((checks_passed++))
    else
        error "❌ SSL certificate invalid"
    fi
    
    # Check 3: HTTP redirect
    local redirect_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/")
    if [[ "$redirect_code" == "301" ]]; then
        success "✅ HTTP to HTTPS redirect working"
        ((checks_passed++))
    else
        warning "⚠️  HTTP redirect returned: $redirect_code"
    fi
    
    # Check 4: Tools functionality
    if curl -s "https://$DOMAIN/json-formatter" | grep -q "JSON Formatter"; then
        success "✅ Tools pages accessible"
        ((checks_passed++))
    else
        warning "⚠️  Tools pages may have issues"
    fi
    
    # Check 5: Nginx status
    if systemctl is-active --quiet nginx; then
        success "✅ Nginx running"
        ((checks_passed++))
    else
        error "❌ Nginx not running"
    fi
    
    echo ""
    log "Verification complete: $checks_passed/$total_checks checks passed"
}

# Show deployment summary
show_deployment_summary() {
    header "🎉 DEPLOYMENT COMPLETE!"
    echo ""
    echo "🌐 Your FreeFormatHub site is live at:"
    echo "   Primary: https://$DOMAIN"
    echo "   Alternate: https://www.$DOMAIN"
    echo ""
    echo "🛠️ Available Tools:"
    echo "   • JSON Formatter: https://$DOMAIN/json-formatter"
    echo "   • Base64 Encoder: https://$DOMAIN/base64-encoder"
    echo ""
    echo "🔐 Security Features:"
    echo "   ✅ SSL/TLS with auto-renewal"
    echo "   ✅ HTTPS redirect enabled"
    echo "   ✅ Security headers configured"
    echo "   ✅ Firewall rules applied"
    echo "   ✅ Fail2ban protection"
    echo ""
    
    if [[ "$ENABLE_MONITORING" == "true" ]]; then
        echo "📊 Monitoring Dashboards:"
        echo "   • Grafana: https://$DOMAIN/grafana/ (admin/freeformathub2024)"
        echo "   • Prometheus: https://$DOMAIN/prometheus/ (admin/freeformathub2024)"
        echo ""
    fi
    
    echo "🔧 Management Commands:"
    echo "   sudo /opt/freeformathub/scripts/update.sh      # Update application"
    echo "   sudo /opt/freeformathub/scripts/backup.sh      # Create backup"
    echo "   sudo /opt/freeformathub/scripts/health-check.sh # Health check"
    echo "   sudo certbot certificates                       # View SSL certs"
    echo "   sudo systemctl reload nginx                     # Reload Nginx"
    echo ""
    echo "📁 Important Files:"
    echo "   • Nginx config: /etc/nginx/sites-available/freeformathub"
    echo "   • SSL certs: /etc/letsencrypt/live/$DOMAIN/"
    echo "   • App files: /var/www/freeformathub/"
    echo "   • Logs: /var/log/nginx/freeformathub_*.log"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Test all tools at https://$DOMAIN"
    echo "   2. Setup monitoring alerts if needed"
    echo "   3. Configure backup retention policies"
    echo "   4. Add more tools using the established patterns"
    echo ""
    success "🚀 FreeFormatHub is ready for production! 🚀"
}

# Main function
main() {
    header "🚀 FREEFORMATHUB PRODUCTION DEPLOYMENT"
    echo "   Domain: $DOMAIN"
    echo "   Email: $EMAIL"
    echo "   Monitoring: $ENABLE_MONITORING"
    echo ""
    
    preflight_checks
    setup_system
    deploy_with_ssl
    setup_monitoring
    setup_additional_security
    create_maintenance_scripts
    final_verification
    show_deployment_summary
    
    success "🎉 Production deployment completed successfully! 🎉"
}

# Handle help
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    show_usage
    exit 0
fi

main "$@"