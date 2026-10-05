import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-primary-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-green-600',
  error: 'border-l-red-600',
  info: 'border-l-primary-600',
  warning: 'border-l-amber-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    info: (m) => toast(m, 'info'),
    warning: (m) => toast(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-in-right pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-200 border-l-4 ${borders[t.type]} bg-white px-4 py-3 shadow-lg`}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
            <p className="flex-1 text-sm text-slate-700 leading-snug">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
