import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

type AuthPageProps = {
  mode: 'login' | 'signup' | 'admin';
};

export default function AuthPage({ mode: initialMode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode]);

  const navigate = (r: string) => { window.location.hash = `#/${r}`; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      navigate('dashboard');
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }
      // Auth state change will handle redirect
      // For admin mode, the routing logic will check role
    }
  };

  const isAdminMode = mode === 'admin';
  const isSignup = mode === 'signup';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>

      <div className="relative w-full max-w-md px-4">
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="card glow">
          <div className="text-center mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isAdminMode ? 'bg-amber-600/15 text-amber-400' : 'bg-sky-600/15 text-sky-400'
            }`}>
              {isAdminMode ? <Shield size={28} /> : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center font-bold text-white text-lg">
                  C
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isAdminMode ? 'Admin Sign In' : isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-slate-400">
              {isAdminMode
                ? 'Access the admin control panel'
                : isSignup
                  ? 'Start your crypto investment journey'
                  : 'Sign in to your CryptoVault account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-field pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdminMode
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
                  : 'btn-primary'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Please wait...
                </span>
              ) : isAdminMode ? (
                'Sign In to Admin Panel'
              ) : isSignup ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {!isAdminMode && (
            <div className="mt-6 text-center text-sm text-slate-400">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(null); }} className="text-sky-400 hover:text-sky-300 font-medium">
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); }} className="text-sky-400 hover:text-sky-300 font-medium">
                    Sign up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
