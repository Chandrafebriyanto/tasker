import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onNewTask }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks', label: 'My Tasks', icon: 'checklist' },
    { path: '/archive', label: 'Archive', icon: 'archive' },
  ];

  const handleNewTask = () => {
    // Navigate to tasks page and trigger new task form
    if (location.pathname !== '/tasks') {
      navigate('/tasks', { state: { openNewTask: true } });
    } else if (onNewTask) {
      onNewTask();
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col py-6 px-4 bg-surface-container border-r border-outline-variant/20 z-50">
      {/* Logo Section */}
      <div className="mb-10 px-2 flex items-center gap-3">
        {/* <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-sm">grid_view</span>
        </div> */}
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-on-surface">Precision Tasker</h1>
          <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-medium">Student Workspace</p>
        </div>
      </div>

      {/* New Task Button */}
      <button
        onClick={handleNewTask}
        className="mb-8 mx-2 py-2.5 px-4 bg-primary text-on-primary rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-200 active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New Task
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-[0.875rem] ${
                isActive
                  ? 'text-primary font-semibold bg-surface-container-highest'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="mt-auto px-2">
        <div className="flex items-center gap-3 p-2 rounded-md border border-outline-variant/10 bg-surface-container-low">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-on-surface">
              {user?.fullName || 'User'}
            </p>
            <p className="text-[10px] text-on-surface-variant truncate">
              {user?.studyProgram || 'student@edu.ac.uk'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
