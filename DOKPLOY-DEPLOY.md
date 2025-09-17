# FreeFormatHub Dokploy Deployment Guide

This guide covers deploying FreeFormatHub to Dokploy, a self-hosted Platform as a Service (PaaS).

## 🚀 Prerequisites

### Server Requirements
- **VPS/Server**: Minimum 2GB RAM, 30GB disk space
- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Ports**: 80 and 443 must be available
- **Domain**: Point your domain to the server IP

### Dokploy Installation
Install Dokploy on your server:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

After installation, access Dokploy at `https://your-server-ip` and complete the setup.

## 📦 Repository Setup

### 1. Prepare Your Repository
The repository is now configured for Dokploy with these files:
- `deployment/docker/Dockerfile` - Optimized Docker build
- `deployment/nginx/dokploy.conf` - Nginx configuration
- `dokploy.toml` - Dokploy configuration hints
- `.env.example` - Environment variable template

### 2. Environment Variables
Copy `.env.example` to configure your environment variables locally:

```bash
cp .env.example .env
# Edit .env with your actual values
```

## 🔧 Dokploy Configuration

### 1. Create New Application
1. Log into Dokploy UI
2. Click "Create Application"
3. Choose "Application" type
4. Select "Git Repository" as source

### 2. Repository Settings
- **Repository URL**: `https://github.com/yourusername/freeformathub.git`
- **Branch**: `master`
- **Build Type**: `Dockerfile`
- **Dockerfile Path**: `deployment/docker/Dockerfile`

### 3. Environment Variables
In Dokploy UI, add these environment variables:

#### Required Variables
```
NODE_ENV=production
PUBLIC_GA_MEASUREMENT_ID=G-34Z7YVSEZ2
PUBLIC_ADSENSE_CLIENT_ID=ca-pub-5745115058807126
```

#### AdSense Configuration
Replace with your actual AdSense slot IDs:
```
PUBLIC_HEADER_AD_SLOT=your-header-slot-id
PUBLIC_SIDEBAR_AD_SLOT=your-sidebar-slot-id
PUBLIC_CONTENT_AD_SLOT=your-content-slot-id
PUBLIC_FOOTER_AD_SLOT=your-footer-slot-id
PUBLIC_ADS_TEST_MODE=false
PUBLIC_ADSENSE_VERIFICATION=your-verification-code
```

### 4. Domain Configuration
1. In Dokploy, go to your application settings
2. Add your domain (e.g., `freeformathub.com`)
3. Enable SSL/TLS (Let's Encrypt)
4. Dokploy will handle SSL certificate generation

### 5. Resource Limits (Optional)
Configure resource limits if needed:
- **Memory**: 512MB (minimum recommended)
- **CPU**: 0.5 cores
- **Storage**: 10GB

## 🔍 Health Checks

The application includes built-in health checks:
- **Endpoint**: `/health`
- **Response**: `{"status":"ok","service":"freeformathub"}`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds

## 🚀 Deployment Process

### 1. Initial Deployment
1. Configure all settings in Dokploy UI
2. Click "Deploy" to start the build process
3. Monitor build logs for any issues
4. Wait for deployment to complete

### 2. Automatic Deployments
Dokploy can automatically deploy on:
- Git push to master branch
- Webhook triggers
- Manual deployments

### 3. Build Process
The Dockerfile performs these steps:
1. Install Node.js 20 and nginx
2. Install npm dependencies
3. Build Astro static site (`npm run build`)
4. Configure nginx with optimized settings
5. Set up health checks and permissions

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
1. Check build logs in Dokploy UI
2. Verify all environment variables are set
3. Ensure repository access is configured
4. Check Dockerfile syntax

#### Runtime Issues
1. Check application logs in Dokploy
2. Verify health check endpoint (`/health`)
3. Test nginx configuration
4. Check resource usage

#### SSL Certificate Issues
1. Verify domain points to server IP
2. Check DNS propagation
3. Ensure ports 80/443 are open
4. Try regenerating SSL certificate in Dokploy

#### Environment Variable Issues
1. Verify all required variables are set in Dokploy UI
2. Check variable names match exactly (case-sensitive)
3. Restart application after adding variables

### Debug Commands
Access application container via Dokploy terminal:

```bash
# Check nginx status
nginx -t

# View application files
ls -la /usr/share/nginx/html/

# Check health endpoint
curl http://localhost/health

# View nginx error logs
tail -f /var/log/nginx/error.log
```

## 📊 Monitoring

### Application Metrics
Monitor your application through:
- Dokploy dashboard (resource usage)
- Application logs
- Health check status
- Google Analytics (traffic)

### Key Metrics to Watch
- Memory usage (should stay under 512MB)
- CPU usage (normally <50%)
- Response times (should be <1s)
- Error rates (should be minimal)

## 🔄 Updates and Maintenance

### Updating the Application
1. Push changes to your git repository
2. Dokploy will auto-deploy (if configured)
3. Or manually trigger deployment in Dokploy UI

### Backup Strategy
Regular backups recommended:
- Application configuration (export from Dokploy)
- Environment variables
- SSL certificates (auto-renewed by Dokploy)

### Scaling
For high traffic, consider:
- Increasing resource limits
- Multiple application instances
- CDN integration
- Database optimization (if needed)

## 🔐 Security Considerations

### SSL/TLS
- Dokploy handles SSL certificates automatically
- HTTPS redirects are configured
- Security headers are set in nginx config

### Environment Variables
- Never commit sensitive data to repository
- Use Dokploy UI for environment variables
- Regularly rotate API keys and tokens

### Nginx Security
- CSP headers configured for Google Analytics/AdSense
- Security headers prevent common attacks
- Hidden files and logs are protected

## 📞 Support

### Getting Help
- **Dokploy Documentation**: https://docs.dokploy.com/
- **Dokploy Community**: Discord/GitHub discussions
- **Application Issues**: Check repository issues

### Monitoring Tools
Recommended tools for production monitoring:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (Google Analytics)

---

## 🎯 Quick Deployment Checklist

- [ ] Dokploy installed on server
- [ ] Domain configured and pointing to server
- [ ] Repository accessible to Dokploy
- [ ] All environment variables configured
- [ ] SSL certificate generated
- [ ] Health checks passing
- [ ] Google Analytics working
- [ ] AdSense ads displaying (if configured)
- [ ] All 101 tools accessible and functional

## 📈 Post-Deployment

After successful deployment:
1. Test all 101 tools functionality
2. Verify Google Analytics tracking
3. Check AdSense ads display correctly
4. Test consent management system
5. Monitor performance and error rates
6. Set up monitoring alerts

Your FreeFormatHub application should now be running smoothly on Dokploy!