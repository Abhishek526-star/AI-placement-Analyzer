import React, { useState } from 'react';
import { Target, Sparkles, AlertCircle, ArrowRight, Clipboard, CheckCircle2, Loader2, Building, MapPin, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { apiClient } from '../lib/api.js';
import { POPULAR_JOB_CATEGORIES } from '../constants/jobRoles.js';
import { JobTitleSelect } from '../components/JobTitleSelect.jsx';
import { ExperienceLevelSelect } from '../components/ExperienceLevelSelect.jsx';
import { CompanySelect } from '../components/CompanySelect.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';

export function JobDescriptionInputPage({ onJdCreated, onBack }) {
  const defaultRole = POPULAR_JOB_CATEGORIES[0]?.roles[0]?.title || 'Full Stack Developer (MERN)';
  
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [customTitle, setCustomTitle] = useState('');
  const [title, setTitle] = useState(defaultRole);
  const [selectedCompany, setSelectedCompany] = useState('Google');
  const [customCompany, setCustomCompany] = useState('');
  const [company, setCompany] = useState('Google');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level (0-2 years)');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [error, setError] = useState(null);
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const pipelineStages = [
    { title: 'Chunking & Tokenizing', desc: 'Parsing job requirements into semantic vectors' },
    { title: 'Taxonomy Normalization', desc: 'Mapping alias terms to canonical technology skills' },
    { title: 'Deterministic Matrix (FR-08)', desc: 'Calculating exact weighted Cosine & TF-IDF math' },
    { title: 'Verifier Audit (FR-12)', desc: 'Stripping unsupported claims & cross-verifying citations' }
  ];

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    if (newRole === 'custom') {
      setTitle(customTitle);
    } else {
      setTitle(newRole);
      for (const cat of POPULAR_JOB_CATEGORIES) {
        const found = cat.roles.find((r) => r.title === newRole);
        if (found && found.experience) {
          setExperienceLevel(found.experience);
          break;
        }
      }
    }
  };

  const handleCompanyChange = (newCompany) => {
    setSelectedCompany(newCompany);
    if (newCompany === 'custom') {
      setCompany(customCompany);
    } else {
      setCompany(newCompany);
    }
  };

  const handleLoadSampleJd = () => {
    for (const cat of POPULAR_JOB_CATEGORIES) {
      const found = cat.roles.find((r) => r.title === selectedRole);
      if (found && found.sampleJd) {
        setDescription(found.sampleJd);
        setSelectedCompany('TechCorp Solutions');
        setCompany('TechCorp Solutions');
        if (found.experience) {
          setExperienceLevel(found.experience);
        }
        setSampleLoaded(true);
        setTimeout(() => setSampleLoaded(false), 2500);
        break;
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDescription(text);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const effectiveTitle = selectedRole === 'custom' ? customTitle.trim() : title.trim();
    const effectiveCompany = selectedCompany === 'custom' ? customCompany.trim() : (company || '').trim();

    if (!effectiveTitle) {
      setError('Please provide a valid Job Title.');
      return;
    }

    if (description.trim().length < 50) {
      setError('Job description must be at least 50 characters long.');
      return;
    }

    setLoading(true);
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 600);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1400);
    const stepTimer3 = setTimeout(() => setAnalysisStep(4), 2200);

    try {
      const data = await apiClient('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: effectiveTitle,
          company: effectiveCompany,
          experience_level: experienceLevel,
          location: location.trim(),
          description
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setLoading(false);
      onJdCreated(data.id, data);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setError(err.message || 'Failed to parse and save job description.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Target Job Description
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              PRD FR-08 Grounded Matrix
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Select or customize a target role and paste the job description to run real-time deterministic match telemetry.
          </p>
        </div>

        {onBack && (
          <ColorfulButton variant="glass" size="md" onClick={onBack}>
            Back to Dashboard
          </ColorfulButton>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <span className="font-display font-bold block text-sm">Submission Error</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Multi-Step Analysis Pipeline Loading Banner */}
      {loading && (
        <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="font-display font-bold text-foreground text-sm">
                Executing Placement Intelligence Analysis Pipeline...
              </span>
            </div>
            <span className="text-xs font-mono-numbers font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {Math.min(100, analysisStep * 25)}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-card/80 border border-border/50 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500 rounded-full animate-ribbon-progress"
              style={{ width: `${Math.min(100, analysisStep * 25)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {pipelineStages.map((st, idx) => {
              const num = idx + 1;
              const isDone = analysisStep > num;
              const isActive = analysisStep === num;

              return (
                <div
                  key={st.title}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isActive
                      ? 'bg-primary/15 border-primary shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                      : 'bg-card/40 border-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-numbers text-[10px] uppercase font-bold text-muted-foreground">
                      Phase 0{num}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted"></span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-xs text-foreground truncate">{st.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Form Bento Card */}
      <form onSubmit={handleSubmit} className="bento-card p-6 sm:p-8 rounded-3xl space-y-6">
        {/* Role & Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <JobTitleSelect
              selectedRole={selectedRole}
              onRoleChange={handleRoleChange}
              customTitle={customTitle}
              onCustomTitleChange={(val) => {
                setCustomTitle(val);
                setTitle(val);
              }}
              onLoadSampleJd={handleLoadSampleJd}
              sampleLoaded={sampleLoaded}
            />
          </div>

          <div>
            <CompanySelect
              value={selectedCompany}
              onChange={handleCompanyChange}
              customCompany={customCompany}
              onCustomCompanyChange={(val) => {
                setCustomCompany(val);
                setCompany(val);
              }}
            />
          </div>

          <div>
            <ExperienceLevelSelect
              value={experienceLevel}
              onChange={setExperienceLevel}
            />
          </div>
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Paste Target Job Description</span>
              <span className="text-rose-400">*</span>
            </label>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full ${
                description.length >= 50
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {description.length} chars (min 50)
              </span>

              {selectedRole !== 'custom' && (
                <ColorfulButton
                  variant="amber"
                  size="sm"
                  icon={FileText}
                  onClick={handleLoadSampleJd}
                >
                  {sampleLoaded ? 'Loaded!' : 'Use Sample JD'}
                </ColorfulButton>
              )}

              <ColorfulButton
                variant="violet"
                size="sm"
                icon={Clipboard}
                onClick={handlePasteClipboard}
              >
                Paste
              </ColorfulButton>
            </div>
          </div>

          <textarea
            required
            rows={12}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the complete job description text including responsibilities, required skills, and preferred qualifications..."
            className="w-full p-4 text-xs font-mono-numbers leading-relaxed rounded-2xl border border-border bg-card/70 text-foreground focus:outline-none focus:border-primary/60 transition-all resize-y"
          />
        </div>

        {/* Action Button Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Extracted requirements will be matched deterministically against your candidate profile.
          </p>

          <ColorfulButton
            type="submit"
            variant="prism"
            size="lg"
            icon={Sparkles}
            loading={loading}
            loadingText="Extracting & Matching..."
            disabled={loading || description.trim().length < 50 || !(selectedRole === 'custom' ? customTitle.trim() : title.trim())}
          >
            Extract Requirements & Match
          </ColorfulButton>
        </div>
      </form>
    </div>
  );
}
