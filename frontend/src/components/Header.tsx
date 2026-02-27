import { Link } from 'react-router-dom';
import { Settings, Code2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Code2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Intent-to-Software
            </span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Projects
            </Link>
            <Link
              to="/settings"
              className="text-gray-700 hover:text-gray-900 p-2 rounded-md"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
