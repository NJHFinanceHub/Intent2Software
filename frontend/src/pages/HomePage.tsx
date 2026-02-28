import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader, Sparkles, Calendar, ArrowRight, X } from 'lucide-react';
import { projectsApi } from '../api/client';
import { useStore } from '../store';
import { Project } from '@intent-platform/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, setProjects, aiConfig } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsList = await projectsApi.list();
      setProjects(projectsList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await projectsApi.create({
        name: newProject.name,
        description: newProject.description,
        aiConfig: aiConfig || undefined
      });

      setShowNewProjectModal(false);
      setNewProject({ name: '', description: '' });
      navigate(`/project/${response.project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-zinc-950">
        <Loader className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Your Projects
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">
              Describe what you want to build. AI generates the code.
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-zinc-400 text-sm mb-8 max-w-sm mx-auto">
              Create your first project and describe what you want to build in plain English.
            </p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">New Project</h2>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all"
                    placeholder="My Awesome App"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    What do you want to build?
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all resize-none"
                    placeholder="A todo app with user authentication, drag-and-drop reordering, and dark mode..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-xl text-sm shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'generating':
      case 'building':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {project.name}
        </h3>
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${getStatusStyle(project.status)}`}>
          {project.status}
        </span>
      </div>
      <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-2">{project.description}</p>
      <div className="flex items-center text-[11px] text-zinc-500">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
