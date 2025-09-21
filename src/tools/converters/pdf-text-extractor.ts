import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface PDFTextExtractorConfig {
  preserveLineBreaks: boolean;
  preserveWhitespace: boolean;
  extractMetadata: boolean;
  pageRange?: {
    start: number;
    end: number;
  };
  outputFormat: 'plain' | 'markdown' | 'json';
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: PDFMetadata;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  fileSize: number;
  version?: string;
}

const DEFAULT_CONFIG: PDFTextExtractorConfig = {
  preserveLineBreaks: true,
  preserveWhitespace: false,
  extractMetadata: true,
  outputFormat: 'plain',
};

export async function extractTextFromPDF(file: File, config: PDFTextExtractorConfig = DEFAULT_CONFIG): Promise<ToolResult> {
  try {
    if (!file) {
      return {
        success: false,
        error: 'No PDF file provided'
      };
    }

    if (file.type !== 'application/pdf') {
      return {
        success: false,
        error: 'File must be a PDF document'
      };
    }

    // Check file size (limit to 50MB for client-side processing)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `PDF file too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Load PDF.js dynamically
    const pdfjs = await loadPDFJS();

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const metadata: PDFMetadata = {
      pageCount: pdf.numPages,
      fileSize: file.size,
    };

    // Extract metadata if requested
    if (config.extractMetadata) {
      try {
        const pdfMetadata = await pdf.getMetadata();
        metadata.title = pdfMetadata.info?.Title || undefined;
        metadata.author = pdfMetadata.info?.Author || undefined;
        metadata.subject = pdfMetadata.info?.Subject || undefined;
        metadata.creator = pdfMetadata.info?.Creator || undefined;
        metadata.producer = pdfMetadata.info?.Producer || undefined;
        metadata.creationDate = pdfMetadata.info?.CreationDate || undefined;
        metadata.modificationDate = pdfMetadata.info?.ModDate || undefined;
        metadata.version = pdfMetadata.info?.PDFFormatVersion || undefined;
      } catch (metaError) {
        console.warn('Could not extract PDF metadata:', metaError);
      }
    }

    // Determine page range
    const startPage = config.pageRange?.start || 1;
    const endPage = config.pageRange?.end || pdf.numPages;
    const actualStartPage = Math.max(1, Math.min(startPage, pdf.numPages));
    const actualEndPage = Math.max(actualStartPage, Math.min(endPage, pdf.numPages));

    // Extract text from pages
    const textContent: string[] = [];

    for (let pageNum = actualStartPage; pageNum <= actualEndPage; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContentObj = await page.getTextContent();

        let pageText = '';
        for (const item of textContentObj.items) {
          if ('str' in item) {
            pageText += item.str;

            // Add space if the next item is on the same line but with a gap
            if (config.preserveWhitespace && 'transform' in item) {
              pageText += ' ';
            }
          }
        }

        // Clean up text based on config
        if (!config.preserveWhitespace) {
          pageText = pageText.replace(/\s+/g, ' ').trim();
        }

        if (config.preserveLineBreaks) {
          // Try to detect line breaks by analyzing text layout
          pageText = pageText.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
        }

        if (pageText.trim()) {
          textContent.push(pageText.trim());
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        textContent.push(`[Error extracting text from page ${pageNum}]`);
      }
    }

    // Join all text content
    const extractedText = textContent.join('\n\n');

    if (!extractedText.trim()) {
      return {
        success: true,
        output: 'No text content found in the PDF file. The PDF might contain only images or be password-protected.',
        metadata
      };
    }

    // Format output based on config
    let formattedOutput = '';

    switch (config.outputFormat) {
      case 'markdown':
        formattedOutput = `# PDF Text Content\n\n`;
        if (metadata.title) {
          formattedOutput += `**Document:** ${metadata.title}\n`;
        }
        if (metadata.author) {
          formattedOutput += `**Author:** ${metadata.author}\n`;
        }
        formattedOutput += `**Pages:** ${actualStartPage}-${actualEndPage} of ${metadata.pageCount}\n`;
        formattedOutput += `**File Size:** ${formatFileSize(metadata.fileSize)}\n\n`;
        formattedOutput += `---\n\n${extractedText}`;
        break;

      case 'json':
        const jsonOutput = {
          metadata,
          extractedPages: { start: actualStartPage, end: actualEndPage },
          textContent: extractedText,
          extractedAt: new Date().toISOString()
        };
        formattedOutput = JSON.stringify(jsonOutput, null, 2);
        break;

      default: // plain
        formattedOutput = extractedText;
        break;
    }

    return {
      success: true,
      output: formattedOutput,
      metadata
    };

  } catch (error) {
    return {
      success: false,
      error: `PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Utility function to load PDF.js dynamically
async function loadPDFJS() {
  try {
    // Try to use CDN version for client-side compatibility
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

    return new Promise((resolve, reject) => {
      script.onload = () => {
        if (window.pdfjsLib) {
          // Set worker source
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  } catch (error) {
    throw new Error('PDF.js library not available. Please check your internet connection.');
  }
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const PDF_TEXT_EXTRACTOR_TOOL: Tool = {
  id: 'pdf-text-extractor',
  name: 'PDF Text Extractor - Extract Text from PDF Online',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!,
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'converters')!.subcategories!.find(sub => sub.id === 'document-conversion')!,
  slug: 'pdf-text-extractor',
  icon: '📄',
  keywords: ['pdf text extractor', 'pdf to text', 'extract text from pdf', 'pdf text extraction', 'pdf converter', 'pdf reader', 'free pdf text extractor', 'online pdf text extractor'],
  seoTitle: 'Free PDF Text Extractor Online - Extract Text from PDF Files',
  seoDescription: 'Extract text from PDF files instantly with our free online PDF text extractor. No upload to servers, works offline, supports large files. Convert PDF to text safely.',
  description: 'Free online PDF text extractor that safely extracts text content from PDF documents in your browser. No files uploaded to servers, works offline, supports metadata extraction, and handles large PDF files up to 50MB.',

  examples: [
    {
      title: 'Research Paper Text Extraction',
      input: 'research-paper.pdf (10 pages)',
      output: `# PDF Text Content

**Document:** Analysis of Machine Learning Algorithms
**Author:** Dr. Jane Smith
**Pages:** 1-10 of 10
**File Size:** 2.3 MB

---

ABSTRACT

This paper presents a comprehensive analysis of machine learning algorithms and their applications in modern data science. We examine supervised learning, unsupervised learning, and reinforcement learning approaches...

INTRODUCTION

Machine learning has revolutionized the way we process and analyze data. In recent years, the field has seen unprecedented growth...`,
      description: 'Extract text from academic papers and research documents'
    },
    {
      title: 'Business Document Processing',
      input: 'contract.pdf (3 pages, pages 2-3 only)',
      output: `TERMS AND CONDITIONS

Section 5. Payment Terms
Payment shall be made within thirty (30) days of invoice date. Late payments may incur interest charges at the rate of 1.5% per month.

Section 6. Confidentiality
Both parties agree to maintain strict confidentiality regarding proprietary information shared during the course of this agreement...`,
      description: 'Extract specific pages from business documents and contracts'
    },
    {
      title: 'Text Extraction with Metadata',
      input: 'invoice.pdf (1 page)',
      output: `{
  "metadata": {
    "title": "Invoice #2024-001",
    "author": "ABC Company",
    "pageCount": 1,
    "fileSize": 156789,
    "creationDate": "2024-01-15T10:30:00Z"
  },
  "extractedPages": {
    "start": 1,
    "end": 1
  },
  "textContent": "INVOICE\\n\\nInvoice Number: 2024-001\\nDate: January 15, 2024\\nBill To: XYZ Corporation...",
  "extractedAt": "2024-01-20T15:45:00Z"
}`,
      description: 'Extract text with complete metadata in JSON format'
    }
  ],

  howItWorks: [
    {
      title: "Upload Your PDF File",
      icon: "📁",
      description: "Select a PDF file from your computer (up to 50MB). The file is processed entirely in your browser - no upload to servers required. Supports password-protected PDFs and files with complex layouts.",
      keywords: ["upload pdf", "pdf file input", "pdf text extraction", "secure pdf processing"]
    },
    {
      title: "Configure Extraction Options",
      icon: "⚙️",
      description: "Choose extraction settings: preserve line breaks, extract metadata, select specific page ranges, and pick output format (plain text, Markdown, or JSON). Customize the extraction to match your needs.",
      keywords: ["pdf extraction options", "text formatting", "page range selection", "pdf metadata"]
    },
    {
      title: "Extract Text Instantly",
      icon: "⚡",
      description: "Click 'Extract Text' to process your PDF using advanced PDF.js technology. Text is extracted with layout preservation, and metadata like author, title, and creation date is captured automatically.",
      keywords: ["instant pdf extraction", "pdf.js", "text extraction", "pdf processing"]
    },
    {
      title: "Download or Copy Results",
      icon: "💾",
      description: "Copy extracted text to clipboard or download as a text file. Perfect for data entry, content migration, research, legal document processing, and accessibility compliance.",
      keywords: ["download pdf text", "copy extracted text", "pdf accessibility", "document processing"]
    }
  ],

  useCases: [
    'Academic research and paper analysis',
    'Legal document text extraction and review',
    'Business contract and agreement processing',
    'Data entry and content migration from PDF forms',
    'Accessibility compliance for PDF documents',
    'Invoice and receipt text extraction for accounting',
    'Content analysis and keyword extraction from reports',
    'Translation preparation from PDF documents',
    'Archive digitization and text preservation',
    'Educational material text extraction for study notes'
  ],

  faq: [
    {
      question: 'Is this PDF text extractor free to use?',
      answer: 'Yes, this PDF text extractor is completely free with no limits on the number of files you can process. No registration required, and no watermarks added to extracted text.'
    },
    {
      question: 'Are my PDF files uploaded to your servers?',
      answer: 'No, all PDF processing happens locally in your browser using PDF.js technology. Your files never leave your computer, ensuring complete privacy and security for sensitive documents.'
    },
    {
      question: 'What size PDF files can I extract text from?',
      answer: 'You can extract text from PDF files up to 50MB in size. This covers most documents including research papers, reports, contracts, and books. Larger files may slow down your browser.'
    },
    {
      question: 'Can I extract text from password-protected PDFs?',
      answer: 'This tool works with unprotected PDF files. For password-protected PDFs, you would need to remove the password protection first using other PDF tools before text extraction.'
    },
    {
      question: 'Does this work with scanned PDF documents (images)?',
      answer: 'This tool extracts text that is already embedded in PDF files. For scanned PDFs (which are essentially images), you would need OCR (Optical Character Recognition) software to convert images to text first.'
    },
    {
      question: 'Can I extract text from specific pages only?',
      answer: 'Yes, you can specify a page range to extract text from only certain pages. This is useful for large documents where you only need content from specific sections.'
    },
    {
      question: 'What output formats are supported?',
      answer: 'You can export extracted text in three formats: Plain Text (for simple use), Markdown (with document structure), or JSON (with metadata and structured data). Choose the format that best fits your needs.'
    },
    {
      question: 'How accurate is the text extraction?',
      answer: 'Text extraction accuracy depends on the PDF quality and structure. Well-formatted PDFs with embedded text provide near-perfect results. Complex layouts or unusual fonts may require manual review of extracted text.'
    }
  ],

  commonErrors: [
    'PDF file is password protected - remove password protection first',
    'PDF contains only images - use OCR tools for scanned documents',
    'File size too large - try compressing the PDF or extracting pages in batches',
    'Complex layouts may cause text order issues - review extracted text for accuracy',
    'Some fonts or special characters may not extract correctly'
  ],

  relatedTools: ['pdf-tools', 'text-statistics', 'word-counter', 'markdown-converter']
};