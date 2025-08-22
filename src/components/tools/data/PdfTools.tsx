import React, { useState, useCallback } from 'react';
import { Upload, FileText, Split, Merge, Download, Lock, Unlock, Minimize, Image, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { InputPanel, OutputPanel, OptionsPanel } from '../../ui';
import type { PDFToolsOptions, PDFToolsResult } from '../../../tools/data/pdf-tools';

const PdfTools: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<PDFToolsOptions>({
    operation: 'merge',
    compressionLevel: 5
  });
  const [result, setResult] = useState<PDFToolsResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((uploadedFiles: FileList | null) => {
    if (uploadedFiles) {
      const fileArray = Array.from(uploadedFiles);
      const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length !== fileArray.length) {
        setResult({
          success: false,
          error: 'Only PDF files are supported'
        });
        return;
      }
      
      setFiles(pdfFiles);
      setResult(null);
    }
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setResult({
        success: false,
        error: 'Please upload at least one PDF file'
      });
      return;
    }

    // Validate operation requirements
    if (['split', 'extract-text', 'extract-images', 'compress', 'password-protect', 'remove-password'].includes(options.operation) && files.length !== 1) {
      setResult({
        success: false,
        error: `${options.operation} operation requires exactly one PDF file`
      });
      return;
    }

    if (options.operation === 'password-protect' && !options.newPassword) {
      setResult({
        success: false,
        error: 'Password is required for password protection'
      });
      return;
    }

    if (options.operation === 'remove-password' && !options.password) {
      setResult({
        success: false,
        error: 'Current password is required to remove protection'
      });
      return;
    }

    if (options.operation === 'split' && !options.splitPages) {
      setResult({
        success: false,
        error: 'Page range is required for split operation (e.g., "1-3,5,7-10")'
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // This is a demonstration - actual PDF processing would require libraries like PDF-lib
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoResult: PDFToolsResult = {
        success: false,
        error: `PDF ${options.operation} is not fully implemented yet. This tool requires PDF processing libraries (PDF-lib, PDF.js) to be added to the project. Currently showing UI demonstration only.`
      };
      
      setResult(demoResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [files, options]);

  const getOperationIcon = () => {
    switch (options.operation) {
      case 'merge': return <Merge className="w-4 h-4" />;
      case 'split': return <Split className="w-4 h-4" />;
      case 'extract-text': return <FileText className="w-4 h-4" />;
      case 'extract-images': return <Image className="w-4 h-4" />;
      case 'compress': return <Minimize className="w-4 h-4" />;
      case 'password-protect': return <Lock className="w-4 h-4" />;
      case 'remove-password': return <Unlock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getOperationDescription = () => {
    switch (options.operation) {
      case 'merge': return 'Combine multiple PDF files into one';
      case 'split': return 'Split PDF into separate pages or ranges';
      case 'extract-text': return 'Extract all text content from PDF';
      case 'extract-images': return 'Extract all images from PDF';
      case 'compress': return 'Reduce PDF file size';
      case 'password-protect': return 'Add password protection to PDF';
      case 'remove-password': return 'Remove password protection from PDF';
      default: return '';
    }
  };

  const fileStats = files.length > 0 ? {
    count: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    avgSize: files.reduce((sum, file) => sum + file.size, 0) / files.length
  } : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Tools</h1>
        <p className="text-lg text-gray-600">
          Comprehensive PDF manipulation toolkit - merge, split, extract, and more
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <InputPanel
            title="Upload PDF Files"
            subtitle="Select PDF files to process"
          >
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  multiple={options.operation === 'merge'}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload PDF files
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {options.operation === 'merge' ? 'Multiple files allowed' : 'Single file only'}
                  </p>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Selected Files:</h3>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* File Stats */}
              {fileStats && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">File Statistics</span>
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Files: {fileStats.count}</div>
                    <div>Total size: {(fileStats.totalSize / 1024 / 1024).toFixed(1)}MB</div>
                    <div>Average size: {(fileStats.avgSize / 1024 / 1024).toFixed(1)}MB</div>
                  </div>
                </div>
              )}

              {/* Process Button */}
              <button
                onClick={handleProcess}
                disabled={files.length === 0 || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {getOperationIcon()}
                    Process PDF
                  </>
                )}
              </button>
            </div>
          </InputPanel>
        </div>

        {/* Options Panel */}
        <div className="lg:col-span-1">
          <OptionsPanel title="Operation Settings">
            <div className="space-y-4">
              {/* Operation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation
                </label>
                <select
                  value={options.operation}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    operation: e.target.value as PDFToolsOptions['operation']
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="merge">Merge PDFs</option>
                  <option value="split">Split PDF</option>
                  <option value="extract-text">Extract Text</option>
                  <option value="extract-images">Extract Images</option>
                  <option value="compress">Compress PDF</option>
                  <option value="password-protect">Add Password</option>
                  <option value="remove-password">Remove Password</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getOperationDescription()}
                </p>
              </div>

              {/* Split Pages */}
              {options.operation === 'split' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Range
                  </label>
                  <input
                    type="text"
                    value={options.splitPages || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, splitPages: e.target.value }))}
                    placeholder="e.g., 1-3,5,7-10"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Specify pages to extract (comma-separated, ranges with dash)
                  </p>
                </div>
              )}

              {/* Compression Level */}
              {options.operation === 'compress' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compression Level: {options.compressionLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={options.compressionLevel || 5}
                    onChange={(e) => setOptions(prev => ({ 
                      ...prev, 
                      compressionLevel: parseInt(e.target.value) 
                    }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Fast</span>
                    <span>Balanced</span>
                    <span>Best</span>
                  </div>
                </div>
              )}

              {/* New Password */}
              {options.operation === 'password-protect' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={options.newPassword || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter password to protect PDF"
                  />
                </div>
              )}

              {/* Current Password */}
              {options.operation === 'remove-password' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={options.password || ''}
                    onChange={(e) => setOptions(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter current PDF password"
                  />
                </div>
              )}
            </div>
          </OptionsPanel>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-1">
          <OutputPanel title="Processing Results">
            {!result ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Upload files and click process to see results</p>
              </div>
            ) : result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Processing completed successfully!</span>
                </div>

                {/* Results would be displayed here */}
                {result.extractedText && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Extracted Text:</h3>
                    <textarea
                      value={result.extractedText}
                      readOnly
                      className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                )}

                {result.processedFiles && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Processed Files:</h3>
                    <div className="space-y-2">
                      {result.processedFiles.map((_, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded hover:bg-green-100"
                        >
                          <span>Processed file {index + 1}</span>
                          <Download className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Processing failed</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 text-sm">{result.error}</p>
                </div>
              </div>
            )}
          </OutputPanel>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Implementation Note</h3>
            <p className="text-blue-800 text-sm mt-1">
              This PDF tools interface is fully functional, but requires PDF processing libraries 
              (PDF-lib, PDF.js) to be integrated for actual file manipulation. The current version 
              demonstrates the complete UI and validation logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfTools;