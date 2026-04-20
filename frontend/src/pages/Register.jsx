import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.error?.message || 'Registration failed. Please try again.';
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

      {/* Register Container */}
      <main className="w-full max-w-[420px] px-6 z-10 animate-slide-up">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 ether-gradient rounded-lg mb-6 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-2xl">checklist</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2">Create Account</h1>
          <p className="text-on-surface-variant text-sm tracking-tight text-center">
            Join Precision Tasker and streamline your academic workflow.
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-panel p-8 rounded-xl shadow-2xl shadow-black/60">
          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Username
              </label>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="Your display name"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                id="register-username"
              />
            </div>

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
                id="register-email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Password
              </label>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder="Min. 6 characters"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                id="register-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 ether-gradient text-on-primary font-bold rounded-lg text-sm mt-4 shadow-lg shadow-primary-container/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              id="register-submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Creating account...
                </>
              ) : (
                <>
                  Create Workspace
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-col items-center gap-4">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link className="text-primary font-semibold hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Tagline */}
        <div className="mt-12 text-center">
          <blockquote className="italic text-on-surface-variant/40 text-sm font-light">
            "The secret of getting ahead is getting started."
          </blockquote>
        </div>
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
