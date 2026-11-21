import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AuthModal } from './pages/AuthModal.jsx';

function MainLayout() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">Loading AI Placement Analyzer...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors see the Landing Page by default
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onNavigate={(view) => setCurrentView(view)}
          currentView={currentView}
        />
        <LandingPage onOpenAuth={handleOpenAuth} />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => setCurrentView('dashboard')}
        />
      </div>
    );
  }

  // Authenticated users see the SaaS Layout with Sidebar
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />
      <div className="flex-1 flex">
        <Sidebar currentView={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && <DashboardPage onNavigate={setCurrentView} />}
          {currentView === 'resumes' && (
            <div className="p-8 max-w-4xl mx-auto text-center py-20">
              <h2 className="text-2xl font-bold mb-2">Resume Management</h2>
              <p className="text-muted-foreground text-sm">
                Phase 2 Ingestion pipeline ready for upload and parsing.
              </p>
            </div>
          )}
          {currentView === 'analyze' && (
            <div className="p-8 max-w-4xl mx-auto text-center py-20">
              <h2 className="text-2xl font-bold mb-2">New Match Analysis</h2>
              <p className="text-muted-foreground text-sm">
                Paste your target Job Description to compare against your verified resume.
              </p>
            </div>
          )}
          {currentView === 'history' && (
            <div className="p-8 max-w-4xl mx-auto text-center py-20">
              <h2 className="text-2xl font-bold mb-2">Analysis History</h2>
              <p className="text-muted-foreground text-sm">
                Revisit, compare, and manage your past placement gap analyses.
              </p>
            </div>
          )}
          {currentView === 'settings' && (
            <div className="p-8 max-w-4xl mx-auto text-center py-20">
              <h2 className="text-2xl font-bold mb-2">Account & Settings</h2>
              <p className="text-muted-foreground text-sm">
                Manage profile, privacy disclosures, and account erasure controls.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
