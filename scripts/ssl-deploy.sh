#!/bin/bash

# FreeFormatHub SSL Deployment Script
# Deploy with Nginx and SSL using Certbot

set -e

# Configuration
DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN}}"
PROJECT_DIR="/home/projects/freeformathub"
NGINX_ROOT="/var/www/freeformathub"
NGINX_CONFIG_SOURCE="$PROJECT_DIR/deployment/nginx/freeformathub-ssl.conf"
NGINX_CONFIG_DEST="/etc/nginx/sites-available/freeformathub"
NGINX_ENABLED="/etc/nginx/sites-enabled/freeformathub"

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

# Show usage
show_usage() {
    echo "Usage: $0 <domain> [email]"
    echo ""
    echo "Examples:"
    echo "  $0 freeformathub.com"
    echo "  $0 freeformathub.com admin@freeformathub.com"
    echo ""
    echo "This script will:"
    echo "  1. Deploy FreeFormatHub to Nginx"
    echo "  2. Configure domain and SSL"
    echo "  3. Obtain SSL certificate via Certbot"
    echo "  4. Setup automatic renewal"
    echo ""
}

# Validate inputs
validate_inputs() {
    if [[ -z "$DOMAIN" ]]; then
        error "Domain is required"
        show_usage
    fi
    
    if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        error "Invalid domain format: $DOMAIN"
    fi
    
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
}

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("nginx" "certbot" "node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            case "$dep" in
                "certbot")
                    log "Installing Certbot..."
                    if [[ -f /etc/debian_version ]]; then
                        apt update
                        apt install -y certbot python3-certbot-nginx
                    elif [[ -f /etc/redhat-release ]]; then
                        yum install -y certbot python3-certbot-nginx
                    fi
                    ;;
                *)
                    error "$dep is not installed. Please run setup-nginx.sh first."
                    ;;
            esac
        fi
    done
    
    success "Dependencies check passed"
}

