import { Link, useLocation } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-200/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-white tracking-tight">
              Intent<span className="text-accent-light">2</span>Software
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-white bg-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Projects
            </Link>
            <Link
              to="/settings"
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === '/settings'
                  ? 'text-white bg-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
