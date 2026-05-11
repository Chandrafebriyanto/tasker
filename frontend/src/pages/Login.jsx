import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';

export default function Login() {
  const t = useT();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
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
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary-container/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Login Container */}
      <main className="w-full max-w-[420px] px-6 z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 ether-gradient rounded-lg mb-6 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-2xl">checklist</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface mb-2">{t('loginTitle')}</h1>
          <p className="text-on-surface-variant text-sm tracking-tight text-center">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="glass-panel p-8 rounded-xl shadow-2xl shadow-black/60">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/20 border border-error/20 text-error text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                {t('emailLabel')}
              </label>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder={t('emailPlaceholder')}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                id="login-email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                {t('passwordLabel')}
              </label>
              <input
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                placeholder={t('passwordPlaceholder')}
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
              className="w-full h-11 ether-gradient text-on-primary font-bold rounded-lg text-sm mt-2 shadow-lg shadow-primary-container/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              id="login-submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  {t('signingIn')}
                </>
              ) : (
                <>
                  {t('enterWorkspace')}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex flex-col items-center gap-4">
            <p className="text-xs text-on-surface-variant">
              {t('noAccount')}{' '}
              <Link className="text-primary font-semibold hover:underline" to="/register">
                {t('createOne')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <blockquote className="italic text-on-surface-variant/40 text-sm font-light">
            {t('loginQuote')}
          </blockquote>
        </div>
      </main>

      <footer className="fixed bottom-8 w-full flex justify-center gap-8 px-6">
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          {t('systemStatus')}
        </a>
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          {t('privacy')}
        </a>
        <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">
          {t('terms')}
        </a>
      </footer>
    </div>
  );
}
