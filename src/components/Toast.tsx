import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps extends Toast {
  onRemove: (id: string) => void;
}

const icons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colors: Record<ToastType, string> = {
  success: 'border-l-topo-500',
  error: 'border-l-error-500',
  warning: 'border-l-warning-500',
  info: 'border-l-info-500'
};

const iconColors: Record<ToastType, string> = {
  success: 'text-topo-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-info-500'
};

const durations: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
};

const ToastItem: React.FC<ToastItemProps> = ({ id, type, message, duration, onRemove }) => {
  const Icon = icons[type];
  const timeout = duration || durations[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, timeout);

    return () => clearTimeout(timer);
  }, [id, timeout, onRemove]);

  return (
    <div className={`toast ${colors[type]} animate-slide-in-right`}>
      <Icon className={`w-5 h-5 ${iconColors[type]} flex-shrink-0`} />
      <span className="flex-1 text-sm text-ink-700">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="p-1 rounded hover:bg-ink-100 transition-colors"
      >
        <X className="w-4 h-4 text-ink-400" />
      </button>
    </div>
  );
};

// Toast container component
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          {...toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// useToast hook
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};
