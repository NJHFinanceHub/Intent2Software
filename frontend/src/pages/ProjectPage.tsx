import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Play, Loader, CheckCircle, XCircle, Package, X, Zap } from 'lucide-react';
import { projectsApi } from '../api/client';
import { useStore } from '../store';
import ChatPanel from '../components/ChatPanel';
import ProjectTree from '../components/ProjectTree';
import PreviewPanel from '../components/PreviewPanel';
import { GeneratedFile } from '@intent-platform/shared';

type Toast = { type: 'success' | 'error' | 'info'; message: string } | null;

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, setCurrentProject, isGenerating, setIsGenerating } = useStore();
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [buildAction, setBuildAction] = useState<'generate' | 'build' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiles = currentProject && currentProject.files.length > 0;

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type: type!, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadProject = useCallback(async (id: string) => {
    try {
      const project = await projectsApi.getById(id);
      setCurrentProject(project);
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }, [setCurrentProject]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: string, action: 'generate' | 'build') => {
    stopPolling();
    setBuildAction(action);
    pollRef.current = setInterval(async () => {
      const project = await loadProject(id);
      if (project && !['generating', 'planning', 'building', 'testing'].includes(project.status)) {
        stopPolling();
        setIsGenerating(false);
        setBuildAction(null);

        if (project.status === 'ready') {
          if (action === 'generate') {
            showToast('success', `Generated ${project.files.length} files successfully!`);
          } else {
            showToast('success', 'Build completed successfully!');
          }
        } else if (project.status === 'failed') {
          showToast('error', `${action === 'generate' ? 'Generation' : 'Build'} failed. Check the logs.`);
        }
      }
    }, 2000);
  }, [loadProject, stopPolling, setIsGenerating]);

  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId);
    return () => stopPolling();
  }, [projectId, loadProject, stopPolling]);

  const handleGenerate = async () => {
    if (!projectId) return;

    try {
      setIsGenerating(true);
      showToast('info', 'Generating project files...');
      await projectsApi.generate({ projectId, confirmed: true });
      startPolling(projectId, 'generate');
    } catch (error) {
      console.error('Failed to generate project:', error);
      setIsGenerating(false);
      showToast('error', 'Failed to start generation.');
    }
  };

  const handleBuild = async () => {
    if (!projectId) return;

    try {
      setIsGenerating(true);
      showToast('info', 'Building project — installing deps & compiling...');
      await projectsApi.build(projectId);
      startPolling(projectId, 'build');
    } catch (error) {
      console.error('Failed to build project:', error);
      setIsGenerating(false);
      showToast('error', 'Failed to start build.');
    }
  };

  const handleDownload = async () => {
    if (!projectId) return;

    try {
      const blob = await projectsApi.download(projectId, 'zip');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.name || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download project:', error);
      showToast('error', 'Download failed.');
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-200' :
          toast.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-200' :
          'bg-zinc-900/90 border-cyan-500/30 text-cyan-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.type === 'info' && <Loader className="w-4 h-4 flex-shrink-0 animate-spin" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">{currentProject.name}</h1>
            <StatusBadge status={currentProject.status} />
            {hasFiles && (
              <span className="text-xs text-zinc-500">
                {currentProject.files.length} files
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="flex items-center gap-2 text-cyan-300 text-xs">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                {buildAction === 'build' ? 'Building...' : 'Generating...'}
              </div>
            )}

            {currentProject.status === 'ready' && !isGenerating && (
              <>
                <button
                  onClick={handleBuild}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Build & Test
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className={hasFiles ? 'w-[30%] min-w-[300px] border-r border-zinc-800' : 'w-full max-w-3xl mx-auto'}>
          <ChatPanel projectId={projectId!} onGenerate={handleGenerate} />
        </div>

        {/* File Tree + Preview */}
        {hasFiles && (
          <>
            <div className="w-[20%] min-w-[200px]">
              <ProjectTree
                files={currentProject.files}
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
              />
            </div>
            <div className="flex-1">
              <PreviewPanel file={selectedFile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'ready':
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'Ready' };
      case 'generating':
      case 'building':
        return { icon: Loader, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', text: status };
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', text: 'Failed' };
      default:
        return { icon: Package, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', text: status.replace(/_/g, ' ') };
    }
  };

  const { icon: Icon, color, bg, text } = getStatusInfo();

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${bg}`}>
      <Icon className={`w-3 h-3 ${color} ${status.includes('ing') ? 'animate-spin' : ''}`} />
      <span className={`text-[11px] font-medium ${color} capitalize`}>{text}</span>
    </div>
  );
}
