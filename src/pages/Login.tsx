import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, Loader2, ArrowRight, TrendingUp, Users2, Target, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back! You have been signed in.');
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-slate-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 animate-pulse-soft" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-600/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-soft" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-900/50">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Nexus CRM</h1>
              <p className="text-xs text-slate-400 font-medium">Management Suite</p>
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Manage your leads,
              <br />
              <span className="gradient-text">close more deals.</span>
            </h2>
            <p className="mt-5 text-slate-400 text-lg leading-relaxed">
              A complete CRM platform for tracking leads, customers, and team activities — all in one beautifully designed workspace.
            </p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-col gap-3">
              {[
                { icon: Target, text: 'Visual lead pipeline with drag-and-drop stages' },
                { icon: Users2, text: 'Unified customer and contact management' },
                { icon: TrendingUp, text: 'Real-time activity tracking and reporting' },
                { icon: Shield, text: 'Role-based access control for your team' },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 shrink-0">
                      <Icon className="w-4 h-4 text-accent-400" />
                    </div>
                    <span className="text-sm text-slate-300">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-500 font-medium">
            Connected to your Django REST API backend
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex lg:hidden flex-col items-center mb-8 animate-slide-up">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-600/20 mb-4">
              <Layers className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nexus CRM</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
          </div>

          {/* Form card */}
          <div className="card p-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="mb-6 hidden lg:block">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-slide-down">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="username" className="label-field">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="label-field">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 text-base group" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Secure JWT authentication via your Django backend
          </p>
        </div>
      </div>
    </div>
  );
}
