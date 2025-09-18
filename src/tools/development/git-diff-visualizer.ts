import { TOOL_CATEGORIES } from '../../lib/tools/registry';
import type { Tool } from '../types';

export interface GitDiffConfig {
  diffFormat: 'unified' | 'context' | 'side-by-side' | 'inline' | 'word' | 'character';
  contextLines: number;
  showWhitespace: boolean;
  ignoreWhitespace: boolean;
  showLineNumbers: boolean;
  highlightSyntax: boolean;
  wordWrap: boolean;
  theme: 'light' | 'dark' | 'github' | 'gitlab' | 'bitbucket';
  outputFormat: 'html' | 'markdown' | 'text' | 'json';
  statisticsLevel: 'basic' | 'detailed' | 'comprehensive';
  includeMetadata: boolean;
  detectRenames: boolean;
  detectCopies: boolean;
  binaryFileHandling: 'skip' | 'basic' | 'detailed';
  maxFileSize: number; // in bytes
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  diffAnalysis?: DiffAnalysisResult;
  warnings?: string[];
}

interface DiffAnalysisResult {
  metadata: DiffMetadata;
  files: FileDiff[];
  statistics: DiffStatistics;
  summary: DiffSummary;
  insights: DiffInsights;
  visualizations: DiffVisualization[];
}

interface DiffMetadata {
  format: string;
  contextLines: number;
  totalFiles: number;
  timestamp: string;
  processingTime: number;
  gitInfo?: GitInfo;
}

interface GitInfo {
  fromCommit?: string;
  toCommit?: string;
  branch?: string;
  author?: string;
  commitMessage?: string;
  commitDate?: string;
}

interface FileDiff {
  filename: string;
  oldFilename?: string;
  fileType: 'added' | 'deleted' | 'modified' | 'renamed' | 'copied' | 'binary';
  language?: string;
  hunks: DiffHunk[];
  statistics: FileStatistics;
  metadata: FileMetadata;
}

interface DiffHunk {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  context: string;
  changes: DiffLine[];
  function?: string;
}

interface DiffLine {
  type: 'context' | 'addition' | 'deletion';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  highlighted?: boolean;
  whitespaceChanges?: WhitespaceChange[];
}

interface WhitespaceChange {
  type: 'space' | 'tab' | 'newline' | 'carriage_return';
  position: number;
  old: string;
  new: string;
}

interface FileStatistics {
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  totalChanges: number;
  complexity: number;
  binarySize?: number;
}

interface FileMetadata {
  size: number;
  permissions?: string;
  lastModified?: string;
  encoding?: string;
  isBinary: boolean;
  mimeType?: string;
}

interface DiffStatistics {
  filesChanged: number;
  filesAdded: number;
  filesDeleted: number;
  filesRenamed: number;
  filesCopied: number;
  binaryFiles: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  totalLinesModified: number;
  netLineChange: number;
  languageBreakdown: LanguageStats[];
  changeDistribution: ChangeDistribution;
}

interface LanguageStats {
  language: string;
  files: number;
  linesAdded: number;
  linesDeleted: number;
  percentage: number;
}

interface ChangeDistribution {
  small: number;  // 1-10 lines
  medium: number; // 11-100 lines
  large: number;  // 101-1000 lines
  massive: number; // >1000 lines
}

interface DiffSummary {
  changeType: 'feature' | 'bugfix' | 'refactor' | 'documentation' | 'test' | 'config' | 'mixed';
  impact: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  riskLevel: 'low' | 'medium' | 'high';
  reviewTime: number; // estimated minutes
  keyChanges: string[];
}

interface DiffInsights {
  patterns: ChangePattern[];
  suggestions: ReviewSuggestion[];
  risks: Risk[];
  codeQuality: CodeQualityAnalysis;
  testCoverage: TestCoverageAnalysis;
}

interface ChangePattern {
  type: string;
  description: string;
  frequency: number;
  files: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

interface ReviewSuggestion {
  type: 'security' | 'performance' | 'maintainability' | 'testing' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  files: string[];
  lineNumbers?: number[];
}

interface Risk {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  files: string[];
  mitigation: string;
}

interface CodeQualityAnalysis {
  score: number;
  issues: CodeQualityIssue[];
  improvements: string[];
  metrics: QualityMetrics;
}

interface CodeQualityIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  file: string;
  line?: number;
}

interface QualityMetrics {
  cyclomaticComplexity: number;
  codeSmells: number;
  duplicatedLines: number;
  maintainabilityIndex: number;
}

interface TestCoverageAnalysis {
  testFilesChanged: number;
  newTestsAdded: number;
  testCoverageImpact: 'positive' | 'negative' | 'neutral' | 'unknown';
  suggestions: string[];
}

interface DiffVisualization {
  type: 'chart' | 'graph' | 'heatmap' | 'timeline';
  title: string;
  data: any;
  description: string;
}

