import { TOOL_CATEGORIES } from '../lib/tools/registry';
import type { Tool } from '../types';

export interface GitignoreGeneratorConfig {
  templates: string[];
  includeComments: boolean;
  includeOs: boolean;
  includeEditor: boolean;
  customPatterns: boolean;
  sortPatterns: boolean;
  groupByCategory: boolean;
  minimizeOutput: boolean;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
  templates?: TemplateInfo[];
  stats?: GitignoreStats;
}

interface TemplateInfo {
  name: string;
  description: string;
  patterns: string[];
  category: string;
}

interface GitignoreStats {
  totalPatterns: number;
  templatesUsed: number;
  categories: string[];
  estimatedFiles: number;
}

// Predefined gitignore templates
const GITIGNORE_TEMPLATES: Record<string, TemplateInfo> = {
  // Programming Languages
  node: {
    name: 'Node.js',
    description: 'Node.js dependencies and build artifacts',
    category: 'Languages',
    patterns: [
      '# Dependencies',
      'node_modules/',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'lerna-debug.log*',
      '',
      '# Build outputs',
      'dist/',
      'build/',
      '.tmp/',
      '.cache/',
      '',
      '# Environment variables',
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '',
      '# Package locks',
      'package-lock.json',
      'yarn.lock'
    ]
  },
  
  python: {
    name: 'Python',
    description: 'Python bytecode, virtual environments, and build artifacts',
    category: 'Languages',
    patterns: [
      '# Byte-compiled / optimized / DLL files',
      '__pycache__/',
      '*.py[cod]',
      '*$py.class',
      '',
      '# Virtual environments',
      'venv/',
      'env/',
      'ENV/',
      '.venv/',
      '',
      '# Distribution / packaging',
      'build/',
      'develop-eggs/',
      'dist/',
      'downloads/',
      'eggs/',
      '.eggs/',
      'lib/',
      'lib64/',
      'parts/',
      'sdist/',
      'var/',
      'wheels/',
      '*.egg-info/',
      '.installed.cfg',
      '*.egg',
      '',
      '# PyInstaller',
      '*.manifest',
      '*.spec',
      '',
      '# Unit test / coverage',
      'htmlcov/',
      '.tox/',
      '.coverage',
      '.coverage.*',
      '.cache',
      '.pytest_cache/',
      'nosetests.xml',
      'coverage.xml',
      '*.cover'
    ]
  },

  java: {
    name: 'Java',
    description: 'Java compiled classes and Maven/Gradle artifacts',
    category: 'Languages',
    patterns: [
      '# Compiled class files',
      '*.class',
      '',
      '# Log files',
      '*.log',
      '',
      '# BlueJ files',
      '*.ctxt',
      '',
      '# Mobile Tools for Java (J2ME)',
      '.mtj.tmp/',
      '',
      '# Package Files',
      '*.jar',
      '*.war',
      '*.nar',
      '*.ear',
      '*.zip',
      '*.tar.gz',
      '*.rar',
      '',
      '# Maven',
      'target/',
      'pom.xml.tag',
      'pom.xml.releaseBackup',
      'pom.xml.versionsBackup',
      'pom.xml.next',
      'release.properties',
      'dependency-reduced-pom.xml',
      '',
      '# Gradle',
      '.gradle',
      'build/',
      'gradle-app.setting',
      '!gradle-wrapper.jar',
      '.gradletasknamecache'
    ]
  },

  react: {
    name: 'React',
    description: 'React application build artifacts and dependencies',
    category: 'Frameworks',
    patterns: [
      '# Dependencies',
      'node_modules/',
      '.pnp',
      '.pnp.js',
      '',
      '# Production builds',
      'build/',
      'dist/',
      '',
      '# Environment variables',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      '',
      '# Debug logs',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '',
      '# ESLint cache',
      '.eslintcache',
      '',
      '# Optional npm cache directory',
      '.npm',
      '',
      '# Optional REPL history',
      '.node_repl_history',
      '',
      '# Storybook build outputs',
      'storybook-static',
      '',
      '# Create React App',
      '.env',
      'build/',
      ''
    ]
  },

  // Operating Systems
  windows: {
    name: 'Windows',
    description: 'Windows system files and thumbnails',
    category: 'OS',
    patterns: [
      '# Windows thumbnail cache files',
      'Thumbs.db',
      'Thumbs.db:encryptable',
      'ehthumbs.db',
      'ehthumbs_vista.db',
      '',
      '# Dump file',
      '*.stackdump',
      '',
      '# Folder config file',
      '[Dd]esktop.ini',
      '',
      '# Recycle Bin used on file shares',
      '$RECYCLE.BIN/',
      '',
      '# Windows Installer files',
      '*.cab',
      '*.msi',
      '*.msix',
      '*.msm',
      '*.msp',
      '',
      '# Windows shortcuts',
      '*.lnk'
    ]
  },

  macos: {
    name: 'macOS',
    description: 'macOS system files and metadata',
    category: 'OS',
    patterns: [
      '# General',
      '.DS_Store',
      '.AppleDouble',
      '.LSOverride',
      '',
      '# Icon must end with two \\r',
      'Icon\\r\\r',
      '',
      '# Thumbnails',
      '._*',
      '',
      '# Files that might appear in the root of a volume',
      '.DocumentRevisions-V100',
      '.fseventsd',
      '.Spotlight-V100',
      '.TemporaryItems',
      '.Trashes',
      '.VolumeIcon.icns',
      '.com.apple.timemachine.donotpresent',
      '',
      '# Directories potentially created on remote AFP share',
      '.AppleDB',
      '.AppleDesktop',
      'Network Trash Folder',
      'Temporary Items',
      '.apdisk'
    ]
  },

  linux: {
    name: 'Linux',
    description: 'Linux temporary files and directory listings',
    category: 'OS',
    patterns: [
      '# Temporary files',
      '*~',
      '',
      '# Temporary files which can be created if a process still has a handle open of a deleted file',
      '.fuse_hidden*',
      '',
      '# KDE directory preferences',
      '.directory',
      '',
      '# Linux trash folder which might appear on any partition or disk',
      '.Trash-*',
      '',
      '# .nfs files are created when an open file is removed but is still being accessed',
      '.nfs*'
    ]
  },

  // Editors
  vscode: {
    name: 'Visual Studio Code',
    description: 'VS Code workspace settings and extensions',
    category: 'Editors',
    patterns: [
      '.vscode/*',
      '!.vscode/settings.json',
      '!.vscode/tasks.json',
      '!.vscode/launch.json',
      '!.vscode/extensions.json',
      '*.code-workspace',
      '',
      '# Local History for Visual Studio Code',
      '.history/'
    ]
  },

  intellij: {
    name: 'IntelliJ IDEA',
    description: 'JetBrains IDEs project files and caches',
    category: 'Editors',
    patterns: [
      '# Covers JetBrains IDEs: IntelliJ, RubyMine, PhpStorm, AppCode, PyCharm, CLion, Android Studio, WebStorm and Rider',
      '.idea/*',
      '*.iws',
      '*.iml',
      '*.ipr',
      '',
      '# CMake',
      'cmake-build-*/',
      '',
      '# File-based project format',
      '*.iws',
      '',
      '# IntelliJ',
      'out/',
      '',
      '# User-specific stuff',
      '.idea/**/workspace.xml',
      '.idea/**/tasks.xml',
      '.idea/**/usage.statistics.xml',
      '.idea/**/dictionaries',
      '.idea/**/shelf',
      '',
      '# Generated files',
      '.idea/**/contentModel.xml'
    ]
  },

  // Databases
  database: {
    name: 'Database',
    description: 'Database files and temporary data',
    category: 'Data',
    patterns: [
      '# SQLite',
      '*.db',
      '*.sqlite',
      '*.sqlite3',
      '',
      '# MySQL',
      '*.sql',
      '',
      '# Database backups',
      '*.dump',
      '*.bak',
      '',
      '# MongoDB',
      '*.lock'
    ]
  },

  // Build Tools
  docker: {
    name: 'Docker',
    description: 'Docker build context and temporary files',
    category: 'DevOps',
    patterns: [
      '# Docker build context',
      '.dockerignore',
      'Dockerfile.dev',
      'docker-compose.override.yml',
      '',
      '# Docker volumes',
      '.docker/',
      ''
    ]
  },

  // Logs and temporary files
  logs: {
    name: 'Logs',
    description: 'Log files and temporary data',
    category: 'Temp',
    patterns: [
      '# Log files',
      '*.log',
      'logs/',
      '',
      '# Runtime data',
      'pids/',
      '*.pid',
      '*.seed',
      '*.pid.lock',
      '',
      '# Temporary folders',
      'tmp/',
      'temp/',
      '.tmp/',
      '.temp/',
      ''
    ]
  }
};

