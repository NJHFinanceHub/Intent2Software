import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Play, Loader, CheckCircle, XCircle, Zap, Package } from 'lucide-react';
import { projectsApi } from '../api/client';
import { useStore } from '../store';
import { WebSocketClient } from '../api/websocket';
import ChatPanel from '../components/ChatPanel';
import ProjectTree from '../components/ProjectTree';
import PreviewPanel from '../components/PreviewPanel';
import { GeneratedFile, WebSocketEvent } from '@intent-platform/shared';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, setCurrentProject, updateProject, isGenerating, setIsGenerating } = useStore();
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!projectId) return;

    loadProject(projectId);

    const client = new WebSocketClient(projectId);
    wsClientRef.current = client;

    client.on(WebSocketEvent.FILE_GENERATED, (data) => {
      // update project files in store
      console.log('File generated:', data);
    });

    client.on(WebSocketEvent.BUILD_COMPLETED, (data) => {
      console.log('Build completed:', data);
      setIsGenerating(false);
    });

    client.on(WebSocketEvent.ERROR, (data) => {
      console.error('WebSocket error:', data);
      setIsGenerating(false);
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [projectId]);

  const loadProject = async (id: string) => {
    try {
      const project = await projectsApi.getById(id);
      setCurrentProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleGenerate = async () => {
    if (!projectId) return;

    try {
      setIsGenerating(true);
      await projectsApi.generate({ projectId, confirmed: true });
    } catch (error) {
      console.error('Failed to generate project:', error);
      setIsGenerating(false);
    }
  };

  const handleBuild = async () => {
    if (!projectId) return;

    try {
      setIsGenerating(true);
      await projectsApi.build(projectId);
    } catch (error) {
      console.error('Failed to build project:', error);
      setIsGenerating(false);
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
    }
  };

  if (!currentProject) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {/* Action Bar */}
      <div className="border-b border-border bg-surface-200/50 backdrop-blur-sm px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">{currentProject.name}</h1>
            <StatusBadge status={currentProject.status} />
            {currentProject.files.length > 0 && (
              <span className="text-xs text-slate-500">
                {currentProject.files.length} files
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentProject.status === 'gathering_requirements' && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-accent/20 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                {isGenerating ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Generate Code
              </button>
            )}

            {currentProject.status === 'ready' && (
              <>
                <button
                  onClick={handleBuild}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Build & Test
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-medium border border-border hover:border-border-light transition-all"
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
        {/* Chat Panel - 30% */}
        <div className="w-[30%] min-w-[300px]">
          <ChatPanel projectId={projectId!} />
        </div>

        {/* Project Tree - 20% */}
        <div className="w-[20%] min-w-[200px]">
          <ProjectTree
            files={currentProject.files}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
          />
        </div>

        {/* Preview Panel - 50% */}
        <div className="flex-1">
          <PreviewPanel file={selectedFile} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'ready':
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'Ready' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', text: 'Failed' };
      case 'generating':
      case 'building':
        return { icon: Loader, color: 'text-accent-light', bg: 'bg-accent/10 border-accent/20', text: status };
      default:
        return { icon: Package, color: 'text-slate-400', bg: 'bg-white/5 border-white/10', text: status.replace(/_/g, ' ') };
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
