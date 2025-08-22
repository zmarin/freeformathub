import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ImageFormatConverterConfig {
  outputFormat: 'PNG' | 'JPEG' | 'WEBP' | 'BMP' | 'GIF';
  quality: number; // 1-100 for lossy formats
  resizeWidth?: number;
  resizeHeight?: number;
  maintainAspectRatio: boolean;
  backgroundColor: string; // For formats that don't support transparency
  removeMetadata: boolean;
  compression: 'none' | 'low' | 'medium' | 'high';
  enableProgressive: boolean; // For JPEG
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: {
    originalFormat: string;
    originalSize: { width: number; height: number };
    newSize: { width: number; height: number };
    fileSizeReduction: number;
    processingTime: number;
  };
}

// Helper function to detect image format from data URL
function detectImageFormat(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  if (dataUrl.startsWith('data:image/bmp')) return 'BMP';
  if (dataUrl.startsWith('data:image/gif')) return 'GIF';
  return 'Unknown';
}

// Helper function to calculate file size from base64 data
function calculateBase64Size(base64: string): number {
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

// Canvas-based image processing
function processImageOnCanvas(
  img: HTMLImageElement, 
  config: ImageFormatConverterConfig
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let { width, height } = img;
      
      // Handle resizing
      if (config.resizeWidth || config.resizeHeight) {
        if (config.maintainAspectRatio) {
          if (config.resizeWidth && config.resizeHeight) {
            const aspectRatio = img.width / img.height;
            const targetAspectRatio = config.resizeWidth / config.resizeHeight;
            
            if (aspectRatio > targetAspectRatio) {
              width = config.resizeWidth;
              height = config.resizeWidth / aspectRatio;
            } else {
              height = config.resizeHeight;
              width = config.resizeHeight * aspectRatio;
            }
          } else if (config.resizeWidth) {
            width = config.resizeWidth;
            height = (config.resizeWidth / img.width) * img.height;
          } else if (config.resizeHeight) {
            height = config.resizeHeight;
            width = (config.resizeHeight / img.height) * img.width;
          }
        } else {
          width = config.resizeWidth || img.width;
          height = config.resizeHeight || img.height;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Set background color for formats that don't support transparency
      if (config.outputFormat === 'JPEG' || config.outputFormat === 'BMP') {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply image smoothing based on compression setting
      ctx.imageSmoothingEnabled = config.compression !== 'none';
      ctx.imageSmoothingQuality = config.compression === 'high' ? 'high' : 
                                 config.compression === 'medium' ? 'medium' : 'low';

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to desired format
      let mimeType: string;
      let quality: number | undefined;

      switch (config.outputFormat) {
        case 'PNG':
          mimeType = 'image/png';
          break;
        case 'JPEG':
          mimeType = 'image/jpeg';
          quality = config.quality / 100;
          break;
        case 'WEBP':
          mimeType = 'image/webp';
          quality = config.quality / 100;
          break;
        case 'BMP':
          // Canvas doesn't natively support BMP, we'll use PNG
          mimeType = 'image/png';
          break;
        case 'GIF':
          // Canvas doesn't support GIF encoding, we'll use PNG
          mimeType = 'image/png';
          break;
        default:
          mimeType = 'image/png';
      }

      const dataUrl = canvas.toDataURL(mimeType, quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

export function processImageFormatConverter(input: string, config: ImageFormatConverterConfig): Promise<ToolResult> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    try {
      // Validate input
      if (!input.trim()) {
        resolve({
          success: false,
          error: 'Please provide an image file or data URL'
        });
        return;
      }

      // Handle different input types
      let imageDataUrl: string;
      
      if (input.startsWith('data:image/')) {
        // Already a data URL
        imageDataUrl = input;
      } else {
        // Assume it's a base64 string, try to create a data URL
        try {
          // Try to detect format from the input or default to PNG
          imageDataUrl = `data:image/png;base64,${input}`;
        } catch {
          resolve({
            success: false,
            error: 'Invalid image data. Please provide a data URL (data:image/...) or base64 image data.'
          });
          return;
        }
      }

      const originalFormat = detectImageFormat(imageDataUrl);
      const originalBase64 = imageDataUrl.split(',')[1];
      const originalSize = calculateBase64Size(originalBase64);

      // Create image element
      const img = new Image();
      
      img.onload = async () => {
        try {
          const processedDataUrl = await processImageOnCanvas(img, config);
          const newBase64 = processedDataUrl.split(',')[1];
          const newSize = calculateBase64Size(newBase64);
          const endTime = performance.now();
          
          const fileSizeReduction = ((originalSize - newSize) / originalSize) * 100;

          resolve({
            success: true,
            output: processedDataUrl,
            metadata: {
              originalFormat,
              originalSize: { width: img.naturalWidth, height: img.naturalHeight },
              newSize: { width: img.width, height: img.height },
              fileSizeReduction: Math.round(fileSizeReduction * 100) / 100,
              processingTime: Math.round((endTime - startTime) * 100) / 100
            }
          });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process image'
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
      
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert image format'
      });
    }
  });
}

export const IMAGE_FORMAT_CONVERTER_TOOL: Tool = {
  id: 'image-format-converter',
  name: 'Image Format Converter',
  description: 'Convert images between different formats (PNG, JPEG, WebP, BMP, GIF) with compression, resizing, and optimization options. Process images entirely in your browser.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'images-media')!,
  slug: 'image-format-converter',
  icon: '🖼️',
  keywords: ['image', 'convert', 'format', 'png', 'jpeg', 'webp', 'compression', 'resize'],
  seoTitle: 'Image Format Converter - Convert PNG, JPEG, WebP Online | FreeFormatHub',
  seoDescription: 'Convert images between PNG, JPEG, WebP, BMP, and GIF formats online. Compress, resize, and optimize images with customizable quality settings.',
  
  examples: [
    {
      title: 'PNG to JPEG Conversion',
      input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      output: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      description: 'Convert PNG image to JPEG format with compression'
    },
    {
      title: 'Image Resizing',
      input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      output: '[Resized image data]',
      description: 'Resize image while maintaining aspect ratio'
    },
    {
      title: 'WebP Optimization',
      input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      output: '[WebP optimized data]',
      description: 'Convert to WebP format for better compression'
    }
  ],

  useCases: [
    'Web optimization and performance improvement',
    'Social media image preparation',
    'Email attachment size reduction',
    'Website image format standardization',
    'Mobile app image optimization',
    'Print preparation and format conversion',
    'Batch image processing workflows',
    'Legacy format compatibility'
  ],

  faq: [
    {
      question: 'What image formats are supported?',
      answer: 'The tool supports PNG, JPEG, WebP, BMP, and GIF formats for both input and output. Note that GIF and BMP output may be converted to PNG due to browser limitations.'
    },
    {
      question: 'How does image compression work?',
      answer: 'Compression reduces file size by removing unnecessary data. JPEG and WebP support lossy compression (quality 1-100), while PNG uses lossless compression. Higher quality settings preserve more detail but create larger files.'
    },
    {
      question: 'Can I resize images while converting?',
      answer: 'Yes! You can specify new width and/or height dimensions. Enable "Maintain Aspect Ratio" to prevent distortion, or disable it for exact dimensions.'
    },
    {
      question: 'What happens to image metadata?',
      answer: 'You can choose to remove metadata (EXIF data) during conversion to reduce file size and protect privacy. This includes camera settings, location data, and timestamps.'
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Processing happens in your browser, so limits depend on your device\'s memory. Very large images may cause performance issues or fail to process.'
    }
  ],

  commonErrors: [
    'Invalid image format or corrupted data',
    'Image too large for browser processing',
    'Unsupported image features',
    'Canvas rendering limitations'
  ],

  relatedTools: ['image-optimizer', 'base64-image-encoder', 'color-converter']
};