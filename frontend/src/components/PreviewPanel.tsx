import { GeneratedFile } from '@intent-platform/shared';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface PreviewPanelProps {
  file: GeneratedFile | null;
}

export default function PreviewPanel({ file }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (file) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{file.path}</h3>
          <p className="text-xs text-gray-500 mt-1">{file.purpose}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
          <code className="language-{file.language}">{file.content}</code>
        </pre>
      </div>
    </div>
  );
}
