import { Link, useLocation } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/20 transition-shadow group-hover:shadow-cyan-500/40">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              Intent<span className="text-cyan-400">2</span>Software
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Projects
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className={`p-2 rounded-lg transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
