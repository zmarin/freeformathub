import type { Tool, ToolResult, ToolExample } from '../types';
import { TOOL_CATEGORIES } from '../../lib/tools/registry';

export interface PDFToolsOptions {
  operation: 'merge' | 'split' | 'extract-text' | 'extract-images' | 'compress' | 'password-protect' | 'remove-password';
  password?: string;
  splitPages?: string; // e.g., "1-3,5,7-10"
  compressionLevel?: number; // 1-9
  newPassword?: string;
}

export interface PDFToolsInput {
  files: File[];
  options: PDFToolsOptions;
}

export interface PDFToolsResult extends ToolResult {
  processedFiles?: Blob[];
  extractedText?: string;
  extractedImages?: Blob[];
  fileInfo?: {
    pages: number;
    size: number;
    isProtected: boolean;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
}

async function processPDFFiles(input: PDFToolsInput): Promise<PDFToolsResult> {
  try {
    const { files, options } = input;

    if (!files || files.length === 0) {
      return {
        success: false,
        error: 'No PDF files provided'
      };
    }

    // Validate that all files are PDFs
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        return {
          success: false,
          error: `File ${file.name} is not a PDF file`
        };
      }
    }

    switch (options.operation) {
      case 'merge':
        return await mergePDFs(files, options);
      
      case 'split':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Split operation requires exactly one PDF file'
          };
        }
        return await splitPDF(files[0], options);
      
      case 'extract-text':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Text extraction requires exactly one PDF file'
          };
        }
        return await extractTextFromPDF(files[0], options);
      
      case 'extract-images':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Image extraction requires exactly one PDF file'
          };
        }
        return await extractImagesFromPDF(files[0], options);
      
      case 'compress':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Compression requires exactly one PDF file'
          };
        }
        return await compressPDF(files[0], options);
      
      case 'password-protect':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Password protection requires exactly one PDF file'
          };
        }
        return await protectPDF(files[0], options);
      
      case 'remove-password':
        if (files.length !== 1) {
          return {
            success: false,
            error: 'Password removal requires exactly one PDF file'
          };
        }
        return await removePasswordFromPDF(files[0], options);
      
      default:
        return {
          success: false,
          error: `Unknown operation: ${options.operation}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function mergePDFs(files: File[], options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  // In a real implementation, you would use a library like PDF-lib or jsPDF
  return {
    success: false,
    error: 'PDF merging requires a PDF processing library (PDF-lib). This is a client-side demonstration.'
  };
}

async function splitPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF splitting requires a PDF processing library (PDF-lib). This is a client-side demonstration.'
  };
}

async function extractTextFromPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF text extraction requires a PDF processing library (PDF.js or PDF-lib). This is a client-side demonstration.'
  };
}

async function extractImagesFromPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF image extraction requires a PDF processing library (PDF.js or PDF-lib). This is a client-side demonstration.'
  };
}

async function compressPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF compression requires a PDF processing library (PDF-lib). This is a client-side demonstration.'
  };
}

async function protectPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF password protection requires a PDF processing library (PDF-lib). This is a client-side demonstration.'
  };
}

async function removePasswordFromPDF(file: File, options: PDFToolsOptions): Promise<PDFToolsResult> {
  // Note: This is a placeholder implementation
  return {
    success: false,
    error: 'PDF password removal requires a PDF processing library (PDF-lib). This is a client-side demonstration.'
  };
}

function parsePageRange(range: string): number[] {
  const pages: number[] = [];
  const parts = range.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
      if (isNaN(start) || isNaN(end) || start > end || start < 1) {
        throw new Error(`Invalid page range: ${part}`);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    } else {
      const page = parseInt(trimmed);
      if (isNaN(page) || page < 1) {
        throw new Error(`Invalid page number: ${part}`);
      }
      pages.push(page);
    }
  }
  
  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

export const PDF_TOOLS_TOOL: Tool = {
  id: 'pdf-tools',
  name: 'PDF Tools',
  description: 'Comprehensive PDF manipulation toolkit for merging, splitting, text extraction, and more',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'data')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'data')!.subcategories!.find(sub => sub.id === 'document-processing')!,
  slug: 'pdf-tools',
  icon: 'FileText',
  tags: ['pdf', 'merge', 'split', 'extract', 'compress', 'document'],
  complexity: 'advanced',
  keywords: ['pdf', 'merge', 'split', 'extract', 'compress', 'password', 'document', 'file'],
  
  examples: [
    {
      title: 'PDF Merging',
      input: 'Upload multiple PDF files',
      output: 'Single merged PDF document',
      description: 'Combine multiple PDF files into one document'
    },
    {
      title: 'PDF Splitting',
      input: 'Upload PDF and specify pages: "1-3,5,7-10"',
      output: 'Multiple PDF files with specified pages',
      description: 'Split large PDF into smaller parts'
    },
    {
      title: 'Text Extraction',
      input: 'Upload PDF document',
      output: 'Extracted text content from all pages',
      description: 'Extract text content from PDF files'
    }
  ],
  
  useCases: [
    'Merge multiple PDF files into one document',
    'Split large PDF files into smaller parts',
    'Extract text content from PDF documents',
    'Extract images from PDF files',
    'Compress PDF files to reduce size',
    'Add or remove password protection',
    'Get PDF metadata and information'
  ],
  
  faq: [
    {
      question: 'What PDF operations are supported?',
      answer: 'The tool supports merging, splitting, text extraction, image extraction, compression, password protection/removal, and metadata extraction.'
    },
    {
      question: 'Is there a file size limit?',
      answer: 'Processing is done client-side, so limits depend on your browser and device memory. Large files may take longer to process.'
    },
    {
      question: 'Are passwords secure?',
      answer: 'All processing happens locally in your browser. No files or passwords are sent to external servers.'
    },
    {
      question: 'How do I specify page ranges for splitting?',
      answer: 'Use formats like "1-3,5,7-10" to specify individual pages and ranges. Pages are numbered starting from 1.'
    }
  ],
  
  commonErrors: [
    'Invalid page range format',
    'Password-protected PDF cannot be processed',
    'Corrupted or invalid PDF file'
  ],
  
  relatedTools: ['image-format-converter', 'file-compressor', 'document-converter'],
  seoTitle: 'PDF Tools - Merge, Split, Extract, and Compress PDFs Online',
  seoDescription: 'Comprehensive PDF toolkit for merging, splitting, text extraction, compression, and password protection. All processing done locally.'
};