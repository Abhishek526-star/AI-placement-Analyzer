import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { apiClient } from '../lib/api.js';
import { User, ShieldAlert, Trash2, Save, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, Key } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import { SkeletonCardGrid } from '../components/ui/Skeletons.jsx';

export function ProfileSettingsPage({ onSignOut }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { skeletonSimulator } = useTheme();
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
      toast.success('Profile details saved successfully!', 'Saved');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      toast.error(err.message || 'Failed to update profile', 'Update Failed');
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

  if (loading || skeletonSimulator) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonCardGrid count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Account & Security Cockpit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Verified User
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage your personal information, security preferences, and GDPR Right to Erasure.
          </p>
        </div>
      </div>

      {/* Profile Form Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-border/40">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-foreground">Profile Identity</h2>
            <p className="text-xs text-muted-foreground">Your candidate identity used across placement analyses.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-display text-xs font-semibold text-foreground">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 rounded-2xl border border-border bg-card/70 text-foreground text-sm focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-display text-xs font-semibold text-foreground">Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2.5 rounded-2xl border border-border/50 bg-muted/40 text-muted-foreground text-sm font-mono-numbers cursor-not-allowed"
            />
            <p className="text-[11px] text-muted-foreground">Managed via Supabase Auth authentication provider.</p>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <ColorfulButton
              type="submit"
              variant="emerald"
              size="md"
              icon={Save}
              loading={saving}
              loadingText="Saving..."
            >
              Save Profile Changes
            </ColorfulButton>
          </div>
        </form>
      </div>

      {/* Security & RLS Compliance Overview Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="font-display font-bold text-base text-foreground">
            Data Privacy & Row Level Security (RLS)
          </h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your uploaded resumes and parsed profile details are protected by database Row-Level Security (RLS) policies. Only authenticated requests matching your unique UUID can view, query, or match against your documents. No third party or recruiter can inspect your records without explicit authorization.
        </p>
        <div className="pt-2 text-[11px] font-mono-numbers text-muted-foreground flex items-center gap-2">
          <span>Account UUID:</span>
          <span className="px-2 py-0.5 rounded-lg bg-card/80 border border-border/50 text-foreground">{user?.id}</span>
        </div>
      </div>

      {/* Danger Zone Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl border-rose-500/30 bg-rose-500/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-rose-400">Danger Zone: Right to Erasure</h2>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account, uploaded resumes, vector embeddings, and all historical analyses.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Once you delete your account, there is no going back. All uploaded resume files in encrypted storage, parsed skills, extracted requirements, match analyses, vector embeddings, and cached interview questions will be immediately and irrevocably erased.
        </p>

        <div className="pt-2">
          <ColorfulButton
            variant="coral"
            size="sm"
            icon={Trash2}
            onClick={() => {
              setConfirmText('');
              setShowDeleteModal(true);
            }}
          >
            Delete My Account
          </ColorfulButton>
        </div>
      </div>

      {/* Double Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bento-card p-6 sm:p-7 rounded-3xl shadow-2xl space-y-4 border-rose-500/40">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-bold text-base text-foreground">Confirm Irrevocable Account Deletion</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This action cannot be undone. To confirm permanent deletion of your profile, resumes, vector chunks, and match reports, please type <span className="font-bold font-mono-numbers text-rose-400">DELETE</span> below:
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-2.5 rounded-2xl border border-rose-500/40 bg-background text-foreground text-sm font-mono-numbers focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />

            <div className="flex items-center justify-end gap-3 pt-3">
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
                loadingText="Deleting..."
                onClick={handleDeleteAccount}
              >
                Permanently Delete Account
              </ColorfulButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