# Build and deploy application
deploy_application() {
    log "Building and deploying FreeFormatHub..."
    
    cd "$PROJECT_DIR"
    
    # Install dependencies and build
    npm ci --only=production
    npm run test:run
    npm run build
    
    # Create nginx directory and deploy
    mkdir -p "$NGINX_ROOT"
    cp -r "$PROJECT_DIR/dist"/* "$NGINX_ROOT/"
    chown -R www-data:www-data "$NGINX_ROOT"
    find "$NGINX_ROOT" -type d -exec chmod 755 {} \;
    find "$NGINX_ROOT" -type f -exec chmod 644 {} \;
    
    success "Application deployed"
}

# Create SSL-ready Nginx configuration
create_ssl_config() {
    log "Creating SSL-ready Nginx configuration..."
    
    cat > "$NGINX_CONFIG_SOURCE" << EOF
# FreeFormatHub SSL Configuration
# HTTP server (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name $DOMAIN www.$DOMAIN;
    root $NGINX_ROOT;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_ecdh_curve secp384r1;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy (GA + AdSense compatible)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: https://*.googlesyndication.com https://*.google-analytics.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googlesyndication.com https://*.google.com; frame-src https://*.googlesyndication.com;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml
        text/css
        text/javascript
        text/xml
        text/plain
        text/html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # CORS for fonts and assets
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }

    # Cache HTML files
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
        add_header Vary "Accept-Encoding";
    }

    # 301 redirects for old tool URLs to new clean URLs
    location /tools/ {
        rewrite ^/tools/(.*)$ /$1 permanent;
    }
    location = /tools {
        return 301 /formatters;
    }
    location = /tools {
        return 301 /formatters;
    }

    # Legacy categories prefix
    location /categories/ {
        rewrite ^/categories/(.*)$ /$1 permanent;
    }

    # Main location block
    location / {
        try_files \$uri \$uri/ \$uri.html /index.html;
        expires 30m;
        add_header Cache-Control "public";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Robots.txt
    location /robots.txt {
        alias $NGINX_ROOT/robots.txt;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Sitemap
    location /sitemap.xml {
        alias $NGINX_ROOT/sitemap.xml;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;

    # Logging
    access_log /var/log/nginx/freeformathub_access.log;
    error_log /var/log/nginx/freeformathub_error.log;
}
EOF

    success "SSL configuration created"
}

# Setup initial HTTP configuration for Certbot
setup_http_config() {
    log "Setting up initial HTTP configuration..."
    
    cat > "/etc/nginx/sites-available/freeformathub-temp" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $NGINX_ROOT;
    index index.html;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Serve the application
    location / {
        try_files \$uri \$uri/ \$uri.html /index.html;
    }
    
    # 301 redirects for old tool URLs to new clean URLs
    location /tools/ {
        rewrite ^/tools/(.*)$ /$1 permanent;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Remove existing config and enable temp
    rm -f "$NGINX_ENABLED"
    ln -sf "/etc/nginx/sites-available/freeformathub-temp" "$NGINX_ENABLED"
    
    # Create certbot directory
    mkdir -p /var/www/certbot
    chown -R www-data:www-data /var/www/certbot
    
    # Test and reload Nginx
    nginx -t && systemctl reload nginx
    
    success "Temporary HTTP configuration active"
}

# Obtain SSL certificate
obtain_ssl_certificate() {
    log "Obtaining SSL certificate for $DOMAIN..."
    
    # Test if domain resolves to this server
    local server_ip=$(curl -s -4 icanhazip.com || echo "unknown")
    local domain_ip=$(dig +short "$DOMAIN" | head -1)
    
    if [[ "$server_ip" != "unknown" && "$domain_ip" != "$server_ip" ]]; then
        warning "Domain $DOMAIN may not point to this server"
        warning "Server IP: $server_ip, Domain IP: $domain_ip"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Aborted by user"
        fi
    fi
    
    # Obtain certificate
    if certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"; then
        success "SSL certificate obtained successfully"
    else
        error "Failed to obtain SSL certificate"
    fi
}

# Configure SSL and finalize setup
configure_ssl() {
    log "Configuring SSL and finalizing setup..."
    
    # Replace temp config with SSL config
    cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
    
    # Test nginx configuration
    if ! nginx -t; then
        error "Nginx configuration test failed"
    fi
    
    # Reload nginx
    systemctl reload nginx
    
    success "SSL configuration applied"
}

# Setup automatic renewal
setup_auto_renewal() {
    log "Setting up automatic SSL renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/freeformathub-ssl-renewal << EOF
# FreeFormatHub SSL Certificate Renewal
# Runs twice daily to check for certificate renewal
0 12,0 * * * root /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx
EOF

    # Test renewal
    if certbot renew --dry-run; then
        success "SSL auto-renewal configured successfully"
    else
        warning "SSL renewal test failed - please check manually"
    fi
    
    # Add renewal hook for nginx reload
    mkdir -p /etc/letsencrypt/renewal-hooks/deploy
    cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx << 'EOF'
#!/bin/bash
/bin/systemctl reload nginx
EOF
    chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx
}

# Configure firewall for HTTPS
setup_firewall() {
    log "Configuring firewall for HTTPS..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        success "UFW firewall configured for HTTP/HTTPS"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        success "Firewalld configured for HTTP/HTTPS"
    else
        warning "No firewall detected - please configure ports 80 and 443 manually"
    fi
}

# Verify deployment
verify_ssl_deployment() {
    log "Verifying SSL deployment..."
    
    # Wait a moment for services to start
    sleep 5
    
    # Test HTTP redirect
    local http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/" || echo "000")
    if [[ "$http_response" == "301" ]]; then
        success "HTTP to HTTPS redirect working"
    else
        warning "HTTP redirect returned: $http_response"
    fi
    
    # Test HTTPS
    local https_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/" || echo "000")
    if [[ "$https_response" == "200" ]]; then
        success "HTTPS site accessible"
    else
        warning "HTTPS site returned: $https_response"
    fi
    
    # Test SSL certificate
    if openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" -verify_return_error < /dev/null > /dev/null 2>&1; then
        success "SSL certificate is valid"
    else
        warning "SSL certificate verification failed"
    fi
    
    # Show certificate info
    log "SSL certificate details:"
    certbot certificates -d "$DOMAIN" | grep -E "(Certificate Name|Domains|Expiry Date)"
}

# Show final information
show_deployment_info() {
    log "🎉 SSL Deployment Complete!"
    echo ""
    echo "🌐 Your FreeFormatHub site is now live at:"
    echo "   https://$DOMAIN"
    echo "   https://www.$DOMAIN"
    echo ""
    echo "🔧 Available tools:"
    echo "   • JSON Formatter: https://$DOMAIN/json-formatter"
    echo "   • Base64 Encoder: https://$DOMAIN/base64-encoder"
    echo ""
    echo "🔍 Health check:"
    echo "   https://$DOMAIN/health"
    echo ""
    echo "📊 SSL Certificate:"
    echo "   Auto-renewal: Configured (runs twice daily)"
    echo "   Expires: $(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/cert.pem 2>/dev/null | cut -d= -f2 || echo 'Unknown')"
    echo ""
    echo "📝 Configuration files:"
    echo "   • Nginx config: /etc/nginx/sites-available/freeformathub"
    echo "   • SSL certificates: /etc/letsencrypt/live/$DOMAIN/"
    echo "   • Access logs: /var/log/nginx/freeformathub_access.log"
    echo "   • Error logs: /var/log/nginx/freeformathub_error.log"
    echo ""
    echo "🛡️ Security features enabled:"
    echo "   ✅ HTTPS/TLS 1.2 & 1.3"
    echo "   ✅ HSTS (HTTP Strict Transport Security)"
    echo "   ✅ Security headers (XSS, CSP, etc.)"
    echo "   ✅ SSL certificate auto-renewal"
    echo ""
    echo "🔄 Management commands:"
    echo "   sudo certbot renew                    # Manual renewal"
    echo "   sudo certbot certificates            # View certificates"
    echo "   sudo systemctl reload nginx          # Reload Nginx"
    echo "   sudo tail -f /var/log/nginx/freeformathub_error.log"
}

# Cleanup function
cleanup() {
    if [[ -f "/etc/nginx/sites-available/freeformathub-temp" ]]; then
        rm -f "/etc/nginx/sites-available/freeformathub-temp"
        rm -f "/etc/nginx/sites-enabled/freeformathub-temp"
    fi
}

# Main deployment function
main() {
    trap cleanup EXIT
    
    log "Starting SSL deployment for FreeFormatHub..."
    
    validate_inputs
    check_dependencies
    deploy_application
    create_ssl_config
    setup_http_config
    obtain_ssl_certificate
    configure_ssl
    setup_auto_renewal
    setup_firewall
    verify_ssl_deployment
    show_deployment_info
    
    success "🚀 FreeFormatHub is now live with SSL! 🎉"
}

# Handle command line arguments
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    show_usage
    exit 0
fi

main "$@"
