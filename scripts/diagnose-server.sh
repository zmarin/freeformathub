#!/bin/bash

# Server Diagnostic Script for FreeFormatHub
# Check what's currently serving on the domain

echo "🔍 FreeFormatHub Server Diagnostic"
echo "=================================="
echo ""

# Check current user and permissions
echo "👤 Current User: $(whoami)"
echo "🏠 Current Directory: $(pwd)"
echo ""

# Check what's running on port 80 and 443
echo "🌐 Port Usage:"
echo "Port 80 (HTTP):"
sudo lsof -i :80 | head -10
echo ""
echo "Port 443 (HTTPS):"
sudo lsof -i :443 | head -10
echo ""

# Check Nginx status and configuration
echo "⚙️  Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    echo "📝 Active Nginx sites:"
    ls -la /etc/nginx/sites-enabled/
    echo ""
    echo "📄 Nginx configuration files:"
    ls -la /etc/nginx/sites-available/ | grep -v default
else
    echo "❌ Nginx is not running"
fi
echo ""

# Check what's in the web root
echo "📁 Web Root Contents:"
if [[ -d "/var/www" ]]; then
    echo "Directories in /var/www:"
    ls -la /var/www/
    echo ""
    
    # Check for different possible web roots
    for dir in /var/www/html /var/www/freeformathub /var/www/soloearnings; do
        if [[ -d "$dir" ]]; then
            echo "Contents of $dir:"
            ls -la "$dir" | head -5
            echo ""
        fi
    done
fi

# Check for Docker containers
echo "🐳 Docker Status:"
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "Running Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
    else
        echo "Docker not accessible or no containers running"
    fi
else
    echo "Docker not installed"
fi
echo ""

# Check Apache (in case it's running instead of Nginx)
echo "🌐 Apache Status:"
if systemctl is-active --quiet apache2 2>/dev/null || systemctl is-active --quiet httpd 2>/dev/null; then
    echo "⚠️  Apache is running (may conflict with Nginx)"
    systemctl status apache2 2>/dev/null || systemctl status httpd 2>/dev/null | head -5
else
    echo "✅ Apache not running"
fi
echo ""

# Check processes using port 80/443
echo "🔍 Processes on HTTP/HTTPS ports:"
echo "What's serving HTTP (port 80):"
sudo ss -tulpn | grep :80
echo ""
echo "What's serving HTTPS (port 443):"
sudo ss -tulpn | grep :443
echo ""

# Check if our FreeFormatHub files exist
echo "📄 FreeFormatHub Files:"
if [[ -d "/var/www/freeformathub" ]]; then
    echo "✅ FreeFormatHub directory exists:"
    ls -la /var/www/freeformathub/ | head -5
    echo ""
    
    if [[ -f "/var/www/freeformathub/index.html" ]]; then
        echo "📝 FreeFormatHub index.html content (first few lines):"
        head -10 /var/www/freeformathub/index.html
    fi
else
    echo "❌ No FreeFormatHub directory found at /var/www/freeformathub"
fi
echo ""

# Check domain resolution
echo "🌍 Domain Resolution:"
DOMAIN="freeformathub.com"
SERVER_IP=$(curl -s -4 icanhazip.com 2>/dev/null || echo "unknown")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || echo "unknown")

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [[ "$SERVER_IP" == "$DOMAIN_IP" ]]; then
    echo "✅ Domain points to this server"
else
    echo "⚠️  Domain points to different server or DNS issue"
fi
echo ""

# Test the domain response
echo "🌐 Domain Response Test:"
echo "HTTP Response:"
curl -s -I "http://freeformathub.com/" | head -5
echo ""
echo "HTTPS Response:"
curl -s -I "https://freeformathub.com/" | head -5
echo ""

echo "🎯 Next Steps:"
echo "1. Check the diagnostic results above"
echo "2. If another app is running, we need to replace it"
echo "3. If Nginx config is wrong, we need to fix it"
echo "4. Run: sudo ./scripts/force-deploy.sh to replace current deployment"