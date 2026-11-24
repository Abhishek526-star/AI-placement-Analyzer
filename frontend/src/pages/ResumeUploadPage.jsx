import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api.js';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import { SkeletonPipeline } from '../components/ui/Skeletons.jsx';

export function ResumeUploadPage({ onUploadSuccess, onCancel }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: idle, 1: uploading, 2: parsing, 3: structuring, 4: complete
  const [error, setError] = useState(null);

  const steps = [
    { name: 'Uploading file', desc: 'Secure transfer to storage' },
    { name: 'Validating magic bytes', desc: 'Sanitizing PDF/DOCX headers' },
    { name: 'Extracting resume text', desc: 'Tokenizing chunks & projects' },
    { name: 'Structuring profile & skills', desc: 'Canonical taxonomy mapping' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const selectFile = (selected) => {
    setError(null);
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Only PDF and DOCX files up to 10 MB are supported.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setCurrentStep(1);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setTimeout(() => setCurrentStep(2), 500);
      setTimeout(() => setCurrentStep(3), 1200);

      const data = await apiClient('/resumes', {
        method: 'POST',
        headers: {},
        body: formData
      });

      setCurrentStep(4);
      setTimeout(() => {
        onUploadSuccess(data.id);
      }, 600);
    } catch (err) {
      setError(err.message || 'Failed to upload and parse resume.');
      setUploading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Upload Your Resume
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Deterministic Parsing
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your latest resume in PDF or DOCX format. We extract projects, verifiable experience, and skills into your candidate profile.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <span className="font-display font-bold block text-sm">Upload Failed</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone Bento Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bento-card relative rounded-3xl p-8 sm:p-14 text-center transition-all overflow-hidden ${
          isDragging
            ? 'border-primary ring-2 ring-primary/40 bg-primary/10'
            : 'hover:border-primary/50'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInput}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-primary/30 text-primary flex items-center justify-center mb-5 shadow-lg shadow-purple-500/10">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
            {file ? file.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Strict magic-byte validated PDF or DOCX files up to 10 MB
          </p>

          {file ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 text-xs font-mono-numbers font-bold border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for parsing ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <ColorfulButton variant="cobalt" size="md" icon={UploadCloud}>
              Browse Resume File
            </ColorfulButton>
          )}
        </div>
      </div>

      {/* Multi-Stage Animated Pipeline Loader */}
      {uploading && (
        <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="font-display font-bold text-foreground text-sm">
                Multi-Stage Parsing & Extraction Pipeline
              </span>
            </div>
            <span className="text-xs font-mono-numbers font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {Math.min(100, currentStep * 25)}% Complete
            </span>
          </div>

          {/* Animated Progress Ribbon */}
          <div className="w-full h-2 rounded-full bg-card/80 border border-border/50 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500 rounded-full animate-ribbon-progress"
              style={{ width: `${Math.min(100, currentStep * 25)}%` }}
            ></div>
          </div>

          {/* 4 Sequential Pipeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {steps.map((st, idx) => {
              const stepNumber = idx + 1;
              const isDone = currentStep > idx;
              const isActive = currentStep === stepNumber;

              return (
                <div
                  key={st.name}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isActive
                      ? 'bg-primary/15 border-primary shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                      : 'bg-card/40 border-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono-numbers text-[10px] uppercase font-bold text-muted-foreground">
                      Step {stepNumber}/4
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted"></span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-xs text-foreground truncate">
                    {st.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="bento-card p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Files are stored privately in encrypted storage and can be deleted anytime.</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onCancel && (
            <ColorfulButton
              variant="glass"
              size="md"
              disabled={uploading}
              onClick={onCancel}
            >
              Cancel
            </ColorfulButton>
          )}

          <ColorfulButton
            variant="prism"
            size="lg"
            icon={ArrowRight}
            loading={uploading}
            loadingText="Processing..."
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            Confirm & Upload
          </ColorfulButton>
        </div>
      </div>
    </div>
  );
}
