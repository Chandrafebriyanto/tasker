import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-40 flex justify-between items-center px-8 h-16 bg-surface-container-highest/60 backdrop-blur-xl shadow-2xl shadow-black/40 border-b border-outline-variant/10 transition-all duration-300">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-4">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high transition-all text-sm font-medium text-on-surface-variant hover:text-on-surface"
          title={language === 'en' ? 'Switch to Bahasa Indonesia' : 'Switch to English'}
        >
          <span className="material-symbols-outlined text-[16px]">translate</span>
          <span className="text-xs font-bold uppercase tracking-wider">{language === 'en' ? 'EN' : 'ID'}</span>
        </button>

        <div className="h-8 w-[1px] bg-outline-variant/20"></div>

        {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-on-surface">{t('workspace')}</span>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold border border-primary/20">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Overlay penutup dropdown */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowDropdown(false)}
                ></div>

                <div className="absolute right-0 top-12 w-56 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-outline-variant/10">
                    <p className="text-sm font-semibold text-on-surface">{user?.fullName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user?.studyProgram}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-error hover:bg-error-container/10 transition-colors flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {t('signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </header>
  );
}