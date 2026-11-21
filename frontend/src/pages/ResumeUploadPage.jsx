import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, Shield } from 'lucide-react';
import { apiClient } from '../lib/api.js';

export function ResumeUploadPage({ onUploadSuccess, onCancel }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: idle, 1: uploading, 2: parsing, 3: structuring, 4: complete
  const [error, setError] = useState(null);

  const steps = ['Uploading file', 'Validating magic bytes', 'Extracting resume text', 'Structuring profile & skills'];

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
      // Simulate progress steps for smooth UX
      setTimeout(() => setCurrentStep(2), 500);
      setTimeout(() => setCurrentStep(3), 1200);

      const data = await apiClient('/resumes', {
        method: 'POST',
        headers: {}, // FormData sets multipart boundaries automatically
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
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Your Resume</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your latest resume in PDF or DOCX format. We will extract your projects and skills so you can verify them before running job matches.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Upload Failed</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileInput}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {file ? file.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            PDF or DOCX files up to 10 MB
          </p>

          {file ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for validation ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <span className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm">
              Browse File
            </span>
          )}
        </div>
      </div>

      {/* Step Tracker during upload */}
      {uploading && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Processing Resume...</span>
            </span>
            <span className="text-xs text-primary font-mono">{Math.min(100, currentStep * 25)}%</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {steps.map((st, idx) => {
              const done = currentStep > idx;
              const active = currentStep === idx + 1;
              return (
                <div key={st} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      done ? 'bg-primary' : active ? 'bg-primary/50 animate-pulse' : 'bg-muted'
                    }`}
                  />
                  <p className="text-[10px] text-muted-foreground truncate">{st}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Files are stored privately in Supabase Storage and can be deleted anytime.</span>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={uploading}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-all"
          >
            <span>Confirm & Upload</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
