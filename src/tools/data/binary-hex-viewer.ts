import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface BinaryHexViewerConfig {
  displayMode: 'hex' | 'binary' | 'ascii' | 'combined';
  bytesPerLine: number;
  showAddresses: boolean;
  showAscii: boolean;
  groupBytes: number;
  upperCase: boolean;
  encoding: 'utf8' | 'utf16' | 'ascii' | 'latin1';
  startOffset: number;
  maxBytes: number;
  highlightPattern: string;
  colorize: boolean;
  showHeaders: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  analysis?: FileAnalysis;
}

interface FileAnalysis {
  size: number;
  type: string;
  encoding: string;
  entropy: number;
  nullBytes: number;
  printableChars: number;
  signature: string;
  magicNumber: string;
  fileFormat: FileFormat;
  structure: FileStructure[];
}

interface FileFormat {
  name: string;
  mimeType: string;
  extension: string;
  description: string;
  confidence: number;
}

interface FileStructure {
  offset: number;
  length: number;
  name: string;
  description: string;
  value: string;
  type: 'header' | 'data' | 'metadata' | 'footer';
}

// File signatures for format detection
const FILE_SIGNATURES: Record<string, FileFormat> = {
  '89504E47': { name: 'PNG', mimeType: 'image/png', extension: '.png', description: 'Portable Network Graphics', confidence: 1.0 },
  'FFD8FF': { name: 'JPEG', mimeType: 'image/jpeg', extension: '.jpg', description: 'JPEG Image', confidence: 1.0 },
  '47494638': { name: 'GIF', mimeType: 'image/gif', extension: '.gif', description: 'Graphics Interchange Format', confidence: 1.0 },
  '504B0304': { name: 'ZIP', mimeType: 'application/zip', extension: '.zip', description: 'ZIP Archive', confidence: 1.0 },
  '25504446': { name: 'PDF', mimeType: 'application/pdf', extension: '.pdf', description: 'Portable Document Format', confidence: 1.0 },
  '4D5A': { name: 'EXE', mimeType: 'application/octet-stream', extension: '.exe', description: 'Windows Executable', confidence: 1.0 },
  '7F454C46': { name: 'ELF', mimeType: 'application/octet-stream', extension: '', description: 'Linux Executable', confidence: 1.0 },
  'CAFEBABE': { name: 'Java', mimeType: 'application/java-vm', extension: '.class', description: 'Java Class File', confidence: 1.0 },
  '377ABCAF': { name: '7Z', mimeType: 'application/x-7z-compressed', extension: '.7z', description: '7-Zip Archive', confidence: 1.0 },
  '52617221': { name: 'RAR', mimeType: 'application/x-rar-compressed', extension: '.rar', description: 'RAR Archive', confidence: 1.0 },
  '1F8B08': { name: 'GZIP', mimeType: 'application/gzip', extension: '.gz', description: 'GZIP Compressed', confidence: 1.0 },
  '425A68': { name: 'BZIP2', mimeType: 'application/x-bzip2', extension: '.bz2', description: 'BZIP2 Compressed', confidence: 1.0 },
  '49443303': { name: 'MP3', mimeType: 'audio/mpeg', extension: '.mp3', description: 'MP3 Audio', confidence: 0.9 },
  'RIFF': { name: 'RIFF', mimeType: 'audio/wav', extension: '.wav', description: 'RIFF Container (WAV/AVI)', confidence: 0.8 },
};

