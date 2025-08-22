import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface Base64ImageDecoderConfig {
  outputFormat: 'preview' | 'download' | 'dataurl';
  showMetadata: boolean;
  validateImage: boolean;
  autoDetectFormat: boolean;
  resizePreview: boolean;
  maxPreviewSize: number;
  extractEmbedded: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  imageData?: {
    dataUrl: string;
    format: string;
    size: number;
    dimensions?: { width: number; height: number };
    isValid: boolean;
  };
  metadata?: {
    originalLength: number;
    decodedSize: number;
    compressionRatio: number;
    mimeType: string;
    processingTime: number;
  };
}

// Helper function to detect image format from data URL or base64
function detectImageFormat(input: string): string | null {
  // Check for data URL format
  const dataUrlMatch = input.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (dataUrlMatch) {
    return dataUrlMatch[1].toLowerCase();
  }

  // For raw base64, try to detect from magic bytes
  try {
    const decoded = atob(input.replace(/\s/g, ''));
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }

    // Check magic bytes for common formats
    if (bytes.length >= 8) {
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png';
      }
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return 'jpeg';
      }
      
      // WebP: RIFF ... WEBP
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return 'webp';
      }
      
      // GIF: GIF87a or GIF89a
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return 'gif';
      }
      
      // BMP: BM
      if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
        return 'bmp';
      }
    }
  } catch {
    return null;
  }
  
  return null;
}

// Validate base64 format
function validateBase64(base64: string): { isValid: boolean; error?: string } {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64.replace(/^data:image\/[^;]+;base64,/, '');
    
    // Check if it's valid base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      return { isValid: false, error: 'Invalid base64 characters detected' };
    }
    
    // Try to decode
    atob(cleanBase64);
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid base64 encoding' };
  }
}

// Get image dimensions
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}

// Extract base64 from various input formats
function extractBase64FromInput(input: string): { base64: string; format?: string; hasDataUrl: boolean } {
  // Remove whitespace
  const cleaned = input.replace(/\s+/g, '');
  
  // Check for data URL format
  const dataUrlMatch = cleaned.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      base64: dataUrlMatch[2],
      format: dataUrlMatch[1],
      hasDataUrl: true
    };
  }
  
  // Check for HTML img tag
  const imgMatch = cleaned.match(/src="data:image\/([^;]+);base64,([^"]+)"/);
  if (imgMatch) {
    return {
      base64: imgMatch[2],
      format: imgMatch[1],
      hasDataUrl: true
    };
  }
  
  // Check for CSS background-image
  const cssMatch = cleaned.match(/background-image:\s*url\(["']?data:image\/([^;]+);base64,([^"')]+)["']?\)/);
  if (cssMatch) {
    return {
      base64: cssMatch[2],
      format: cssMatch[1],
      hasDataUrl: true
    };
  }
  
  // Assume raw base64
  return {
    base64: cleaned,
    hasDataUrl: false
  };
}

export async function processBase64ImageDecoding(
  input: string,
  config: Base64ImageDecoderConfig
): Promise<ToolResult> {
  const startTime = performance.now();
  
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Please provide base64 encoded image data'
      };
    }

    // Extract base64 from various input formats
    const extracted = extractBase64FromInput(input);
    
    // Validate base64
    const validation = validateBase64(extracted.base64);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid base64 data'
      };
    }

    // Detect format if not already known
    let format = extracted.format;
    if (!format && config.autoDetectFormat) {
      format = detectImageFormat(extracted.base64);
    }

    // Create data URL
    const mimeType = format ? `image/${format}` : 'image/png';
    const dataUrl = `data:${mimeType};base64,${extracted.base64}`;

    // Validate if it's actually an image (when config.validateImage is true)
    if (config.validateImage) {
      try {
        await getImageDimensions(dataUrl);
      } catch {
        return {
          success: false,
          error: 'The decoded data is not a valid image'
        };
      }
    }

    const decodedSize = atob(extracted.base64).length;
    const endTime = performance.now();

    // Get image dimensions for metadata
    let dimensions: { width: number; height: number } | undefined;
    try {
      dimensions = await getImageDimensions(dataUrl);
    } catch {
      // Ignore dimension errors
    }

    const imageData = {
      dataUrl,
      format: format || 'unknown',
      size: decodedSize,
      dimensions,
      isValid: true
    };

    const metadata = {
      originalLength: input.length,
      decodedSize,
      compressionRatio: Math.round((decodedSize / input.length) * 100 * 100) / 100,
      mimeType,
      processingTime: Math.round((endTime - startTime) * 100) / 100
    };

    // Generate output based on config
    let output = `# Base64 Image Decoded Successfully\n\n`;
    
    output += `## 📊 Image Information\n\n`;
    output += `**Format:** ${(format || 'Unknown').toUpperCase()}\n`;
    output += `**File Size:** ${(decodedSize / 1024).toFixed(1)} KB\n`;
    if (dimensions) {
      output += `**Dimensions:** ${dimensions.width} × ${dimensions.height} pixels\n`;
    }
    output += `**MIME Type:** ${mimeType}\n`;
    output += `**Processing Time:** ${metadata.processingTime}ms\n\n`;
    
    if (config.showMetadata) {
      output += `## 🔧 Decoding Details\n\n`;
      output += `**Original Base64 Length:** ${metadata.originalLength.toLocaleString()} characters\n`;
      output += `**Decoded File Size:** ${decodedSize.toLocaleString()} bytes\n`;
      output += `**Compression Efficiency:** ${metadata.compressionRatio}% of original size\n`;
      output += `**Input Format:** ${extracted.hasDataUrl ? 'Data URL' : 'Raw Base64'}\n\n`;
    }
    
    output += `## 🎯 Usage Options\n\n`;
    output += `- **Preview:** Image preview is available in the interface\n`;
    output += `- **Download:** Use the download button to save the image file\n`;
    output += `- **Data URL:** The complete data URL is ready to use in HTML/CSS\n`;
    output += `- **Embed:** Use directly in \`<img>\` tags or CSS backgrounds\n\n`;
    
    output += `---\n*Base64 image decoding powered by FreeFormatHub*`;

    return {
      success: true,
      output,
      imageData,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode base64 image'
    };
  }
}

