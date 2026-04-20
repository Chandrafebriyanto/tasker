import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect via component (not during render)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Background Texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Login Container */}
      <main className="w-full max-w-[420px] px-6 z-10 animate-slide-up">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-10">
          {/* <div className="w-12 h-12 ether-gradient rounded-lg mb-6 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-2xl">checklist</span>
          </div> */}
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2">Precision Tasker</h1>
          <p className="text-on-surface-variant text-sm tracking-tight text-center">
            Your academic workflow, refined and focused.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-panel p-8 rounded-xl shadow-2xl shadow-black/60">
          {/* Google Login (Placeholder) */}
          <button
            type="button"
            className="w-full h-11 flex items-center justify-center gap-3 bg-surface-container-highest border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-300 rounded-lg text-sm font-medium mb-8 cursor-not-allowed opacity-60"
            title="Google login coming soon"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
              Or with Email
            </span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Email
              </label>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="name@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Password
                </label>
                <a className="text-[10px] text-primary hover:underline font-semibold" href="#">
                  Forgot?
                </a>
              </div>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 ether-gradient text-on-primary font-bold rounded-lg text-sm mt-4 shadow-lg shadow-primary-container/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              id="login-submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  Enter Workspace
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-col items-center gap-4">
            <p className="text-xs text-on-surface-variant">
              New to Precision?{' '}
              <Link className="text-primary font-semibold hover:underline" to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Tagline */}
        {/* <div className="mt-12 text-center">
          <blockquote className="italic text-on-surface-variant/40 text-sm font-light">
            "Productivity is being able to do things that you were never able to do before."
          </blockquote>
        </div> */}
      </main>

      {/* Support Links */}
      <footer className="fixed bottom-8 w-full flex justify-center gap-8 px-6">
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          System Status
        </a>
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          Privacy
        </a>
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          Terms
        </a>
      </footer>
    </div>
  );
}
