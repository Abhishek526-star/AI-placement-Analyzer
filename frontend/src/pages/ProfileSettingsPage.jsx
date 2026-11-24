import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/api.js';
import {
  User, ShieldAlert, Trash2, Save, CheckCircle2, AlertTriangle,
  ShieldCheck, Key, Mail, Copy, Check, Lock, Shield, Sparkles,
  Calendar, Fingerprint, Database, GraduationCap, BookOpen, Building
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import { SkeletonCardGrid } from '../components/ui/Skeletons.jsx';

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'CP';
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Active Candidate';
  try {
    const d = new Date(dateString);
    return `Candidate since ${d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Active Candidate';
  }
}

export function ProfileSettingsPage({ onSignOut }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    full_name: '',
    email: user?.email || '',
    course: '',
    branch: '',
    year: '',
    college: '',
    created_at: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [copiedUuid, setCopiedUuid] = useState(false);

  // Danger Zone Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient('/profile')
      .then((data) => {
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            email: data.email || user?.email || '',
            course: data.course || '',
            branch: data.branch || '',
            year: data.year || '',
            college: data.college || '',
            created_at: data.created_at
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load profile from DB, using auth context info:', err);
        setProfile({
          full_name: '',
          email: user?.email || '',
          course: '',
          branch: '',
          year: '',
          college: '',
          created_at: new Date().toISOString()
        });
        setLoading(false);
      });
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await apiClient('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: profile.full_name,
          course: profile.course,
          branch: profile.branch,
          year: profile.year,
          college: profile.college
        })
      });
      setProfile((prev) => ({
        ...prev,
        full_name: updated.full_name !== undefined ? updated.full_name : prev.full_name,
        course: updated.course !== undefined ? updated.course : prev.course,
        branch: updated.branch !== undefined ? updated.branch : prev.branch,
        year: updated.year !== undefined ? updated.year : prev.year,
        college: updated.college !== undefined ? updated.college : prev.college
      }));
      setSaveSuccess(true);
      toast.success('Candidate profile and academic background updated!', 'Profile Saved');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile', 'Update Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUuid = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUuid(true);
      toast.info('Account UUID copied to clipboard', 'Copied');
      setTimeout(() => setCopiedUuid(false), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await apiClient('/profile', { method: 'DELETE' });
      setShowDeleteModal(false);
      toast.success('Your account and all associated data have been permanently erased.', 'Account Deleted');
      if (onSignOut) {
        onSignOut();
      } else {
        await signOut();
      }
    } catch (err) {
      toast.error(err.message || 'Unknown error', 'Failed to Delete Account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <SkeletonCardGrid count={3} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Account & Security Cockpit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Verified Candidate
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              GDPR Article 17
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage candidate credentials, academic background, data governance policies, and cryptographic tenant isolation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-mono text-muted-foreground self-start sm:self-auto">
          <Fingerprint className="w-3.5 h-3.5 text-primary" />
          <span className="truncate max-w-[200px] sm:max-w-none">{user?.email || 'Authenticated Session'}</span>
        </div>
      </div>

      {/* Main 12-Column Grid: Profile Identity (7 cols) + Security & RLS (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Profile Identity & Candidate Credentials */}
        <div className="lg:col-span-7 bento-card p-6 sm:p-7 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Candidate Identity Header with Avatar Squircle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-500/20 to-purple-500/20 border border-primary/30 text-primary flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-primary/10 shrink-0">
                  {getInitials(profile.full_name, profile.email)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-base text-foreground">
                      {profile.full_name || 'Candidate Profile'}
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="text-slate-300">{profile.email}</span>
                    <span className="text-white/20">•</span>
                    <span>{formatMemberSince(profile.created_at)}</span>
                  </div>

                  {/* Dynamic Academic Summary Chips */}
                  {(profile.course || profile.branch || profile.college || profile.year) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {(profile.course || profile.branch) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/25">
                          <GraduationCap className="w-3 h-3" />
                          <span>{[profile.course, profile.branch].filter(Boolean).join(' • ')}</span>
                        </span>
                      )}
                      {profile.year && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{profile.year}</span>
                        </span>
                      )}
                      {profile.college && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-300 bg-white/5 border border-white/10 truncate max-w-[200px]">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{profile.college}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300 self-start sm:self-auto">
                Deterministic Identity
              </span>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Candidate identity saved successfully!</span>
              </div>
            )}

            {/* Profile Form */}
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-5">
              {/* Primary Identity Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Full Name</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">Editable</span>
                  </div>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Primary Email</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Locked</span>
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground/60 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/5 bg-white/[0.015] text-muted-foreground text-sm font-mono-numbers cursor-not-allowed select-all"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Background Section Divider */}
              <div className="pt-2 border-t border-border/40">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <h3 className="font-display font-bold text-xs text-foreground tracking-tight">
                      Academic & Placement Background
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-semibold">
                    Optional
                  </span>
                </div>

                {/* 2x2 Grid for Academic Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Course */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Course / Degree</span>
                    </label>
                    <div className="relative flex items-center">
                      <GraduationCap className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.course}
                        onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                        placeholder="e.g. B.Tech / MCA / B.Sc"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                      />
                    </div>
                  </div>

                  {/* Branch */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Branch / Major</span>
                    </label>
                    <div className="relative flex items-center">
                      <BookOpen className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.branch}
                        onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                        placeholder="e.g. Computer Science, AI/ML"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                      />
                    </div>
                  </div>

                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Year / Batch</span>
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.year}
                        onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                        placeholder="e.g. 4th Year / 2026 Batch"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                      />
                    </div>
                  </div>

                  {/* College */}
                  <div className="space-y-1.5">
                    <label className="font-display text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      <span>College / Institution</span>
                    </label>
                    <div className="relative flex items-center">
                      <Building className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.college}
                        onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                        placeholder="e.g. National Institute of Technology"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.03] text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-white/[0.06] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Academic details calibrate placement benchmarks.
            </span>
            <ColorfulButton
              type="submit"
              form="profile-form"
              variant="emerald"
              size="md"
              icon={Save}
              loading={saving}
              loadingText="Saving Changes..."
            >
              Save Profile Changes
            </ColorfulButton>
          </div>
        </div>

        {/* Right 5 Cols: Security & Row Level Security (RLS) Telemetry */}
        <div className="lg:col-span-5 bento-card p-6 sm:p-7 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/10">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm text-foreground">
                    Data Privacy & RLS
                  </h2>
                  <p className="text-[11px] text-muted-foreground">Multi-tenant cryptographic security</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Enforced
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your resumes, extracted skills, and vector embeddings are shielded by database Row-Level Security (RLS) policies. Only your authenticated user UUID can access or match against your documents.
            </p>

            {/* 3 High-Assurance Security Feature Chips */}
            <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
              <div className="p-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Row-Level Tenant Isolation</span>
                    <span className="text-[10px] font-mono text-emerald-400">PostgreSQL</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Zero cross-tenant visibility. Queries are bound strictly to your session UID.
                  </p>
                </div>
              </div>

              <div className="p-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <Database className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Isolated pgvector Storage</span>
                    <span className="text-[10px] font-mono text-indigo-400">1536-D Chunks</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Resumes are tokenized into encrypted vector embeddings scoped only to you.
                  </p>
                </div>
              </div>

              <div className="p-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Anti-Leakage Guarantee</span>
                    <span className="text-[10px] font-mono text-cyan-400">Private Vault</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    No recruiter, third-party parser, or external crawler can access your records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account UUID Copy Card */}
          <div className="pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-primary" />
                  <span>Account UUID:</span>
                </span>
                <span className="text-[10px] text-slate-500">Supabase Auth ID</span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="font-mono text-xs text-slate-300 truncate select-all">
                  {user?.id || '—'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUuid}
                  title="Copy UUID"
                  className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all shrink-0"
                >
                  {copiedUuid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 12 Cols: Danger Zone — GDPR Right to Erasure */}
        <div className="col-span-12 bento-card p-6 sm:p-7 rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.05] via-transparent to-transparent space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-500/15">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-base text-rose-400">
                    Danger Zone: Right to Erasure
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    GDPR Article 17
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently purge candidate credentials, documents, vector embeddings, and match records.
                </p>
              </div>
            </div>

            <ColorfulButton
              variant="coral"
              size="md"
              icon={Trash2}
              onClick={() => {
                setConfirmText('');
                setShowDeleteModal(true);
              }}
              className="self-start sm:self-auto"
            >
              Delete My Account
            </ColorfulButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-black/20 border border-rose-500/10 space-y-1">
              <div className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Resume Documents</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                All uploaded PDF files in encrypted bucket storage and raw extracted text are destroyed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-rose-500/10 space-y-1">
              <div className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Vector Embeddings</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                1536-D pgvector semantic embeddings and cosine index records are immediately wiped.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/20 border border-rose-500/10 space-y-1">
              <div className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Match History & Roadmaps</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                All deterministic score breakdowns, interview prep plans, and skill gap roadmaps are purged.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Irrevocable Account Deletion Double Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bento-card p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 border border-rose-500/40 bg-card/95">
            <div className="flex items-center gap-3.5 text-rose-400 pb-3 border-b border-rose-500/20">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  Confirm Irrevocable Account Deletion
                </h3>
                <p className="text-xs text-rose-400/80 font-mono">
                  GDPR Article 17 Purge Process
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action <span className="text-rose-400 font-semibold">cannot be undone</span>. To permanently erase your candidate profile, uploaded resumes, 1536-D vector embeddings, and all historical match telemetry, please type <span className="font-bold font-mono text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">DELETE</span> below:
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted-foreground">Verification Confirmation</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-4 py-2.5 rounded-2xl border border-rose-500/40 bg-black/40 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <ColorfulButton
                variant="glass"
                size="sm"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </ColorfulButton>

              <ColorfulButton
                variant="coral"
                size="sm"
                icon={Trash2}
                disabled={confirmText !== 'DELETE'}
                loading={deleting}
                loadingText="Purging Data..."
                onClick={handleDeleteAccount}
              >
                Permanently Erase Everything
              </ColorfulButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
