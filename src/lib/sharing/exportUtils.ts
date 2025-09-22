import JSZip from 'jszip';
import type { Project, ProjectFile } from '../../components/tools/web/project/ProjectManager';

export interface ExportOptions {
  format: 'html' | 'zip' | 'codepen' | 'jsfiddle' | 'stackblitz' | 'codesandbox' | 'github-gist';
  includeMetadata?: boolean;
  minify?: boolean;
  inlineAssets?: boolean;
  generateManifest?: boolean;
  addComments?: boolean;
}

export interface ShareableLink {
  url: string;
  embedCode?: string;
  qrCode?: string;
  expiresAt?: Date;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string | ShareableLink;
  error?: string;
  metadata?: {
    size: number;
    files: number;
    exportTime: number;
  };
}

export class ProjectExporter {
  static async exportProject(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = performance.now();

    try {
      switch (options.format) {
        case 'html':
          return await this.exportAsHTML(project, options);
        case 'zip':
          return await this.exportAsZip(project, options);
        case 'codepen':
          return await this.exportToCodePen(project, options);
        case 'jsfiddle':
          return await this.exportToJSFiddle(project, options);
        case 'stackblitz':
          return await this.exportToStackBlitz(project, options);
        case 'codesandbox':
          return await this.exportToCodeSandbox(project, options);
        case 'github-gist':
          return await this.exportToGitHubGist(project, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    } finally {
      const exportTime = performance.now() - startTime;
      console.debug(`Export completed in ${exportTime.toFixed(2)}ms`);
    }
  }

  private static async exportAsHTML(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const htmlFile = this.findMainFile(project, 'html');
    const cssFiles = this.getFilesByExtension(project, ['css', 'scss']);
    const jsFiles = this.getFilesByExtension(project, ['js', 'ts', 'jsx']);

    if (!htmlFile) {
      throw new Error('No HTML file found in project');
    }

    let htmlContent = htmlFile.content || '';

    // Process CSS
    if (options.inlineAssets && cssFiles.length > 0) {
      const combinedCSS = cssFiles.map(f => f.content || '').join('\n\n');
      const cssTag = `<style>\n${combinedCSS}\n</style>`;

      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssTag}\n</head>`);
      } else {
        htmlContent = `${cssTag}\n${htmlContent}`;
      }
    }

    // Process JavaScript
    if (options.inlineAssets && jsFiles.length > 0) {
      const combinedJS = jsFiles.map(f => f.content || '').join('\n\n');
      const jsTag = `<script>\n${combinedJS}\n</script>`;

      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsTag}\n</body>`);
      } else {
        htmlContent = `${htmlContent}\n${jsTag}`;
      }
    }

    // Add metadata comment
    if (options.addComments || options.includeMetadata) {
      const metadata = this.generateMetadataComment(project);
      htmlContent = `${metadata}\n${htmlContent}`;
    }

    // Minify if requested
    if (options.minify) {
      htmlContent = this.minifyHTML(htmlContent);
    }

    const blob = new Blob([htmlContent], { type: 'text/html' });

