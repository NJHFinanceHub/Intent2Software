import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { GeneratedFile } from '@intent-platform/shared';

interface ProjectTreeProps {
  files: GeneratedFile[];
  onFileSelect: (file: GeneratedFile) => void;
  selectedFile: GeneratedFile | null;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  file?: GeneratedFile;
}

export default function ProjectTree({ files, onFileSelect, selectedFile }: ProjectTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));

  // Build tree structure from flat file list
  const buildTree = (): FileNode => {
    const root: FileNode = {
      name: 'root',
      path: '/',
      type: 'directory',
      children: []
    };

    files.forEach((file) => {
      const parts = file.path.split('/').filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const path = '/' + parts.slice(0, index + 1).join('/');

        let child = current.children?.find((c) => c.name === part);

        if (!child) {
          child = {
            name: part,
            path,
            type: isFile ? 'file' : 'directory',
            children: isFile ? undefined : [],
            file: isFile ? file : undefined
          };
          current.children?.push(child);
        }

        if (!isFile) {
          current = child;
        }
      });
    });

    return root;
  };

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileColor = (name: string) => {
    if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'text-blue-400';
    if (name.endsWith('.js') || name.endsWith('.jsx')) return 'text-yellow-400';
    if (name.endsWith('.css') || name.endsWith('.scss')) return 'text-pink-400';
    if (name.endsWith('.json')) return 'text-green-400';
    if (name.endsWith('.md')) return 'text-slate-300';
    if (name === 'Dockerfile' || name === '.gitignore') return 'text-orange-400';
    return 'text-slate-400';
  };

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile?.path === node.file?.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 cursor-pointer rounded-md mx-1 transition-colors"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleDir(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
            <Folder className="w-3.5 h-3.5 text-accent-light/70" />
            <span className="text-xs text-slate-300 font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded-md mx-1 transition-colors ${
          isSelected ? 'bg-accent/10 border-l-2 border-accent' : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${level * 12 + 20}px` }}
        onClick={() => node.file && onFileSelect(node.file)}
      >
        <File className={`w-3.5 h-3.5 ${getFileColor(node.name)}`} />
        <span className={`text-xs ${isSelected ? 'text-accent-light font-medium' : 'text-slate-400'}`}>
          {node.name}
        </span>
      </div>
    );
  };

  const tree = useMemo(() => buildTree(), [files]);

  return (
    <div className="h-full overflow-y-auto bg-surface-200 border-r border-border">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Files</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{files.length} files</p>
      </div>
      <div className="py-2">
        {files.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8 px-4">
            No files generated yet. Chat with the AI to describe your project, then click Generate.
          </p>
        ) : (
          tree.children && tree.children.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}
