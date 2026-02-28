import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader, Sparkles, Calendar, ArrowRight, X } from 'lucide-react';
import { projectsApi } from '../api/client';
import { useStore } from '../store';
import { Project } from '@intent-platform/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const { projects, setProjects } = useStore();
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
        description: newProject.description
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Your Projects
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Describe what you want to build. AI generates the code.
          </p>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-accent-glow border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-accent-light" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
            Create your first project and describe what you want to build in plain English.
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-surface-100 border border-border-light rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">New Project</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-surface-300 border border-border-light rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
                  placeholder="My Awesome App"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  What do you want to build?
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-surface-300 border border-border-light rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all resize-none"
                  placeholder="A todo app with user authentication, drag-and-drop reordering, and dark mode..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-5 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-sm font-medium shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
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
        return 'bg-accent/10 text-accent-light border-accent/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group bg-surface-100 border border-border rounded-xl p-5 hover:border-border-light hover:bg-surface-50 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-accent-light transition-colors">
          {project.name}
        </h3>
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${getStatusStyle(project.status)}`}>
          {project.status}
        </span>
      </div>
      <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">{project.description}</p>
      <div className="flex items-center text-[11px] text-slate-500">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