    return {
      success: true,
      data: blob,
      metadata: {
        size: blob.size,
        files: 1,
        exportTime: 0
      }
    };
  }

  private static async exportAsZip(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const zip = new JSZip();

    // Add project files
    const addFilesToZip = (files: ProjectFile[], folder: JSZip = zip) => {
      files.forEach(file => {
        if (file.type === 'file' && file.content !== undefined) {
          let content = file.content;

          // Process content based on options
          if (options.minify) {
            content = this.minifyFileContent(content, file.extension || '');
          }

          if (options.addComments && file.extension === 'html') {
            const metadata = this.generateMetadataComment(project);
            content = `${metadata}\n${content}`;
          }

          folder.file(file.name, content);
        } else if (file.type === 'folder' && file.children) {
          const subFolder = folder.folder(file.name);
          if (subFolder) {
            addFilesToZip(file.children, subFolder);
          }
        }
      });
    };

    addFilesToZip(project.files);

    // Add project metadata
    if (options.includeMetadata) {
      const metadata = {
        name: project.name,
        description: project.description,
        version: project.metadata.version,
        created: new Date(project.metadata.created).toISOString(),
        lastModified: new Date(project.metadata.lastModified).toISOString(),
        settings: project.settings,
        exportedAt: new Date().toISOString(),
        exportedBy: 'FreeFormatHub HTML Visualizer'
      };
      zip.file('project.json', JSON.stringify(metadata, null, 2));
    }

    // Generate manifest
    if (options.generateManifest) {
      const manifest = this.generateWebManifest(project);
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }

    // Add README
    if (options.addComments) {
      const readme = this.generateReadme(project);
      zip.file('README.md', readme);
    }

    const blob = await zip.generateAsync({ type: 'blob' });

    return {
      success: true,
      data: blob,
      metadata: {
        size: blob.size,
        files: Object.keys(zip.files).length,
        exportTime: 0
      }
    };
  }

  private static async exportToCodePen(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const htmlFile = this.findMainFile(project, 'html');
    const cssFile = this.findMainFile(project, 'css');
    const jsFile = this.findMainFile(project, 'js');

    const data = {
      title: project.name,
      description: project.description,
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      js: jsFile?.content || '',
      html_pre_processor: 'none',
      css_pre_processor: project.settings.preprocessors.scss ? 'scss' : 'none',
      js_pre_processor: project.settings.preprocessors.typescript ? 'typescript' : 'none',
      tags: project.metadata.tags,
      private: false
    };

    // Create form and submit to CodePen
    const form = document.createElement('form');
    form.action = 'https://codepen.io/pen/define';
    form.method = 'POST';
    form.target = '_blank';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    return {
      success: true,
      data: 'https://codepen.io/pen/define',
      metadata: {
        size: JSON.stringify(data).length,
        files: 1,
        exportTime: 0
      }
    };
  }

  private static async exportToJSFiddle(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const htmlFile = this.findMainFile(project, 'html');
    const cssFile = this.findMainFile(project, 'css');
    const jsFile = this.findMainFile(project, 'js');

    const data = {
      title: project.name,
      description: project.description,
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      js: jsFile?.content || '',
      panel_html: 1,
      panel_css: 1,
      panel_js: 1,
      wrap: 'd'
    };

    // Create form and submit to JSFiddle
    const form = document.createElement('form');
    form.action = 'https://jsfiddle.net/api/post/library/pure/';
    form.method = 'POST';
    form.target = '_blank';

    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    return {
      success: true,
      data: 'https://jsfiddle.net/api/post/library/pure/',
      metadata: {
        size: JSON.stringify(data).length,
        files: 1,
        exportTime: 0
      }
    };
  }

  private static async exportToStackBlitz(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const files: Record<string, string> = {};

    // Convert project files to StackBlitz format
    const processFiles = (projectFiles: ProjectFile[]) => {
      projectFiles.forEach(file => {
        if (file.type === 'file' && file.content !== undefined) {
          files[file.name] = file.content;
        } else if (file.type === 'folder' && file.children) {
          processFiles(file.children);
        }
      });
    };

    processFiles(project.files);

    // Add package.json if not exists
    if (!files['package.json']) {
      files['package.json'] = JSON.stringify({
        name: project.name.toLowerCase().replace(/\s+/g, '-'),
        version: project.metadata.version,
        description: project.description,
        main: 'index.html',
        scripts: {
          start: 'npm run dev',
          dev: 'vite',
          build: 'vite build'
        },
        devDependencies: {
          vite: '^4.0.0'
        }
      }, null, 2);
    }

    const projectData = {
      title: project.name,
      description: project.description,
      template: 'html',
      files
    };

    // Create StackBlitz URL
    const url = `https://stackblitz.com/fork/web-platform?title=${encodeURIComponent(project.name)}`;

    // Open StackBlitz with project data
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      // Post message with project data when window loads
      setTimeout(() => {
        newWindow.postMessage({
          type: 'IMPORT_PROJECT',
          data: projectData
        }, 'https://stackblitz.com');
      }, 2000);
    }

    return {
      success: true,
      data: url,
      metadata: {
        size: JSON.stringify(projectData).length,
        files: Object.keys(files).length,
        exportTime: 0
      }
    };
  }

  private static async exportToCodeSandbox(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const files: Record<string, { content: string; isBinary?: boolean }> = {};

    // Convert project files to CodeSandbox format
    const processFiles = (projectFiles: ProjectFile[]) => {
      projectFiles.forEach(file => {
        if (file.type === 'file' && file.content !== undefined) {
          files[file.name] = { content: file.content };
        } else if (file.type === 'folder' && file.children) {
          processFiles(file.children);
        }
      });
    };

    processFiles(project.files);

    // Add package.json if not exists
    if (!files['package.json']) {
      files['package.json'] = {
        content: JSON.stringify({
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          version: project.metadata.version,
          description: project.description,
          main: 'index.html',
          keywords: project.metadata.tags,
          dependencies: {}
        }, null, 2)
      };
    }

    const sandboxConfig = {
      files,
      template: 'static'
    };

    try {
      const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sandboxConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to create CodeSandbox');
      }

      const result = await response.json();
      const url = `https://codesandbox.io/s/${result.sandbox_id}`;

      return {
        success: true,
        data: {
          url,
          embedCode: `<iframe src="https://codesandbox.io/embed/${result.sandbox_id}" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" title="${project.name}"></iframe>`
        } as ShareableLink,
        metadata: {
          size: JSON.stringify(sandboxConfig).length,
          files: Object.keys(files).length,
          exportTime: 0
        }
      };
    } catch (error) {
      throw new Error(`CodeSandbox export failed: ${error}`);
    }
  }

  private static async exportToGitHubGist(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const files: Record<string, { content: string }> = {};

    // Convert project files to Gist format
    const processFiles = (projectFiles: ProjectFile[]) => {
      projectFiles.forEach(file => {
        if (file.type === 'file' && file.content !== undefined) {
          files[file.name] = { content: file.content };
        } else if (file.type === 'folder' && file.children) {
          processFiles(file.children);
        }
      });
    };

    processFiles(project.files);

    // Add README with project description
    files['README.md'] = {
      content: this.generateReadme(project)
    };

    const gistData = {
      description: `${project.name} - ${project.description}`,
      public: true,
      files
    };

    // Note: This would require GitHub API token for actual creation
    // For now, just open GitHub Gist creation page
    const url = 'https://gist.github.com/';
    window.open(url, '_blank');

    return {
      success: true,
      data: JSON.stringify(gistData, null, 2),
      metadata: {
        size: JSON.stringify(gistData).length,
        files: Object.keys(files).length,
        exportTime: 0
      }
    };
  }

  // Utility methods
  private static findMainFile(project: Project, extension: string): ProjectFile | null {
    const findFile = (files: ProjectFile[]): ProjectFile | null => {
      for (const file of files) {
        if (file.type === 'file' && file.extension === extension) {
          if (file.name.startsWith('index.') || file.name.startsWith('main.')) {
            return file;
          }
        }
        if (file.type === 'folder' && file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      // Return first file with matching extension if no index/main found
      for (const file of files) {
        if (file.type === 'file' && file.extension === extension) {
          return file;
        }
        if (file.type === 'folder' && file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findFile(project.files);
  }

  private static getFilesByExtension(project: Project, extensions: string[]): ProjectFile[] {
    const files: ProjectFile[] = [];

    const findFiles = (projectFiles: ProjectFile[]) => {
      projectFiles.forEach(file => {
        if (file.type === 'file' && file.extension && extensions.includes(file.extension)) {
          files.push(file);
        } else if (file.type === 'folder' && file.children) {
          findFiles(file.children);
        }
      });
    };

    findFiles(project.files);
    return files;
  }

  private static generateMetadataComment(project: Project): string {
    return `<!--
  Project: ${project.name}
  Description: ${project.description}
  Created: ${new Date(project.metadata.created).toLocaleString()}
  Last Modified: ${new Date(project.metadata.lastModified).toLocaleString()}
  Generated by: FreeFormatHub HTML Visualizer
  URL: https://freeformathub.com/web/html-visualizer
-->`;
  }

  private static generateReadme(project: Project): string {
    return `# ${project.name}

${project.description}

## Project Information

- **Version**: ${project.metadata.version}
- **Created**: ${new Date(project.metadata.created).toLocaleString()}
- **Last Modified**: ${new Date(project.metadata.lastModified).toLocaleString()}
- **Tags**: ${project.metadata.tags.join(', ') || 'None'}

## Files

${project.files.map(file => `- ${file.name}${file.type === 'folder' ? '/' : ''}`).join('\n')}

## Settings

- **Auto Save**: ${project.settings.autoSave ? 'Enabled' : 'Disabled'}
- **Auto Format**: ${project.settings.autoFormat ? 'Enabled' : 'Disabled'}
- **Live Reload**: ${project.settings.liveReload ? 'Enabled' : 'Disabled'}

### Preprocessors
${Object.entries(project.settings.preprocessors)
  .filter(([_, enabled]) => enabled)
  .map(([name, _]) => `- ${name}`)
  .join('\n') || '- None enabled'}

---

Generated by [FreeFormatHub HTML Visualizer](https://freeformathub.com/web/html-visualizer)
`;
  }

  private static generateWebManifest(project: Project) {
    return {
      name: project.name,
      short_name: project.name.split(' ').map(w => w[0]).join('').toUpperCase(),
      description: project.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
  }

  private static minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  }

  private static minifyFileContent(content: string, extension: string): string {
    switch (extension) {
      case 'html':
      case 'htm':
        return this.minifyHTML(content);
      case 'css':
        return content
          .replace(/\s+/g, ' ')
          .replace(/;\s*}/g, '}')
          .replace(/{\s*/g, '{')
          .replace(/;\s*/g, ';')
          .trim();
      case 'js':
      case 'jsx':
        // Basic JS minification (for production use a proper minifier)
        return content
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .replace(/\s+/g, ' ')
          .trim();
      default:
        return content;
    }
  }
}

export default ProjectExporter;