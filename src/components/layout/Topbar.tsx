import { useState, type ReactNode } from 'react';
import { Menu, Globe, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '@/api/client';

interface TopbarProps {
  title: string;
  actions?: ReactNode;
  onMenuClick: () => void;
}

export default function Topbar({ title, actions, onMenuClick }: TopbarProps) {
  const [showApiInfo, setShowApiInfo] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 glass px-4 sm:px-6">
      <button
        className="lg:hidden btn-icon"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="hidden sm:block text-sm font-medium text-slate-400">CRM</span>
        <ChevronRight className="hidden sm:block w-4 h-4 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-900 truncate tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <div className="relative">
          <button
            className="btn-icon"
            onClick={() => setShowApiInfo(!showApiInfo)}
            title="API connection info"
          >
            <Globe className="w-[18px] h-[18px]" />
          </button>
          {showApiInfo && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowApiInfo(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-elevated animate-slide-down">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
                    <Globe className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    API Connection
                  </p>
                </div>
                <p className="text-sm text-slate-700 break-all font-mono bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{API_BASE_URL}</p>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Connected to your Django REST backend. If requests fail due to CORS, ensure this
                  frontend's origin is added to the backend's CORS_ALLOWED_ORIGINS.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
