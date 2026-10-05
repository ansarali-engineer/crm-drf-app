import { useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import Customers from '@/pages/Customers';
import LeadActivities from '@/pages/LeadActivities';
import Branches from '@/pages/Branches';
import Users from '@/pages/Users';
import Roles from '@/pages/Roles';
import RolePermissions from '@/pages/RolePermissions';
import { FullPageSpinner } from '@/components/ui/Spinner';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/customers': 'Customers',
  '/lead-activities': 'Lead Activities',
  '/branches': 'Branches',
  '/users': 'Users',
  '/roles': 'Roles',
  '/role-permissions': 'Role Permissions',
};

function AppLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'CRM Dashboard';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/leads" element={<ErrorBoundary><Leads /></ErrorBoundary>} />
        <Route path="/customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
        <Route path="/lead-activities" element={<ErrorBoundary><LeadActivities /></ErrorBoundary>} />
        <Route path="/branches" element={<ErrorBoundary><Branches /></ErrorBoundary>} />
        <Route path="/users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
        <Route path="/roles" element={<ErrorBoundary><Roles /></ErrorBoundary>} />
        <Route path="/role-permissions" element={<ErrorBoundary><RolePermissions /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
