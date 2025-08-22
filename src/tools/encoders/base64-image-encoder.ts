import type { Tool, ToolResult, ToolConfig } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface Base64ImageEncoderConfig extends ToolConfig {
  outputFormat: 'data-uri' | 'raw' | 'css' | 'html';
  includeFileInfo: boolean;
  maxFileSizeWarning: number; // in bytes
}

export interface ImageProcessingResult {
  originalSize: number;
  encodedSize: number;
  mimeType: string;
  filename: string;
  compressionRatio: number;
}

export function processImageToBase64(
  file: File,
  config: Base64ImageEncoderConfig
): Promise<ToolResult & { imageInfo?: ImageProcessingResult }> {
  return new Promise((resolve) => {
    if (!file) {
      resolve({
        success: false,
        error: 'No file provided'
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      resolve({
        success: false,
        error: 'File must be an image (PNG, JPG, GIF, SVG, WebP, etc.)'
      });
      return;
    }

    // Check file size warning
    if (file.size > config.maxFileSizeWarning) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const warningMessage = `Large file detected (${sizeMB}MB). Base64 encoding increases size by ~33%. Consider optimizing the image first.`;
      
      resolve({
        success: false,
        error: warningMessage
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        if (!result) {
          resolve({
            success: false,
            error: 'Failed to read file'
          });
          return;
        }

        // Extract base64 data (remove data URI prefix if present)
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        const mimeType = file.type;
        
        // Calculate sizes and compression ratio
        const originalSize = file.size;
        const encodedSize = base64Data.length;
        const compressionRatio = encodedSize / originalSize;

        let output = '';
        
        switch (config.outputFormat) {
          case 'data-uri':
            output = `data:${mimeType};base64,${base64Data}`;
            break;
          case 'raw':
            output = base64Data;
            break;
          case 'css':
            output = `background-image: url('data:${mimeType};base64,${base64Data}');`;
            break;
          case 'html':
            output = `<img src="data:${mimeType};base64,${base64Data}" alt="${file.name}" />`;
            break;
        }

        if (config.includeFileInfo) {
          const fileInfo = [
            `/* File: ${file.name} */`,
            `/* Original size: ${formatFileSize(originalSize)} */`,
            `/* Encoded size: ${formatFileSize(encodedSize)} */`,
            `/* Compression ratio: ${(compressionRatio * 100).toFixed(1)}% */`,
            `/* MIME type: ${mimeType} */`,
            '',
            output
          ].join('\n');
          output = fileInfo;
        }

        const imageInfo: ImageProcessingResult = {
          originalSize,
          encodedSize,
          mimeType,
          filename: file.name,
          compressionRatio
        };

        resolve({
          success: true,
          output,
          imageInfo
        });
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file. Please make sure it\'s a valid image file.'
      });
    };

    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const BASE64_IMAGE_ENCODER_TOOL: Tool = {
  id: 'base64-image-encoder',
  name: 'Base64 Image Encoder',
  description: 'Convert images to Base64 data URIs for embedding in HTML, CSS, or emails',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'base-encoding')!,
  slug: 'base64-image-encoder',
  icon: '🖼️',
  keywords: [
    'base64',
    'image',
    'encoder',
    'data uri',
    'embed',
    'html',
    'css',
    'email',
    'inline',
    'png',
    'jpg',
    'gif',
    'svg',
    'webp'
  ],
  seoTitle: 'Base64 Image Encoder - Convert Images to Data URIs Online',
  seoDescription: 'Convert PNG, JPG, GIF, SVG and other images to Base64 data URIs for embedding in HTML, CSS, emails. Free online tool with instant preview.',
  useCases: [
    'Embed images directly in HTML or CSS files',
    'Include images in email templates',
    'Create single-file HTML documents',
    'Reduce HTTP requests by inlining small images',
    'Store images in JSON or configuration files',
    'Create self-contained web components'
  ],
  examples: [
    {
      title: 'Small Icon or Logo',
      description: 'Perfect for icons, logos, or small graphics under 10KB',
      input: 'Upload a small PNG/SVG icon',
      output: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...'
    },
    {
      title: 'CSS Background Image',
      description: 'Generate CSS-ready background-image declarations',
      input: 'Upload image with CSS output format',
      output: "background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE...');"
    },
    {
      title: 'HTML Image Tag',
      description: 'Create complete HTML img tags with embedded data',
      input: 'Upload image with HTML output format',
      output: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE..." alt="image.png" />'
    },
    {
      title: 'Email-Safe Image',
      description: 'Embed images in email templates that work across clients',
      input: 'Upload image for email use',
      output: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE... (with file info)'
    }
  ],
  commonErrors: [
    'File too large - keep images under 100KB for best performance',
    'Unsupported file format - only image files are supported',
    'Corrupted image file - ensure the file is a valid image',
    'Browser memory issues with very large Base64 strings',
    'Email client compatibility issues with large embedded images',
    'Cache performance problems when embedding many large images'
  ],
  faq: [
    {
      question: 'What is Base64 image encoding?',
      answer: 'Base64 encoding converts binary image data into a text string that can be embedded directly in HTML, CSS, or other text-based formats. This eliminates the need for separate image files.'
    },
    {
      question: 'When should I use Base64 encoded images?',
      answer: 'Use Base64 encoding for small images (under 10KB), icons, logos, or when you need to create self-contained files. Avoid it for large images as it increases file size by about 33%.'
    },
    {
      question: 'What image formats are supported?',
      answer: 'All common web image formats are supported: PNG, JPG/JPEG, GIF, SVG, WebP, BMP, and ICO. The original format is preserved in the encoded output.'
    },
    {
      question: 'Does Base64 encoding affect image quality?',
      answer: 'No, Base64 encoding is lossless. The image quality remains exactly the same. However, the file size increases by approximately 33% due to the encoding overhead.'
    },
    {
      question: 'Are there file size limits?',
      answer: 'While there\'s no hard limit, we recommend keeping images under 100KB for performance. Large Base64 strings can slow down page loading and increase memory usage.'
    },
    {
      question: 'Can I use Base64 images in all browsers?',
      answer: 'Yes, data URIs are supported in all modern browsers and most email clients. Very old browsers (IE7 and below) have limited support.'
    }
  ],
  relatedTools: [
    'base64-encoder',
    'url-encoder', 
    'html-entity-encoder'
  ]
};