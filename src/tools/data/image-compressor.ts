import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ImageCompressorConfig {
  compressionLevel: 'low' | 'medium' | 'high' | 'custom';
  quality: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  format: 'auto' | 'jpeg' | 'webp' | 'png';
  removeMetadata: boolean;
  enableProgressive: boolean;
  targetFileSize?: number; // KB
  autoOptimize: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: {
    originalSize: number; // bytes
    compressedSize: number; // bytes
    compressionRatio: number; // percentage
    originalDimensions: { width: number; height: number };
    newDimensions: { width: number; height: number };
    format: string;
    processingTime: number;
    qualityUsed: number;
  };
}

// Calculate file size from base64 data
function calculateBase64Size(base64: string): number {
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

// Detect optimal compression settings
function getOptimalSettings(
  originalSize: number,
  targetSize: number | undefined,
  config: ImageCompressorConfig
): { quality: number; maxWidth?: number; maxHeight?: number } {
  let quality = config.quality;
  let maxWidth = config.maxWidth;
  let maxHeight = config.maxHeight;

  if (config.autoOptimize) {
    // Auto-adjust quality based on original size
    if (originalSize > 2000000) { // > 2MB
      quality = Math.min(quality, 70);
    } else if (originalSize > 1000000) { // > 1MB
      quality = Math.min(quality, 80);
    } else if (originalSize > 500000) { // > 500KB
      quality = Math.min(quality, 85);
    }

    // Auto-resize large images
    if (!maxWidth && !maxHeight) {
      if (originalSize > 3000000) { // > 3MB
        maxWidth = 1920;
        maxHeight = 1080;
      } else if (originalSize > 1000000) { // > 1MB
        maxWidth = 2560;
        maxHeight = 1440;
      }
    }
  }

  // Adjust for target file size
  if (targetSize && targetSize < originalSize / 1024) {
    const compressionNeeded = (targetSize * 1024) / originalSize;
    quality = Math.max(10, quality * compressionNeeded);
  }

  return { quality, maxWidth, maxHeight };
}

// Process image with compression
async function compressImageOnCanvas(
  img: HTMLImageElement,
  config: ImageCompressorConfig
): Promise<{ dataUrl: string; metadata: any }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const originalSize = img.naturalWidth * img.naturalHeight * 4; // Rough estimate
      const optimalSettings = getOptimalSettings(originalSize, config.targetFileSize, config);

      let { width, height } = { 
        width: img.naturalWidth, 
        height: img.naturalHeight 
      };

      // Apply resizing constraints
      if (optimalSettings.maxWidth || optimalSettings.maxHeight) {
        const maxW = optimalSettings.maxWidth || width;
        const maxH = optimalSettings.maxHeight || height;

        if (config.maintainAspectRatio) {
          const aspectRatio = width / height;
          if (width > maxW || height > maxH) {
            if (width / maxW > height / maxH) {
              width = maxW;
              height = maxW / aspectRatio;
            } else {
              height = maxH;
              width = maxH * aspectRatio;
            }
          }
        } else {
          width = Math.min(width, maxW);
          height = Math.min(height, maxH);
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Apply compression-based rendering options
      if (config.compressionLevel !== 'low') {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = config.compressionLevel === 'high' ? 'high' : 'medium';
      }

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      let mimeType: string;
      let quality: number | undefined;

      if (config.format === 'auto') {
        // Auto-detect best format based on image characteristics
        const imageData = ctx.getImageData(0, 0, Math.min(100, width), Math.min(100, height));
        const hasTransparency = imageData.data.some((_, i) => i % 4 === 3 && imageData.data[i] < 255);
        
        if (hasTransparency) {
          mimeType = 'image/png';
        } else {
          // Use WebP if supported, otherwise JPEG
          mimeType = 'image/webp';
          quality = optimalSettings.quality / 100;
        }
      } else if (config.format === 'jpeg') {
        mimeType = 'image/jpeg';
        quality = optimalSettings.quality / 100;
      } else if (config.format === 'webp') {
        mimeType = 'image/webp';
        quality = optimalSettings.quality / 100;
      } else {
        mimeType = 'image/png';
      }

      const dataUrl = canvas.toDataURL(mimeType, quality);
      
      resolve({
        dataUrl,
        metadata: {
          newDimensions: { width, height },
          format: mimeType.split('/')[1],
          qualityUsed: optimalSettings.quality
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function processImageCompression(
  input: string,
  config: ImageCompressorConfig
): Promise<ToolResult> {
  const startTime = performance.now();

  try {
    // Validate input
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide an image file or data URL'
      };
    }

    // Handle different input types
    let imageDataUrl: string;
    
    if (input.startsWith('data:image/')) {
      imageDataUrl = input;
    } else {
      // Try to create a data URL from base64
      try {
        imageDataUrl = `data:image/png;base64,${input}`;
      } catch {
        return {
          success: false,
          error: 'Invalid image data. Please provide a data URL or base64 image data.'
        };
      }
    }

    const originalBase64 = imageDataUrl.split(',')[1];
    const originalSize = calculateBase64Size(originalBase64);

    // Load and process image
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          const result = await compressImageOnCanvas(img, config);
          const compressedBase64 = result.dataUrl.split(',')[1];
          const compressedSize = calculateBase64Size(compressedBase64);
          const endTime = performance.now();

          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

          const metadata = {
            originalSize,
            compressedSize,
            compressionRatio: Math.round(compressionRatio * 100) / 100,
            originalDimensions: { 
              width: img.naturalWidth, 
              height: img.naturalHeight 
            },
            newDimensions: result.metadata.newDimensions,
            format: result.metadata.format,
            processingTime: Math.round((endTime - startTime) * 100) / 100,
            qualityUsed: result.metadata.qualityUsed
          };

          let outputText = `# Image Compression Complete\n\n`;
          outputText += `## 📊 Compression Results\n\n`;
          outputText += `**Original Size:** ${(originalSize / 1024).toFixed(1)} KB\n`;
          outputText += `**Compressed Size:** ${(compressedSize / 1024).toFixed(1)} KB\n`;
          outputText += `**Size Reduction:** ${compressionRatio.toFixed(1)}% smaller\n`;
          outputText += `**Quality Used:** ${result.metadata.qualityUsed}%\n`;
          outputText += `**Processing Time:** ${metadata.processingTime}ms\n\n`;
          
          outputText += `## 📐 Dimensions\n\n`;
          outputText += `**Original:** ${metadata.originalDimensions.width} × ${metadata.originalDimensions.height}px\n`;
          outputText += `**New:** ${metadata.newDimensions.width} × ${metadata.newDimensions.height}px\n\n`;
          
          outputText += `## 🎯 Optimization Details\n\n`;
          outputText += `**Output Format:** ${result.metadata.format.toUpperCase()}\n`;
          outputText += `**Compression Level:** ${config.compressionLevel}\n`;
          if (config.removeMetadata) {
            outputText += `**Metadata:** Removed for privacy and size reduction\n`;
          }
          
          resolve({
            success: true,
            output: result.dataUrl,
            metadata
          });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to compress image'
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image. Please check that the image data is valid.'
        });
      };

      img.src = imageDataUrl;
    });

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compress image'
    };
  }
}

