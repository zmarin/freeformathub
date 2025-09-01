# 🚀 FreeFormatHub Production Deployment with SSL

Complete guide for deploying FreeFormatHub to production with Nginx, SSL/TLS via Certbot, and optional monitoring.

## 🎯 Quick Production Deployment

### **One-Command Deployment**
```bash
# Complete production setup with SSL
sudo ./scripts/production-deploy.sh yourdomain.com admin@yourdomain.com

# With monitoring enabled
sudo ./scripts/production-deploy.sh yourdomain.com admin@yourdomain.com true
```

### **Step-by-Step Deployment**
```bash
# 1. System setup
sudo ./scripts/setup-nginx.sh

# 2. SSL deployment
sudo ./scripts/ssl-deploy.sh yourdomain.com admin@yourdomain.com

# 3. Verify deployment
curl -I https://yourdomain.com/health
```

## 📋 Prerequisites

### **Server Requirements**
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum
- **Network**: Public IP with ports 80, 443 open

### **Domain Configuration**
- Domain pointing to your server IP
- DNS A records configured:
  - `yourdomain.com` → `your-server-ip`
  - `www.yourdomain.com` → `your-server-ip`

### **Prerequisites Check**
```bash
# Check server IP
curl -4 icanhazip.com

# Check domain resolution
dig +short yourdomain.com
dig +short www.yourdomain.com

# Verify ports are open
sudo netstat -tlnp | grep -E ':80|:443'
```

## 🔧 Manual Deployment Steps

### **1. System Setup**
```bash
# Clone the repository (if not already done)
git clone https://github.com/your-repo/freeformathub.git
cd freeformathub

# Run system setup (installs Nginx, Node.js, Certbot)
sudo ./scripts/setup-nginx.sh
```

### **2. SSL Certificate Setup**
```bash
# Deploy with SSL (replace with your domain)
sudo ./scripts/ssl-deploy.sh yourdomain.com admin@yourdomain.com
```

### **3. Verify Deployment**
```bash
# Check HTTPS
curl -I https://yourdomain.com/

# Check tools
curl -s https://yourdomain.com/formatters/json-formatter | grep "JSON Formatter"
curl -s https://yourdomain.com/encoders/base64-encoder | grep "Base64 Encoder"

# Check SSL certificate
openssl s_client -servername yourdomain.com -connect yourdomain.com:443 -verify_return_error < /dev/null
```

## 🔐 SSL Configuration Details

### **What Gets Configured**

1. **Let's Encrypt Certificate**
   - SSL certificate for `yourdomain.com` and `www.yourdomain.com`
   - Automatic renewal via cron job
   - OCSP stapling enabled

2. **Security Headers**
   ```nginx
   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
   X-Frame-Options: SAMEORIGIN
   X-Content-Type-Options: nosniff
   X-XSS-Protection: 1; mode=block
   Content-Security-Policy: default-src 'self'; ...
   ```

3. **HTTPS Enforcement**
   - HTTP → HTTPS redirect (301)
   - TLS 1.2 and 1.3 support
   - Modern cipher suites

### **SSL Management Commands**
```bash
# View certificates
sudo certbot certificates

# Manual renewal (automatic via cron)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem
```

## 📊 Monitoring Setup (Optional)

### **Enable Monitoring**
```bash
# Deploy with monitoring stack
sudo ./scripts/production-deploy.sh yourdomain.com admin@yourdomain.com true
```

### **Monitoring Access**
- **Grafana Dashboard**: `https://yourdomain.com/grafana/`
  - Username: `admin`
  - Password: `freeformathub2024`

- **Prometheus Metrics**: `https://yourdomain.com/prometheus/`
  - Username: `admin`
  - Password: `freeformathub2024`

### **Available Metrics**
- Server performance (CPU, RAM, disk)
- Nginx request metrics
- SSL certificate expiry
- Application uptime

## 🔧 File Locations

### **Application Files**
```
/var/www/freeformathub/          # Application root
├── index.html                   # Homepage
├── tools/                       # Tool pages
├── _astro/                      # Built assets
└── robots.txt                   # SEO robots file
```

### **Configuration Files**
```
/etc/nginx/sites-available/freeformathub  # Nginx config
/etc/letsencrypt/live/yourdomain.com/     # SSL certificates
/opt/freeformathub/scripts/               # Maintenance scripts
/var/log/nginx/freeformathub_*.log        # Nginx logs
```

### **Maintenance Scripts**
```
/opt/freeformathub/scripts/
├── update.sh          # Update application
├── backup.sh          # Create backups
└── health-check.sh    # Health monitoring
```

## 🔄 Application Management

