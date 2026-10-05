import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Users2,
  TrendingUp,
  Building2,
  DollarSign,
  ArrowRight,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { branchesApi, customersApi, leadActivitiesApi, leadsApi, usersApi } from '@/api/client';
import type { Branch, Customer, Lead, LeadActivity, User } from '@/types';
import { formatCurrency, formatDate, PriorityBadge, resolveName, StatusBadge } from '@/utils/format';
import { ErrorState } from '@/components/ui/States';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';

interface DashboardCounts {
  leads: number;
  customers: number;
  activities: number;
  branches: number;
  users: number;
  leadResults: Lead[];
  customerResults: Customer[];
  activityResults: LeadActivity[];
  errors: string[];
}

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState<DashboardCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const promises: Promise<{ key: string; count: number; results: unknown[]; error?: string }>[] = [
      leadsApi.list({ page: 1 }).then((r) => ({ key: 'leads', count: r.count, results: r.results })).catch((e) => ({ key: 'leads', count: 0, results: [], error: e instanceof Error ? e.message : 'Failed' })),
      customersApi.list({ page: 1 }).then((r) => ({ key: 'customers', count: r.count, results: r.results })).catch((e) => ({ key: 'customers', count: 0, results: [], error: e instanceof Error ? e.message : 'Failed' })),
      leadActivitiesApi.list({ page: 1 }).then((r) => ({ key: 'activities', count: r.count, results: r.results })).catch((e) => ({ key: 'activities', count: 0, results: [], error: e instanceof Error ? e.message : 'Failed' })),
      branchesApi.list({ page: 1 }).then((r) => ({ key: 'branches', count: r.count, results: r.results })).catch((e) => ({ key: 'branches', count: 0, results: [], error: e instanceof Error ? e.message : 'Failed' })),
      usersApi.list({ page: 1 }).then((r) => ({ key: 'users', count: r.count, results: r.results })).catch((e) => ({ key: 'users', count: 0, results: [], error: e instanceof Error ? e.message : 'Failed' })),
    ];

    Promise.all(promises)
      .then((results) => {
        if (cancelled) return;
        const map = Object.fromEntries(results.map((r) => [r.key, r]));
        const errors = results.filter((r) => r.error).map((r) => `${r.key}: ${r.error}`);

        if (errors.length > 0 && errors.length < results.length) {
          toast.warning(`Some dashboard sections could not be loaded (${errors.length} of ${results.length}).`);
        }

        setData({
          leads: map.leads.count,
          customers: map.customers.count,
          activities: map.activities.count,
          branches: map.branches.count,
          users: map.users.count,
          leadResults: map.leads.results as Lead[],
          customerResults: map.customers.results as Customer[],
          activityResults: map.activities.results as LeadActivity[],
          errors,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) return <FullPageSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="No data available" />;

  const stats = [
    { label: 'Total Leads', value: data.leads, icon: Target, color: 'text-primary-600', bg: 'bg-primary-50', ring: 'ring-primary-100', link: '/leads' },
    { label: 'Total Customers', value: data.customers, icon: Users2, color: 'text-accent-600', bg: 'bg-accent-50', ring: 'ring-accent-100', link: '/customers' },
    { label: 'Lead Activities', value: data.activities, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-100', link: '/lead-activities' },
    { label: 'Branches', value: data.branches, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-100', link: '/branches' },
  ];

  const expectedRevenue = data.leadResults.reduce((sum, lead) => {
    const val = typeof lead.expected_value === 'number' ? lead.expected_value : parseFloat(String(lead.expected_value));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const recentLeads = data.leadResults.slice(0, 5);
  const recentActivities = data.activityResults.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="stat-card group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ring-4 ${stat.ring} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-slate-400 group-hover:text-primary-600 transition-colors">
                View all <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-50 opacity-60" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 ring-4 ring-accent-100/50 shrink-0">
              <DollarSign className="w-5 h-5 text-accent-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500">Expected Revenue</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{formatCurrency(expectedRevenue)}</p>
            </div>
          </div>
          <p className="relative text-xs text-slate-400 mt-3">
            Based on {data.leadResults.length} of {data.leads} total leads
          </p>
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-50 opacity-60" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 ring-4 ring-primary-100/50 shrink-0">
              <Users2 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500">Team Members</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{data.users}</p>
            </div>
          </div>
          <p className="relative text-xs text-slate-400 mt-3">Total registered users</p>
        </div>

        <div className="card p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-50 opacity-60" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 ring-4 ring-amber-100/50 shrink-0">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500">Total Activities</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{data.activities}</p>
            </div>
          </div>
          <p className="relative text-xs text-slate-400 mt-3">Lead activities logged</p>
        </div>
      </div>

      {/* Recent lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-primary-600" />
              <h3 className="font-bold text-slate-900">Recent Leads</h3>
            </div>
            <Link to="/leads" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="py-14 text-center">
              <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No leads found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  to="/leads"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{lead.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {resolveName(lead.customer)} · {formatCurrency(lead.expected_value)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <StatusBadge status={lead.status} />
                    <PriorityBadge priority={lead.priority} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900">Recent Activities</h3>
            </div>
            <Link to="/lead-activities" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className="py-14 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No activities found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  to="/lead-activities"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">{activity.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {activity.activity_type} · {resolveName(activity.user, 'username')}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 ml-3 shrink-0">
                    {formatDate(activity.activity_date)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.errors.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-bold">Some data could not be loaded</p>
            <p className="mt-0.5 text-amber-600">This may be due to permission restrictions. The dashboard shows data from endpoints you have access to.</p>
          </div>
        </div>
      )}
    </div>
  );
}
