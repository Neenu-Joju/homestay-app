import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'error':
        return 'border-rose-500/40 bg-slate-900/95 text-rose-200';
      case 'warning':
        return 'border-amber-500/40 bg-slate-900/95 text-amber-200';
      case 'info':
        return 'border-blue-500/40 bg-slate-900/95 text-blue-200';
      default:
        return 'border-emerald-500/40 bg-slate-900/95 text-emerald-200';
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] animate-bounce duration-300 max-w-md pointer-events-auto shadow-2xl">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${getBorder()}`}
      >
        {getIcon()}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};
