import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const TYPE_STYLES = {
  success: { bg: 'bg-emerald-500/20 border-emerald-500/40', icon: CheckCircle, color: 'text-emerald-400' },
  error:   { bg: 'bg-red-500/20 border-red-500/40',         icon: AlertCircle, color: 'text-red-400' },
  info:    { bg: 'bg-blue-500/20 border-blue-500/40',       icon: Info,        color: 'text-blue-400' },
  warning: { bg: 'bg-amber-500/20 border-amber-500/40',     icon: AlertTriangle, color: 'text-amber-400' },
};

function ToastItem({ toast, onRemove }) {
  const { bg, icon: Icon, color } = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-3xl ${bg} shadow-xl shadow-black/20 min-w-[260px] max-w-[340px]`}>
      <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
      <span className="text-sm text-white/90 flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 active:scale-95"
        aria-label="Bildirimi kapat"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="no-print fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
