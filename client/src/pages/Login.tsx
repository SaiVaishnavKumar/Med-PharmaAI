import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function Login() {
  const { login, availableUsers, switchUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your pharmacy email.');
    setBusy(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchUser(userId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-teal-50/30 to-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-800 to-emerald-600 text-white font-extrabold flex items-center justify-center font-display text-2xl shadow-md mx-auto">
            M
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            MediFlow <span className="text-teal-700">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Intelligent Pharmacy Operations, FEFO Dispensing & Inventory System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-display">Sign In to Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access your clinical pharmacy terminal and dispensing logs.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pharmacy Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pharmacist@mediflow.local"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              loading={busy}
              className="w-full font-bold"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Instant Demo Profiles
              </span>
              <span>1-click access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(u.id)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all flex items-center gap-2 group"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    {u.avatar || u.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate text-[11px] leading-tight">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize truncate">
                      {u.role.replaceAll('_', ' ').toLowerCase()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Encrypted Session • Role-Based Access Control (RBAC)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
