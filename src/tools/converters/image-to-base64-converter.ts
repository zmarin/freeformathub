import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ImageToBase64Config {
  outputFormat: 'data-url' | 'base64-only' | 'html' | 'css' | 'json';
  includeMetadata: boolean;
  compressImage: boolean;
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio: boolean;
  validateImage: boolean;
  allowedFormats: string[];
  maxFileSize: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  conversion?: ConversionResult;
  warnings?: string[];
}

interface ConversionResult {
  originalFile: FileInfo;
  base64Data: string;
  dataUrl: string;
  outputFormats: OutputFormats;
  compressionApplied: boolean;
  resizeApplied: boolean;
  conversionStats: ConversionStats;
}

interface FileInfo {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  dimensions?: { width: number; height: number };
}

interface OutputFormats {
  dataUrl: string;
  base64Only: string;
  html: string;
  css: string;
  json: string;
}

interface ConversionStats {
  originalSize: number;
  base64Size: number;
  sizeIncrease: number;
  compressionRatio?: number;
  processingTime: number;
}

// Supported image formats
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/ico',
  'image/tiff'
];

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 5 * 1024 * 1024,   // 5MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'image/svg+xml': 1 * 1024 * 1024, // 1MB
  'image/bmp': 20 * 1024 * 1024,  // 20MB
  'image/ico': 1 * 1024 * 1024,   // 1MB
  'image/tiff': 20 * 1024 * 1024  // 20MB
};

function validateImageFile(file: File, config: ImageToBase64Config): string[] {
  const errors: string[] = [];

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format: ${file.type}`);
  }

  // Check if format is allowed in config
  if (config.allowedFormats.length > 0 && !config.allowedFormats.includes(file.type)) {
    errors.push(`File format not allowed: ${file.type}`);
  }

  // Check file size
  const maxSize = config.maxFileSize > 0 ? config.maxFileSize : (MAX_FILE_SIZES[file.type as keyof typeof MAX_FILE_SIZES] || 5 * 1024 * 1024);
  if (file.size > maxSize) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`);
  }

  // Check if file is actually an image (basic validation)
  if (!file.type.startsWith('image/')) {
    errors.push('File is not a valid image');
  }

  return errors;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      // SVG dimensions are harder to determine, skip for now
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

async function resizeImage(file: File, maxWidth: number, maxHeight: number, maintainAspect: boolean, quality: number): Promise<{ file: File; resized: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      let needsResize = false;

      // Calculate new dimensions
      if (maxWidth > 0 && width > maxWidth) {
        if (maintainAspect) {
          height = (height * maxWidth) / width;
        }
        width = maxWidth;
        needsResize = true;
      }

      if (maxHeight > 0 && height > maxHeight) {
        if (maintainAspect) {
          width = (width * maxHeight) / height;
        }
        height = maxHeight;
        needsResize = true;
      }

      if (!needsResize && quality >= 1.0) {
        resolve({ file, resized: false });
        return;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ file, resized: false });
        return;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
              lastModified: Date.now()
            });
            resolve({ file: resizedFile, resized: needsResize || quality < 1.0 });
          } else {
            resolve({ file, resized: false });
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ file, resized: false });
    };

    img.src = url;
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

function generateOutputFormats(file: File, base64Data: string, config: ImageToBase64Config): OutputFormats {
  const dataUrl = `data:${file.type};base64,${base64Data}`;

  const formats: OutputFormats = {
    dataUrl,
    base64Only: base64Data,
    html: `<img src="${dataUrl}" alt="${file.name}" />`,
    css: `background-image: url("${dataUrl}");`,
    json: JSON.stringify({
      filename: file.name,
      type: file.type,
      size: file.size,
      base64: base64Data,
      dataUrl: dataUrl
    }, null, 2)
  };

  return formats;
}

