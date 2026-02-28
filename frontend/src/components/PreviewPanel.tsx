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
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-border flex items-center justify-center mx-auto mb-3">
            <FileCode className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-sm text-slate-500">Select a file to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-200/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-accent-light truncate">{file.path}</span>
          {file.purpose && (
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
              — {file.purpose}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all flex-shrink-0 ${
            copied
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-white/5 text-slate-400 border border-border hover:bg-white/10 hover:text-white'
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
          <code className="text-slate-300">{file.content}</code>
        </pre>
      </div>
    </div>
  );
}
