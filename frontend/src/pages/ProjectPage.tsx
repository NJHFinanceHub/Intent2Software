import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Play, Loader, CheckCircle, XCircle } from 'lucide-react';
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
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
      setupWebSocket();
    }

    return () => {
      wsClient?.disconnect();
    };
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const project = await projectsApi.getById(projectId);
      setCurrentProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const setupWebSocket = () => {
    if (!projectId) return;

    const client = new WebSocketClient(projectId);
    client.connect();

    client.on(WebSocketEvent.PROJECT_STATUS_CHANGED, (data) => {
      if (projectId) {
        updateProject(projectId, { status: data.status });
      }
    });

    client.on(WebSocketEvent.FILE_GENERATED, (data) => {
      console.log('File generated:', data.file.path);
    });

    client.on(WebSocketEvent.BUILD_COMPLETED, (data) => {
      console.log('Build completed:', data);
      setIsGenerating(false);
    });

    setWsClient(client);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentProject.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <StatusBadge status={currentProject.status} />
              {currentProject.files.length > 0 && (
                <span className="text-sm text-gray-600">
                  {currentProject.files.length} files
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentProject.status === 'gathering_requirements' && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Generate Code</span>
              </button>
            )}

            {currentProject.status === 'ready' && (
              <>
                <button
                  onClick={handleBuild}
                  disabled={isGenerating}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>Build & Test</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
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
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Ready' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Failed' };
      case 'generating':
      case 'building':
        return { icon: Loader, color: 'text-blue-600', bg: 'bg-blue-50', text: status };
      default:
        return { icon: Loader, color: 'text-gray-600', bg: 'bg-gray-50', text: status };
    }
  };

  const { icon: Icon, color, bg, text } = getStatusInfo();

  return (
    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-4 h-4 ${color} ${status.includes('ing') ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${color} capitalize`}>{text}</span>
    </div>
  );
}
