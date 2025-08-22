#!/bin/bash

# Force Deploy FreeFormatHub
# This will replace whatever is currently serving on your domain

set -e

DOMAIN="freeformathub.com"
EMAIL="admin@freeformathub.com"

# Colors
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
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root or with sudo"
fi

log "🚀 Force deploying FreeFormatHub to $DOMAIN"
echo ""

# Stop any conflicting services
log "🛑 Stopping conflicting services..."
systemctl stop apache2 2>/dev/null || true
systemctl stop httpd 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
systemctl disable httpd 2>/dev/null || true

# Stop and remove any Docker containers that might be serving the site
if command -v docker &> /dev/null; then
    log "🐳 Stopping Docker containers..."
    docker stop $(docker ps -q) 2>/dev/null || true
fi

# Remove any existing web content
log "🧹 Cleaning existing web content..."
rm -rf /var/www/html/* 2>/dev/null || true
rm -rf /var/www/soloearnings 2>/dev/null || true
mkdir -p /var/www/freeformathub

# Remove conflicting Nginx configurations
log "⚙️  Cleaning Nginx configuration..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/soloearnings*
rm -f /etc/nginx/sites-available/soloearnings*
rm -f /etc/nginx/sites-enabled/000-default*

# Build FreeFormatHub
log "🔨 Building FreeFormatHub..."
cd /home/projects/freeformathub
npm run build

# Deploy files
log "📂 Deploying FreeFormatHub files..."
cp -r dist/* /var/www/freeformathub/
chown -R www-data:www-data /var/www/freeformathub
chmod -R 755 /var/www/freeformathub

# Create new Nginx configuration
log "⚙️  Creating Nginx configuration..."
cat > /etc/nginx/sites-available/freeformathub << EOF
# FreeFormatHub HTTP Configuration (will be upgraded to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name freeformathub.com www.freeformathub.com;
    
    root /var/www/freeformathub;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/plain
        text/html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 301 redirects for old tool URLs to new clean URLs
    location /tools/ {
        rewrite ^/tools/(.*)$ /$1 permanent;
    }

    # Main location
    location / {
        try_files \$uri \$uri/ \$uri.html /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "FreeFormatHub is running\n";
        add_header Content-Type text/plain;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }

    # Logs
    access_log /var/log/nginx/freeformathub_access.log;
    error_log /var/log/nginx/freeformathub_error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/freeformathub /etc/nginx/sites-enabled/freeformathub

# Test Nginx configuration
if ! nginx -t; then
    error "Nginx configuration test failed"
fi

# Restart Nginx
log "🔄 Restarting Nginx..."
systemctl restart nginx

# Ensure Nginx is running
if ! systemctl is-active --quiet nginx; then
    error "Failed to start Nginx"
fi

# Wait a moment
sleep 3

# Test the deployment
log "🧪 Testing deployment..."
if curl -s "http://freeformathub.com/health" | grep -q "FreeFormatHub"; then
    success "✅ FreeFormatHub is now serving on HTTP"
else
    warning "⚠️  HTTP test failed, but deployment may still be successful"
fi

# Now set up SSL
log "🔐 Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    # Create webroot directory for certbot
    mkdir -p /var/www/certbot
    chown -R www-data:www-data /var/www/certbot
    
    # Add certbot location to nginx config
    sed -i '/location \/ {/i\
    # Let'\''s Encrypt challenge\
    location /.well-known/acme-challenge/ {\
        root /var/www/certbot;\
        allow all;\
    }\
' /etc/nginx/sites-available/freeformathub
    
    systemctl reload nginx
    
    # Obtain certificate
    if certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains freeformathub.com,www.freeformathub.com; then
        
        log "🔐 SSL certificate obtained, updating Nginx config..."
        
        # Update nginx config for SSL
        cat > /etc/nginx/sites-available/freeformathub << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name freeformathub.com www.freeformathub.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name freeformathub.com www.freeformathub.com;
    root /var/www/freeformathub;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/freeformathub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/freeformathub.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/plain
        text/html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 301 redirects for old tool URLs to new clean URLs
    location /tools/ {
        rewrite ^/tools/(.*)$ /$1 permanent;
    }

    # Main location
    location / {
        try_files $uri $uri/ $uri.html /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "FreeFormatHub is running with SSL";
        add_header Content-Type text/plain;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }

    # Logs
    access_log /var/log/nginx/freeformathub_access.log;
    error_log /var/log/nginx/freeformathub_error.log;
}
EOF
        
        nginx -t && systemctl reload nginx
        success "✅ SSL certificate installed and configured"
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx" | crontab -
        
    else
        warning "⚠️  SSL certificate setup failed, but HTTP is working"
    fi
else
    warning "⚠️  Certbot not found, SSL not configured"
fi

# Final test
log "🧪 Final verification..."
sleep 5

echo ""
log "🎉 Force deployment completed!"
echo ""
echo "🌐 Your FreeFormatHub should now be accessible at:"
echo "   http://freeformathub.com (will redirect to HTTPS if SSL worked)"
echo "   https://freeformathub.com (if SSL is configured)"
echo ""
echo "🛠️  Available tools:"
echo "   • JSON Formatter: https://freeformathub.com/json-formatter"
echo "   • Base64 Encoder: https://freeformathub.com/base64-encoder"
echo ""
echo "🔍 Health check:"
echo "   https://freeformathub.com/health"
echo ""

# Test final accessibility
if curl -s "https://freeformathub.com/health" | grep -q "FreeFormatHub"; then
    success "✅ HTTPS is working!"
elif curl -s "http://freeformathub.com/health" | grep -q "FreeFormatHub"; then
    success "✅ HTTP is working!"
    warning "⚠️  HTTPS may need manual configuration"
else
    warning "⚠️  Please check the site manually"
fi

echo ""
echo "If you still see the old application, please:"
echo "1. Clear your browser cache (Ctrl+F5)"
echo "2. Wait 5-10 minutes for DNS/CDN caches to clear"
echo "3. Check: curl -I https://freeformathub.com/health"