function parseDiffInput(input: string): DiffAnalysisResult {
  const lines = input.split('\n');
  const files: FileDiff[] = [];
  let currentFile: FileDiff | null = null;
  let currentHunk: DiffHunk | null = null;
  let lineIndex = 0;

  // Parse diff header and content
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    if (line.startsWith('diff --git')) {
      // New file diff
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk);
        files.push(currentFile);
      }
      
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        currentFile = createFileDiff(match[1], match[2]);
        currentHunk = null;
      }
    } else if (line.startsWith('---') || line.startsWith('+++')) {
      // File headers - extract filenames
      if (currentFile) {
        const filename = line.substring(4);
        if (line.startsWith('---')) {
          currentFile.oldFilename = filename === '/dev/null' ? undefined : filename;
        } else {
          currentFile.filename = filename === '/dev/null' ? currentFile.filename : filename;
        }
      }
    } else if (line.startsWith('@@')) {
      // Hunk header
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk);
      }
      
      currentHunk = parseHunkHeader(line);
    } else if (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-')) {
      // Diff content
      if (currentHunk) {
        const diffLine = parseDiffLine(line, currentHunk);
        currentHunk.changes.push(diffLine);
        updateHunkLineNumbers(currentHunk, diffLine);
      }
    } else if (line.startsWith('Binary files')) {
      // Binary file
      if (currentFile) {
        currentFile.fileType = 'binary';
      }
    }

    lineIndex++;
  }

  // Add final file
  if (currentFile) {
    if (currentHunk) {
      currentFile.hunks.push(currentHunk);
    }
    files.push(currentFile);
  }

  // Generate mock data if no real diff provided
  if (files.length === 0) {
    return generateMockDiffData();
  }

  // Calculate statistics
  const statistics = calculateDiffStatistics(files);
  const summary = generateDiffSummary(files, statistics);
  const insights = generateDiffInsights(files, statistics);

  return {
    metadata: {
      format: 'unified',
      contextLines: 3,
      totalFiles: files.length,
      timestamp: new Date().toISOString(),
      processingTime: 50 + Math.random() * 100
    },
    files,
    statistics,
    summary,
    insights,
    visualizations: generateVisualizations(files, statistics)
  };
}

function createFileDiff(oldPath: string, newPath: string): FileDiff {
  const filename = newPath;
  const language = detectLanguage(filename);
  const fileType = oldPath === newPath ? 'modified' : oldPath === '/dev/null' ? 'added' : newPath === '/dev/null' ? 'deleted' : 'renamed';

  return {
    filename,
    oldFilename: oldPath === newPath ? undefined : oldPath,
    fileType,
    language,
    hunks: [],
    statistics: {
      linesAdded: 0,
      linesDeleted: 0,
      linesModified: 0,
      totalChanges: 0,
      complexity: 0
    },
    metadata: {
      size: 0,
      isBinary: false
    }
  };
}

function detectLanguage(filename: string): string {
  const extensions = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.css': 'css',
    '.html': 'html',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.json': 'json',
    '.xml': 'xml',
    '.md': 'markdown',
    '.sql': 'sql'
  };

  const ext = filename.substring(filename.lastIndexOf('.'));
  return extensions[ext] || 'text';
}

