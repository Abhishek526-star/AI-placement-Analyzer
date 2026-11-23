import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  prism: 'bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25',
  coral: 'bg-gradient-to-r from-[#ff5858] to-[#ff8c42] text-white shadow-lg shadow-orange-500/25',
  emerald: 'bg-gradient-to-r from-[#00d28f] to-[#00b4d8] text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25',
  violet: 'bg-gradient-to-r from-[#7c3aed] to-[#db2777] text-white shadow-lg shadow-violet-500/25',
  amber: 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-slate-950 font-extrabold shadow-lg shadow-amber-500/25',
  cobalt: 'bg-gradient-to-r from-[#2563eb] to-[#06b6d4] text-white shadow-lg shadow-blue-500/25',
  glass: 'bg-card/70 hover:bg-card border border-border text-foreground backdrop-blur-md shadow-sm'
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-[11px] rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-xs rounded-xl gap-2 font-bold',
  lg: 'px-5 py-2.5 text-sm rounded-2xl gap-2.5 font-extrabold'
};

export function ColorfulButton({
  children,
  variant = 'prism',
  size = 'md',
  icon: Icon = null,
  badge = null,
  loading = false,
  loadingText = null,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  title = '',
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.prism;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`btn-tactile inline-flex items-center justify-center font-display tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none select-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{loadingText || 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
          <span>{children}</span>
          {badge !== null && badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers font-bold bg-black/20 text-white/90">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
