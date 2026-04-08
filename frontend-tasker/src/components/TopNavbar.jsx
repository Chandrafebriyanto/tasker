import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function TopNavbar() {
  const { user, logout } = useAuth();
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
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            className="w-full bg-surface-container-lowest border-none focus:ring-1 focus:ring-primary rounded-lg pl-10 pr-4 py-1.5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50"
            placeholder="Search tasks, courses, or files..."
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 ml-4">
        {/* <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="material-symbols-outlined hover:text-on-surface transition-colors">notifications</button>
          <button className="material-symbols-outlined hover:text-on-surface transition-colors">settings</button>
        </div> */}

        <div className="h-8 w-[1px] bg-outline-variant/20"></div>

        {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-medium text-on-surface">Workspace</span>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold border border-primary/20">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Overlay penutup dropdown - pastikan z-index di bawah dropdown tapi di atas konten lain */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowDropdown(false)}
                ></div>

                {/* Tambahkan z-50 agar dropdown ada di atas overlay */}
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
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
      </div>
    </header>
  );
}