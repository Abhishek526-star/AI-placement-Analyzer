import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Lock, Mail, User, AlertCircle, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';

export function AuthModal({ initialMode = 'login', isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { signIn, signUp, resetPassword } = useAuth();

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'signup') {
        const result = await signUp(email, password, fullName);
        if (result?.session) {
          onSuccess();
          onClose();
        } else {
          setMessage('Registration successful! Please check your email to confirm your account.');
        }
      } else if (mode === 'reset') {
        if (cooldown > 0) {
          setError(`Security cooldown active: Please wait ${cooldown}s before requesting another reset email.`);
          setLoading(false);
          return;
        }
        await resetPassword(email);
        setMessage('Password reset email sent. Please check your inbox.');
        setCooldown(60);
      }
    } catch (err) {
      const is429 = err.status === 429 ||
        err.message?.toLowerCase().includes('rate limit') ||
        err.message?.includes('429') ||
        err.message?.toLowerCase().includes('60 seconds');

      if (is429) {
        setError('Security Cooldown: Supabase allows password reset requests once every 60 seconds. Please wait before trying again.');
        if (cooldown === 0) setCooldown(60);
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bento-card shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode Switch Pills */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-card/60 border border-border/50 max-w-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-display font-bold transition-all ${
              mode === 'login'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-display font-bold transition-all ${
              mode === 'signup'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {mode === 'login' && 'Welcome to Placement Cockpit'}
            {mode === 'signup' && 'Create Your Candidate Profile'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'login' && 'Sign in to access your placement intelligence and simulated ATS tests.'}
            {mode === 'signup' && 'Join to analyze your resume against target JDs with deterministic scoring.'}
            {mode === 'reset' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="font-display text-xs font-semibold text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-background/80 text-foreground text-xs focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-display text-xs font-semibold text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-background/80 text-foreground text-xs font-mono-numbers focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-display text-xs font-semibold text-foreground">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-background/80 text-foreground text-xs font-mono-numbers focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <ColorfulButton
              type="submit"
              variant="prism"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading || (mode === 'reset' && cooldown > 0)}
              loadingText="Authenticating..."
              icon={Sparkles}
            >
              {mode === 'login' && 'Sign In to Cockpit'}
              {mode === 'signup' && 'Create Candidate Account'}
              {mode === 'reset' && (cooldown > 0 ? `Wait ${cooldown}s to Resend` : 'Send Password Reset Link')}
            </ColorfulButton>

            {mode === 'reset' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