function generateGitignore(templates: string[], config: GitignoreGeneratorConfig): string {
  let patterns: string[] = [];
  let usedTemplates: TemplateInfo[] = [];

  // Add header comment
  if (config.includeComments) {
    patterns.push('# Generated by FreeFormatHub - Git Ignore Generator');
    patterns.push(`# Templates: ${templates.join(', ')}`);
    patterns.push('# https://freeformathub.com/development/gitignore-generator');
    patterns.push('');
  }

  // Collect patterns from selected templates
  templates.forEach(templateName => {
    const template = GITIGNORE_TEMPLATES[templateName];
    if (template) {
      usedTemplates.push(template);
      
      if (config.groupByCategory) {
        if (config.includeComments) {
          patterns.push(`# ${template.category}: ${template.name}`);
          patterns.push(`# ${template.description}`);
          patterns.push('');
        }
      } else if (config.includeComments) {
        patterns.push(`# ${template.name}`);
        patterns.push('');
      }
      
      patterns.push(...template.patterns);
      patterns.push('');
    }
  });

  // Add common OS patterns if requested
  if (config.includeOs) {
    const osTemplates = ['windows', 'macos', 'linux'];
    osTemplates.forEach(os => {
      if (!templates.includes(os) && GITIGNORE_TEMPLATES[os]) {
        const template = GITIGNORE_TEMPLATES[os];
        if (config.includeComments) {
          patterns.push(`# ${template.name} (Auto-included)`);
          patterns.push('');
        }
        patterns.push(...template.patterns);
        patterns.push('');
        usedTemplates.push(template);
      }
    });
  }

  // Add common editor patterns if requested
  if (config.includeEditor) {
    const editorTemplates = ['vscode', 'intellij'];
    editorTemplates.forEach(editor => {
      if (!templates.includes(editor) && GITIGNORE_TEMPLATES[editor]) {
        const template = GITIGNORE_TEMPLATES[editor];
        if (config.includeComments) {
          patterns.push(`# ${template.name} (Auto-included)`);
          patterns.push('');
        }
        patterns.push(...template.patterns);
        patterns.push('');
        usedTemplates.push(template);
      }
    });
  }

  // Clean up patterns
  let finalPatterns = patterns;

  // Remove empty lines if minimizing
  if (config.minimizeOutput) {
    finalPatterns = patterns.filter(line => line.trim() !== '' || line.startsWith('#'));
  }

  // Sort patterns if requested (but keep comments with their groups)
  if (config.sortPatterns) {
    const groups: string[][] = [];
    let currentGroup: string[] = [];
    
    finalPatterns.forEach(line => {
      if (line.startsWith('#') && currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [line];
      } else {
        currentGroup.push(line);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Sort non-comment lines within each group
    finalPatterns = groups.flatMap(group => {
      const comments = group.filter(line => line.startsWith('#') || line.trim() === '');
      const patterns = group.filter(line => !line.startsWith('#') && line.trim() !== '');
      patterns.sort();
      return [...comments, ...patterns];
    });
  }

  // Add footer
  if (config.includeComments) {
    finalPatterns.push('');
    finalPatterns.push('# End of generated .gitignore');
  }

  return finalPatterns.join('\n');
}

export function processGitignoreGenerator(templates: string[], config: GitignoreGeneratorConfig): ToolResult {
  try {
    if (templates.length === 0) {
      return {
        success: false,
        error: 'Please select at least one template to generate a .gitignore file'
      };
    }

    // Validate templates
    const invalidTemplates = templates.filter(t => !GITIGNORE_TEMPLATES[t]);
    if (invalidTemplates.length > 0) {
      return {
        success: false,
        error: `Unknown templates: ${invalidTemplates.join(', ')}`
      };
    }

    const output = generateGitignore(templates, config);
    
    // Calculate statistics
    const usedTemplates = templates.map(t => GITIGNORE_TEMPLATES[t]).filter(Boolean);
    const allPatterns = output.split('\n').filter(line => 
      line.trim() !== '' && !line.startsWith('#')
    );
    
    const categories = [...new Set(usedTemplates.map(t => t.category))];
    
    const stats: GitignoreStats = {
      totalPatterns: allPatterns.length,
      templatesUsed: usedTemplates.length,
      categories,
      estimatedFiles: allPatterns.length * 10 // Rough estimate
    };

    const templateInfo = usedTemplates;

    return {
      success: true,
      output,
      templates: templateInfo,
      stats
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate .gitignore file'
    };
  }
}

export const GITIGNORE_GENERATOR_TOOL: Tool = {
  id: 'gitignore-generator',
  name: 'Git Ignore Generator',
  category: TOOL_CATEGORIES.find(cat => cat.id === 'development')!,
  slug: 'gitignore-generator',
  icon: '📄',
  keywords: ['git', 'gitignore', 'ignore', 'repository', 'vcs', 'exclude', 'files', 'patterns'],
  seoTitle: 'Git Ignore Generator - Create .gitignore Files | FreeFormatHub',
  seoDescription: 'Generate comprehensive .gitignore files for any project. Pre-built templates for Node.js, Python, Java, React and more. Exclude unwanted files from Git.',
  description: 'Generate comprehensive .gitignore files for your projects. Choose from pre-built templates for popular languages, frameworks, and tools.',

  examples: [
    {
      title: 'Node.js Project',
      input: 'Templates: node, vscode, logs',
      output: `# Generated by FreeFormatHub - Git Ignore Generator
# Templates: node, vscode, logs

# Node.js

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.cache/

# Environment variables
.env
.env.local
.env.development.local

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
*.code-workspace

# Logs
*.log
logs/
pids/
*.pid`,
      description: 'Comprehensive .gitignore for Node.js development with VS Code'
    },
    {
      title: 'Python Data Science',
      input: 'Templates: python, database, logs',
      output: `# Generated by FreeFormatHub - Git Ignore Generator
# Templates: python, database, logs

# Python

# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
venv/
env/
.venv/

# Distribution / packaging
build/
dist/
*.egg-info/

# Database files
*.db
*.sqlite
*.sqlite3

# Log files
*.log
logs/`,
      description: 'Perfect for Python data science and machine learning projects'
    }
  ],

  useCases: [
    'Setting up new Git repositories with proper file exclusions',
    'Creating language-specific .gitignore files for development projects',
    'Generating comprehensive ignore patterns for full-stack applications',
    'Excluding build artifacts, dependencies, and temporary files',
    'Creating team-standard .gitignore files for consistent repositories',
    'Bootstrapping projects with best-practice file exclusion patterns',
    'Combining multiple technology stacks in a single ignore file',
    'Learning about common files that should be excluded from version control'
  ],

  faq: [
    {
      question: 'Which templates should I choose for my project?',
      answer: 'Select templates that match your technology stack. For a React app, choose "react" and "node". For Python, choose "python". Always consider adding OS and editor templates for comprehensive coverage.'
    },
    {
      question: 'Should I include OS-specific patterns?',
      answer: 'Yes, enabling "Include OS patterns" adds Windows, macOS, and Linux system files. This prevents committing .DS_Store, Thumbs.db, and other OS artifacts that team members might accidentally add.'
    },
    {
      question: 'What does "Group by Category" do?',
      answer: 'This organizes patterns into logical sections (Languages, OS, Editors) with descriptive comments, making the .gitignore file easier to understand and maintain.'
    },
    {
      question: 'Can I add custom patterns to the generated file?',
      answer: 'The tool generates standard patterns, but you can manually add project-specific patterns after generation. Consider patterns for your specific build tools, IDEs, or deployment artifacts.'
    },
    {
      question: 'Why are some files already tracked despite being in .gitignore?',
      answer: 'Files already committed to Git won\'t be ignored automatically. Use `git rm --cached filename` to untrack them, then the .gitignore will take effect for future changes.'
    }
  ],

  commonErrors: [
    'No templates selected (at least one template is required)',
    'Unknown template names (check available template list)',
    'Conflicting patterns when combining multiple templates',
    'Missing critical patterns for specific project setups',
    'OS-specific patterns not included for cross-platform teams'
  ],

  relatedTools: ['git-diff', 'project-initializer', 'file-explorer', 'pattern-matcher', 'repository-cleaner']
};

// Export available templates for UI
export const AVAILABLE_TEMPLATES = Object.entries(GITIGNORE_TEMPLATES).map(([key, template]) => ({
  id: key,
  name: template.name,
  description: template.description,
  category: template.category,
  patternCount: template.patterns.filter(p => p.trim() && !p.startsWith('#')).length
}));
