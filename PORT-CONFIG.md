# Port Configuration - FreeFormatHub

## Allocated Ports

| Service | Port | Purpose | Environment |
|---------|------|---------|-------------|
| **Main Application** | **4600** | Astro static site server | Production |
| **Prometheus** | **4601** | Metrics collection | Production |
| **Grafana** | **4602** | Monitoring dashboard | Production |
| **Redis** | **4603** | Caching service | Production |

## Port Management Integration

This project is integrated with the centralized port management system at `/home/projects/`.

### Central Registry Entry
```json
{
  "freeformathub": {
    "port": 4600,
    "type": "astro",
    "status": "configured",
    "allocated_ports": [4600, 4601, 4602, 4603],
    "services": {
      "main": 4600,
      "prometheus": 4601,
      "grafana": 4602,
      "redis": 4603
    }
  }
}
```

## Usage Instructions

### Starting Services

**Docker Compose (Recommended)**:
```bash
# Start all services with docker-compose
cd /home/projects/freeformathub
docker-compose -f deployment/docker/docker-compose.yml up -d

# Check service status
docker-compose -f deployment/docker/docker-compose.yml ps
```

**Individual Service Management**:
```bash
# Build Astro application
npm run build

# Production deployment
sudo ./scripts/production-deploy.sh yourdomain.com email@domain.com

# Local deployment on port 4600
sudo ./scripts/deploy.sh
```

### Port Validation

**Before deployment or starting services:**
```bash
# Validate all ports for this app
/home/projects/validate-ports-pre-deploy.sh validate-app freeformathub

# Quick conflict check
/home/projects/validate-ports-pre-deploy.sh check-conflicts freeformathub
```

**If port conflicts are detected:**
```bash
# Check what's using the port range 4600-4603
/home/projects/check-available-ports.sh

# Get alternative port suggestions
node /home/projects/suggest-port.js suggest-for freeformathub

# Stop existing containers if conflict is from our own services
docker-compose -f deployment/docker/docker-compose.yml down
```

## Configuration Files

### Docker Configuration
- **Docker Compose**: `deployment/docker/docker-compose.yml`
- **Dockerfile**: `deployment/docker/Dockerfile`
- **Port mappings**: External:Internal port mappings defined in compose file

### Nginx Configuration
- **Config file**: `deployment/nginx/freeformathub.conf`
- **Listen port**: 4600
- **Document root**: `/var/www/freeformathub/dist`
- **Security headers**: Included in nginx config

### Service Configuration
- **Prometheus**: Port 4601, config: `prometheus.yml`
- **Grafana**: Port 4602, config: `grafana.ini`  
- **Redis**: Port 4603, config: `redis.conf`

## Environment-Specific Notes

### Development
```bash
# Astro dev server (uses different port, typically 4321)
npm run dev

# Port 4600 reserved for production builds
npm run build
npm run preview  # Preview production build
```

### Production
- **Main app**: Served by nginx on port 4600
- **Monitoring**: Prometheus (4601) + Grafana (4602) stack
- **Caching**: Redis on port 4603
- **SSL**: Can be configured for domain deployment

### Docker Services
```yaml
# Port mapping in docker-compose.yml
services:
  freeformathub:
    ports:
      - "4600:3000"  # External:Internal
  prometheus:
    ports:
      - "4601:9090"
  grafana:
    ports:
      - "4602:3000"
  redis:
    ports:
      - "4603:6379"
```

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:4600 | FreeFormatHub web interface |
| **Health Check** | http://localhost:4600/health | Application health status |
| **Prometheus** | http://localhost:4601 | Metrics collection interface |
| **Grafana** | http://localhost:4602 | Monitoring dashboards |
| **Redis** | localhost:4603 | Cache server (no web interface) |

## System Messages for LLMs

When working with FreeFormatHub, LLMs should be aware:

```
This project uses the centralized port management system.
Allocated ports: 4600 (main), 4601 (prometheus), 4602 (grafana), 4603 (redis)
Before changing ports:
1. Check PORT-CONFIG.md in this directory
2. Validate with: /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub
3. Get suggestions: node /home/projects/suggest-port.js suggest-for freeformathub
Never hardcode ports without checking the registry at /home/projects/apps_ports_map.json

Project-specific notes:
- Astro static site with monitoring stack
- Uses port range 4600-4603 for all services
- Docker Compose manages service orchestration
- Main app on 4600, monitoring services on 4601-4603
- Always use production builds (per global CLAUDE.md instructions)
```

