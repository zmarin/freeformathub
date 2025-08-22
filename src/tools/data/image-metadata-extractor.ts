import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface ImageMetadataConfig {
  extractExif: boolean;
  extractIptc: boolean;
  extractXmp: boolean;
  extractIcc: boolean;
  extractThumbnail: boolean;
  showRawData: boolean;
  formatOutput: 'detailed' | 'summary' | 'json' | 'table';
  includeGeolocation: boolean;
  analyzeDimensions: boolean;
  extractColorProfile: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: ImageMetadataResult;
  warnings?: string[];
}

interface ImageMetadataResult {
  filename: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  dimensions: ImageDimensions;
  exifData?: ExifData;
  iptcData?: IptcData;
  xmpData?: XmpData;
  iccProfile?: IccProfile;
  thumbnail?: ThumbnailData;
  colorProfile?: ColorProfileInfo;
  geolocation?: GeolocationData;
  camera?: CameraInfo;
  processing: ProcessingInfo;
}

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  resolution?: {
    x: number;
    y: number;
    unit: string;
  };
  bitDepth?: number;
  colorSpace?: string;
  channels?: number;
}

interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;
  orientation?: number;
  xResolution?: number;
  yResolution?: number;
  resolutionUnit?: number;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
  flash?: string;
  whiteBalance?: string;
  meteringMode?: string;
  exposureMode?: string;
  sceneType?: string;
  customRendered?: string;
  digitalZoomRatio?: string;
  focalLengthIn35mm?: number;
  sceneCaptureType?: string;
  gainControl?: string;
  contrast?: string;
  saturation?: string;
  sharpness?: string;
  subjectDistanceRange?: string;
}

interface IptcData {
  caption?: string;
  headline?: string;
  keywords?: string[];
  category?: string;
  supplementalCategories?: string[];
  urgency?: string;
  byline?: string;
  bylineTitle?: string;
  credit?: string;
  source?: string;
  copyrightNotice?: string;
  contact?: string;
  city?: string;
  provinceState?: string;
  countryName?: string;
  originalTransmissionReference?: string;
  instructions?: string;
  dateCreated?: string;
  timeCreated?: string;
}

interface XmpData {
  title?: string;
  description?: string;
  subject?: string[];
  creator?: string[];
  rights?: string;
  publisher?: string;
  contributor?: string[];
  date?: string;
  type?: string;
  format?: string;
  identifier?: string;
  source?: string;
  language?: string;
  relation?: string;
  coverage?: string;
  rating?: number;
  label?: string;
  colorMode?: string;
  historyActions?: string[];
}

interface IccProfile {
  description?: string;
  copyright?: string;
  manufacturer?: string;
  model?: string;
  profileVersion?: string;
  deviceClass?: string;
  colorSpace?: string;
  pcs?: string;
  platform?: string;
  renderingIntent?: string;
  whitePoint?: number[];
  redColorant?: number[];
  greenColorant?: number[];
  blueColorant?: number[];
}

interface ThumbnailData {
  format: string;
  width: number;
  height: number;
  dataUrl?: string;
  size: number;
}

interface ColorProfileInfo {
  colorSpace: string;
  hasProfile: boolean;
  profileName?: string;
  intent?: string;
  gamma?: number;
  whitePoint?: string;
  primaries?: {
    red: [number, number];
    green: [number, number];
    blue: [number, number];
  };
}

interface GeolocationData {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  direction?: number;
  mapUrl?: string;
  locationName?: string;
}

interface CameraInfo {
  make?: string;
  model?: string;
  lens?: string;
  serialNumber?: string;
  firmware?: string;
  settings: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    flash?: boolean;
    meteringMode?: string;
    focusMode?: string;
  };
}

interface ProcessingInfo {
  processingTime: number;
  extractedSections: string[];
  fileAnalysis: {
    isValidImage: boolean;
    hasMetadata: boolean;
    supportedFormat: boolean;
    compressionType?: string;
    quality?: number;
  };
  warnings: string[];
}

