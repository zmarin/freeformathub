#!/usr/bin/env node

/**
 * Creates a minimal ICO file with a single 16x16 icon
 * This is a basic implementation for favicon.ico compatibility
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

// Create a minimal 16x16 bitmap representation of our 2x2 dot pattern
// ICO format structure: Header + Directory Entry + Bitmap

// ICO Header (6 bytes)
const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved (2 bytes)
  0x01, 0x00, // Type: 1 = ICO (2 bytes)
  0x01, 0x00  // Number of images (2 bytes)
]);

// Directory Entry (16 bytes)
const directoryEntry = Buffer.from([
  0x10,       // Width: 16px
  0x10,       // Height: 16px
  0x00,       // Color count (0 = no palette)
  0x00,       // Reserved
  0x01, 0x00, // Color planes
  0x20, 0x00, // Bits per pixel (32 = RGBA)
  0x40, 0x04, 0x00, 0x00, // Size of image data (1088 bytes)
  0x16, 0x00, 0x00, 0x00  // Offset to image data (22 bytes)
]);

// Bitmap Header (40 bytes)
const bitmapHeader = Buffer.from([
  0x28, 0x00, 0x00, 0x00, // Header size (40)
  0x10, 0x00, 0x00, 0x00, // Width (16)
  0x20, 0x00, 0x00, 0x00, // Height (32 = 16*2 for ICO format)
  0x01, 0x00,             // Color planes (1)
  0x20, 0x00,             // Bits per pixel (32)
  0x00, 0x00, 0x00, 0x00, // Compression (0 = none)
  0x00, 0x04, 0x00, 0x00, // Image size (1024 bytes)
  0x00, 0x00, 0x00, 0x00, // X pixels per meter
  0x00, 0x00, 0x00, 0x00, // Y pixels per meter
  0x00, 0x00, 0x00, 0x00, // Colors used
  0x00, 0x00, 0x00, 0x00  // Important colors
]);

// Create a 16x16 RGBA bitmap with our 2x2 dot pattern
const bitmap = Buffer.alloc(16 * 32 * 4); // 16x32 pixels * 4 bytes (RGBA)

// Define colors (BGRA format for ICO)
const colors = {
  transparent: [0x00, 0x00, 0x00, 0x00],
  red: [0x44, 0x44, 0xef, 0xff],          // #ef4444
  orange: [0x16, 0x73, 0xf9, 0xff],       // #f97316
  green: [0x5e, 0xc5, 0x22, 0xff],        // #22c55e
  blue: [0xf6, 0x82, 0x3b, 0xff]          // #3b82f6
};

// Fill bitmap with transparent background
for (let i = 0; i < bitmap.length; i += 4) {
  bitmap[i] = 0x00;     // B
  bitmap[i + 1] = 0x00; // G
  bitmap[i + 2] = 0x00; // R
  bitmap[i + 3] = 0x00; // A
}

// Draw 2x2 dot pattern (centered in 16x16)
function setPixel(x, y, color) {
  // ICO bitmaps are stored bottom-up, so flip Y
  const flippedY = 31 - y;
  const index = (flippedY * 16 + x) * 4;
  if (index >= 0 && index < bitmap.length - 3) {
    bitmap[index] = color[0];     // B
    bitmap[index + 1] = color[1]; // G
    bitmap[index + 2] = color[2]; // R
    bitmap[index + 3] = color[3]; // A
  }
}

// Draw dots (2x2 pixels each, centered)
// Top-left (red) - position (5,5) to (6,6)
for (let x = 5; x <= 6; x++) {
  for (let y = 5; y <= 6; y++) {
    setPixel(x, y, colors.red);
  }
}

// Top-right (orange) - position (9,5) to (10,6)
for (let x = 9; x <= 10; x++) {
  for (let y = 5; y <= 6; y++) {
    setPixel(x, y, colors.orange);
  }
}

// Bottom-left (green) - position (5,9) to (6,10)
for (let x = 5; x <= 6; x++) {
  for (let y = 9; y <= 10; y++) {
    setPixel(x, y, colors.green);
  }
}

// Bottom-right (blue) - position (9,9) to (10,10)
for (let x = 9; x <= 10; x++) {
  for (let y = 9; y <= 10; y++) {
    setPixel(x, y, colors.blue);
  }
}

// AND mask (all transparent, 16x16 bits = 32 bytes)
const andMask = Buffer.alloc(32, 0x00);

// Combine all parts
const icoFile = Buffer.concat([
  icoHeader,
  directoryEntry,
  bitmapHeader,
  bitmap,
  andMask
]);

try {
  const outputPath = join(process.cwd(), 'public', 'favicon.ico');
  writeFileSync(outputPath, icoFile);
  console.log('✓ Created favicon.ico');
  console.log(`Icon size: ${icoFile.length} bytes`);
} catch (error) {
  console.error('Error creating ICO file:', error);
  process.exit(1);
}