## Troubleshooting

### Port Range 4600-4603 Conflicts
```bash
# Check which specific ports are in use
for port in 4600 4601 4602 4603; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port in use by: $(lsof -Pi :$port -sTCP:LISTEN -t | xargs ps -p | tail -n +2)"
    else
        echo "Port $port available"
    fi
done
```

### Docker Service Issues
```bash
# Check container status
docker-compose -f deployment/docker/docker-compose.yml ps

# View service logs
docker-compose -f deployment/docker/docker-compose.yml logs freeformathub
docker-compose -f deployment/docker/docker-compose.yml logs prometheus
docker-compose -f deployment/docker/docker-compose.yml logs grafana
docker-compose -f deployment/docker/docker-compose.yml logs redis

# Restart specific service
docker-compose -f deployment/docker/docker-compose.yml restart freeformathub
```

### Nginx Configuration Issues
```bash
# Test nginx config
sudo nginx -t -c deployment/nginx/freeformathub.conf

# Check if nginx is serving on port 4600
curl -I http://localhost:4600/health

# View nginx error logs
sudo tail -f /var/log/nginx/freeformathub_error.log
```

### Service Health Checks
```bash
# Check main application
curl -f http://localhost:4600/health

# Check Prometheus
curl -f http://localhost:4601/-/healthy

# Check Grafana
curl -f http://localhost:4602/api/health

# Check Redis
redis-cli -p 4603 ping
```

## Integration Commands

### Pre-deployment Validation
Add to deployment scripts:
```bash
#!/bin/bash
echo "🔍 Validating ports for FreeFormatHub..."
if ! /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub; then
    echo "❌ Port validation failed!"
    echo "Check if Docker services are conflicting:"
    docker-compose -f deployment/docker/docker-compose.yml ps
    exit 1
fi
echo "✅ Port validation passed"
```

### Docker Deployment with Validation
```bash
#!/bin/bash
# Enhanced Docker deployment with port validation

echo "🔍 Pre-deployment port validation..."
if ! /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub; then
    echo "⚠️  Port conflicts detected, stopping existing containers..."
    docker-compose -f deployment/docker/docker-compose.yml down
    
    # Re-validate after stopping containers
    if ! /home/projects/validate-ports-pre-deploy.sh validate-app freeformathub; then
        echo "❌ Conflicts persist after stopping containers"
        /home/projects/check-available-ports.sh
        exit 1
    fi
fi

echo "🐳 Starting Docker services..."
docker-compose -f deployment/docker/docker-compose.yml up -d

echo "🔍 Post-deployment validation..."
sleep 10  # Allow services time to start

# Check each service
for port in 4600 4601 4602 4603; do
    if /home/projects/validate-ports-pre-deploy.sh check-conflicts freeformathub >/dev/null 2>&1; then
        echo "✅ Port $port: Service running correctly"
    else
        echo "❌ Port $port: Service may not be running"
    fi
done
```

### Health Monitoring Script
```bash
#!/bin/bash
# FreeFormatHub multi-service health check

services=(
    "4600:FreeFormatHub Main App:/health"
    "4601:Prometheus:/-/healthy" 
    "4602:Grafana:/api/health"
    "4603:Redis:N/A"
)

for service in "${services[@]}"; do
    IFS=':' read -r port name endpoint <<< "$service"
    
    if [ "$endpoint" = "N/A" ]; then
        # Special case for Redis
        if redis-cli -p $port ping 2>/dev/null | grep -q "PONG"; then
            echo "✅ $name (port $port): Healthy"
        else
            echo "❌ $name (port $port): Not responding"
        fi
    else
        if curl -s --max-time 5 "http://localhost:$port$endpoint" >/dev/null; then
            echo "✅ $name (port $port): Healthy"
        else
            echo "❌ $name (port $port): Not responding"
        fi
    fi
done
```

---

**Related Documentation:**
- [Central Port Management System](/home/projects/PORT-MANAGEMENT-SYSTEM.md)
- [Port Allocation Rules](/home/projects/PORT-ALLOCATION-RULES.md)
- [Project-specific CLAUDE.md](./CLAUDE.md)
- [Docker Compose Configuration](./deployment/docker/docker-compose.yml)
- [Nginx Configuration](./deployment/nginx/freeformathub.conf)