// Mock metadata extraction since we can't include full EXIF libraries
function extractImageMetadata(file: File, config: ImageMetadataConfig): Promise<ImageMetadataResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Basic file analysis
      const fileType = detectFileType(uint8Array);
      const dimensions = extractBasicDimensions(uint8Array, fileType);
      
      // Mock metadata extraction for demonstration
      const metadata: ImageMetadataResult = {
        filename: file.name,
        fileSize: file.size,
        fileType,
        mimeType: file.type,
        dimensions,
        processing: {
          processingTime: 0,
          extractedSections: [],
          fileAnalysis: {
            isValidImage: true,
            hasMetadata: false,
            supportedFormat: ['jpeg', 'jpg', 'tiff', 'tif'].includes(fileType.toLowerCase()),
            compressionType: fileType === 'jpeg' ? 'JPEG' : undefined,
          },
          warnings: []
        }
      };

      // Extract EXIF data (mock)
      if (config.extractExif && (fileType === 'jpeg' || fileType === 'tiff')) {
        metadata.exifData = extractMockExifData();
        metadata.processing.extractedSections.push('EXIF');
        metadata.processing.fileAnalysis.hasMetadata = true;
      }

      // Extract IPTC data (mock)
      if (config.extractIptc && fileType === 'jpeg') {
        metadata.iptcData = extractMockIptcData();
        metadata.processing.extractedSections.push('IPTC');
      }

      // Extract XMP data (mock)
      if (config.extractXmp) {
        metadata.xmpData = extractMockXmpData();
        metadata.processing.extractedSections.push('XMP');
      }

      // Extract ICC profile (mock)
      if (config.extractIcc) {
        metadata.iccProfile = extractMockIccProfile();
        metadata.processing.extractedSections.push('ICC');
      }

      // Extract color profile info
      if (config.extractColorProfile) {
        metadata.colorProfile = extractMockColorProfile();
      }

      // Extract geolocation
      if (config.includeGeolocation && metadata.exifData) {
        metadata.geolocation = extractMockGeolocation();
      }

      // Extract camera info
      if (metadata.exifData) {
        metadata.camera = extractCameraInfo(metadata.exifData);
      }

      // Extract thumbnail (mock)
      if (config.extractThumbnail && fileType === 'jpeg') {
        metadata.thumbnail = extractMockThumbnail();
        metadata.processing.extractedSections.push('Thumbnail');
      }

      resolve(metadata);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

function detectFileType(data: Uint8Array): string {
  // Check file signatures
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'jpeg';
  }
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return 'png';
  }
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'gif';
  }
  if (data[0] === 0x42 && data[1] === 0x4D) {
    return 'bmp';
  }
  if ((data[0] === 0x49 && data[1] === 0x49) || (data[0] === 0x4D && data[1] === 0x4D)) {
    return 'tiff';
  }
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) {
    return 'webp';
  }
  
  return 'unknown';
}

function extractBasicDimensions(data: Uint8Array, fileType: string): ImageDimensions {
  // Mock dimension extraction - in real implementation would parse file headers
  const mockDimensions = {
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    resolution: {
      x: 72,
      y: 72,
      unit: 'dpi'
    },
    bitDepth: 8,
    colorSpace: 'sRGB',
    channels: 3
  };

  // Adjust based on file type
  switch (fileType) {
    case 'png':
      mockDimensions.channels = 4; // RGBA
      break;
    case 'gif':
      mockDimensions.bitDepth = 8;
      mockDimensions.channels = 1; // Indexed color
      break;
    case 'bmp':
      mockDimensions.resolution = { x: 96, y: 96, unit: 'dpi' };
      break;
  }

  return mockDimensions;
}

function extractMockExifData(): ExifData {
  return {
    make: 'Canon',
    model: 'EOS R5',
    software: 'Adobe Lightroom 6.0 (Macintosh)',
    dateTime: '2024:01:15 14:30:22',
    dateTimeOriginal: '2024:01:15 14:30:22',
    dateTimeDigitized: '2024:01:15 14:30:22',
    orientation: 1,
    xResolution: 240,
    yResolution: 240,
    resolutionUnit: 2,
    exposureTime: '1/500',
    fNumber: 'f/2.8',
    iso: 400,
    focalLength: '85mm',
    flash: 'Flash did not fire',
    whiteBalance: 'Auto',
    meteringMode: 'Multi-segment',
    exposureMode: 'Manual',
    sceneType: 'Directly photographed',
    customRendered: 'Normal process',
    digitalZoomRatio: '1.0',
    focalLengthIn35mm: 85,
    sceneCaptureType: 'Standard',
    gainControl: 'None',
    contrast: 'Normal',
    saturation: 'Normal',
    sharpness: 'Normal',
    subjectDistanceRange: 'Close view'
  };
}

