import { GeneratedFile } from '@intent-platform/shared';
import { Copy, Check, FileCode } from 'lucide-react';
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
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
            <FileCode className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">Select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#09090b]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-cyan-400 truncate">{file.path}</span>
          {file.purpose && (
            <span className="text-[11px] text-zinc-500 hidden sm:inline truncate">
              — {file.purpose}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all flex-shrink-0 ${
            copied
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <pre className="text-sm font-mono p-4 leading-relaxed">
          <code className="text-zinc-300">{file.content}</code>
        </pre>
      </div>
    </div>
  );
}
