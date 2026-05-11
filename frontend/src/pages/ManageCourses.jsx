import { useState, useEffect, useRef } from 'react';
import { useT } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ICON_OPTIONS = [
  'functions', 'biotech', 'history_edu', 'terminal', 'code', 'science',
  'psychology', 'architecture', 'school', 'calculate', 'language', 'draw',
  'data_object', 'analytics', 'menu_book', 'engineering', 'palette',
  'music_note', 'sports_soccer', 'public', 'account_balance', 'gavel',
];

// Color hex map for dynamic styling (Tailwind JIT can't resolve dynamic class names)
const COLOR_HEX = {
  'primary': '#bdc2ff',
  'tertiary': '#ff6f7e',
  'secondary': '#999ea7',
  'primary-dim': '#acb3ff',
};

const COLOR_KEYS = ['primary', 'tertiary', 'secondary', 'primary-dim'];

export default function ManageCourses() {
  const t = useT();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  const editingCourseRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    iconString: 'school',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, tasksRes] = await Promise.all([
        api.get('/courses', {
          params: {
            'filters[user][documentId][$eq]': user?.documentId,
            'populate': 'tasks',
            'status': 'published',
          },
        }),
        api.get('/titles', {
          params: {
            'filters[user][documentId][$eq]': user?.documentId,
            'populate': 'course',
            'pagination[pageSize]': 100,
            'status': 'published',
          },
        }),
      ]);
      setCourses(coursesRes.data.data || []);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const openNewCourseForm = () => {
    setEditingCourse(null);
    editingCourseRef.current = null;
    setForm({ name: '', code: '', iconString: 'school' });
    setSidebarKey((k) => k + 1);
    setShowSidebar(true);
  };

  const openEditCourseForm = (course) => {
    setEditingCourse(course);
    editingCourseRef.current = course;
    setForm({
      name: course.name || '',
      code: course.code || '',
      iconString: course.iconString || 'school',
    });
    setSidebarKey((k) => k + 1);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setEditingCourse(null);
    editingCourseRef.current = null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const currentCourse = editingCourseRef.current;

    const payload = {
      data: {
        name: form.name,
        code: form.code,
        iconString: form.iconString,
        user: user?.documentId,
        publishedAt: new Date().toISOString(),
      },
    };

    try {
      if (currentCourse) {
        await api.put(`/courses/${currentCourse.documentId || currentCourse.id}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      closeSidebar();
      await fetchData();
    } catch (err) {
      console.error('Failed to save course:', err.response?.data || err);
      alert(t('failedSaveCourse'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(t('confirmDeleteCourse').replace('${name}', course.name))) return;

    setDeletingId(course.documentId || course.id);
    try {
      await api.delete(`/courses/${course.documentId || course.id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete course:', err.response?.data || err);
      const errorMsg = err.response?.data?.error?.message || err.message;
      alert(`${t('failedDeleteCourse')} \n\nDetail: ${errorMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Hitung statistik per course
  const getCourseStats = (course) => {
    const courseTasks = tasks.filter(t => t.course?.id === course.id);
    const pendingCount = courseTasks.filter(t => t.status_task === 'Pending').length;
    const completedCount = courseTasks.filter(t => t.status_task === 'Completed').length;
    return { total: courseTasks.length, pending: pendingCount, completed: completedCount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">{t('loadingCourses')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-slide-up">
        <header className="flex justify-between items-end mb-10">
          <div>
            <span className="text-[0.6875rem] uppercase tracking-[0.05em] text-primary-dim font-bold mb-2 block">
              {t('academicSetup')}
            </span>
            <h2 className="text-4xl font-black tracking-tighter mb-2">{t('myCoursesTitle')}</h2>
            <p className="text-on-surface-variant max-w-md">
              {t('myCoursesSubtitle')}
            </p>
          </div>
          <button
            onClick={openNewCourseForm}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>{t('newCourse')}</span>
          </button>
        </header>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, i) => {
              const stats = getCourseStats(course);
              const colorKey = COLOR_KEYS[i % COLOR_KEYS.length];
              const colorHex = COLOR_HEX[colorKey];
              const isDeleting = deletingId === (course.documentId || course.id);
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

              return (
                <div
                  key={course.id}
                  className={`group relative p-6 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-300 flex flex-col justify-between min-h-[200px] ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${colorHex}33`, color: colorHex }}
                    >
                      <span className="material-symbols-outlined text-2xl">{course.iconString || 'school'}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditCourseForm(course)}
                        className="p-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors"
                        title={t('edit')}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        className="p-1.5 hover:bg-error-container/20 rounded-lg text-error transition-colors"
                        title={t('delete')}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-on-surface">{course.name}</h3>
                      {course.code && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest text-on-surface-variant rounded">
                          {course.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-2">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">assignment</span>
                        {stats.total} {t('tasks')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">pending</span>
                        {stats.pending} {t('pending')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {stats.completed} {t('done')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar - using inline styles to avoid Tailwind dynamic class issue */}
                  {stats.total > 0 && (
                    <div className="mt-4">
                      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: colorHex }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1.5 font-medium">
                        {pct}% {t('completed')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add New Course Card */}
            <button
              onClick={openNewCourseForm}
              className="group p-6 rounded-xl border-2 border-dashed border-outline-variant/20 hover:border-primary/40 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] hover:bg-surface-container-low/50"
            >
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 group-hover:text-primary/60 transition-colors mb-3">add_circle</span>
              <span className="text-sm font-semibold text-on-surface-variant/50 group-hover:text-primary/80 transition-colors">{t('addAnotherCourse')}</span>
            </button>
          </div>
        ) : (
          <div className="bg-surface-container rounded-xl p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">school</span>
            <h3 className="text-xl font-bold text-on-surface-variant mb-2">{t('noCoursesTitle')}</h3>
            <p className="text-on-surface-variant text-sm mb-6">{t('noCoursesSubtitle')}</p>
            <button
              onClick={openNewCourseForm}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t('createFirstCourse')}
            </button>
          </div>
        )}
      </div>

      {/* Slide-in Sidebar Form */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-fade-in"
            onClick={closeSidebar}
          ></div>

          <div
            key={sidebarKey}
            className="fixed top-0 right-0 w-[420px] h-full z-[70] animate-slide-in-right shadow-[-20px_0_40px_rgba(0,0,0,0.6)] bg-surface-container-high border-l border-outline-variant/10 flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/20 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {editingCourse ? t('editCourse') : t('newCourse')}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  {editingCourse ? t('updateCourseDetails') : t('setupNewCourse')}
                </p>
              </div>
              <button
                onClick={closeSidebar}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {/* Course Name */}
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">{t('courseNameLabel')}</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    placeholder={t('courseNamePlaceholder')}
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Course Code */}
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">{t('courseCodeLabel')}</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all uppercase"
                    placeholder="e.g. MATH201"
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                  <p className="text-[10px] text-on-surface-variant">{t('courseCodeHelp')}</p>
                </div>

                {/* Icon Picker */}
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">{t('iconLabel')}</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setForm({ ...form, iconString: icon })}
                        className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                          form.iconString === icon
                            ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2 ring-offset-surface-container-high'
                            : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">{t('previewLabel')}</label>
                  <div className="p-5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">{form.iconString || 'school'}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{form.name || t('courseName')}</h4>
                        {form.code && (
                          <span className="text-xs text-on-surface-variant font-medium">{form.code}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="shrink-0 p-8 border-t border-outline-variant/10 bg-surface-container-highest/10">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="flex-1 px-6 py-3 rounded-lg border border-outline-variant text-sm font-bold hover:bg-surface-container-highest transition-colors"
                  >
                    {t('discard')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.name}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        {t('saving')}
                      </>
                    ) : (
                      editingCourse ? t('updateCourse') : t('createCourse')
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
