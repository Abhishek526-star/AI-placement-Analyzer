import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/api.js';
import { User, ShieldAlert, Trash2, Save, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export function ProfileSettingsPage({ onSignOut }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', email: user?.email || '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

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
        body: JSON.stringify({ full_name: profile.full_name })
      });
      setProfile((prev) => ({ ...prev, full_name: updated.full_name }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await apiClient('/profile', { method: 'DELETE' });
      setShowDeleteModal(false);
      if (onSignOut) {
        onSignOut();
      } else {
        await signOut();
      }
    } catch (err) {
      alert('Failed to delete account: ' + (err.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Loading account profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Account & Privacy Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal information, security preferences, and GDPR Right to Erasure.
        </p>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Profile Information</h2>
            <p className="text-xs text-muted-foreground">Your candidate identity used across placement analyses.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-muted/40 text-muted-foreground text-sm cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">Managed via Supabase Auth authentication provider.</p>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & RLS Compliance Overview */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <h2 className="text-base font-bold text-foreground">Data Privacy & Row Level Security (RLS)</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your uploaded resumes and parsed profile details are protected by database Row-Level Security (RLS) policies. Only authenticated requests matching your unique UUID can view, query, or match against your documents. No user or recruiter can inspect your records without explicit authorization.
        </p>
        <div className="pt-2 text-[11px] font-mono text-muted-foreground">
          Account ID: {user?.id}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">Danger Zone: Right to Erasure</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Permanently delete your account, uploaded resumes, and all historical analyses.
            </p>
          </div>
        </div>

        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
          Once you delete your account, there is no going back. All uploaded resume files in Supabase Storage, parsed skills, extracted requirements, match analyses, vector embeddings, and cached interview questions will be immediately and irrevocably deleted.
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              setConfirmText('');
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Double Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-300 dark:border-rose-900 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-foreground">Confirm Irrevocable Account Deletion</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action cannot be undone. To confirm permanent deletion of your profile, resumes, vector chunks, and match reports, please type <span className="font-bold font-mono text-rose-600">DELETE</span> below:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 transition-all"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Permanently Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
