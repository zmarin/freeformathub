# 🚀 FreeFormatHub Nginx Deployment - Complete Setup

## ✅ What's Been Configured

### **Production-Ready Nginx Setup (Port 4600)**
- **High-Performance Configuration** with gzip compression and caching
- **Security Headers** (CSP, HSTS, XSS protection, etc.)
- **Static Asset Optimization** with 1-year browser caching
- **Rate Limiting** (10 requests/second per IP)
- **Health Check Endpoint** at `/health`
- **Error Pages** and comprehensive logging

### **Automated Deployment Scripts**
- **`setup-nginx.sh`** - Complete system setup (Nginx, Node.js, firewall)
- **`deploy.sh`** - Build and deploy application with backup system
- **`docker-deploy.sh`** - Containerized deployment with monitoring options
- **`test-nginx-config.sh`** - Validation and testing suite

### **Multi-Deployment Options**
1. **Direct Nginx** - Traditional server deployment
2. **Docker** - Containerized with optional monitoring stack
3. **Docker Compose** - Full stack with Prometheus, Grafana, Redis

### **Port Configuration**
- **Main Application**: `http://localhost:4600`
- **Monitoring (Prometheus)**: `http://localhost:4601`
- **Dashboard (Grafana)**: `http://localhost:4602`
- **Cache (Redis)**: `localhost:4603`

## 🎯 Quick Start Commands

### Option 1: Traditional Nginx Deployment
```bash
# Complete setup (run as root/sudo)
sudo ./scripts/setup-nginx.sh
sudo ./scripts/deploy.sh

# Access: http://localhost:4600
```

### Option 2: Docker Deployment
```bash
# Basic deployment
./scripts/docker-deploy.sh

# With monitoring stack
./scripts/docker-deploy.sh deploy-monitor

# Check status
./scripts/docker-deploy.sh status
```

## 📊 Performance Metrics

### **Bundle Optimization**
- JSON Formatter: **4.08 KB gzipped**
- Base64 Encoder: **4.13 KB gzipped**
- Core Store: **19.17 KB gzipped**
- Total per page: **~27KB + React runtime**

### **Server Performance**
- **Target LCP**: < 1s on 4G networks
- **Nginx Workers**: Auto-scaled based on CPU cores
- **Connection Handling**: 4096 connections per worker
- **Keepalive**: 30s timeout with 1000 requests per connection

### **Caching Strategy**
- **Static Assets**: 1 year browser cache
- **HTML Pages**: 1 hour cache
- **Homepage**: 30 minutes cache
- **Gzip Compression**: All text assets
- **Client Storage**: localStorage + IndexedDB

## 🛡️ Security Features

### **Headers Configuration**
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
```

### **Access Control**
- **Rate Limiting**: 10 requests/second per IP
- **Hidden Files**: Denied access to `.` files
- **Config Files**: Blocked access to sensitive files
- **Input Validation**: Client-side with sanitization

### **SSL Ready** (Uncomment in config)
- **Let's Encrypt** integration prepared
- **Modern TLS** configuration (1.2, 1.3)
- **HSTS** and security headers
- **Auto-redirect** HTTP → HTTPS

## 📁 File Structure

```
deployment/
├── nginx/
│   └── freeformathub.conf     # Production Nginx config
├── docker/
│   ├── Dockerfile             # Optimized production image
│   └── docker-compose.yml     # Full stack deployment
└── README.md                  # Detailed deployment guide

scripts/
├── setup-nginx.sh             # System setup and configuration
├── deploy.sh                  # Build, deploy, and restart
├── docker-deploy.sh           # Docker deployment management
└── test-nginx-config.sh       # Configuration validation
```

## 🔧 Management Commands

### **Deployment Operations**
```bash
# Full deployment
sudo ./scripts/deploy.sh

# Build only
sudo ./scripts/deploy.sh build

# Deploy without building
sudo ./scripts/deploy.sh deploy

# Restart services
sudo ./scripts/deploy.sh restart

# Check status
sudo ./scripts/deploy.sh status
```

### **Docker Operations**
```bash
# Start basic stack
./scripts/docker-deploy.sh deploy

# Start with monitoring
./scripts/docker-deploy.sh deploy-monitor

# View logs
./scripts/docker-deploy.sh logs

# Stop all containers
./scripts/docker-deploy.sh stop

# Update containers
./scripts/docker-deploy.sh update
```

### **Monitoring & Logs**
```bash
# Access logs
sudo tail -f /var/log/nginx/freeformathub_access.log

# Error logs
sudo tail -f /var/log/nginx/freeformathub_error.log

# System status
sudo systemctl status nginx

# Port usage
sudo lsof -i :4600
```

## 🎁 Bonus Features Included

### **Monitoring Stack** (Docker)
- **Prometheus**: Metrics collection on port 4601
- **Grafana**: Dashboards on port 4602 (admin/admin123)
- **Health Checks**: Automated container monitoring

### **Development Tools**
- **Hot Reload**: Development server with live updates
- **Testing**: Vitest unit tests with coverage
- **Linting**: ESLint and Prettier configuration
- **Type Safety**: Strict TypeScript configuration

### **Backup System**
- **Automatic Backups**: Before each deployment
- **Retention**: Last 5 backups kept automatically
- **Recovery**: Simple tar-based restoration

### **Production Optimizations**
- **Asset Minification**: All assets optimized
- **Tree Shaking**: Unused code eliminated  
- **Code Splitting**: Lazy loading for components
- **Service Worker**: Ready for offline capability

## 🌐 Access URLs

After deployment, access your application at:

### **Main Application**
- **Local**: `http://localhost:4600`
- **Network**: `http://your-server-ip:4600`

### **Available Tools**
- **JSON Formatter**: `http://localhost:4600/tools/json-formatter`
- **Base64 Encoder**: `http://localhost:4600/tools/base64-encoder`

### **Monitoring** (Docker with monitoring)
- **Prometheus**: `http://localhost:4601`
- **Grafana**: `http://localhost:4602`
- **Health Check**: `http://localhost:4600/health`

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ `http://localhost:4600` shows FreeFormatHub homepage
- ✅ `http://localhost:4600/health` returns "healthy"
- ✅ JSON Formatter tool works correctly
- ✅ Base64 Encoder tool functions properly
- ✅ No errors in `/var/log/nginx/freeformathub_error.log`

## 🆘 Troubleshooting

### **Common Issues & Solutions**

**Port 4600 already in use:**
```bash
sudo lsof -i :4600
sudo kill -9 <PID>
```

**Nginx fails to start:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**Permission errors:**
```bash
sudo chown -R www-data:www-data /var/www/freeformathub
sudo chmod -R 755 /var/www/freeformathub
```

**Build failures:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🚀 Ready for Production!

Your FreeFormatHub deployment is now:
- ⚡ **Optimized** for high performance
- 🔒 **Secured** with modern security headers
- 📈 **Scalable** with container options
- 🔧 **Maintainable** with automated scripts
- 📊 **Monitorable** with optional dashboards

**Start serving privacy-first developer tools on port 4600!** 🎯

---

**Made with ❤️ for the developer community - Privacy-first, always free, no ads.**