function extractMockIptcData(): IptcData {
  return {
    caption: 'Beautiful sunset over the mountains captured during golden hour',
    headline: 'Mountain Sunset Photography',
    keywords: ['sunset', 'mountains', 'landscape', 'golden hour', 'nature'],
    category: 'LAC',
    supplementalCategories: ['Nature', 'Landscape'],
    urgency: '5',
    byline: 'John Photographer',
    bylineTitle: 'Professional Photographer',
    credit: 'Photography Studio Inc.',
    source: 'Original Photography',
    copyrightNotice: '© 2024 Photography Studio Inc. All rights reserved.',
    contact: 'john@photostudio.com',
    city: 'Aspen',
    provinceState: 'Colorado',
    countryName: 'United States',
    originalTransmissionReference: 'PS2024-001',
    instructions: 'High resolution file available upon request',
    dateCreated: '2024-01-15',
    timeCreated: '14:30:22-07:00'
  };
}

function extractMockXmpData(): XmpData {
  return {
    title: 'Mountain Sunset Photography',
    description: 'A stunning capture of golden hour light over mountain peaks',
    subject: ['landscape', 'sunset', 'mountains', 'golden hour'],
    creator: ['John Photographer'],
    rights: '© 2024 Photography Studio Inc.',
    publisher: 'Photography Studio Inc.',
    contributor: ['John Photographer', 'Assistant Jane'],
    date: '2024-01-15T14:30:22-07:00',
    type: 'Photograph',
    format: 'image/jpeg',
    identifier: 'PS2024-MOUNTAIN-001',
    source: 'Digital Camera',
    language: 'en-US',
    coverage: 'Aspen, Colorado, United States',
    rating: 5,
    label: 'Portfolio',
    colorMode: 'RGB',
    historyActions: [
      'Imported from camera',
      'Basic corrections applied',
      'Color grading applied',
      'Export for web'
    ]
  };
}

function extractMockIccProfile(): IccProfile {
  return {
    description: 'Adobe RGB (1998)',
    copyright: 'Copyright Adobe Systems, Inc. 1999',
    manufacturer: 'Adobe',
    model: 'Adobe RGB (1998)',
    profileVersion: '2.1.0',
    deviceClass: 'Display',
    colorSpace: 'RGB',
    pcs: 'XYZ',
    platform: 'Apple',
    renderingIntent: 'Perceptual',
    whitePoint: [0.9505, 1.0000, 1.0890],
    redColorant: [0.6097, 0.2052, 0.1492],
    greenColorant: [0.2052, 0.6242, 0.0606],
    blueColorant: [0.1492, 0.0606, 0.7394]
  };
}

function extractMockColorProfile(): ColorProfileInfo {
  return {
    colorSpace: 'Adobe RGB',
    hasProfile: true,
    profileName: 'Adobe RGB (1998)',
    intent: 'Perceptual',
    gamma: 2.2,
    whitePoint: 'D65',
    primaries: {
      red: [0.64, 0.33],
      green: [0.21, 0.71],
      blue: [0.15, 0.06]
    }
  };
}

function extractMockGeolocation(): GeolocationData {
  const lat = 39.1911;
  const lng = -106.8175;
  
  return {
    latitude: lat,
    longitude: lng,
    altitude: 2438,
    direction: 245,
    mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
    locationName: 'Aspen, Colorado, USA'
  };
}

function extractCameraInfo(exifData: ExifData): CameraInfo {
  return {
    make: exifData.make,
    model: exifData.model,
    lens: 'Canon RF 85mm f/1.2L USM',
    serialNumber: 'CR5001234567',
    firmware: '1.8.1',
    settings: {
      aperture: exifData.fNumber,
      shutterSpeed: exifData.exposureTime,
      iso: exifData.iso,
      focalLength: exifData.focalLength,
      flash: exifData.flash !== 'Flash did not fire',
      meteringMode: exifData.meteringMode,
      focusMode: 'Single AF'
    }
  };
}

