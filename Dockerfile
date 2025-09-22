# FreeFormatHub Production Dockerfile
# Optimized for performance, security, and SEO

# Use Node.js LTS Alpine for smaller image size
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for production builds
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=UTC

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx user (if not exists)
RUN addgroup -g 101 -S nginx || true
RUN adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx run directory
RUN mkdir -p /var/run/nginx && \
    chown nginx:nginx /var/run/nginx

# Security: Remove unnecessary packages and files
RUN rm -rf /var/cache/apk/* \
    /tmp/* \
    /usr/share/man/* \
    /usr/share/doc/*

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Run nginx as nginx user
USER nginx

# Start nginx with daemon off
CMD ["nginx", "-g", "daemon off;"]

# Metadata
LABEL maintainer="FreeFormatHub <contact@freeformathub.com>" \
      description="FreeFormatHub - Free Business & Developer Tools" \
      version="1.0" \
      org.opencontainers.image.title="FreeFormatHub" \
      org.opencontainers.image.description="Free online business and developer tools" \
      org.opencontainers.image.url="https://freeformathub.com" \
      org.opencontainers.image.vendor="FreeFormatHub" \
      org.opencontainers.image.licenses="MIT"