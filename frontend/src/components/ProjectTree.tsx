import { useState } from 'react';
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

  const renderNode = (node: FileNode, level: number = 0): JSX.Element => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile?.path === node.file?.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 cursor-pointer"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleDir(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <Folder className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">{node.name}</span>
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
        className={`flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 cursor-pointer ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 20}px` }}
        onClick={() => node.file && onFileSelect(node.file)}
      >
        <File className="w-4 h-4 text-gray-400" />
        <span className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
          {node.name}
        </span>
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Project Files</h3>
        <p className="text-xs text-gray-500 mt-1">{files.length} files</p>
      </div>
      <div className="py-2">
        {tree.children && tree.children.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