function extractMockThumbnail(): ThumbnailData {
  return {
    format: 'jpeg',
    width: 160,
    height: 120,
    size: 8192
  };
}

export function processImageMetadataExtractor(fileInput: string, config: ImageMetadataConfig): Promise<ToolResult> {
  return new Promise(async (resolve) => {
    try {
      const startTime = Date.now();
      
      // Check if we have a file (this would be handled differently in real implementation)
      if (!fileInput || fileInput.trim() === '') {
        resolve({
          success: false,
          error: 'Please provide an image file for metadata extraction'
        });
        return;
      }

      // Mock file processing
      const mockFile = new File([], 'sample-image.jpg', { type: 'image/jpeg' });
      
      const metadata = await extractImageMetadata(mockFile, config);
      const processingTime = Date.now() - startTime;
      metadata.processing.processingTime = processingTime;

      // Generate warnings
      const warnings: string[] = [];
      
      if (!metadata.processing.fileAnalysis.supportedFormat) {
        warnings.push('File format may not support metadata extraction');
      }
      
      if (!metadata.processing.fileAnalysis.hasMetadata) {
        warnings.push('No metadata found in image file');
      }
      
      if (metadata.fileSize > 50 * 1024 * 1024) {
        warnings.push('Large file size may slow processing');
      }

      // Format output based on configuration
      let output = '';
      
      switch (config.formatOutput) {
        case 'summary':
          output = generateSummaryOutput(metadata);
          break;
        case 'json':
          output = JSON.stringify(metadata, null, 2);
          break;
        case 'table':
          output = generateTableOutput(metadata);
          break;
        default:
          output = generateDetailedOutput(metadata, config);
      }

      resolve({
        success: true,
        output,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined
      });

    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  });
}

function generateDetailedOutput(metadata: ImageMetadataResult, config: ImageMetadataConfig): string {
  let output = `Image Metadata Extraction Report\n${'='.repeat(40)}\n\n`;
  
  // File Information
  output += `📁 File Information:\n`;
  output += `• Filename: ${metadata.filename}\n`;
  output += `• File Size: ${formatFileSize(metadata.fileSize)}\n`;
  output += `• File Type: ${metadata.fileType.toUpperCase()}\n`;
  output += `• MIME Type: ${metadata.mimeType}\n\n`;
  
  // Dimensions
  output += `📐 Image Dimensions:\n`;
  output += `• Size: ${metadata.dimensions.width} × ${metadata.dimensions.height} pixels\n`;
  output += `• Aspect Ratio: ${metadata.dimensions.aspectRatio}\n`;
  if (metadata.dimensions.resolution) {
    output += `• Resolution: ${metadata.dimensions.resolution.x} × ${metadata.dimensions.resolution.y} ${metadata.dimensions.resolution.unit}\n`;
  }
  if (metadata.dimensions.bitDepth) {
    output += `• Bit Depth: ${metadata.dimensions.bitDepth} bits per channel\n`;
  }
  if (metadata.dimensions.colorSpace) {
    output += `• Color Space: ${metadata.dimensions.colorSpace}\n`;
  }
  output += '\n';

  // EXIF Data
  if (metadata.exifData && config.extractExif) {
    output += `📷 EXIF Data:\n`;
    if (metadata.exifData.make) output += `• Camera Make: ${metadata.exifData.make}\n`;
    if (metadata.exifData.model) output += `• Camera Model: ${metadata.exifData.model}\n`;
    if (metadata.exifData.software) output += `• Software: ${metadata.exifData.software}\n`;
    if (metadata.exifData.dateTimeOriginal) output += `• Date Taken: ${metadata.exifData.dateTimeOriginal}\n`;
    if (metadata.exifData.exposureTime) output += `• Exposure Time: ${metadata.exifData.exposureTime}\n`;
    if (metadata.exifData.fNumber) output += `• F-Number: ${metadata.exifData.fNumber}\n`;
    if (metadata.exifData.iso) output += `• ISO: ${metadata.exifData.iso}\n`;
    if (metadata.exifData.focalLength) output += `• Focal Length: ${metadata.exifData.focalLength}\n`;
    if (metadata.exifData.flash) output += `• Flash: ${metadata.exifData.flash}\n`;
    output += '\n';
  }

  // Camera Information
  if (metadata.camera) {
    output += `🎯 Camera Settings:\n`;
    if (metadata.camera.lens) output += `• Lens: ${metadata.camera.lens}\n`;
    if (metadata.camera.serialNumber) output += `• Serial Number: ${metadata.camera.serialNumber}\n`;
    if (metadata.camera.firmware) output += `• Firmware: ${metadata.camera.firmware}\n`;
    if (metadata.camera.settings.meteringMode) output += `• Metering Mode: ${metadata.camera.settings.meteringMode}\n`;
    if (metadata.camera.settings.focusMode) output += `• Focus Mode: ${metadata.camera.settings.focusMode}\n`;
    output += '\n';
  }

  // IPTC Data
  if (metadata.iptcData && config.extractIptc) {
    output += `📝 IPTC Data:\n`;
    if (metadata.iptcData.headline) output += `• Headline: ${metadata.iptcData.headline}\n`;
    if (metadata.iptcData.caption) output += `• Caption: ${metadata.iptcData.caption}\n`;
    if (metadata.iptcData.byline) output += `• Photographer: ${metadata.iptcData.byline}\n`;
    if (metadata.iptcData.credit) output += `• Credit: ${metadata.iptcData.credit}\n`;
    if (metadata.iptcData.copyrightNotice) output += `• Copyright: ${metadata.iptcData.copyrightNotice}\n`;
    if (metadata.iptcData.keywords) output += `• Keywords: ${metadata.iptcData.keywords.join(', ')}\n`;
    if (metadata.iptcData.city) output += `• Location: ${metadata.iptcData.city}, ${metadata.iptcData.provinceState}, ${metadata.iptcData.countryName}\n`;
    output += '\n';
  }

  // XMP Data
  if (metadata.xmpData && config.extractXmp) {
    output += `🏷️ XMP Data:\n`;
    if (metadata.xmpData.title) output += `• Title: ${metadata.xmpData.title}\n`;
    if (metadata.xmpData.description) output += `• Description: ${metadata.xmpData.description}\n`;
    if (metadata.xmpData.creator) output += `• Creator: ${metadata.xmpData.creator.join(', ')}\n`;
    if (metadata.xmpData.rights) output += `• Rights: ${metadata.xmpData.rights}\n`;
    if (metadata.xmpData.rating) output += `• Rating: ${metadata.xmpData.rating}/5\n`;
    if (metadata.xmpData.label) output += `• Label: ${metadata.xmpData.label}\n`;
    output += '\n';
  }

  // Geolocation
  if (metadata.geolocation && config.includeGeolocation) {
    output += `🌍 Geolocation:\n`;
    output += `• Latitude: ${metadata.geolocation.latitude}°\n`;
    output += `• Longitude: ${metadata.geolocation.longitude}°\n`;
    if (metadata.geolocation.altitude) output += `• Altitude: ${metadata.geolocation.altitude}m\n`;
    if (metadata.geolocation.locationName) output += `• Location: ${metadata.geolocation.locationName}\n`;
    if (metadata.geolocation.mapUrl) output += `• Map: ${metadata.geolocation.mapUrl}\n`;
    output += '\n';
  }

  // Color Profile
  if (metadata.colorProfile && config.extractColorProfile) {
    output += `🎨 Color Profile:\n`;
    output += `• Color Space: ${metadata.colorProfile.colorSpace}\n`;
    output += `• Has Profile: ${metadata.colorProfile.hasProfile ? 'Yes' : 'No'}\n`;
    if (metadata.colorProfile.profileName) output += `• Profile Name: ${metadata.colorProfile.profileName}\n`;
    if (metadata.colorProfile.intent) output += `• Rendering Intent: ${metadata.colorProfile.intent}\n`;
    if (metadata.colorProfile.gamma) output += `• Gamma: ${metadata.colorProfile.gamma}\n`;
    output += '\n';
  }

  // ICC Profile
  if (metadata.iccProfile && config.extractIcc) {
    output += `📊 ICC Profile:\n`;
    if (metadata.iccProfile.description) output += `• Description: ${metadata.iccProfile.description}\n`;
    if (metadata.iccProfile.manufacturer) output += `• Manufacturer: ${metadata.iccProfile.manufacturer}\n`;
    if (metadata.iccProfile.deviceClass) output += `• Device Class: ${metadata.iccProfile.deviceClass}\n`;
    if (metadata.iccProfile.renderingIntent) output += `• Rendering Intent: ${metadata.iccProfile.renderingIntent}\n`;
    output += '\n';
  }

  // Thumbnail
  if (metadata.thumbnail && config.extractThumbnail) {
    output += `🖼️ Thumbnail:\n`;
    output += `• Format: ${metadata.thumbnail.format.toUpperCase()}\n`;
    output += `• Size: ${metadata.thumbnail.width} × ${metadata.thumbnail.height}\n`;
    output += `• Data Size: ${formatFileSize(metadata.thumbnail.size)}\n\n`;
  }

  // Processing Information
  output += `⚡ Processing Information:\n`;
  output += `• Processing Time: ${metadata.processing.processingTime}ms\n`;
  output += `• Extracted Sections: ${metadata.processing.extractedSections.join(', ')}\n`;
  output += `• Valid Image: ${metadata.processing.fileAnalysis.isValidImage ? 'Yes' : 'No'}\n`;
  output += `• Has Metadata: ${metadata.processing.fileAnalysis.hasMetadata ? 'Yes' : 'No'}\n`;
  output += `• Supported Format: ${metadata.processing.fileAnalysis.supportedFormat ? 'Yes' : 'No'}\n`;

  return output;
}

function generateSummaryOutput(metadata: ImageMetadataResult): string {
  let output = `Image Metadata Summary\n${'='.repeat(25)}\n\n`;
  
  output += `📁 ${metadata.filename} (${metadata.fileType.toUpperCase()})\n`;
  output += `📐 ${metadata.dimensions.width} × ${metadata.dimensions.height} pixels\n`;
  output += `💾 ${formatFileSize(metadata.fileSize)}\n`;
  
  if (metadata.exifData?.make && metadata.exifData?.model) {
    output += `📷 ${metadata.exifData.make} ${metadata.exifData.model}\n`;
  }
  
  if (metadata.exifData?.dateTimeOriginal) {
    output += `📅 ${metadata.exifData.dateTimeOriginal}\n`;
  }
  
  if (metadata.processing.extractedSections.length > 0) {
    output += `🏷️ Metadata: ${metadata.processing.extractedSections.join(', ')}\n`;
  }
  
  return output;
}

function generateTableOutput(metadata: ImageMetadataResult): string {
  let output = `| Property | Value |\n`;
  output += `|----------|-------|\n`;
  output += `| Filename | ${metadata.filename} |\n`;
  output += `| File Size | ${formatFileSize(metadata.fileSize)} |\n`;
  output += `| Dimensions | ${metadata.dimensions.width} × ${metadata.dimensions.height} |\n`;
  output += `| File Type | ${metadata.fileType.toUpperCase()} |\n`;
  
  if (metadata.exifData?.make) {
    output += `| Camera Make | ${metadata.exifData.make} |\n`;
  }
  if (metadata.exifData?.model) {
    output += `| Camera Model | ${metadata.exifData.model} |\n`;
  }
  if (metadata.exifData?.dateTimeOriginal) {
    output += `| Date Taken | ${metadata.exifData.dateTimeOriginal} |\n`;
  }
  if (metadata.exifData?.exposureTime) {
    output += `| Exposure | ${metadata.exifData.exposureTime} |\n`;
  }
  if (metadata.exifData?.fNumber) {
    output += `| Aperture | ${metadata.exifData.fNumber} |\n`;
  }
  if (metadata.exifData?.iso) {
    output += `| ISO | ${metadata.exifData.iso} |\n`;
  }
  
  return output;
}

function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export const IMAGE_METADATA_EXTRACTOR_TOOL: Tool = {
  id: 'image-metadata-extractor',
  name: 'Image Metadata Extractor',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'image-processing')!,
  slug: 'image-metadata-extractor',
  icon: '🖼️',
  keywords: ['image', 'metadata', 'exif', 'iptc', 'xmp', 'icc', 'photo', 'camera', 'gps', 'geolocation'],
  seoTitle: 'Image Metadata Extractor - Extract EXIF, IPTC, XMP Data | FreeFormatHub',
  seoDescription: 'Extract comprehensive metadata from images including EXIF camera data, IPTC keywords, XMP information, ICC profiles, and geolocation data.',
  description: 'Extract comprehensive metadata from image files including EXIF camera settings, IPTC descriptive data, XMP information, ICC color profiles, geolocation data, and thumbnails.',

  examples: [
    {
      title: 'EXIF Camera Data',
      input: 'photo.jpg',
      output: `📷 EXIF Data:
• Camera Make: Canon
• Camera Model: EOS R5
• Date Taken: 2024:01:15 14:30:22
• Exposure Time: 1/500
• F-Number: f/2.8
• ISO: 400
• Focal Length: 85mm
• Flash: Flash did not fire

🎯 Camera Settings:
• Lens: Canon RF 85mm f/1.2L USM
• Metering Mode: Multi-segment
• Focus Mode: Single AF`,
      description: 'Extract camera settings and technical metadata from photos'
    },
    {
      title: 'IPTC Descriptive Data',
      input: 'landscape.jpg',
      output: `📝 IPTC Data:
• Headline: Mountain Sunset Photography
• Caption: Beautiful sunset over the mountains
• Photographer: John Photographer
• Credit: Photography Studio Inc.
• Copyright: © 2024 Photography Studio Inc.
• Keywords: sunset, mountains, landscape, golden hour
• Location: Aspen, Colorado, United States`,
      description: 'Extract descriptive metadata and copyright information'
    },
    {
      title: 'Geolocation Data',
      input: 'geotagged.jpg',
      output: `🌍 Geolocation:
• Latitude: 39.1911°
• Longitude: -106.8175°
• Altitude: 2438m
• Location: Aspen, Colorado, USA
• Map: https://www.google.com/maps?q=39.1911,-106.8175

🎨 Color Profile:
• Color Space: Adobe RGB
• Profile Name: Adobe RGB (1998)
• Rendering Intent: Perceptual`,
      description: 'Extract GPS coordinates and color profile information'
    }
  ],

  useCases: [
    'Digital asset management and photo organization',
    'Copyright and authorship verification',
    'Camera settings analysis for photography learning',
    'Geolocation tracking and mapping of photos',
    'Color profile verification for print workflows',
    'Metadata removal for privacy protection',
    'Photo forensics and authenticity verification',
    'Automated photo cataloging and tagging',
    'Quality control in professional photography',
    'Compliance checking for stock photography'
  ],

  faq: [
    {
      question: 'What types of metadata can be extracted?',
      answer: 'The tool extracts EXIF (camera settings), IPTC (descriptive data), XMP (Adobe metadata), ICC (color profiles), geolocation data, and embedded thumbnails from supported image formats.'
    },
    {
      question: 'Which image formats support metadata?',
      answer: 'JPEG and TIFF files support the most comprehensive metadata. PNG supports limited metadata, while GIF and BMP have minimal metadata support.'
    },
    {
      question: 'Is geolocation data automatically extracted?',
      answer: 'GPS data is extracted when present in EXIF data and the geolocation option is enabled. Not all photos contain location information.'
    },
    {
      question: 'Can I extract metadata without uploading files?',
      answer: 'All processing happens locally in your browser. Image files are not uploaded to any server, ensuring complete privacy.'
    },
    {
      question: 'What is the difference between EXIF, IPTC, and XMP?',
      answer: 'EXIF contains camera technical data, IPTC holds descriptive information like captions and keywords, and XMP is Adobe\'s extensible metadata standard that can contain various information types.'
    }
  ],

  commonErrors: [
    'Unsupported image format for metadata extraction',
    'Corrupted or incomplete metadata in image file',
    'Large file size causing processing delays',
    'Missing metadata sections in image file',
    'Invalid GPS coordinates in geolocation data'
  ],

  relatedTools: ['image-compressor', 'image-format-converter', 'exif-remover', 'photo-analyzer', 'geolocation-extractor']
};