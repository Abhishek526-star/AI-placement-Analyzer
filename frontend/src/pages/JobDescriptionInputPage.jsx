import React, { useState } from 'react';
import { Target, Sparkles, AlertCircle, ArrowRight, Clipboard, CheckCircle2, Loader2, Building, MapPin, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { apiClient } from '../lib/api.js';
import { POPULAR_JOB_CATEGORIES } from '../constants/jobRoles.js';
import { JobTitleSelect } from '../components/JobTitleSelect.jsx';
import { ExperienceLevelSelect } from '../components/ExperienceLevelSelect.jsx';

export function JobDescriptionInputPage({ onJdCreated, onBack }) {
  // Default to first popular role
  const defaultRole = POPULAR_JOB_CATEGORIES[0]?.roles[0]?.title || 'Full Stack Developer (MERN)';
  
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [customTitle, setCustomTitle] = useState('');
  const [title, setTitle] = useState(defaultRole);
  const [company, setCompany] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level (0-2 years)');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    if (newRole === 'custom') {
      setTitle(customTitle);
    } else {
      setTitle(newRole);
      // Auto-update recommended experience level for the role
      for (const cat of POPULAR_JOB_CATEGORIES) {
        const found = cat.roles.find((r) => r.title === newRole);
        if (found && found.experience) {
          setExperienceLevel(found.experience);
          break;
        }
      }
    }
  };

  const handleLoadSampleJd = () => {
    for (const cat of POPULAR_JOB_CATEGORIES) {
      const found = cat.roles.find((r) => r.title === selectedRole);
      if (found && found.sampleJd) {
        setDescription(found.sampleJd);
        if (!company.trim()) {
          setCompany('TechCorp Solutions');
        }
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

    if (!effectiveTitle) {
      setError('Please provide a valid Job Title.');
      return;
    }

    if (description.trim().length < 50) {
      setError('Job description must be at least 50 characters long.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: effectiveTitle,
          company: company.trim(),
          experience_level: experienceLevel,
          location: location.trim(),
          description
        })
      });

      setLoading(false);
      onJdCreated(data.id, data);
    } catch (err) {
      setError(err.message || 'Failed to parse and save job description.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Target Job Description</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select or customize a target job title and paste the job description to match against your resume.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Back
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Submission Error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Metadata Inputs */}
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
            <label className="block text-xs font-semibold text-foreground mb-1">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Amazon, Startup"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <ExperienceLevelSelect
              value={experienceLevel}
              onChange={setExperienceLevel}
            />
          </div>
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Paste Full Job Description <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${description.length >= 50 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {description.length} chars (min 50)
              </span>
              {selectedRole !== 'custom' && (
                <button
                  type="button"
                  onClick={handleLoadSampleJd}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{sampleLoaded ? 'Loaded!' : 'Use Sample JD'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste from clipboard</span>
              </button>
            </div>
          </div>

          <textarea
            required
            rows={12}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the complete job description text including responsibilities, required skills, and preferred qualifications..."
            className="w-full p-4 text-sm font-mono leading-relaxed rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Extracted requirements will be matched deterministically against your resume.
          </p>

          <button
            type="submit"
            disabled={loading || description.trim().length < 50 || !(selectedRole === 'custom' ? customTitle.trim() : title.trim())}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Extract Requirements & Match</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
