# FreeFormatHub Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code (including .env via .dockerignore)
COPY . .

# Build the application with environment variables
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Install Node.js for any server-side needs
RUN apk add --no-cache nodejs npm

# Copy custom nginx configuration
COPY deployment/nginx/freeformathub.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user and set permissions
RUN addgroup -g 1001 -S freeformathub && \
    adduser -S freeformathub -u 1001 -G freeformathub && \
    chown -R freeformathub:freeformathub /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create log directories
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/freeformathub_access.log && \
    touch /var/log/nginx/freeformathub_error.log && \
    chown -R freeformathub:freeformathub /var/log/nginx

# Update nginx.conf to use custom config
RUN sed -i 's/listen       80;/listen       4600;/g' /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4600/health || exit 1

# Expose port
EXPOSE 4600

# Start nginx
CMD ["nginx", "-g", "daemon off;"]