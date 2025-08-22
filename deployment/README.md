# FreeFormatHub Deployment Guide

This directory contains deployment configurations and scripts for FreeFormatHub using Nginx on port 4600.

## 🚀 Quick Start

### Option 1: Direct Nginx Deployment

```bash
# 1. Setup Nginx (run as root)
sudo ./scripts/setup-nginx.sh

# 2. Deploy application
sudo ./scripts/deploy.sh
```

### Option 2: Docker Deployment

```bash
# Basic deployment
./scripts/docker-deploy.sh deploy

# With monitoring (Prometheus + Grafana)
./scripts/docker-deploy.sh deploy-monitor

# Full stack (monitoring + caching)
./scripts/docker-deploy.sh deploy-full
```

## 📁 Directory Structure

```
deployment/
├── nginx/
│   └── freeformathub.conf     # Nginx configuration
├── docker/
│   ├── Dockerfile             # Production Docker image
│   └── docker-compose.yml     # Multi-service setup
└── README.md                  # This file

scripts/
├── setup-nginx.sh             # Initial Nginx setup
├── deploy.sh                  # Build and deploy
└── docker-deploy.sh           # Docker deployment
```

## 🔧 Nginx Configuration

### Port Configuration
- **Main Site**: Port 4600
- **Monitoring**: Port 4601 (Prometheus)
- **Dashboard**: Port 4602 (Grafana)
- **Cache**: Port 4603 (Redis)

### Performance Features
- **Gzip Compression**: Enabled for all text assets
- **Browser Caching**: Optimized cache headers
- **Static Asset Optimization**: 1-year cache for assets
- **Security Headers**: CSP, HSTS, XSS protection
- **Rate Limiting**: 10 requests/second per IP

### File Locations
- **Document Root**: `/var/www/freeformathub/dist`
- **Nginx Config**: `/etc/nginx/sites-available/freeformathub`
- **Access Logs**: `/var/log/nginx/freeformathub_access.log`
- **Error Logs**: `/var/log/nginx/freeformathub_error.log`
- **Backups**: `/var/backups/freeformathub/`

## 📊 Monitoring & Logging

### Nginx Logs
```bash
# Follow access logs
sudo tail -f /var/log/nginx/freeformathub_access.log

# Follow error logs
sudo tail -f /var/log/nginx/freeformathub_error.log

# Analyze logs with GoAccess
goaccess /var/log/nginx/freeformathub_access.log --log-format=COMBINED
```

### Health Checks
```bash
# Basic health check
curl http://localhost:4600/health

# Check response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4600/

# Check all tools
curl -s http://localhost:4600/tools/json-formatter | grep -q "JSON Formatter"
curl -s http://localhost:4600/tools/base64-encoder | grep -q "Base64 Encoder"
```

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost:4600/

# Test tool pages
ab -n 500 -c 5 http://localhost:4600/tools/json-formatter/
ab -n 500 -c 5 http://localhost:4600/tools/base64-encoder/
```

## 🔄 Deployment Commands

### Manual Deployment
```bash
# Full deployment (build + deploy + restart)
sudo ./scripts/deploy.sh

# Build only
sudo ./scripts/deploy.sh build

# Deploy only (skip build)
sudo ./scripts/deploy.sh deploy

# Restart Nginx only
sudo ./scripts/deploy.sh restart

# Check status
sudo ./scripts/deploy.sh status
```

### Docker Deployment
```bash
# Deploy basic stack
./scripts/docker-deploy.sh deploy

# Deploy with monitoring
./scripts/docker-deploy.sh deploy-monitor

# Check status
./scripts/docker-deploy.sh status

# View logs
./scripts/docker-deploy.sh logs

# Update containers
./scripts/docker-deploy.sh update

# Stop all
./scripts/docker-deploy.sh stop

# Cleanup
./scripts/docker-deploy.sh cleanup
```

## 🛡️ Security

### SSL Configuration (Production)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Rules
```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 4600/tcp    # FreeFormatHub
sudo ufw enable

# Firewalld (RHEL/CentOS)
sudo firewall-cmd --permanent --add-port=4600/tcp
sudo firewall-cmd --reload
```

### Security Headers
The Nginx configuration includes:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` for XSS protection

## 🔧 Troubleshooting

### Common Issues

**Port 4600 already in use:**
```bash
sudo lsof -i :4600
sudo kill -9 <PID>
```

**Nginx fails to start:**
```bash
sudo nginx -t                    # Test config
sudo systemctl status nginx      # Check status
sudo journalctl -u nginx         # Check logs
```

**Permission issues:**
```bash
sudo chown -R www-data:www-data /var/www/freeformathub
sudo chmod -R 755 /var/www/freeformathub
```

**Build failures:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

**High memory usage:**
```bash
# Check Nginx processes
ps aux | grep nginx

# Monitor system resources
htop
free -h
df -h
```

**Slow response times:**
```bash
# Enable Nginx status module
# Add to nginx.conf:
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}

# Check status
curl http://localhost:4600/nginx_status
```

## 📈 Performance Optimization

### Nginx Tuning
```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 4096;
keepalive_timeout 30;
client_max_body_size 20M;
```

### System Limits
```bash
# /etc/security/limits.conf
www-data soft nofile 65535
www-data hard nofile 65535

# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
```

### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Setup log rotation
sudo nano /etc/logrotate.d/freeformathub
```

## 🔄 Backup & Recovery

### Backup Strategy
```bash
# Backup script (add to crontab)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "/var/backups/freeformathub/backup_$DATE.tar.gz" \
    -C /var/www/freeformathub .

# Keep only last 7 days
find /var/backups/freeformathub -name "*.tar.gz" -mtime +7 -delete
```

### Recovery
```bash
# Restore from backup
sudo tar -xzf /var/backups/freeformathub/backup_YYYYMMDD_HHMMSS.tar.gz \
    -C /var/www/freeformathub/

sudo chown -R www-data:www-data /var/www/freeformathub
sudo systemctl reload nginx
```

## 🆘 Support

For deployment issues:
1. Check logs: `/var/log/nginx/freeformathub_error.log`
2. Verify permissions: `ls -la /var/www/freeformathub`
3. Test Nginx config: `sudo nginx -t`
4. Check port availability: `sudo lsof -i :4600`

## 📝 Notes

- Default deployment uses port 4600 as specified
- All processing is client-side, no backend services needed
- Designed for high-performance static site serving
- Supports horizontal scaling with load balancers
- Ready for CDN integration (Cloudflare, AWS CloudFront)

---

**Made with ❤️ for the developer community**