import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface WebPConverterConfig {
  operation: 'toWebP' | 'fromWebP';
  quality: number;
  lossless: boolean;
  method: number;
  targetSize: number;
  pass: number;
  preprocessing: boolean;
  segments: number;
  snsStrength: number;
  filterStrength: number;
  filterSharpness: number;
  filterType: 'simple' | 'strong';
  autoFilter: boolean;
  alphaCompression: boolean;
  alphaFiltering: 'none' | 'fast' | 'best';
  alphaQuality: number;
  outputFormat: 'png' | 'jpeg' | 'bmp' | 'gif';
  jpegQuality: number;
  preserveMetadata: boolean;
}

interface ConversionResult {
  success: boolean;
  originalSize: number;
  convertedSize: number;
  compressionRatio: number;
  outputDataUrl: string;
  originalFormat: string;
  outputFormat: string;
  metadata?: {
    width: number;
    height: number;
    hasAlpha: boolean;
    colorDepth: number;
    originalMimeType: string;
    convertedMimeType: string;
  };
  processingTime: number;
  qualityMetrics?: {
    estimatedPSNR: number;
    compressionEfficiency: number;
    qualityScore: number;
  };
}

// Utility function to get image metadata
async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  hasAlpha: boolean;
  colorDepth: number;
  mimeType: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Check for alpha channel
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasAlpha = false;
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }
      
      resolve({
        width: img.width,
        height: img.height,
        hasAlpha,
        colorDepth: 24, // Assume 24-bit for most web images
        mimeType: file.type
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Convert image to WebP format
async function convertToWebP(file: File, config: WebPConverterConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply preprocessing if enabled
      if (config.preprocessing) {
        ctx.filter = `contrast(${1 + config.filterSharpness * 0.1}) brightness(1.05)`;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to WebP with quality settings
      const quality = config.lossless ? 1 : config.quality / 100;
      const webpDataUrl = canvas.toDataURL('image/webp', quality);
      
      if (webpDataUrl === canvas.toDataURL()) {
        reject(new Error('WebP format not supported in this browser'));
        return;
      }
      
      resolve(webpDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Convert WebP to other formats
async function convertFromWebP(file: File, config: WebPConverterConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (!ctx) {
        reject(new Error('Unable to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Convert to target format
      let mimeType: string;
      let quality: number;
      
      switch (config.outputFormat) {
        case 'jpeg':
          mimeType = 'image/jpeg';
          quality = config.jpegQuality / 100;
          break;
        case 'png':
          mimeType = 'image/png';
          quality = 1; // PNG is lossless
          break;
        case 'bmp':
          mimeType = 'image/bmp';
          quality = 1;
          break;
        case 'gif':
          mimeType = 'image/gif';
          quality = 1;
          break;
        default:
          mimeType = 'image/png';
          quality = 1;
      }
      
      const outputDataUrl = canvas.toDataURL(mimeType, quality);
      resolve(outputDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load WebP image'));
    img.src = URL.createObjectURL(file);
  });
}

// Calculate quality metrics
function calculateQualityMetrics(originalSize: number, convertedSize: number, config: WebPConverterConfig): {
  estimatedPSNR: number;
  compressionEfficiency: number;
  qualityScore: number;
} {
  const compressionRatio = originalSize / convertedSize;
  
  // Estimate PSNR based on quality setting and compression
  let estimatedPSNR: number;
  if (config.lossless) {
    estimatedPSNR = Infinity;
  } else {
    // Rough estimation based on quality setting
    estimatedPSNR = 20 + (config.quality * 0.4);
  }
  
  // Calculate compression efficiency (higher is better)
  const compressionEfficiency = Math.min(100, compressionRatio * 20);
  
  // Overall quality score combining PSNR and efficiency
  const qualityScore = config.lossless ? 100 : 
    Math.min(100, (config.quality * 0.7) + (compressionEfficiency * 0.3));
  
  return {
    estimatedPSNR,
    compressionEfficiency,
    qualityScore
  };
}

export function processWebPConverter(
  file: File, 
  config: WebPConverterConfig
): Promise<ToolResult<ConversionResult | null>> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();
    
    try {
      if (!file) {
        resolve({
          data: null,
          error: 'Please select an image file to convert',
          processing_time: 0
        });
        return;
      }
      
      // Validate file type
      const validInputTypes = config.operation === 'toWebP' 
        ? ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff']
        : ['image/webp'];
      
      if (!validInputTypes.includes(file.type)) {
        const expectedTypes = config.operation === 'toWebP' 
          ? 'JPEG, PNG, GIF, BMP, or TIFF' 
          : 'WebP';
        resolve({
          data: null,
          error: `Invalid file type. Expected ${expectedTypes} image.`,
          processing_time: Date.now() - startTime
        });
        return;
      }
      
      // Get original image metadata
      const metadata = await getImageMetadata(file);
      const originalSize = file.size;
      
      // Perform conversion
      let outputDataUrl: string;
      let outputFormat: string;
      let outputMimeType: string;
      
      if (config.operation === 'toWebP') {
        outputDataUrl = await convertToWebP(file, config);
        outputFormat = 'webp';
        outputMimeType = 'image/webp';
      } else {
        outputDataUrl = await convertFromWebP(file, config);
        outputFormat = config.outputFormat;
        outputMimeType = `image/${config.outputFormat}`;
      }
      
      // Calculate converted file size (approximate from data URL)
      const base64Data = outputDataUrl.split(',')[1];
      const convertedSize = Math.round((base64Data.length * 3) / 4);
      const compressionRatio = originalSize / convertedSize;
      
      // Calculate quality metrics
      const qualityMetrics = calculateQualityMetrics(originalSize, convertedSize, config);
      
      const result: ConversionResult = {
        success: true,
        originalSize,
        convertedSize,
        compressionRatio,
        outputDataUrl,
        originalFormat: file.type.split('/')[1],
        outputFormat,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          hasAlpha: metadata.hasAlpha,
          colorDepth: metadata.colorDepth,
          originalMimeType: metadata.mimeType,
          convertedMimeType: outputMimeType
        },
        processingTime: Date.now() - startTime,
        qualityMetrics
      };
      
      resolve({
        data: result,
        processing_time: Date.now() - startTime,
        metadata: {
          operation: config.operation,
          inputFormat: file.type,
          outputFormat: outputMimeType,
          originalSize,
          convertedSize,
          compressionRatio: compressionRatio.toFixed(2),
          quality: config.quality,
          lossless: config.lossless,
          hasAlpha: metadata.hasAlpha,
          dimensions: `${metadata.width}x${metadata.height}`
        }
      });
      
    } catch (error) {
      resolve({
        data: null,
        error: error instanceof Error ? error.message : 'Failed to convert image',
        processing_time: Date.now() - startTime
      });
    }
  });
}

const examples: ToolExample[] = [
  {
    title: 'Convert JPEG to WebP',
    description: 'Convert a JPEG image to WebP format with 80% quality for web optimization',
    input: 'photo.jpg (JPEG image file)',
    output: `✓ Conversion successful
Original: JPEG (245 KB)
Converted: WebP (156 KB)
Compression: 36% size reduction
Quality Score: 82/100
Dimensions: 1920x1080
Processing Time: 1.2s`
  },
  {
    title: 'Lossless PNG to WebP',
    description: 'Convert PNG to lossless WebP to maintain perfect quality',
    input: 'logo.png (PNG with transparency)',
    output: `✓ Lossless conversion successful  
Original: PNG (89 KB)
Converted: WebP (62 KB)
Compression: 30% size reduction
Quality Score: 100/100 (Lossless)
Alpha Channel: Preserved
Processing Time: 0.8s`
  },
  {
    title: 'WebP to JPEG Conversion',
    description: 'Convert WebP back to JPEG for compatibility',
    input: 'optimized.webp (WebP image)',
    output: `✓ Format conversion successful
Original: WebP (156 KB)
Converted: JPEG (198 KB) 
Quality: 90%
Dimensions: 1920x1080
Alpha Channel: Removed (JPEG doesn't support transparency)
Processing Time: 0.9s`
  }
];

export const WEBP_CONVERTER_TOOL: Tool = {
  id: 'webp-converter',
  name: 'WebP Image Converter',
  description: 'Convert images to and from WebP format with advanced compression settings, quality optimization, and detailed conversion metrics. Supports JPEG, PNG, GIF, BMP input with lossless and lossy modes.',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'images-media')!,
  tags: ['webp', 'image', 'converter', 'compression', 'optimization', 'jpeg', 'png', 'format'],
  complexity: 'advanced',
  examples,
  faqs: [
    {
      question: 'What is WebP and why should I use it?',
      answer: 'WebP is a modern image format developed by Google that provides superior compression compared to JPEG and PNG. It typically reduces file sizes by 25-35% while maintaining similar quality, leading to faster website loading times.'
    },
    {
      question: 'What\'s the difference between lossy and lossless WebP?',
      answer: 'Lossy WebP uses compression similar to JPEG with configurable quality settings, ideal for photos. Lossless WebP preserves perfect image quality like PNG, better for graphics, logos, and images with transparency.'
    },
    {
      question: 'Which browsers support WebP?',
      answer: 'WebP is supported by Chrome, Firefox, Safari (14+), Edge, and most modern browsers. For older browser support, you can provide fallback images or use progressive enhancement techniques.'
    },
    {
      question: 'Can I convert WebP back to other formats?',
      answer: 'Yes, you can convert WebP images back to JPEG, PNG, BMP, or GIF. Note that converting from lossy WebP to other formats won\'t recover the original quality.'
    },
    {
      question: 'How do I choose the best quality setting?',
      answer: 'For photos, start with 75-85 quality for good balance. Use 90+ for high-quality images, 60-75 for web optimization. For graphics with text or sharp edges, consider lossless mode to preserve clarity.'
    }
  ],
  relatedTools: ['image-compressor', 'image-resizer', 'format-converter', 'image-optimizer', 'batch-image-processor']
};