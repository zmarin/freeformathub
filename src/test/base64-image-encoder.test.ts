import { describe, it, expect, beforeAll } from 'vitest';
import { processImageToBase64, type Base64ImageEncoderConfig } from '../tools/base64-image-encoder';

// Create mock image files for testing
function createMockImageFile(name: string, mimeType: string, size: number): File {
  // Create a simple PNG-like data for testing
  const data = new Uint8Array(size);
  data.fill(Math.floor(Math.random() * 256));
  
  return new File([data], name, { type: mimeType });
}

describe('Base64 Image Encoder', () => {
  const defaultConfig: Base64ImageEncoderConfig = {
    outputFormat: 'data-uri',
    includeFileInfo: false,
    maxFileSizeWarning: 100 * 1024, // 100KB
  };

  let smallPngFile: File;
  let largePngFile: File;
  let jpgFile: File;
  let svgFile: File;

  beforeAll(() => {
    // Create mock image files
    smallPngFile = createMockImageFile('test-small.png', 'image/png', 1024); // 1KB
    largePngFile = createMockImageFile('test-large.png', 'image/png', 200 * 1024); // 200KB
    jpgFile = createMockImageFile('test.jpg', 'image/jpeg', 5 * 1024); // 5KB
    svgFile = new File(['<svg><rect/></svg>'], 'test.svg', { type: 'image/svg+xml' });
  });

  describe('Input validation', () => {
    it('should reject non-image files', async () => {
      const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const result = await processImageToBase64(textFile, defaultConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File must be an image');
    });

    it('should reject files larger than warning size', async () => {
      const result = await processImageToBase64(largePngFile, defaultConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Large file detected');
      expect(result.error).toContain('MB');
    });

    it('should handle null/undefined file', async () => {
      const result = await processImageToBase64(null as any, defaultConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No file provided');
    });
  });

  describe('Output formats', () => {
    it('should generate data URI format', async () => {
      const config = { ...defaultConfig, outputFormat: 'data-uri' as const };
      const result = await processImageToBase64(smallPngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate raw base64 format', async () => {
      const config = { ...defaultConfig, outputFormat: 'raw' as const };
      const result = await processImageToBase64(smallPngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toMatch(/^data:/);
      // Base64 should only contain valid characters
      expect(result.output).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    it('should generate CSS background-image format', async () => {
      const config = { ...defaultConfig, outputFormat: 'css' as const };
      const result = await processImageToBase64(smallPngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/^background-image: url\('data:image\/png;base64,/);
      expect(result.output).toMatch(/'\);$/);
    });

    it('should generate HTML img tag format', async () => {
      const config = { ...defaultConfig, outputFormat: 'html' as const };
      const result = await processImageToBase64(smallPngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/^<img src="data:image\/png;base64,/);
      expect(result.output).toMatch(/alt="test-small\.png" \/>$/);
    });
  });

  describe('File information', () => {
    it('should include file info when requested', async () => {
      const config = { ...defaultConfig, includeFileInfo: true };
      const result = await processImageToBase64(smallPngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('/* File: test-small.png */');
      expect(result.output).toContain('/* Original size:');
      expect(result.output).toContain('/* Encoded size:');
      expect(result.output).toContain('/* MIME type: image/png */');
    });

    it('should not include file info by default', async () => {
      const result = await processImageToBase64(smallPngFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('/* File:');
    });

    it('should provide image processing information', async () => {
      const result = await processImageToBase64(smallPngFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.imageInfo).toBeDefined();
      expect(result.imageInfo!.originalSize).toBe(1024);
      expect(result.imageInfo!.mimeType).toBe('image/png');
      expect(result.imageInfo!.filename).toBe('test-small.png');
      expect(result.imageInfo!.compressionRatio).toBeGreaterThan(1); // Base64 increases size
    });
  });

  describe('Different image types', () => {
    it('should handle PNG images', async () => {
      const result = await processImageToBase64(smallPngFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('data:image/png;base64,');
      expect(result.imageInfo!.mimeType).toBe('image/png');
    });

    it('should handle JPEG images', async () => {
      const result = await processImageToBase64(jpgFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('data:image/jpeg;base64,');
      expect(result.imageInfo!.mimeType).toBe('image/jpeg');
    });

    it('should handle SVG images', async () => {
      const result = await processImageToBase64(svgFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.output).toContain('data:image/svg+xml;base64,');
      expect(result.imageInfo!.mimeType).toBe('image/svg+xml');
    });
  });

  describe('Size calculations', () => {
    it('should calculate compression ratio correctly', async () => {
      const result = await processImageToBase64(smallPngFile, defaultConfig);
      
      expect(result.success).toBe(true);
      expect(result.imageInfo!.compressionRatio).toBeCloseTo(1.33, 1); // ~33% increase
    });

    it('should handle different file sizes', async () => {
      const config = { ...defaultConfig, maxFileSizeWarning: 300 * 1024 }; // Increase limit
      const result = await processImageToBase64(largePngFile, config);
      
      expect(result.success).toBe(true);
      expect(result.imageInfo!.originalSize).toBe(200 * 1024);
      expect(result.imageInfo!.encodedSize).toBeGreaterThan(200 * 1024);
    });
  });

  describe('Error handling', () => {
    it('should handle file reading errors gracefully', async () => {
      // Create a mock file that will cause reading issues
      const corruptFile = new File([''], 'corrupt.png', { type: 'image/png' });
      const result = await processImageToBase64(corruptFile, defaultConfig);
      
      // Should still succeed as FileReader can handle empty files
      expect(result.success).toBe(true);
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        ...defaultConfig,
        outputFormat: 'invalid' as any,
      };
      
      const result = await processImageToBase64(smallPngFile, invalidConfig);
      expect(result.success).toBe(true); // Should fallback to default case
    });
  });

  describe('Configuration options', () => {
    it('should respect maxFileSizeWarning setting', async () => {
      const strictConfig = { ...defaultConfig, maxFileSizeWarning: 500 }; // 500 bytes
      const result = await processImageToBase64(smallPngFile, strictConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Large file detected');
    });

    it('should allow larger files when limit is increased', async () => {
      const lenientConfig = { ...defaultConfig, maxFileSizeWarning: 1000 * 1024 }; // 1MB
      const result = await processImageToBase64(largePngFile, lenientConfig);
      
      expect(result.success).toBe(true);
    });
  });
});