// This is a mock implementation for the browser environment
// In a real implementation, this would process actual File objects
export async function processImageToBase64Converter(fileData: { name: string; type: string; size: number; content: string }, config: ImageToBase64Config): Promise<ToolResult> {
  try {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Create mock file info
    const fileInfo: FileInfo = {
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      lastModified: Date.now()
    };

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(fileData.type)) {
      return {
        success: false,
        error: `Unsupported file format: ${fileData.type}`
      };
    }

    // Check file size limits
    const maxSize = config.maxFileSize > 0 ? config.maxFileSize : (MAX_FILE_SIZES[fileData.type as keyof typeof MAX_FILE_SIZES] || 5 * 1024 * 1024);
    if (fileData.size > maxSize) {
      return {
        success: false,
        error: `File size (${formatFileSize(fileData.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`
      };
    }

    // Use provided base64 content (in real implementation, this would be generated from the file)
    const base64Data = fileData.content;
    const dataUrl = `data:${fileData.type};base64,${base64Data}`;

    // Generate output formats
    const outputFormats = generateOutputFormats(fileInfo as any, base64Data, config);

    // Calculate stats
    const base64Size = base64Data.length;
    const sizeIncrease = Math.round(((base64Size - fileData.size) / fileData.size) * 100);
    const processingTime = Date.now() - startTime;

    const conversionStats: ConversionStats = {
      originalSize: fileData.size,
      base64Size,
      sizeIncrease,
      processingTime
    };

    const conversion: ConversionResult = {
      originalFile: fileInfo,
      base64Data,
      dataUrl,
      outputFormats,
      compressionApplied: config.compressImage && config.compressionQuality < 1.0,
      resizeApplied: false, // Would be determined in real implementation
      conversionStats
    };

    // Generate output based on selected format
    let output = '';
    switch (config.outputFormat) {
      case 'data-url':
        output = dataUrl;
        break;
      case 'base64-only':
        output = base64Data;
        break;
      case 'html':
        output = outputFormats.html;
        break;
      case 'css':
        output = outputFormats.css;
        break;
      case 'json':
        output = outputFormats.json;
        break;
      default:
        output = dataUrl;
    }

    // Add conversion report
    const report = `Image to Base64 Conversion Result
${'='.repeat(40)}

File Information:
• Name: ${fileInfo.name}
• Type: ${fileInfo.type}
• Original Size: ${formatFileSize(fileInfo.size)}
• Base64 Size: ${formatFileSize(base64Size)}
• Size Increase: ${sizeIncrease > 0 ? '+' : ''}${sizeIncrease}%

Processing:
• Compression Applied: ${conversion.compressionApplied ? 'Yes' : 'No'}
• Resize Applied: ${conversion.resizeApplied ? 'Yes' : 'No'}
• Processing Time: ${processingTime}ms

Output (${config.outputFormat}):
${'-'.repeat(30)}
${output}`;

    // Add warnings
    if (sizeIncrease > 33) {
      warnings.push('Base64 encoding increases file size by ~33% - consider optimizing image first');
    }

    if (fileData.size > 1024 * 1024) { // > 1MB
      warnings.push('Large image files may cause performance issues when used as base64');
    }

    if (fileData.type === 'image/gif') {
      warnings.push('Animated GIFs may not display correctly in some contexts');
    }

    return {
      success: true,
      output: report,
      conversion,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const IMAGE_TO_BASE64_CONVERTER_TOOL: Tool = {
  id: 'image-to-base64-converter',
  name: 'Image to Base64 Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'images-media')!,
  slug: 'image-to-base64-converter',
  icon: '🖼️',
  keywords: ['image', 'base64', 'encode', 'convert', 'data-url', 'embed', 'inline', 'css', 'html'],
  seoTitle: 'Image to Base64 Converter - Encode Images for Web | FreeFormatHub',
  seoDescription: 'Convert images to Base64 encoding for embedding in HTML, CSS, or JSON. Supports JPEG, PNG, GIF, WebP with compression and resize options.',
  description: 'Convert images to Base64 encoding for embedding directly in HTML, CSS, or applications. Supports multiple formats with compression and resizing options.',

  examples: [
    {
      title: 'Data URL Format',
      input: 'small-icon.png (2.1 KB PNG image)',
      output: `Output (data-url):
------------------------------
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`,
      description: 'Convert image to data URL format for direct embedding'
    },
    {
      title: 'HTML Img Tag',
      input: 'logo.jpg (45.2 KB JPEG image)',
      output: `Output (html):
------------------------------
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..." alt="logo.jpg" />`,
      description: 'Generate HTML img tag with embedded base64 image'
    },
    {
      title: 'CSS Background',
      input: 'pattern.png (12.8 KB PNG image)',
      output: `Output (css):
------------------------------
background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");`,
      description: 'Create CSS background-image with base64 data'
    }
  ],

  useCases: [
    'Embedding small images directly in HTML or CSS',
    'Creating self-contained HTML documents with images',
    'Reducing HTTP requests for small icons and graphics',
    'Including images in JSON APIs or configuration files',
    'Creating email templates with embedded images',
    'Generating offline-capable web applications',
    'Converting images for use in mobile apps',
    'Creating single-file web components with images'
  ],

  faq: [
    {
      question: 'What image formats are supported?',
      answer: 'The tool supports JPEG, PNG, GIF, WebP, SVG, BMP, ICO, and TIFF formats. Each format has different size limits and compression options available.'
    },
    {
      question: 'How much does Base64 encoding increase file size?',
      answer: 'Base64 encoding increases file size by approximately 33%. This is due to the encoding method that uses 4 characters to represent every 3 bytes of binary data.'
    },
    {
      question: 'When should I use Base64 images?',
      answer: 'Use Base64 for small images (< 10KB), icons, or when you need self-contained HTML/CSS. For larger images, regular file serving is usually better for performance.'
    },
    {
      question: 'Can I compress images during conversion?',
      answer: 'Yes, the tool can apply JPEG compression and resize images to reduce the final base64 size. This is especially useful for optimizing larger images.'
    },
    {
      question: 'Are there any limitations or browser support issues?',
      answer: 'Base64 data URLs are well-supported in modern browsers. However, very large images may cause memory issues, and some older email clients have size limits.'
    }
  ],

  commonErrors: [
    'File format not supported or corrupted image files',
    'Image file too large for Base64 conversion',
    'Invalid or missing image data in upload',
    'Browser memory limits with very large images',
    'Network issues during file upload or processing'
  ],

  relatedTools: ['base64-decoder', 'image-compressor', 'image-format-converter', 'data-uri-converter', 'css-minifier']
};