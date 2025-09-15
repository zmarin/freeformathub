# FreeFormatHub Dokploy Dockerfile
# Optimized single-stage build for Dokploy deployment

FROM node:20-alpine

WORKDIR /app

# Install nginx and curl for health checks
RUN apk add --no-cache nginx curl

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create nginx directories and setup
RUN mkdir -p /run/nginx /var/log/nginx

# Copy nginx configuration
COPY deployment/nginx/dokploy.conf /etc/nginx/conf.d/default.conf

# Copy built application to nginx directory
RUN cp -r /app/dist/* /usr/share/nginx/html/

# Create health check endpoint
RUN echo '{"status":"ok","service":"freeformathub"}' > /usr/share/nginx/html/health

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Health check for Dokploy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port 3000 to match Dokploy/Traefik expectation
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]