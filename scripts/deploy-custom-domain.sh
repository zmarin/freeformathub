#!/bin/bash

# FreeFormatHub Custom Domain Deployment
# Deploy with any domain you specify

set -e

# Get domain from user input
if [[ -z "$1" ]]; then
    echo "🌐 FreeFormatHub Custom Domain Deployment"
    echo ""
    echo "Please enter your domain (e.g., mytools.example.com):"
    read -p "Domain: " DOMAIN
    echo "Please enter your email for SSL certificate:"
    read -p "Email: " EMAIL
else
    DOMAIN="$1"
    EMAIL="${2:-admin@$DOMAIN}"
fi

# Validate domain
if [[ -z "$DOMAIN" ]]; then
    echo "❌ Domain is required"
    exit 1
fi

echo "🚀 Deploying FreeFormatHub to: $DOMAIN"
echo "📧 SSL email: $EMAIL"
echo ""

# Check if domain is available
echo "🔍 Checking domain availability..."
if curl -s --connect-timeout 5 "http://$DOMAIN" > /dev/null 2>&1; then
    echo "⚠️  Warning: Domain $DOMAIN appears to be in use"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check DNS resolution
echo "🌍 Checking DNS resolution..."
SERVER_IP=$(curl -s -4 icanhazip.com 2>/dev/null || echo "unknown")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || echo "unknown")

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [[ "$DOMAIN_IP" == "unknown" || "$DOMAIN_IP" == "" ]]; then
    echo "⚠️  Domain $DOMAIN does not resolve to any IP"
    echo "Please configure your DNS A record:"
    echo "  $DOMAIN → $SERVER_IP"
    echo ""
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled - Please configure DNS first"
        exit 1
    fi
elif [[ "$SERVER_IP" != "unknown" && "$DOMAIN_IP" != "$SERVER_IP" ]]; then
    echo "⚠️  Domain points to $DOMAIN_IP but server is $SERVER_IP"
    echo "Please update your DNS A record:"
    echo "  $DOMAIN → $SERVER_IP"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled - Please fix DNS first"
        exit 1
    fi
fi

# Run the production deployment
echo "🚀 Starting deployment..."
sudo ./scripts/production-deploy.sh "$DOMAIN" "$EMAIL"

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your FreeFormatHub site should be available at:"
echo "   https://$DOMAIN"
echo ""
echo "🛠️  Available tools:"
echo "   • JSON Formatter: https://$DOMAIN/json-formatter"
echo "   • Base64 Encoder: https://$DOMAIN/base64-encoder"
echo ""
echo "If the site is not accessible, please check:"
echo "1. DNS configuration (A record: $DOMAIN → $SERVER_IP)"
echo "2. Firewall (ports 80, 443 open)"
echo "3. SSL certificate status: sudo certbot certificates"