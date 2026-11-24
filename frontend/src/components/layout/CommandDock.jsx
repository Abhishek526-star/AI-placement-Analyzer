import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ColorfulButton } from '../ui/ColorfulButton.jsx';
import {
  Sparkles, LayoutDashboard, FileText, Target, History,
  Settings, LogOut, Menu, X, ArrowRight, ShieldCheck, Activity
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resumes', label: 'My Resumes', icon: FileText },
  { id: 'analyze', label: 'New Match', icon: Target, highlight: true },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CommandDock({ currentView, onNavigate, onOpenAuth }) {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const userInitial = (user?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="relative w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-4 pb-1 z-30 no-print">
      <nav className="relative p-2 sm:px-4 sm:py-2.5 rounded-3xl backdrop-blur-2xl border border-[var(--dock-border)] bg-[var(--dock-bg)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.14)] flex items-center justify-between gap-3 transition-all overflow-hidden">
        
        {/* 1. Left: 3D Jewel Brand Mark & Cockpit Telemetry Beacon */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          {/* 3D Jewel Squircle Logo */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 p-[1.5px] shadow-lg shadow-purple-500/30 group-hover:scale-105 group-hover:shadow-purple-500/50 transition-all">
            <div className="w-full h-full rounded-[14px] bg-[#0c1020]/50 backdrop-blur-xs flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
          </div>

          {/* Typography & Cockpit Status Beacon */}
          <div className="hidden sm:block">
            <div className="font-display font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <span className="group-hover:text-primary transition-colors">AI Placement Analyzer</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 font-mono text-muted-foreground font-semibold">
                v2.4
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono-numbers text-emerald-400 font-semibold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Deterministic Core • FR-08 Live</span>
            </div>
          </div>
        </div>

        {/* 2. Center: Floating Sunken Glass Segmented Capsule Track */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/35 border border-white/5 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all select-none font-display relative ${
                  isActive
                    ? 'nav-active-capsule text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-primary scale-110' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Right: Identity Chip, Quick CTA & Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {user ? (
            <>
              {/* Candidate Identity Pill */}
              <div
                onClick={() => onNavigate('settings')}
                title={`Signed in as ${user.email}`}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono-numbers cursor-pointer transition-all select-none"
              >
                <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shrink-0">
                  {userInitial}
                </div>
                <span className="text-muted-foreground truncate max-w-[130px] font-medium">{user.email}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-2xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-white/5 hover:border-border transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Primary New Match CTA */}
              <ColorfulButton
                variant="prism"
                size="md"
                onClick={() => onNavigate('analyze')}
                icon={Target}
              >
                <span className="hidden sm:inline">New Match</span>
                <span className="sm:hidden">Match</span>
              </ColorfulButton>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-xl border border-border/60 text-xs font-display font-semibold text-foreground hover:bg-white/5 hover:border-border transition-all"
              >
                Sign In
              </button>

              <ColorfulButton
                variant="prism"
                size="md"
                onClick={() => onOpenAuth('signup')}
              >
                Get Started
              </ColorfulButton>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl border border-white/10 bg-white/5 text-foreground hover:bg-white/10 transition-all select-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </nav>

      {/* 4. Responsive Mobile Navigation Flyout Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl backdrop-blur-2xl border border-[var(--dock-border)] bg-[var(--dock-bg)] shadow-2xl space-y-3 animate-toast-slide-in">
          <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs">
            <span className="font-display font-bold text-foreground">Navigation Menu</span>
            {user && (
              <span className="font-mono-numbers text-[11px] text-muted-foreground truncate max-w-[180px]">
                {user.email}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-display font-semibold transition-all ${
                    isActive
                      ? 'nav-active-capsule text-white font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                </button>
              );
            })}
          </div>

          {user && (
            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 p-2 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
