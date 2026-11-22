import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, title, type = 'info', duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, title, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    error: (message, title = 'Error') => showToast({ message, title, type: 'error' }),
    success: (message, title = 'Success') => showToast({ message, title, type: 'success' }),
    warning: (message, title = 'Attention') => showToast({ message, title, type: 'warning' }),
    info: (message, title = 'Info') => showToast({ message, title, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div 
      aria-live="polite" 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none p-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { type, title, message } = toast;

  const config = {
    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      borderLeft: 'border-l-4 border-l-rose-500',
      glowShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.18)]',
      bgBadge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    },
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      borderLeft: 'border-l-4 border-l-emerald-500',
      glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.18)]',
      bgBadge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      borderLeft: 'border-l-4 border-l-amber-500',
      glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.18)]',
      bgBadge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-400',
      borderLeft: 'border-l-4 border-l-indigo-500',
      glowShadow: 'shadow-[0_0_20px_rgba(99,102,241,0.18)]',
      bgBadge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    }
  };

  const current = config[type] || config.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-xl border border-border bg-card/95 backdrop-blur-xl p-3.5 shadow-xl ${current.borderLeft} ${current.glowShadow} flex items-start gap-3 transition-all animate-toast-slide-in select-none`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />

      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <h4 className="text-xs font-bold text-foreground tracking-tight leading-none mb-1">
            {title}
          </h4>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed break-words">
          {message}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