export const BASE64_IMAGE_DECODER_TOOL: Tool = {
  id: 'base64-image-decoder',
  name: 'Base64 to Image Converter',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'encoders')!.subcategories!.find(sub => sub.id === 'base-encoding')!,
  slug: 'base64-image-decoder',
  icon: '🖼️',
  keywords: ['base64', 'image', 'decode', 'convert', 'data', 'url', 'picture', 'photo', 'decode'],
  seoTitle: 'Base64 to Image Converter - Decode Base64 Images Online | FreeFormatHub',
  seoDescription: 'Convert base64 encoded strings back to images. Support for PNG, JPEG, WebP, GIF formats. Preview, download, or get data URLs for decoded images.',
  description: 'Decode base64 encoded strings back to images. Extract images from data URLs, HTML, or CSS. Preview decoded images and download in original format.',

  examples: [
    {
      title: 'Data URL Decoding',
      input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      output: `# Base64 Image Decoded Successfully

## 📊 Image Information

**Format:** PNG
**File Size:** 0.1 KB
**Dimensions:** 1 × 1 pixels
**MIME Type:** image/png
**Processing Time:** 2.5ms

## 🎯 Usage Options

- **Preview:** Image preview is available in the interface
- **Download:** Use the download button to save the image file
- **Data URL:** The complete data URL is ready to use in HTML/CSS
- **Embed:** Use directly in \`<img>\` tags or CSS backgrounds`,
      description: 'Decode a complete data URL to extract the image'
    },
    {
      title: 'Raw Base64 Decoding',
      input: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      output: `# Base64 Image Decoded Successfully

## 📊 Image Information

**Format:** JPEG
**File Size:** 0.6 KB
**Dimensions:** 1 × 1 pixels
**MIME Type:** image/jpeg
**Processing Time:** 1.8ms`,
      description: 'Decode raw base64 data with automatic format detection'
    }
  ],

  useCases: [
    'Extract images from data URLs in web development',
    'Decode images from API responses',
    'Convert base64 images to downloadable files',
    'Debug and validate base64 encoded images',
    'Extract images from HTML email templates',
    'Process images from JSON configuration files',
    'Convert embedded images from CSS stylesheets',
    'Batch processing of encoded image data'
  ],

  faq: [
    {
      question: 'What image formats can be decoded?',
      answer: 'The tool can decode any image format that browsers support, including PNG, JPEG, WebP, GIF, BMP, and SVG. Format detection is automatic based on data URL headers or magic bytes.'
    },
    {
      question: 'Can I decode images from HTML or CSS?',
      answer: 'Yes! The tool automatically extracts base64 data from HTML img tags, CSS background-image properties, and complete data URLs. Just paste the entire code snippet.'
    },
    {
      question: 'What happens if the base64 is invalid?',
      answer: 'The tool validates the base64 encoding before decoding and will show specific error messages for invalid characters, incorrect padding, or corrupted data.'
    },
    {
      question: 'How can I use the decoded image?',
      answer: 'You can preview the image, download it as a file, copy the data URL for use in HTML/CSS, or save it for further processing. All options preserve the original format.'
    },
    {
      question: 'Is there a size limit for decoding?',
      answer: 'The limit depends on your browser\'s memory. Very large images may cause performance issues, but typical web images (under 10MB) decode without problems.'
    }
  ],

  commonErrors: [
    'Invalid base64 characters or encoding',
    'Corrupted or truncated base64 data',
    'Missing data URL headers for format detection',
    'Non-image data encoded as base64',
    'Browser memory limitations with very large images'
  ],

  relatedTools: ['base64-encoder', 'base64-image-encoder', 'image-format-converter', 'image-compressor']
};