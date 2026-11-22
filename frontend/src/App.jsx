import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { AuthModal } from './pages/AuthModal.jsx';
import { ResumeUploadPage } from './pages/ResumeUploadPage.jsx';
import { ResumeReviewPage } from './pages/ResumeReviewPage.jsx';
import { JobDescriptionInputPage } from './pages/JobDescriptionInputPage.jsx';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage.jsx';
import { AnalysisHistoryPage } from './pages/AnalysisHistoryPage.jsx';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage.jsx';
import { apiClient } from './lib/api.js';

function MainLayout() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [activeJdId, setActiveJdId] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleUploadSuccess = (resumeId) => {
    setActiveResumeId(resumeId);
    setCurrentView('resume-review');
  };

  const handleConfirmProfileSuccess = (resumeId) => {
    setActiveResumeId(resumeId);
    setCurrentView('analyze');
  };

  const handleJdCreated = async (jdId) => {
    setActiveJdId(jdId);
    
    // If no resume uploaded yet, prompt to upload
    if (!activeResumeId) {
      toast.warning('Please upload and verify your resume first before matching against this job description.', 'Resume Required');
      setCurrentView('resumes');
      return;
    }

    try {
      // Trigger deterministic match analysis
      const analysisData = await apiClient('/analyses', {
        method: 'POST',
        body: JSON.stringify({
          resume_id: activeResumeId,
          job_description_id: jdId
        })
      });

      setCurrentAnalysis(analysisData);
      setCurrentView('results');
    } catch (err) {
      toast.error(err.message || 'Failed to calculate match score', 'Analysis Failed');
    }
  };

  const handleOpenAnalysis = async (analysisId) => {
    try {
      const data = await apiClient(`/analyses/${analysisId}`);
      setCurrentAnalysis(data);
      setCurrentView('results');
    } catch (err) {
      toast.error(err.message || 'Unknown error', 'Failed to Load Analysis');
    }
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

  // Unauthenticated visitors see the Landing Page
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
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentView}
              onOpenAnalysis={handleOpenAnalysis}
            />
          )}
          
          {currentView === 'resumes' && (
            <ResumeUploadPage
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'resume-review' && activeResumeId && (
            <ResumeReviewPage
              resumeId={activeResumeId}
              onConfirmSuccess={handleConfirmProfileSuccess}
              onBack={() => setCurrentView('resumes')}
            />
          )}

          {currentView === 'analyze' && (
            <JobDescriptionInputPage
              onJdCreated={handleJdCreated}
              onBack={() => setCurrentView('dashboard')}
            />
          )}

          {currentView === 'results' && currentAnalysis && (
            <AnalysisResultsPage
              analysis={currentAnalysis}
              onNewAnalysis={() => setCurrentView('analyze')}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'history' && (
            <AnalysisHistoryPage
              onOpenAnalysis={handleOpenAnalysis}
              onNewAnalysis={() => setCurrentView('analyze')}
            />
          )}

          {currentView === 'settings' && (
            <ProfileSettingsPage
              onSignOut={() => setCurrentView('dashboard')}
            />
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
        <ToastProvider>
          <MainLayout />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