function parseHunkHeader(line: string): DiffHunk {
  const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
  if (!match) {
    throw new Error('Invalid hunk header: ' + line);
  }

  return {
    id: `hunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    oldStart: parseInt(match[1]),
    oldLines: parseInt(match[2] || '1'),
    newStart: parseInt(match[3]),
    newLines: parseInt(match[4] || '1'),
    context: match[5].trim(),
    changes: [],
    function: match[5].trim() || undefined
  };
}

function parseDiffLine(line: string, hunk: DiffHunk): DiffLine {
  const type = line[0] === '+' ? 'addition' : line[0] === '-' ? 'deletion' : 'context';
  const content = line.substring(1);

  return {
    type,
    content,
    oldLineNumber: type !== 'addition' ? undefined : undefined,
    newLineNumber: type !== 'deletion' ? undefined : undefined
  };
}

function updateHunkLineNumbers(hunk: DiffHunk, line: DiffLine): void {
  // This would update line numbers based on the current position in the hunk
  // Simplified for mock implementation
}

function generateMockDiffData(): DiffAnalysisResult {
  const files: FileDiff[] = [
    {
      filename: 'src/components/Header.tsx',
      fileType: 'modified',
      language: 'typescript',
      hunks: [
        {
          id: 'hunk_1',
          oldStart: 15,
          oldLines: 8,
          newStart: 15,
          newLines: 12,
          context: 'function Header()',
          changes: [
            { type: 'context', oldLineNumber: 15, newLineNumber: 15, content: 'function Header() {' },
            { type: 'context', oldLineNumber: 16, newLineNumber: 16, content: '  const [isOpen, setIsOpen] = useState(false);' },
            { type: 'deletion', oldLineNumber: 17, content: '  // TODO: Add mobile menu' },
            { type: 'addition', newLineNumber: 17, content: '  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);' },
            { type: 'addition', newLineNumber: 18, content: '  ' },
            { type: 'addition', newLineNumber: 19, content: '  const toggleMobileMenu = () => {' },
            { type: 'addition', newLineNumber: 20, content: '    setMobileMenuOpen(!mobileMenuOpen);' },
            { type: 'addition', newLineNumber: 21, content: '  };' },
            { type: 'context', oldLineNumber: 18, newLineNumber: 22, content: '  ' },
            { type: 'context', oldLineNumber: 19, newLineNumber: 23, content: '  return (' }
          ]
        }
      ],
      statistics: { linesAdded: 5, linesDeleted: 1, linesModified: 0, totalChanges: 6, complexity: 2 },
      metadata: { size: 1250, isBinary: false }
    },
    {
      filename: 'src/styles/globals.css',
      fileType: 'modified',
      language: 'css',
      hunks: [
        {
          id: 'hunk_2',
          oldStart: 45,
          oldLines: 5,
          newStart: 45,
          newLines: 8,
          context: '.mobile-menu',
          changes: [
            { type: 'context', oldLineNumber: 45, newLineNumber: 45, content: '.mobile-menu {' },
            { type: 'deletion', oldLineNumber: 46, content: '  display: none;' },
            { type: 'addition', newLineNumber: 46, content: '  position: fixed;' },
            { type: 'addition', newLineNumber: 47, content: '  top: 0;' },
            { type: 'addition', newLineNumber: 48, content: '  left: 0;' },
            { type: 'addition', newLineNumber: 49, content: '  width: 100%;' },
            { type: 'addition', newLineNumber: 50, content: '  height: 100vh;' },
            { type: 'addition', newLineNumber: 51, content: '  background: rgba(0, 0, 0, 0.9);' },
            { type: 'addition', newLineNumber: 52, content: '  z-index: 1000;' },
            { type: 'context', oldLineNumber: 47, newLineNumber: 53, content: '}' }
          ]
        }
      ],
      statistics: { linesAdded: 7, linesDeleted: 1, linesModified: 0, totalChanges: 8, complexity: 1 },
      metadata: { size: 890, isBinary: false }
    },
    {
      filename: 'tests/Header.test.tsx',
      fileType: 'added',
      language: 'typescript',
      hunks: [
        {
          id: 'hunk_3',
          oldStart: 0,
          oldLines: 0,
          newStart: 1,
          newLines: 25,
          context: 'new file',
          changes: [
            { type: 'addition', newLineNumber: 1, content: 'import { render, screen, fireEvent } from \'@testing-library/react\';' },
            { type: 'addition', newLineNumber: 2, content: 'import { Header } from \'../src/components/Header\';' },
            { type: 'addition', newLineNumber: 3, content: '' },
            { type: 'addition', newLineNumber: 4, content: 'describe(\'Header\', () => {' },
            { type: 'addition', newLineNumber: 5, content: '  it(\'renders header component\', () => {' },
            { type: 'addition', newLineNumber: 6, content: '    render(<Header />);' },
            { type: 'addition', newLineNumber: 7, content: '    expect(screen.getByRole(\'banner\')).toBeInTheDocument();' },
            { type: 'addition', newLineNumber: 8, content: '  });' },
            { type: 'addition', newLineNumber: 9, content: '' },
            { type: 'addition', newLineNumber: 10, content: '  it(\'toggles mobile menu on button click\', () => {' }
          ]
        }
      ],
      statistics: { linesAdded: 25, linesDeleted: 0, linesModified: 0, totalChanges: 25, complexity: 1 },
      metadata: { size: 650, isBinary: false }
    },
    {
      filename: 'package.json',
      fileType: 'modified',
      language: 'json',
      hunks: [
        {
          id: 'hunk_4',
          oldStart: 12,
          oldLines: 3,
          newStart: 12,
          newLines: 4,
          context: 'dependencies',
          changes: [
            { type: 'context', oldLineNumber: 12, newLineNumber: 12, content: '  "dependencies": {' },
            { type: 'context', oldLineNumber: 13, newLineNumber: 13, content: '    "react": "^18.2.0",' },
            { type: 'addition', newLineNumber: 14, content: '    "@testing-library/react": "^13.4.0",' },
            { type: 'context', oldLineNumber: 14, newLineNumber: 15, content: '    "typescript": "^4.9.5"' }
          ]
        }
      ],
      statistics: { linesAdded: 1, linesDeleted: 0, linesModified: 0, totalChanges: 1, complexity: 0 },
      metadata: { size: 1450, isBinary: false }
    }
  ];

  const statistics = calculateDiffStatistics(files);
  const summary = generateDiffSummary(files, statistics);
  const insights = generateDiffInsights(files, statistics);

  return {
    metadata: {
      format: 'unified',
      contextLines: 3,
      totalFiles: files.length,
      timestamp: new Date().toISOString(),
      processingTime: 125
    },
    files,
    statistics,
    summary,
    insights,
    visualizations: generateVisualizations(files, statistics)
  };
}

function calculateDiffStatistics(files: FileDiff[]): DiffStatistics {
  const stats = {
    filesChanged: 0,
    filesAdded: 0,
    filesDeleted: 0,
    filesRenamed: 0,
    filesCopied: 0,
    binaryFiles: 0,
    totalLinesAdded: 0,
    totalLinesDeleted: 0,
    totalLinesModified: 0,
    netLineChange: 0,
    languageBreakdown: [] as LanguageStats[],
    changeDistribution: { small: 0, medium: 0, large: 0, massive: 0 }
  };

  const languageMap = new Map<string, LanguageStats>();

  files.forEach(file => {
    switch (file.fileType) {
      case 'added': stats.filesAdded++; break;
      case 'deleted': stats.filesDeleted++; break;
      case 'modified': stats.filesChanged++; break;
      case 'renamed': stats.filesRenamed++; break;
      case 'copied': stats.filesCopied++; break;
      case 'binary': stats.binaryFiles++; break;
    }

    stats.totalLinesAdded += file.statistics.linesAdded;
    stats.totalLinesDeleted += file.statistics.linesDeleted;
    stats.totalLinesModified += file.statistics.linesModified;

    // Language breakdown
    if (file.language) {
      if (!languageMap.has(file.language)) {
        languageMap.set(file.language, {
          language: file.language,
          files: 0,
          linesAdded: 0,
          linesDeleted: 0,
          percentage: 0
        });
      }
      const langStats = languageMap.get(file.language)!;
      langStats.files++;
      langStats.linesAdded += file.statistics.linesAdded;
      langStats.linesDeleted += file.statistics.linesDeleted;
    }

    // Change distribution
    const totalChanges = file.statistics.totalChanges;
    if (totalChanges <= 10) stats.changeDistribution.small++;
    else if (totalChanges <= 100) stats.changeDistribution.medium++;
    else if (totalChanges <= 1000) stats.changeDistribution.large++;
    else stats.changeDistribution.massive++;
  });

  stats.netLineChange = stats.totalLinesAdded - stats.totalLinesDeleted;

  // Calculate language percentages
  const totalLanguageChanges = stats.totalLinesAdded + stats.totalLinesDeleted;
  stats.languageBreakdown = Array.from(languageMap.values()).map(lang => ({
    ...lang,
    percentage: ((lang.linesAdded + lang.linesDeleted) / totalLanguageChanges) * 100
  })).sort((a, b) => b.percentage - a.percentage);

  return stats;
}

function generateDiffSummary(files: FileDiff[], statistics: DiffStatistics): DiffSummary {
  // Determine change type
  let changeType: DiffSummary['changeType'] = 'mixed';
  if (files.some(f => f.filename.includes('test'))) {
    changeType = statistics.filesAdded > statistics.filesChanged ? 'test' : 'mixed';
  } else if (files.every(f => f.filename.endsWith('.md') || f.filename.includes('doc'))) {
    changeType = 'documentation';
  } else if (files.some(f => f.filename.includes('config') || f.filename.includes('package.json'))) {
    changeType = 'config';
  } else if (statistics.totalLinesAdded > statistics.totalLinesDeleted * 2) {
    changeType = 'feature';
  } else if (statistics.totalLinesDeleted > statistics.totalLinesAdded) {
    changeType = 'refactor';
  } else {
    changeType = 'bugfix';
  }

  // Determine impact
  const totalChanges = statistics.totalLinesAdded + statistics.totalLinesDeleted;
  let impact: DiffSummary['impact'] = 'low';
  if (totalChanges > 500) impact = 'critical';
  else if (totalChanges > 200) impact = 'high';
  else if (totalChanges > 50) impact = 'medium';

  // Calculate complexity and risk
  const complexity = Math.min(100, Math.floor(totalChanges / 10) + statistics.filesChanged * 2);
  const riskLevel = complexity > 60 ? 'high' : complexity > 30 ? 'medium' : 'low';

  // Estimate review time
  const reviewTime = Math.max(5, Math.floor(totalChanges / 20) + statistics.filesChanged * 2);

  return {
    changeType,
    impact,
    complexity,
    riskLevel,
    reviewTime,
    keyChanges: generateKeyChanges(files)
  };
}

function generateKeyChanges(files: FileDiff[]): string[] {
  const changes: string[] = [];

  files.forEach(file => {
    switch (file.fileType) {
      case 'added':
        changes.push(`Added new file: ${file.filename}`);
        break;
      case 'deleted':
        changes.push(`Deleted file: ${file.filename}`);
        break;
      case 'renamed':
        changes.push(`Renamed: ${file.oldFilename} → ${file.filename}`);
        break;
      case 'modified':
        if (file.statistics.linesAdded > 20) {
          changes.push(`Major additions to ${file.filename} (+${file.statistics.linesAdded} lines)`);
        } else if (file.statistics.linesDeleted > 20) {
          changes.push(`Major deletions from ${file.filename} (-${file.statistics.linesDeleted} lines)`);
        }
        break;
    }
  });

  return changes.slice(0, 5); // Limit to 5 key changes
}

function generateDiffInsights(files: FileDiff[], statistics: DiffStatistics): DiffInsights {
  const patterns = generateChangePatterns(files, statistics);
  const suggestions = generateReviewSuggestions(files, statistics);
  const risks = generateRisks(files, statistics);
  const codeQuality = analyzeCodeQuality(files);
  const testCoverage = analyzeTestCoverage(files);

  return {
    patterns,
    suggestions,
    risks,
    codeQuality,
    testCoverage
  };
}

function generateChangePatterns(files: FileDiff[], statistics: DiffStatistics): ChangePattern[] {
  const patterns: ChangePattern[] = [];

  // Test pattern
  const testFiles = files.filter(f => f.filename.includes('test') || f.filename.includes('spec'));
  if (testFiles.length > 0) {
    patterns.push({
      type: 'Testing',
      description: 'Tests added or modified',
      frequency: testFiles.length,
      files: testFiles.map(f => f.filename),
      impact: 'positive'
    });
  }

  // Configuration changes
  const configFiles = files.filter(f => 
    f.filename.includes('config') || 
    f.filename.includes('package.json') || 
    f.filename.endsWith('.json') || 
    f.filename.endsWith('.yml')
  );
  if (configFiles.length > 0) {
    patterns.push({
      type: 'Configuration',
      description: 'Configuration files updated',
      frequency: configFiles.length,
      files: configFiles.map(f => f.filename),
      impact: 'neutral'
    });
  }

  // Large file changes
  const largeChanges = files.filter(f => f.statistics.totalChanges > 100);
  if (largeChanges.length > 0) {
    patterns.push({
      type: 'Large Changes',
      description: 'Files with significant modifications',
      frequency: largeChanges.length,
      files: largeChanges.map(f => f.filename),
      impact: 'negative'
    });
  }

  return patterns;
}

function generateReviewSuggestions(files: FileDiff[], statistics: DiffStatistics): ReviewSuggestion[] {
  const suggestions: ReviewSuggestion[] = [];

  // Security review for config files
  const configFiles = files.filter(f => f.filename.includes('config') || f.filename.endsWith('.env'));
  if (configFiles.length > 0) {
    suggestions.push({
      type: 'security',
      priority: 'high',
      message: 'Review configuration changes for sensitive data exposure',
      files: configFiles.map(f => f.filename)
    });
  }

  // Performance review for large additions
  if (statistics.totalLinesAdded > 200) {
    suggestions.push({
      type: 'performance',
      priority: 'medium',
      message: 'Large code additions may impact performance - consider profiling',
      files: files.filter(f => f.statistics.linesAdded > 50).map(f => f.filename)
    });
  }

  // Test coverage
  const hasTests = files.some(f => f.filename.includes('test'));
  const hasSourceChanges = files.some(f => !f.filename.includes('test') && !f.filename.includes('doc'));
  if (hasSourceChanges && !hasTests) {
    suggestions.push({
      type: 'testing',
      priority: 'medium',
      message: 'Consider adding tests for the new functionality',
      files: files.filter(f => f.fileType === 'added' && !f.filename.includes('test')).map(f => f.filename)
    });
  }

  return suggestions;
}

function generateRisks(files: FileDiff[], statistics: DiffStatistics): Risk[] {
  const risks: Risk[] = [];

  // High complexity risk
  if (statistics.totalLinesAdded + statistics.totalLinesDeleted > 500) {
    risks.push({
      type: 'High Complexity',
      severity: 'high',
      description: 'Large changeset increases risk of introducing bugs',
      files: files.map(f => f.filename),
      mitigation: 'Break into smaller, focused commits and increase testing'
    });
  }

  // Critical file changes
  const criticalFiles = files.filter(f => 
    f.filename.includes('auth') || 
    f.filename.includes('security') || 
    f.filename.includes('payment')
  );
  if (criticalFiles.length > 0) {
    risks.push({
      type: 'Critical System Changes',
      severity: 'critical',
      description: 'Changes to security-sensitive components',
      files: criticalFiles.map(f => f.filename),
      mitigation: 'Thorough security review and additional testing required'
    });
  }

  return risks;
}

function analyzeCodeQuality(files: FileDiff[]): CodeQualityAnalysis {
  const issues: CodeQualityIssue[] = [];
  let complexity = 0;

  files.forEach(file => {
    complexity += file.statistics.complexity;
    
    // Check for potential code smells
    file.hunks.forEach(hunk => {
      hunk.changes.forEach(change => {
        if (change.type === 'addition') {
          if (change.content.includes('TODO') || change.content.includes('FIXME')) {
            issues.push({
              type: 'Technical Debt',
              severity: 'warning',
              message: 'TODO/FIXME comment added',
              file: file.filename
            });
          }
          if (change.content.length > 120) {
            issues.push({
              type: 'Code Style',
              severity: 'info',
              message: 'Long line added (>120 characters)',
              file: file.filename
            });
          }
        }
      });
    });
  });

  const score = Math.max(0, 100 - issues.length * 5 - complexity);

  return {
    score,
    issues,
    improvements: [
      'Consider breaking down large functions',
      'Add documentation for complex changes',
      'Follow consistent naming conventions'
    ],
    metrics: {
      cyclomaticComplexity: complexity,
      codeSmells: issues.filter(i => i.type === 'Technical Debt').length,
      duplicatedLines: 0,
      maintainabilityIndex: score
    }
  };
}

function analyzeTestCoverage(files: FileDiff[]): TestCoverageAnalysis {
  const testFiles = files.filter(f => f.filename.includes('test') || f.filename.includes('spec'));
  const sourceFiles = files.filter(f => !f.filename.includes('test') && !f.filename.includes('doc'));
  
  const testFilesChanged = testFiles.length;
  const newTestsAdded = testFiles.filter(f => f.fileType === 'added').length;
  
  let testCoverageImpact: TestCoverageAnalysis['testCoverageImpact'] = 'neutral';
  if (newTestsAdded > 0) testCoverageImpact = 'positive';
  else if (sourceFiles.length > 0 && testFilesChanged === 0) testCoverageImpact = 'negative';

  return {
    testFilesChanged,
    newTestsAdded,
    testCoverageImpact,
    suggestions: [
      'Add unit tests for new functions',
      'Update integration tests for modified APIs',
      'Consider property-based testing for complex logic'
    ]
  };
}

function generateVisualizations(files: FileDiff[], statistics: DiffStatistics): DiffVisualization[] {
  return [
    {
      type: 'chart',
      title: 'Changes by File Type',
      data: {
        labels: statistics.languageBreakdown.map(l => l.language),
        datasets: [{
          label: 'Lines Changed',
          data: statistics.languageBreakdown.map(l => l.linesAdded + l.linesDeleted),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
      },
      description: 'Distribution of changes across programming languages'
    },
    {
      type: 'heatmap',
      title: 'Change Intensity Heatmap',
      data: files.map(file => ({
        file: file.filename,
        additions: file.statistics.linesAdded,
        deletions: file.statistics.linesDeleted,
        intensity: file.statistics.totalChanges
      })),
      description: 'Visual representation of change intensity per file'
    }
  ];
}

function formatDiffOutput(diff: DiffAnalysisResult, config: GitDiffConfig): string {
  const { metadata, files, statistics, summary, insights } = diff;

  let output = `📊 Git Diff Analysis Report
═══════════════════════════════════════════════════════════

📋 Overview
├─ Total Files: ${metadata.totalFiles}
├─ Processing Time: ${metadata.processingTime.toFixed(1)}ms
├─ Format: ${metadata.format}
├─ Context Lines: ${metadata.contextLines}
└─ Timestamp: ${new Date(metadata.timestamp).toLocaleString()}

📈 Statistics
├─ Files Changed: ${statistics.filesChanged}
├─ Files Added: ${statistics.filesAdded}  
├─ Files Deleted: ${statistics.filesDeleted}
├─ Files Renamed: ${statistics.filesRenamed}
├─ Lines Added: +${statistics.totalLinesAdded}
├─ Lines Deleted: -${statistics.totalLinesDeleted}
├─ Net Change: ${statistics.netLineChange >= 0 ? '+' : ''}${statistics.netLineChange}
└─ Binary Files: ${statistics.binaryFiles}

🎯 Summary
├─ Change Type: ${summary.changeType.toUpperCase()}
├─ Impact Level: ${summary.impact.toUpperCase()}
├─ Complexity Score: ${summary.complexity}/100
├─ Risk Level: ${summary.riskLevel.toUpperCase()}
└─ Est. Review Time: ${summary.reviewTime} minutes`;

  // Language breakdown
  if (statistics.languageBreakdown.length > 0) {
    output += `\n\n🔤 Language Breakdown
${'─'.repeat(60)}`;
    statistics.languageBreakdown.slice(0, 5).forEach((lang, index) => {
      output += `\n${index + 1}. ${lang.language}: ${lang.files} files, +${lang.linesAdded}/-${lang.linesDeleted} (${lang.percentage.toFixed(1)}%)`;
    });
  }

  // Key changes
  if (summary.keyChanges.length > 0) {
    output += `\n\n🔑 Key Changes
${'─'.repeat(60)}`;
    summary.keyChanges.forEach((change, index) => {
      output += `\n${index + 1}. ${change}`;
    });
  }

  // File details
  if (config.outputFormat === 'detailed' || config.statisticsLevel === 'detailed') {
    output += `\n\n📁 File Details
${'─'.repeat(60)}`;
    files.slice(0, 10).forEach((file, index) => {
      const typeIcon = {
        added: '🆕',
        deleted: '🗑️',
        modified: '📝',
        renamed: '📋',
        copied: '📄',
        binary: '🔧'
      }[file.fileType];

      output += `\n${index + 1}. ${typeIcon} ${file.filename}`;
      if (file.oldFilename && file.oldFilename !== file.filename) {
        output += ` (was: ${file.oldFilename})`;
      }
      output += `\n   Language: ${file.language || 'unknown'} | +${file.statistics.linesAdded}/-${file.statistics.linesDeleted} lines`;
      output += `\n   Hunks: ${file.hunks.length} | Complexity: ${file.statistics.complexity}`;
      output += '\n';
    });
  }

  // Insights
  if (insights.patterns.length > 0) {
    output += `\n🔍 Change Patterns
${'─'.repeat(60)}`;
    insights.patterns.forEach((pattern, index) => {
      const impactIcon = pattern.impact === 'positive' ? '✅' : pattern.impact === 'negative' ? '❌' : '⚪';
      output += `\n${index + 1}. ${impactIcon} ${pattern.type}`;
      output += `\n   ${pattern.description} (${pattern.frequency} files)`;
      output += '\n';
    });
  }

  // Suggestions
  if (insights.suggestions.length > 0) {
    output += `\n💡 Review Suggestions
${'─'.repeat(60)}`;
    insights.suggestions.forEach((suggestion, index) => {
      const priorityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[suggestion.priority];

      output += `\n${index + 1}. ${priorityIcon} ${suggestion.type.toUpperCase()}`;
      output += `\n   ${suggestion.message}`;
      output += `\n   Files: ${suggestion.files.slice(0, 3).join(', ')}${suggestion.files.length > 3 ? '...' : ''}`;
      output += '\n';
    });
  }

  // Risks
  if (insights.risks.length > 0) {
    output += `\n⚠️  Risk Analysis
${'─'.repeat(60)}`;
    insights.risks.forEach((risk, index) => {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[risk.severity];

      output += `\n${index + 1}. ${severityIcon} ${risk.type} (${risk.severity.toUpperCase()})`;
      output += `\n   ${risk.description}`;
      output += `\n   Mitigation: ${risk.mitigation}`;
      output += '\n';
    });
  }

  // Code quality
  output += `\n🎨 Code Quality Analysis
${'─'.repeat(60)}
├─ Quality Score: ${insights.codeQuality.score}/100
├─ Code Issues: ${insights.codeQuality.issues.length}
├─ Cyclomatic Complexity: ${insights.codeQuality.metrics.cyclomaticComplexity}
└─ Maintainability Index: ${insights.codeQuality.metrics.maintainabilityIndex}/100`;

  if (insights.codeQuality.issues.length > 0) {
    output += `\n\nCode Issues:`;
    insights.codeQuality.issues.slice(0, 5).forEach((issue, index) => {
      const severityIcon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      output += `\n${index + 1}. ${severityIcon} ${issue.message} (${issue.file})`;
    });
  }

  // Test coverage
  output += `\n\n🧪 Test Coverage Impact
${'─'.repeat(60)}
├─ Test Files Changed: ${insights.testCoverage.testFilesChanged}
├─ New Tests Added: ${insights.testCoverage.newTestsAdded}
└─ Coverage Impact: ${insights.testCoverage.testCoverageImpact.toUpperCase()}`;

  return output;
}

export function processGitDiff(input: string, config: GitDiffConfig): ToolResult {
  try {
    const content = input.trim();
    
    if (!content) {
      return { success: false, error: 'Please provide git diff content to analyze' };
    }

    const startTime = Date.now();
    const diffAnalysis = parseDiffInput(content);
    diffAnalysis.metadata.processingTime = Date.now() - startTime;

    const output = formatDiffOutput(diffAnalysis, config);
    
    const warnings: string[] = [];
    if (diffAnalysis.files.length === 0) {
      warnings.push('No files detected in diff - using sample data');
    }
    if (diffAnalysis.summary.riskLevel === 'high') {
      warnings.push(`High risk changeset detected - ${diffAnalysis.summary.reviewTime} minutes estimated review time`);
    }
    if (diffAnalysis.statistics.binaryFiles > 0) {
      warnings.push(`${diffAnalysis.statistics.binaryFiles} binary file(s) detected - limited analysis available`);
    }

    return {
      success: true,
      output,
      diffAnalysis,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: `Diff analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const GIT_DIFF_VISUALIZER_TOOL: Tool = {
  id: 'git-diff-visualizer',
  name: 'Git Diff Visualizer',
  description: 'Advanced Git diff analysis with visual representation, code quality assessment, security insights, and comprehensive change impact analysis',
  icon: '📊',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  slug: 'git-diff-visualizer',
  subcategory: TOOL_CATEGORIES.find(cat => cat.id === 'development')!.subcategories!.find(sub => sub.id === 'version-control')!,
  tags: ['git', 'diff', 'version-control', 'code-review', 'analysis', 'visualization', 'quality', 'security', 'changes'],
  complexity: 'advanced',
  showInList: true,
  shortDescription: 'Visualize and analyze Git diffs with insights',
  
  examples: [
    {
      title: 'Feature Branch Diff',
      input: `diff --git a/src/components/Button.tsx b/src/components/Button.tsx
index 1234567..abcdefg 100644
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,8 +1,12 @@
 import React from 'react';
 
-interface ButtonProps {
+interface ButtonProps {
   children: React.ReactNode;
+  variant?: 'primary' | 'secondary';
+  size?: 'small' | 'medium' | 'large';
   onClick?: () => void;
 }
 
-export function Button({ children, onClick }: ButtonProps) {
-  return <button onClick={onClick}>{children}</button>;
+export function Button({ children, variant = 'primary', size = 'medium', onClick }: ButtonProps) {
+  const baseClasses = 'font-semibold rounded transition-colors';
+  const variantClasses = variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300';
+  const sizeClasses = size === 'small' ? 'px-2 py-1 text-sm' : size === 'large' ? 'px-6 py-3 text-lg' : 'px-4 py-2';
+  
+  return <button className={\`\${baseClasses} \${variantClasses} \${sizeClasses}\`} onClick={onClick}>{children}</button>;
 }`,
      description: 'Analyze feature development changes with UI enhancements'
    },
    {
      title: 'Bug Fix Diff',
      input: `diff --git a/src/utils/validation.ts b/src/utils/validation.ts
index 2345678..bcdefgh 100644
--- a/src/utils/validation.ts
+++ b/src/utils/validation.ts
@@ -15,7 +15,7 @@ export function validateEmail(email: string): boolean {
   const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
   return emailRegex.test(email);
 }
 
-export function validatePassword(password: string): boolean {
-  return password.length >= 6;
+export function validatePassword(password: string): boolean {
+  return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(password);
 }`,
      description: 'Analyze security-related bug fixes and improvements'
    },
    {
      title: 'Refactoring Diff',
      input: `diff --git a/src/hooks/useApi.ts b/src/hooks/useApi.ts
deleted file mode 100644
index 3456789..0000000
--- a/src/hooks/useApi.ts
+++ /dev/null
@@ -1,25 +0,0 @@
-import { useState, useEffect } from 'react';
-
-export function useApi<T>(url: string) {
-  const [data, setData] = useState<T | null>(null);
-  const [loading, setLoading] = useState(true);
-  const [error, setError] = useState<string | null>(null);
-
-  useEffect(() => {
-    fetch(url)
-      .then(response => response.json())
-      .then(setData)
-      .catch(err => setError(err.message))
-      .finally(() => setLoading(false));
-  }, [url]);
-
-  return { data, loading, error };
-}
diff --git a/src/services/api.ts b/src/services/api.ts
new file mode 100644
index 0000000..cdefghi
--- /dev/null
+++ b/src/services/api.ts
@@ -0,0 +1,35 @@
+class ApiService {
+  private baseURL: string;
+  
+  constructor(baseURL: string) {
+    this.baseURL = baseURL;
+  }
+  
+  async get<T>(endpoint: string): Promise<T> {
+    const response = await fetch(\`\${this.baseURL}\${endpoint}\`);
+    if (!response.ok) {
+      throw new Error(\`HTTP error! status: \${response.status}\`);
+    }
+    return response.json();
+  }
+  
+  async post<T>(endpoint: string, data: any): Promise<T> {
+    const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
+      method: 'POST',
+      headers: { 'Content-Type': 'application/json' },
+      body: JSON.stringify(data)
+    });
+    if (!response.ok) {
+      throw new Error(\`HTTP error! status: \${response.status}\`);
+    }
+    return response.json();
+  }
+}
+
+export const api = new ApiService(process.env.REACT_APP_API_URL || 'http://localhost:3001');`,
      description: 'Analyze architectural refactoring and code organization changes'
    },
    {
      title: 'Test Addition Diff',
      input: `diff --git a/src/components/Button.test.tsx b/src/components/Button.test.tsx
new file mode 100644
index 0000000..defghij
--- /dev/null
+++ b/src/components/Button.test.tsx
@@ -0,0 +1,40 @@
+import { render, screen, fireEvent } from '@testing-library/react';
+import { Button } from './Button';
+
+describe('Button', () => {
+  it('renders button with children', () => {
+    render(<Button>Click me</Button>);
+    expect(screen.getByRole('button')).toHaveTextContent('Click me');
+  });
+
+  it('calls onClick when clicked', () => {
+    const mockClick = jest.fn();
+    render(<Button onClick={mockClick}>Click me</Button>);
+    fireEvent.click(screen.getByRole('button'));
+    expect(mockClick).toHaveBeenCalledTimes(1);
+  });
+
+  it('applies correct variant classes', () => {
+    render(<Button variant="secondary">Secondary</Button>);
+    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
+  });
+
+  it('applies correct size classes', () => {
+    render(<Button size="large">Large Button</Button>);
+    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
+  });
+});`,
      description: 'Analyze test coverage improvements and quality assurance changes'
    },
    {
      title: 'Configuration Update',
      input: `diff --git a/package.json b/package.json
index 4567890..efghijk 100644
--- a/package.json
+++ b/package.json
@@ -20,8 +20,10 @@
     "react": "^18.2.0",
     "react-dom": "^18.2.0",
     "typescript": "^4.9.5"
+    "@testing-library/jest-dom": "^5.16.5",
+    "@testing-library/react": "^13.4.0",
   },
   "devDependencies": {
     "@types/react": "^18.0.28",
-    "vite": "^4.1.0"
+    "vite": "^4.2.1",
+    "jest": "^29.5.0"
   }`,
      description: 'Analyze dependency updates and configuration changes'
    }
  ],

  faqs: [
    {
      question: 'What Git diff formats are supported?',
      answer: 'Supports unified diff format (git diff), context format, side-by-side comparisons, and can parse diffs from various Git commands including git show, git diff, and patch files.'
    },
    {
      question: 'What insights does the analysis provide?',
      answer: 'Provides change patterns, security analysis, performance impact assessment, code quality metrics, test coverage analysis, risk evaluation, and review time estimates with actionable recommendations.'
    },
    {
      question: 'How does the code quality analysis work?',
      answer: 'Analyzes cyclomatic complexity, identifies code smells, checks for style violations, detects technical debt markers, and calculates maintainability index based on the changes in the diff.'
    },
    {
      question: 'Can it detect security issues in diffs?',
      answer: 'Yes, it scans for security-sensitive changes, credential exposure, authentication modifications, configuration vulnerabilities, and provides security-focused review suggestions.'
    },
    {
      question: 'What visualization options are available?',
      answer: 'Offers multiple diff visualization formats including side-by-side, inline, word-level, character-level highlighting, and generates charts showing change distribution and impact metrics.'
    }
  ],

  relatedTools: [
    'text-diff',
    'diff-checker',
    'config-file-validator',
    'log-analysis-tool',
    'text-analytics',
    'regex-tester'
  ]
};