#!/bin/bash

# Generate sitemap for FreeFormatHub
# Run this after building the site

DOMAIN="${1:-https://freeformathub.com}"
DIST_DIR="dist"
SITEMAP_FILE="$DIST_DIR/sitemap.xml"

if [[ ! -d "$DIST_DIR" ]]; then
    echo "Error: $DIST_DIR directory not found. Please run 'npm run build' first."
    exit 1
fi

echo "Generating sitemap for $DOMAIN..."

# Create main sitemap
cat > "$SITEMAP_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Homepage -->
    <url>
        <loc>$DOMAIN/</loc>
        <lastmod>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    
    <!-- Tools -->
    <url>
        <loc>$DOMAIN/json-formatter/</loc>
        <lastmod>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    
    <url>
        <loc>$DOMAIN/base64-encoder/</loc>
        <lastmod>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    
    <!-- Categories -->
    <url>
        <loc>$DOMAIN/categories/formatters/</loc>
        <lastmod>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    
    <url>
        <loc>$DOMAIN/categories/encoders/</loc>
        <lastmod>$(date -u +%Y-%m-%dT%H:%M:%S+00:00)</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    
    <!-- Add more tool URLs as they are created -->
    
</urlset>
EOF

echo "✅ Sitemap generated: $SITEMAP_FILE"

# Validate sitemap
if command -v xmllint &> /dev/null; then
    if xmllint --noout "$SITEMAP_FILE" 2>/dev/null; then
        echo "✅ Sitemap is valid XML"
    else
        echo "❌ Sitemap validation failed"
        exit 1
    fi
fi

echo "🌐 Sitemap available at: $DOMAIN/sitemap.xml"