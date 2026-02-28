import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface text-slate-200">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<div className="flex items-center justify-center h-screen text-gray-400">Page not found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
