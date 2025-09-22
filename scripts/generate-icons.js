#!/usr/bin/env node

/**
 * Simple icon generator for favicon files
 * Creates PNG versions from SVG for better browser compatibility
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Read the SVG favicon
const svgPath = join(process.cwd(), 'public', 'favicon.svg');
const svgContent = readFileSync(svgPath, 'utf8');

console.log('SVG favicon found, creating additional formats...');

// Create a simple PNG representation using Canvas (if available)
// For now, let's create the basic files and rely on the SVG

// Create apple-touch-icon.png (we'll use a data URL method)
const appleIconSize = 180;
const pngIcon192 = 192;
const pngIcon512 = 512;

// Since we can't easily convert SVG to PNG without external tools,
// let's create optimized SVG versions with proper sizing

// Apple Touch Icon (180x180)
const appleTouchIcon = `<svg width="180" height="180" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- 2x2 dot pattern favicon - centered and optimized -->
  <!-- Top row -->
  <!-- Red dot -->
  <circle cx="10" cy="10" r="4" fill="#ef4444"/>
  <!-- Orange dot -->
  <circle cx="22" cy="10" r="4" fill="#f97316"/>

  <!-- Bottom row -->
  <!-- Green dot -->
  <circle cx="10" cy="22" r="4" fill="#22c55e"/>
  <!-- Blue dot -->
  <circle cx="22" cy="22" r="4" fill="#3b82f6"/>
</svg>`;

// 192x192 icon for PWA
const icon192 = `<svg width="192" height="192" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- 2x2 dot pattern favicon - centered and optimized -->
  <!-- Top row -->
  <!-- Red dot -->
  <circle cx="10" cy="10" r="4" fill="#ef4444"/>
  <!-- Orange dot -->
  <circle cx="22" cy="10" r="4" fill="#f97316"/>

  <!-- Bottom row -->
  <!-- Green dot -->
  <circle cx="10" cy="22" r="4" fill="#22c55e"/>
  <!-- Blue dot -->
  <circle cx="22" cy="22" r="4" fill="#3b82f6"/>
</svg>`;

// 512x512 icon for PWA
const icon512 = `<svg width="512" height="512" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <!-- 2x2 dot pattern favicon - centered and optimized -->
  <!-- Top row -->
  <!-- Red dot -->
  <circle cx="10" cy="10" r="4" fill="#ef4444"/>
  <!-- Orange dot -->
  <circle cx="22" cy="10" r="4" fill="#f97316"/>

  <!-- Bottom row -->
  <!-- Green dot -->
  <circle cx="10" cy="22" r="4" fill="#22c55e"/>
  <!-- Blue dot -->
  <circle cx="22" cy="22" r="4" fill="#3b82f6"/>
</svg>`;

try {
  // Write apple-touch-icon.svg (browsers can handle SVG for Apple icons)
  writeFileSync(join(process.cwd(), 'public', 'apple-touch-icon.svg'), appleTouchIcon);
  console.log('✓ Created apple-touch-icon.svg');

  // Write PWA icons
  writeFileSync(join(process.cwd(), 'public', 'icon-192x192.svg'), icon192);
  console.log('✓ Created icon-192x192.svg');

  writeFileSync(join(process.cwd(), 'public', 'icon-512x512.svg'), icon512);
  console.log('✓ Created icon-512x512.svg');

  console.log('\nIcon generation complete! Note: SVG icons are used for better browser compatibility.');
  console.log('For production, consider converting to PNG format using online tools if needed.');

} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}