### **Update Application**
```bash
# Automatic update
sudo /opt/freeformathub/scripts/update.sh

# Manual update
cd /home/projects/freeformathub
git pull origin main
npm run build
sudo ./scripts/deploy.sh deploy
```

### **Backup & Restore**
```bash
# Create backup
sudo /opt/freeformathub/scripts/backup.sh

# List backups
ls -la /var/backups/freeformathub-full/

# Restore from backup
sudo tar -xzf /var/backups/freeformathub-full/app_YYYYMMDD_HHMMSS.tar.gz -C /var/www/freeformathub/
sudo systemctl reload nginx
```

### **Log Management**
```bash
# View access logs
sudo tail -f /var/log/nginx/freeformathub_access.log

# View error logs
sudo tail -f /var/log/nginx/freeformathub_error.log

# Analyze logs with GoAccess
sudo goaccess /var/log/nginx/freeformathub_access.log --log-format=COMBINED
```

## 🛡️ Security Features

### **Implemented Security**
- ✅ SSL/TLS 1.2 & 1.3 with strong ciphers
- ✅ HSTS with preloading
- ✅ Security headers (CSP, XSS protection)
- ✅ Fail2ban intrusion prevention
- ✅ Rate limiting (10 req/s per IP)
- ✅ Hidden file protection
- ✅ Firewall configuration

### **Security Monitoring**
```bash
# Check fail2ban status
sudo fail2ban-client status

# View banned IPs
sudo fail2ban-client status nginx-http-auth

# Unban IP
sudo fail2ban-client set nginx-http-auth unbanip 1.2.3.4

# Check firewall
sudo ufw status verbose
```

## 🔍 Troubleshooting

### **Common Issues**

**SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Check certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/cert.pem

# Re-issue certificate
sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com --force-renewal
```

**Nginx Configuration Issues**
```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T

# Restart services
sudo systemctl restart nginx
sudo systemctl status nginx
```

**Domain Resolution Issues**
```bash
# Check DNS
dig yourdomain.com
nslookup yourdomain.com

# Check from external DNS
dig @8.8.8.8 yourdomain.com
```

**Port Issues**
```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443

# Kill process if needed
sudo kill -9 <PID>
```

### **Health Checks**
```bash
# Run comprehensive health check
sudo /opt/freeformathub/scripts/health-check.sh

# Manual checks
curl -I https://yourdomain.com/health
curl -I https://yourdomain.com/formatters/json-formatter/
openssl s_client -servername yourdomain.com -connect yourdomain.com:443 < /dev/null
```

## 🚀 Performance Optimization

### **Built-in Optimizations**
- **Gzip Compression**: All text assets compressed
- **Browser Caching**: Long-term caching for static assets
- **HTTP/2**: Enabled with SSL
- **Asset Optimization**: Minified CSS/JS bundles
- **CDN Ready**: Headers configured for CDN integration

### **Additional Optimizations**
```bash
# Enable Brotli compression (if available)
sudo apt install nginx-module-brotli

# Add to nginx.conf:
# load_module modules/ngx_http_brotli_filter_module.so;
# load_module modules/ngx_http_brotli_static_module.so;
```

### **CDN Integration**
Ready for CDN setup with:
- CloudFlare
- AWS CloudFront  
- KeyCDN
- MaxCDN

## 📈 Scaling Considerations

### **Horizontal Scaling**
- Load balancer ready
- Stateless application design
- CDN integration prepared
- Database-free architecture

### **Vertical Scaling**
- Nginx worker processes auto-scale
- Memory usage optimized
- CPU efficient static serving

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] Server meets requirements
- [ ] Domain DNS configured
- [ ] Firewall ports 80/443 open
- [ ] Server has internet connectivity

### **Post-Deployment**
- [ ] HTTPS site accessible
- [ ] SSL certificate valid
- [ ] HTTP redirects to HTTPS
- [ ] All tools function correctly
- [ ] Monitoring dashboards accessible (if enabled)
- [ ] SSL auto-renewal configured
- [ ] Backup cron jobs active
- [ ] Security headers present

### **Production Ready**
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Monitoring alerts configured
- [ ] Backup strategy verified
- [ ] Update procedures documented

## 🎉 Success!

Your FreeFormatHub deployment is now:
- 🔒 **Secure** with SSL/TLS encryption
- ⚡ **Fast** with optimized caching
- 📊 **Monitored** with optional dashboards
- 🛡️ **Protected** with security hardening
- 🔄 **Maintainable** with automation scripts

**Site URL**: `https://yourdomain.com` 🚀

---

**Need help?** Check logs, run health checks, or review the troubleshooting section above.
