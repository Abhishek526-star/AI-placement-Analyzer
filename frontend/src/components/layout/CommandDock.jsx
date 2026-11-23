import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ColorfulButton } from '../ui/ColorfulButton.jsx';
import {
  Sparkles, LayoutDashboard, FileText, Target, History,
  Settings, LogOut, LogIn, ChevronDown, Check, Zap, Eye
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resumes', label: 'My Resumes', icon: FileText },
  { id: 'analyze', label: 'New Match', icon: Target },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CommandDock({ currentView, onNavigate, onOpenAuth }) {
  const { user, signOut } = useAuth();
  const { theme, setTheme, themes, skeletonSimulator, toggleSkeletonSimulator } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const activeThemeMeta = themes.find((t) => t.id === theme) || themes[0];

  return (
    <header className="sticky top-3 z-50 max-w-[1440px] mx-auto px-3 sm:px-6 w-full no-print">
      <nav className="p-2 sm:px-4 sm:py-2.5 rounded-3xl backdrop-blur-2xl border border-[var(--dock-border)] bg-[var(--dock-bg)] shadow-2xl flex items-center justify-between gap-2.5 transition-all">
        
        {/* Left: Brand Mark */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <span>AI Placement Analyzer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] font-mono-numbers text-primary font-semibold tracking-wider uppercase">
              Bento-Cockpit
            </div>
          </div>
        </div>

        {/* Center: Colorful Navigation Pills */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/15 border border-border/40">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all select-none font-display ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/35 shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Skeleton Simulator, Palette Studio & CTA */}
        <div className="flex items-center gap-2">
          {/* Skeleton Simulator Trigger */}
          <button
            type="button"
            onClick={toggleSkeletonSimulator}
            title="Toggle geometry-matched shimmer skeleton preview"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono-numbers font-semibold border transition-all ${
              skeletonSimulator
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-card/60 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${skeletonSimulator ? 'bg-amber-400 animate-ping' : 'bg-muted-foreground'}`}></span>
            <span>{skeletonSimulator ? 'Skeletons: ON' : 'Skeletons: OFF'}</span>
          </button>

          {/* Palette Studio Theme Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card/60 hover:bg-card text-foreground transition-all shadow-sm"
              title="Switch luxury color palette"
            >
              <div className="flex -space-x-1">
                {activeThemeMeta.swatches.map((color, i) => (
                  <span
                    key={i}
                    style={{ backgroundColor: color }}
                    className="w-2.5 h-2.5 rounded-full border border-background shadow-sm"
                  ></span>
                ))}
              </div>
              <span className="hidden lg:inline text-[11px] font-display font-medium">
                {activeThemeMeta.label.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {paletteOpen && (
              <div
                className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-card border border-border shadow-2xl backdrop-blur-2xl space-y-1 text-xs z-50 animate-toast-slide-in"
                onMouseLeave={() => setPaletteOpen(false)}
              >
                <div className="text-[10px] font-mono-numbers uppercase font-bold text-muted-foreground px-2 py-1">
                  Luxury Theme Palettes
                </div>
                {themes.map((t) => {
                  const isCurrent = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setPaletteOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                        isCurrent
                          ? 'bg-primary/15 text-primary font-bold border border-primary/25'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-display text-xs">{t.label}</span>
                        <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                          {t.swatches.map((c, idx) => (
                            <span
                              key={idx}
                              style={{ backgroundColor: c }}
                              className="w-3 h-3 rounded-full border border-card shadow-sm"
                            ></span>
                          ))}
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-primary ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Auth Controls & Primary CTA */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <ColorfulButton
                variant="prism"
                size="md"
                onClick={() => onNavigate('analyze')}
                icon={Target}
              >
                New Match
              </ColorfulButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all"
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
            </div>
          )}

        </div>

      </nav>
    </header>
  );
}
