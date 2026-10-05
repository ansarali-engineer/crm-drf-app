import { Inbox, AlertCircle } from 'lucide-react';

export function EmptyState({ message = 'No data found', icon }: { message?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        {icon || <Inbox className="w-8 h-8 text-slate-300" />}
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 mb-4 ring-4 ring-red-100/50">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-base font-semibold text-slate-700 mb-1">Something went wrong</p>
      <p className="text-sm text-slate-500 mb-5 max-w-md">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
