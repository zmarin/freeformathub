import React, { useState, useCallback, useRef } from 'react';
import {
  Folder,
  File,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Save,
  FolderOpen,
  Code,
  Image,
  FileText,
  Settings,
  Search,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Copy,
  Move,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: ProjectFile[];
  parentId?: string;
  size?: number;
  lastModified: number;
  isOpen?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  settings: {
    preprocessors: {
      html: boolean;
      css: boolean;
      scss: boolean;
      typescript: boolean;
      jsx: boolean;
    };
    autoSave: boolean;
    autoFormat: boolean;
    liveReload: boolean;
  };
  metadata: {
    created: number;
    lastModified: number;
    version: string;
    tags: string[];
  };
}

export interface ProjectManagerProps {
  project: Project;
  onProjectChange: (project: Project) => void;
  onFileSelect: (file: ProjectFile | null) => void;
  selectedFile: ProjectFile | null;
  className?: string;
}

const defaultProject: Project = {
  id: 'default',
  name: 'My Project',
  description: 'A new web project',
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: 'file',
      extension: 'html',
      content: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Project</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>',
      lastModified: Date.now(),
      size: 150
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: 'file',
      extension: 'css',
      content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
      lastModified: Date.now(),
      size: 80
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: 'file',
      extension: 'js',
      content: 'console.log("Hello from script!");',
      lastModified: Date.now(),
      size: 35
    }
  ],
  settings: {
    preprocessors: {
      html: false,
      css: false,
      scss: false,
      typescript: false,
      jsx: false
    },
    autoSave: true,
    autoFormat: true,
    liveReload: true
  },
  metadata: {
    created: Date.now(),
    lastModified: Date.now(),
    version: '1.0.0',
    tags: []
  }
};

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  project,
  onProjectChange,
  onFileSelect,
  selectedFile,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: ProjectFile;
  } | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProject = useCallback((updates: Partial<Project>) => {
    const updatedProject = {
      ...project,
      ...updates,
      metadata: {
        ...project.metadata,
        lastModified: Date.now()
      }
    };
    onProjectChange(updatedProject);
  }, [project, onProjectChange]);

  const updateFile = useCallback((fileId: string, updates: Partial<ProjectFile>) => {
    const updateFileRecursive = (files: ProjectFile[]): ProjectFile[] => {
      return files.map(file => {
        if (file.id === fileId) {
          return { ...file, ...updates, lastModified: Date.now() };
        }
        if (file.children) {
          return { ...file, children: updateFileRecursive(file.children) };
        }
        return file;
      });
    };

    updateProject({ files: updateFileRecursive(project.files) });
  }, [project.files, updateProject]);

  const addFile = useCallback((parentId?: string, type: 'file' | 'folder' = 'file') => {
    const defaultName = type === 'file' ? 'untitled.html' : 'New Folder';
    const newFile: ProjectFile = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: defaultName,
      type,
      extension: type === 'file' ? 'html' : undefined,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
      parentId,
      lastModified: Date.now(),
      size: 0
    };

    if (parentId) {
      const addToParent = (files: ProjectFile[]): ProjectFile[] => {
        return files.map(file => {
          if (file.id === parentId && file.type === 'folder') {
            return {
              ...file,
              children: [...(file.children || []), newFile],
              isOpen: true
            };
          }
          if (file.children) {
            return { ...file, children: addToParent(file.children) };
          }
          return file;
        });
      };
      updateProject({ files: addToParent(project.files) });
    } else {
      updateProject({ files: [...project.files, newFile] });
    }

    setRenamingFile(newFile.id);
    setNewFileName(defaultName);
  }, [project.files, updateProject]);

  const deleteFile = useCallback((fileId: string) => {
    const deleteFileRecursive = (files: ProjectFile[]): ProjectFile[] => {
      return files.filter(file => {
        if (file.id === fileId) {
          return false;
        }
        if (file.children) {
          file.children = deleteFileRecursive(file.children);
        }
        return true;
      });
    };

    updateProject({ files: deleteFileRecursive(project.files) });

    if (selectedFile?.id === fileId) {
      onFileSelect(null);
    }
  }, [project.files, selectedFile, onFileSelect, updateProject]);

  const renameFile = useCallback((fileId: string, newName: string) => {
    if (!newName.trim()) return;

    const extension = newName.includes('.') ? newName.split('.').pop() : undefined;
    updateFile(fileId, {
      name: newName.trim(),
      extension: extension?.toLowerCase()
    });

    setRenamingFile(null);
    setNewFileName('');
  }, [updateFile]);

  const toggleFolder = useCallback((folderId: string) => {
    updateFile(folderId, { isOpen: !project.files.find(f => f.id === folderId)?.isOpen });
  }, [project.files, updateFile]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const content = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();

      const newFile: ProjectFile = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'file',
        extension,
        content,
        lastModified: file.lastModified,
        size: file.size
      };

      updateProject({ files: [...project.files, newFile] });
    }

    // Reset input
    event.target.value = '';
  }, [project.files, updateProject]);

  const exportProject = useCallback(async () => {
    const zip = new JSZip();

    const addFilesToZip = (files: ProjectFile[], folder: JSZip = zip) => {
      files.forEach(file => {
        if (file.type === 'file' && file.content !== undefined) {
          folder.file(file.name, file.content);
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
    const metadata = {
      name: project.name,
      description: project.description,
      settings: project.settings,
      metadata: project.metadata
    };
    zip.file('project.json', JSON.stringify(metadata, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [project]);

  const handleContextMenu = useCallback((event: React.MouseEvent, file: ProjectFile) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'folder') {
      return file.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />;
    }

    switch (file.extension) {
      case 'html':
      case 'htm':
        return <Code size={16} style={{ color: '#e34c26' }} />;
      case 'css':
      case 'scss':
      case 'sass':
        return <Code size={16} style={{ color: '#1572b6' }} />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code size={16} style={{ color: '#f7df1e' }} />;
      case 'json':
        return <FileText size={16} style={{ color: '#00d2d3' }} />;
      case 'md':
        return <FileText size={16} style={{ color: '#083fa1' }} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image size={16} style={{ color: '#ff6b6b' }} />;
      default:
        return <File size={16} />;
    }
  };

  const renderFile = (file: ProjectFile, depth: number = 0) => {
    const isSelected = selectedFile?.id === file.id;
    const isRenaming = renamingFile === file.id;

    return (
      <div key={file.id}>
        <div
          className={`file-item ${isSelected ? 'selected' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            paddingLeft: `${depth * 1.5 + 0.5}rem`,
            cursor: 'pointer',
            backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            margin: '0.125rem 0',
            fontSize: '0.875rem'
          }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          {file.type === 'folder' && (
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '0.125rem',
                marginRight: '0.25rem',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(file.id);
              }}
            >
              {file.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}

          <span style={{ marginRight: '0.5rem' }}>
            {getFileIcon(file)}
          </span>

          {isRenaming ? (
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => renameFile(file.id, newFileName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameFile(file.id, newFileName);
                } else if (e.key === 'Escape') {
                  setRenamingFile(null);
                  setNewFileName('');
                }
              }}
              autoFocus
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.125rem 0.25rem',
                fontSize: '0.875rem',
                flex: 1
              }}
            />
          ) : (
            <span style={{ flex: 1 }}>{file.name}</span>
          )}

          {file.type === 'file' && file.size !== undefined && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginLeft: '0.5rem'
            }}>
              {file.size < 1024 ? `${file.size}B` : `${(file.size / 1024).toFixed(1)}KB`}
            </span>
          )}
        </div>

        {file.type === 'folder' && file.isOpen && file.children && (
          <div>
            {file.children.map(child => renderFile(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredFiles = project.files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`project-manager ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            {project.name}
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-ghost"
            style={{ padding: '0.25rem' }}
          >
            <Settings size={14} />
          </button>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-secondary)'
              }}
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem 0.5rem 0.375rem 2rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => addFile(undefined, 'file')}
            className="btn btn-outline"
            style={{ padding: '0.375rem', fontSize: '0.75rem' }}
            title="New File"
          >
            <Plus size={12} />
            <File size={12} />
          </button>
          <button
            onClick={() => addFile(undefined, 'folder')}
            className="btn btn-outline"
            style={{ padding: '0.375rem', fontSize: '0.75rem' }}
            title="New Folder"
          >
            <Plus size={12} />
            <Folder size={12} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
            style={{ padding: '0.375rem', fontSize: '0.75rem' }}
            title="Upload Files"
          >
            <Upload size={12} />
          </button>
          <button
            onClick={exportProject}
            className="btn btn-outline"
            style={{ padding: '0.375rem', fontSize: '0.75rem' }}
            title="Export Project"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-secondary)',
          fontSize: '0.875rem'
        }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem' }}>Project Settings</h4>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Project Name
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProject({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.375rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={project.description}
              onChange={(e) => updateProject({ description: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '0.375rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                resize: 'none'
              }}
            />
          </div>

          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem' }}>Preprocessors</h5>
            {Object.entries(project.settings.preprocessors).map(([key, enabled]) => (
              <label key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateProject({
                    settings: {
                      ...project.settings,
                      preprocessors: {
                        ...project.settings.preprocessors,
                        [key]: e.target.checked
                      }
                    }
                  })}
                />
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* File Tree */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0.5rem'
      }}>
        {filteredFiles.map(file => renderFile(file))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={closeContextMenu}
          />
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 11,
              minWidth: '150px'
            }}
          >
            <button
              onClick={() => {
                setRenamingFile(contextMenu.file.id);
                setNewFileName(contextMenu.file.name);
                closeContextMenu();
              }}
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <Edit3 size={14} />
              Rename
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.file.content || '');
                closeContextMenu();
              }}
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <Copy size={14} />
              Copy Content
            </button>
            <button
              onClick={() => {
                deleteFile(contextMenu.file.id);
                closeContextMenu();
              }}
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--color-danger)'
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".html,.css,.js,.ts,.jsx,.tsx,.json,.md,.txt"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProjectManager;