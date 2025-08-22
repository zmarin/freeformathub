#!/bin/bash

# Test Nginx Configuration for FreeFormatHub
# Validates the configuration without requiring root access

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test 1: Check if nginx config file exists and is valid
test_nginx_config() {
    log "Testing Nginx configuration file..."
    
    local config_file="deployment/nginx/freeformathub.conf"
    
    if [[ ! -f "$config_file" ]]; then
        error "Nginx config file not found: $config_file"
        return 1
    fi
    
    # Check for required sections
    local required_sections=("server" "listen 4600" "root" "location /")
    for section in "${required_sections[@]}"; do
        if ! grep -q "$section" "$config_file"; then
            error "Missing required section in config: $section"
            return 1
        fi
    done
    
    success "Nginx configuration file is valid"
}

# Test 2: Check deploy script
test_deploy_script() {
    log "Testing deploy script..."
    
    local script="scripts/deploy.sh"
    
    if [[ ! -f "$script" ]]; then
        error "Deploy script not found: $script"
        return 1
    fi
    
    if [[ ! -x "$script" ]]; then
        error "Deploy script is not executable: $script"
        return 1
    fi
    
    # Check for required functions
    local required_functions=("build_project" "deploy_files" "configure_nginx")
    for func in "${required_functions[@]}"; do
        if ! grep -q "$func" "$script"; then
            error "Missing required function in deploy script: $func"
            return 1
        fi
    done
    
    success "Deploy script is valid"
}

# Test 3: Check Docker configuration
test_docker_config() {
    log "Testing Docker configuration..."
    
    local dockerfile="deployment/docker/Dockerfile"
    local compose_file="deployment/docker/docker-compose.yml"
    
    if [[ ! -f "$dockerfile" ]]; then
        error "Dockerfile not found: $dockerfile"
        return 1
    fi
    
    if [[ ! -f "$compose_file" ]]; then
        error "Docker Compose file not found: $compose_file"
        return 1
    fi
    
    # Check for required Docker directives
    if ! grep -q "EXPOSE 4600" "$dockerfile"; then
        error "Dockerfile doesn't expose port 4600"
        return 1
    fi
    
    if ! grep -q "4600:4600" "$compose_file"; then
        error "Docker Compose doesn't map port 4600"
        return 1
    fi
    
    success "Docker configuration is valid"
}

# Test 4: Verify project can build
test_build() {
    log "Testing project build..."
    
    if [[ ! -f "package.json" ]]; then
        error "package.json not found"
        return 1
    fi
    
    # Check if dist directory exists (from previous build)
    if [[ ! -d "dist" ]]; then
        log "No existing build found, running build test..."
        
        if ! npm run build &>/dev/null; then
            error "Project build failed"
            return 1
        fi
    fi
    
    # Verify key files exist in dist
    local required_files=("index.html" "_astro")
    for file in "${required_files[@]}"; do
        if [[ ! -e "dist/$file" ]]; then
            error "Missing required build file: dist/$file"
            return 1
        fi
    done
    
    success "Project builds successfully"
}

# Test 5: Check port availability simulation
test_port_config() {
    log "Testing port configuration..."
    
    # Check if port 4600 is mentioned in configs
    local files=("deployment/nginx/freeformathub.conf" "deployment/docker/docker-compose.yml")
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]] && ! grep -q "4600" "$file"; then
            error "Port 4600 not configured in $file"
            return 1
        fi
    done
    
    success "Port 4600 correctly configured in all files"
}

# Test 6: Validate security headers
test_security_headers() {
    log "Testing security headers configuration..."
    
    local config_file="deployment/nginx/freeformathub.conf"
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Content-Security-Policy"
    )
    
    for header in "${security_headers[@]}"; do
        if ! grep -q "$header" "$config_file"; then
            error "Missing security header: $header"
            return 1
        fi
    done
    
    success "Security headers are properly configured"
}

# Test 7: Check file structure
test_file_structure() {
    log "Testing deployment file structure..."
    
    local required_dirs=("deployment/nginx" "deployment/docker" "scripts")
    local required_files=(
        "scripts/deploy.sh"
        "scripts/setup-nginx.sh"
        "scripts/docker-deploy.sh"
        "deployment/nginx/freeformathub.conf"
        "deployment/docker/Dockerfile"
        "deployment/docker/docker-compose.yml"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            error "Missing directory: $dir"
            return 1
        fi
    done
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Missing file: $file"
            return 1
        fi
    done
    
    success "File structure is correct"
}

# Run all tests
main() {
    echo "🧪 FreeFormatHub Nginx Configuration Tests"
    echo "=========================================="
    echo ""
    
    local tests=(
        "test_file_structure"
        "test_nginx_config"
        "test_deploy_script"
        "test_docker_config"
        "test_build"
        "test_port_config"
        "test_security_headers"
    )
    
    local passed=0
    local total=${#tests[@]}
    
    for test in "${tests[@]}"; do
        if $test; then
            ((passed++))
        fi
        echo ""
    done
    
    echo "=========================================="
    echo "Test Results: $passed/$total tests passed"
    
    if [[ $passed -eq $total ]]; then
        success "All tests passed! 🎉"
        echo ""
        echo "Your Nginx deployment configuration is ready!"
        echo ""
        echo "Next steps:"
        echo "1. Run: sudo ./scripts/setup-nginx.sh"
        echo "2. Run: sudo ./scripts/deploy.sh"
        echo "3. Access: http://localhost:4600"
        echo ""
        echo "Or use Docker:"
        echo "1. Run: ./scripts/docker-deploy.sh"
        echo "2. Access: http://localhost:4600"
        
        return 0
    else
        error "Some tests failed. Please fix the issues above."
        return 1
    fi
}

main "$@"