export const IMAGE_COMPRESSOR_TOOL: Tool = {
  id: 'image-compressor',
  name: 'Image Compressor',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'image-processing')!,
  slug: 'image-compressor',
  icon: '🗜️',
  keywords: ['image', 'compress', 'optimize', 'reduce', 'size', 'quality', 'jpeg', 'webp', 'png'],
  seoTitle: 'Image Compressor - Reduce Image File Size Online | FreeFormatHub',
  seoDescription: 'Compress and optimize images online. Reduce file size while maintaining quality. Support for JPEG, PNG, WebP with custom compression settings.',
  description: 'Compress and optimize images to reduce file size while maintaining visual quality. Advanced compression algorithms with customizable settings for web optimization.',

  examples: [
    {
      title: 'High-Quality Compression',
      input: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2...',
      output: `# Image Compression Complete

## 📊 Compression Results

**Original Size:** 450.2 KB
**Compressed Size:** 127.8 KB
**Size Reduction:** 71.6% smaller
**Quality Used:** 80%
**Processing Time:** 156ms

## 📐 Dimensions

**Original:** 1920 × 1080px
**New:** 1920 × 1080px`,
      description: 'Compress a large image while maintaining dimensions and good quality'
    },
    {
      title: 'Aggressive Compression',
      input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...',
      output: `# Image Compression Complete

## 📊 Compression Results

**Original Size:** 2.1 MB
**Compressed Size:** 189.3 KB
**Size Reduction:** 91.2% smaller
**Quality Used:** 60%
**Processing Time:** 289ms`,
      description: 'Maximum compression for web optimization with size constraints'
    }
  ],

  useCases: [
    'Website performance optimization',
    'Email attachment size reduction',
    'Social media image preparation',
    'Mobile app image optimization',
    'Bulk image processing for web galleries',
    'Storage space conservation',
    'Bandwidth usage reduction',
    'SEO performance improvement'
  ],

  faq: [
    {
      question: 'How much can I compress an image?',
      answer: 'Compression depends on the original format and content. JPEG images can typically be compressed by 60-90%, while PNG compression varies. The tool automatically suggests optimal settings.'
    },
    {
      question: 'Will compression affect image quality?',
      answer: 'Yes, lossy compression (JPEG, WebP) trades quality for smaller file sizes. Use higher quality settings (80-95%) for important images, or lower settings (50-70%) for web thumbnails.'
    },
    {
      question: 'What\'s the difference between compression levels?',
      answer: 'Low: Minimal compression, best quality. Medium: Balanced compression and quality. High: Maximum compression, smaller files. Custom: Full control over all settings.'
    },
    {
      question: 'Should I remove metadata?',
      answer: 'Removing EXIF metadata reduces file size and protects privacy by removing camera settings, timestamps, and location data. Enable this for web publishing.'
    },
    {
      question: 'Which format gives the best compression?',
      answer: 'WebP offers the best compression for most images. JPEG is good for photos. PNG is best for images with transparency or few colors. The auto-format option chooses optimally.'
    }
  ],

  commonErrors: [
    'Image file too large for browser processing',
    'Unsupported image format or corrupted data',
    'Target file size too small for reasonable quality',
    'Browser memory limitations with very large images'
  ],

  relatedTools: ['image-format-converter', 'image-resizer', 'base64-image-encoder', 'svg-optimizer']
};