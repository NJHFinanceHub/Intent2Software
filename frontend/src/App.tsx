import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-[#09090b] text-zinc-100">
        {/* Ambient background glow */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          <div className="absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/project/:projectId" element={<ProjectPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
