import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Building2,
  Shield,
  KeyRound,
  Target,
  Users2,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/leads', label: 'Leads', icon: Target },
      { to: '/customers', label: 'Customers', icon: Users2 },
      { to: '/lead-activities', label: 'Lead Activities', icon: TrendingUp },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/branches', label: 'Branches', icon: Building2 },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/roles', label: 'Roles', icon: Shield },
      { to: '/role-permissions', label: 'Role Permissions', icon: KeyRound },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 transform border-r border-sidebar-light bg-sidebar transition-transform duration-300 ease-smooth lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-light px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-900/40 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">Nexus CRM</h1>
            <p className="text-[11px] text-slate-400 leading-tight font-medium">Management Suite</p>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={onCloseMobile}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll flex flex-col gap-4 px-3 py-4 overflow-y-auto h-[calc(100vh-4rem-3.5rem)]">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-sidebar-active text-white'
                            : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent-400" />
                          )}
                          <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-accent-400' : ''}`} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-light p-3">
          <button
            onClick={logout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 transition-transform group-hover:translate-x-0.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