function stringToBytes(input: string, encoding: string): Uint8Array {
  if (encoding === 'hex') {
    // Parse hex input
    const hex = input.replace(/[^0-9A-Fa-f]/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
  
  // Text input
  const encoder = new TextEncoder();
  return encoder.encode(input);
}

function bytesToHex(bytes: Uint8Array, upperCase: boolean = false): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    [upperCase ? 'toUpperCase' : 'toLowerCase']();
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join(' ');
}

function bytesToAscii(bytes: Uint8Array, showUnprintable: boolean = true): string {
  return Array.from(bytes)
    .map(byte => {
      if (byte >= 32 && byte <= 126) {
        return String.fromCharCode(byte);
      } else if (showUnprintable) {
        return '·'; // Middle dot for unprintable characters
      } else {
        return ' ';
      }
    })
    .join('');
}

function calculateEntropy(bytes: Uint8Array): number {
  const frequencies: number[] = new Array(256).fill(0);
  
  // Count byte frequencies
  for (const byte of bytes) {
    frequencies[byte]++;
  }
  
  // Calculate entropy
  let entropy = 0;
  const length = bytes.length;
  
  for (const freq of frequencies) {
    if (freq > 0) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

function detectFileFormat(bytes: Uint8Array): FileFormat {
  const headerHex = bytesToHex(bytes.slice(0, 16), true);
  
  // Check against known signatures
  for (const [signature, format] of Object.entries(FILE_SIGNATURES)) {
    if (headerHex.startsWith(signature)) {
      return format;
    }
  }
  
  // Additional heuristics
  if (headerHex.startsWith('52494646')) {
    // RIFF container - check for specific types
    const riffType = bytesToHex(bytes.slice(8, 12), true);
    if (riffType === '57415645') {
      return { name: 'WAV', mimeType: 'audio/wav', extension: '.wav', description: 'WAV Audio', confidence: 1.0 };
    } else if (riffType === '41564920') {
      return { name: 'AVI', mimeType: 'video/avi', extension: '.avi', description: 'AVI Video', confidence: 1.0 };
    }
  }
  
  // Check for text-based formats
  const textSample = bytesToAscii(bytes.slice(0, 100), false).trim();
  if (textSample.startsWith('<?xml')) {
    return { name: 'XML', mimeType: 'application/xml', extension: '.xml', description: 'XML Document', confidence: 0.9 };
  } else if (textSample.startsWith('{') || textSample.startsWith('[')) {
    return { name: 'JSON', mimeType: 'application/json', extension: '.json', description: 'JSON Document', confidence: 0.8 };
  } else if (textSample.includes('<!DOCTYPE html>') || textSample.includes('<html')) {
    return { name: 'HTML', mimeType: 'text/html', extension: '.html', description: 'HTML Document', confidence: 0.9 };
  }
  
  return { name: 'Unknown', mimeType: 'application/octet-stream', extension: '', description: 'Unknown file format', confidence: 0.0 };
}

function analyzeFileStructure(bytes: Uint8Array, format: FileFormat): FileStructure[] {
  const structures: FileStructure[] = [];
  
  if (format.name === 'PNG') {
    // PNG file structure
    structures.push({
      offset: 0,
      length: 8,
      name: 'PNG Signature',
      description: 'PNG file signature',
      value: bytesToHex(bytes.slice(0, 8), true),
      type: 'header'
    });
    
    let offset = 8;
    while (offset < bytes.length - 8) {
      const length = new DataView(bytes.buffer, offset, 4).getUint32(0);
      const type = bytesToAscii(bytes.slice(offset + 4, offset + 8));
      
      structures.push({
        offset,
        length: length + 12,
        name: `${type} Chunk`,
        description: `PNG ${type} chunk (${length} bytes)`,
        value: `Type: ${type}, Length: ${length}`,
        type: type === 'IHDR' ? 'header' : type === 'IEND' ? 'footer' : 'data'
      });
      
      offset += length + 12;
      if (type === 'IEND') break;
    }
  } else if (format.name === 'JPEG') {
    // JPEG file structure
    let offset = 0;
    while (offset < bytes.length - 4) {
      if (bytes[offset] === 0xFF) {
        const marker = bytes[offset + 1];
        const markerName = getJpegMarkerName(marker);
        
        let length = 2;
        if (marker !== 0xD8 && marker !== 0xD9) { // Not SOI or EOI
          length = new DataView(bytes.buffer, offset + 2, 2).getUint16(0) + 2;
        }
        
        structures.push({
          offset,
          length,
          name: `JPEG ${markerName}`,
          description: `JPEG marker 0xFF${marker.toString(16).toUpperCase()}`,
          value: `Marker: 0xFF${marker.toString(16).toUpperCase()}, Length: ${length}`,
          type: marker === 0xD8 ? 'header' : marker === 0xD9 ? 'footer' : 'data'
        });
        
        offset += length;
      } else {
        offset++;
      }
    }
  }
  
  return structures;
}

function getJpegMarkerName(marker: number): string {
  const markers: Record<number, string> = {
    0xD8: 'SOI (Start of Image)',
    0xD9: 'EOI (End of Image)',
    0xDA: 'SOS (Start of Scan)',
    0xDB: 'DQT (Quantization Table)',
    0xC0: 'SOF0 (Start of Frame)',
    0xC4: 'DHT (Huffman Table)',
    0xE0: 'APP0 (Application)',
    0xE1: 'APP1 (Application)',
    0xFE: 'COM (Comment)'
  };
  
  return markers[marker] || `Unknown (0x${marker.toString(16).toUpperCase()})`;
}

function formatHexDump(bytes: Uint8Array, config: BinaryHexViewerConfig): string {
  const lines: string[] = [];
  const startOffset = config.startOffset;
  const maxBytes = Math.min(bytes.length, config.maxBytes);
  const bytesToProcess = bytes.slice(startOffset, startOffset + maxBytes);
  
  if (config.showHeaders) {
    let header = '';
    if (config.showAddresses) {
      header += 'Address'.padEnd(10) + ' ';
    }
    
    if (config.displayMode === 'hex' || config.displayMode === 'combined') {
      header += 'Hex'.padEnd(config.bytesPerLine * 3) + ' ';
    }
    
    if (config.displayMode === 'binary' || config.displayMode === 'combined') {
      header += 'Binary'.padEnd(config.bytesPerLine * 9) + ' ';
    }
    
    if (config.showAscii || config.displayMode === 'ascii' || config.displayMode === 'combined') {
      header += 'ASCII';
    }
    
    lines.push(header);
    lines.push('─'.repeat(header.length));
  }
  
  for (let i = 0; i < bytesToProcess.length; i += config.bytesPerLine) {
    const lineBytes = bytesToProcess.slice(i, i + config.bytesPerLine);
    let line = '';
    
    // Address column
    if (config.showAddresses) {
      const address = (startOffset + i).toString(16).toUpperCase().padStart(8, '0');
      line += address + ': ';
    }
    
    // Hex display
    if (config.displayMode === 'hex' || config.displayMode === 'combined') {
      const hexParts: string[] = [];
      for (let j = 0; j < lineBytes.length; j++) {
        const hex = lineBytes[j].toString(16).padStart(2, '0');
        hexParts.push(config.upperCase ? hex.toUpperCase() : hex);
        
        // Group bytes
        if (config.groupBytes > 1 && (j + 1) % config.groupBytes === 0 && j < lineBytes.length - 1) {
          hexParts.push(' ');
        }
      }
      
      // Pad the hex section to align ASCII
      const hexSection = hexParts.join(' ').padEnd(config.bytesPerLine * 3);
      line += hexSection + ' ';
    }
    
    // Binary display
    if (config.displayMode === 'binary' || config.displayMode === 'combined') {
      const binaryParts: string[] = [];
      for (const byte of lineBytes) {
        binaryParts.push(byte.toString(2).padStart(8, '0'));
      }
      
      const binarySection = binaryParts.join(' ').padEnd(config.bytesPerLine * 9);
      line += binarySection + ' ';
    }
    
    // ASCII display
    if (config.showAscii || config.displayMode === 'ascii' || config.displayMode === 'combined') {
      const ascii = bytesToAscii(lineBytes, true);
      line += '|' + ascii + '|';
    }
    
    lines.push(line);
  }
  
  return lines.join('\n');
}

function analyzeFile(bytes: Uint8Array): FileAnalysis {
  const format = detectFileFormat(bytes);
  const structure = analyzeFileStructure(bytes, format);
  
  // Calculate statistics
  const entropy = calculateEntropy(bytes);
  let nullBytes = 0;
  let printableChars = 0;
  
  for (const byte of bytes) {
    if (byte === 0) nullBytes++;
    if (byte >= 32 && byte <= 126) printableChars++;
  }
  
  const magicNumber = bytesToHex(bytes.slice(0, 4), true);
  const signature = bytesToHex(bytes.slice(0, 16), true);
  
  return {
    size: bytes.length,
    type: format.name,
    encoding: 'binary',
    entropy: Math.round(entropy * 100) / 100,
    nullBytes,
    printableChars,
    signature,
    magicNumber,
    fileFormat: format,
    structure
  };
}

export function processBinaryHexViewer(input: string, config: BinaryHexViewerConfig): ToolResult {
  try {
    if (!input.trim()) {
      return {
        success: false,
        error: 'Input data is required'
      };
    }
    
    // Determine if input is hex or text
    const isHexInput = /^[0-9A-Fa-f\s]+$/.test(input.trim());
    const encoding = isHexInput ? 'hex' : config.encoding;
    
    const bytes = stringToBytes(input, encoding);
    
    if (bytes.length === 0) {
      return {
        success: false,
        error: 'No valid data to display'
      };
    }
    
    const analysis = analyzeFile(bytes);
    const output = formatHexDump(bytes, config);
    
    return {
      success: true,
      output,
      analysis
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export const BINARY_HEX_VIEWER_TOOL: Tool = {
  id: 'binary-hex-viewer',
  name: 'Binary/Hex Viewer',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'binary-tools')!,
  slug: 'binary-hex-viewer',
  icon: '🔍',
  keywords: ['binary', 'hex', 'hexadecimal', 'dump', 'viewer', 'file', 'format', 'analysis'],
  seoTitle: 'Binary/Hex Viewer - Analyze Files in Hexadecimal Format | FreeFormatHub',
  seoDescription: 'Advanced binary and hex file viewer with format detection, structure analysis, and multiple display modes for file inspection and debugging.',
  description: 'Advanced binary and hexadecimal file viewer with format detection, structure analysis, and customizable display options.',

  examples: [
    {
      title: 'Hex Data Analysis',
      input: '89504E470D0A1A0A0000000D49484452',
      output: 'Address: 00000000: 89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52 |.PNG........IHDR|',
      description: 'View hex data with address, hex, and ASCII columns'
    },
    {
      title: 'File Format Detection',
      input: 'FFD8FFE000104A46494600010101006000600000',
      output: 'Detected: JPEG Image\nMagic Number: FFD8FFE0\nConfidence: 100%',
      description: 'Automatically detect file format from binary signature'
    },
    {
      title: 'Binary Analysis',
      input: 'Hello World!',
      output: 'Entropy: 3.02 bits\nPrintable chars: 100%\nFile size: 12 bytes',
      description: 'Analyze binary content and calculate statistics'
    }
  ],

  useCases: [
    'Analyzing file formats and detecting corruption in binary files',
    'Reverse engineering and debugging binary protocols',
    'Examining executable files and malware analysis (safe inspection)',
    'Validating data integrity and checking file headers',
    'Learning about file formats and binary data structures',
    'Debugging network protocols and packet inspection',
    'Forensic analysis of digital evidence and file recovery',
    'Hex editing preparation and understanding file layouts'
  ],

  faq: [
    {
      question: 'What file formats can the viewer detect?',
      answer: 'Detects common formats including PNG, JPEG, GIF, PDF, ZIP, EXE, ELF, Java class files, and many archive formats based on magic numbers and file signatures.'
    },
    {
      question: 'How does file structure analysis work?',
      answer: 'The tool parses known file formats (like PNG chunks or JPEG markers) to show the internal structure, helping understand how the file is organized.'
    },
    {
      question: 'What is entropy analysis and why is it useful?',
      answer: 'Entropy measures randomness in data (0-8 bits). High entropy suggests encrypted/compressed data, while low entropy indicates structured or repetitive content.'
    },
    {
      question: 'Can I view large files without performance issues?',
      answer: 'Yes, the tool limits display to a configurable number of bytes (default 64KB) and supports offset viewing to inspect specific file sections efficiently.'
    },
    {
      question: 'How do I interpret the different display modes?',
      answer: 'Hex shows bytes as hexadecimal, binary shows bits, ASCII shows printable characters. Combined mode shows all three for comprehensive analysis.'
    }
  ],

  commonErrors: [
    'Invalid hexadecimal input containing non-hex characters',
    'Empty input data or no valid bytes to display',
    'Offset value exceeding actual data length',
    'Invalid byte grouping or display configuration',
    'Memory limitations when processing very large files'
  ],

  relatedTools: ['file-analyzer', 'hash-generator', 'data-converter', 'file-signature-detector', 'binary-editor']
};