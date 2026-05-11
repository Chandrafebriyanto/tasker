import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

// Color hex map for dynamic styling (Tailwind JIT can't resolve dynamic class names)
const COLOR_HEX = {
  'primary': '#bdc2ff',
  'tertiary': '#ff6f7e',
  'secondary': '#999ea7',
  'primary-dim': '#acb3ff',
};

export default function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        api.get('/titles', {
          params: {
            'filters[user][documentId][$eq]': user?.documentId,
            'populate': 'course',
            'pagination[pageSize]': 100,
            'status': 'published',
          },
        }),
        api.get('/courses', {
          params: {
            'filters[user][documentId][$eq]': user?.documentId,
            'populate': 'tasks',
            'status': 'published',
          },
        }),
      ]);
      setTasks(tasksRes.data.data || []);
      setCourses(coursesRes.data.data || []);
    } catch (err) {
      console.error('Error detail:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTasks = tasks;
    const pendingTasks = allTasks.filter(t => t.status_task === 'Pending');
    const completedTasks = allTasks.filter(t => t.status_task === 'Completed');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'High');

    // Tasks completion percentage
    const totalCount = allTasks.length;
    const completedCount = completedTasks.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Next urgent deadline
    const upcomingTasks = pendingTasks
      .filter(t => t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const nextDeadline = upcomingTasks[0] || null;

    // Course with nearest deadline
    let nearestDeadlineCourse = null;
    if (nextDeadline && nextDeadline.course) {
      nearestDeadlineCourse = nextDeadline.course.name;
    }

    // Weekly productivity (last 7 days)
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = weekDays.map((day, i) => {
      const date = new Date();
      const currentDay = date.getDay(); // 0=Sun, 1=Mon...
      const diff = (currentDay === 0 ? 7 : currentDay) - (i + 1);
      const targetDate = new Date(date);
      targetDate.setDate(date.getDate() - diff);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      // Tasks completed on this day
      const doneCount = completedTasks.filter(t => {
        const dateField = t.completedAt || t.updatedAt;
        if (!dateField) return false;
        const d = new Date(dateField);
        return d >= targetDate && d < nextDay;
      }).length;

      // Tasks created on this day
      const createdCount = allTasks.filter(t => {
        const dateField = t.createdAt;
        if (!dateField) return false;
        const d = new Date(dateField);
        return d >= targetDate && d < nextDay;
      }).length;

      return { day, doneCount, createdCount };
    });

    const maxWeekCount = Math.max(...weekData.map(d => Math.max(d.doneCount, d.createdCount)), 1);

    return {
      totalCount,
      completedCount,
      completionPercentage,
      highPriorityTasks,
      nextDeadline,
      nearestDeadlineCourse,
      weekData,
      maxWeekCount,
      pendingTasks,
    };
  }, [tasks]);

  // Countdown for next deadline
  const nextDeadlineStr = stats.nextDeadline?.deadline || null;
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!nextDeadlineStr) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const deadline = new Date(nextDeadlineStr);
      const diff = Math.max(0, deadline - now);

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextDeadlineStr]);

  // Course overview with pending counts
  const courseOverview = useMemo(() => {
    const icons = ['functions', 'biotech', 'history_edu', 'terminal', 'code', 'science', 'psychology', 'architecture'];
    const colorKeys = ['primary', 'tertiary', 'secondary', 'primary-dim'];

    return courses.map((course, i) => {
      const courseTasks = tasks.filter(t => t.course?.id === course.id);
      const pendingCount = courseTasks.filter(t => t.status_task === 'Pending').length;
      const colorKey = colorKeys[i % colorKeys.length];
      return {
        ...course,
        icon: course.iconString || icons[i % icons.length],
        colorKey,
        colorHex: COLOR_HEX[colorKey],
        totalTasks: courseTasks.length,
        pendingCount,
        index: String(i + 1).padStart(2, '0'),
      };
    });
  }, [courses, tasks]);

  // SVG circle calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (stats.completionPercentage / 100) * circumference;

  // Check if all tasks are done (congratulations state)
  const allCompleted = stats.totalCount > 0 && stats.pendingTasks.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header Section */}
      <section className="mb-10">
        <h2 className="text-[3.5rem] font-bold tracking-[-0.02em] leading-tight text-on-surface mb-2">
          {t('hello')}, {user?.fullName || 'Student'}.
        </h2>
        <p className="text-on-surface-variant text-lg max-w-lg">
          {allCompleted ? (
            <>{t('allTasksDone')}</>
          ) : (
            <>
              {stats.pendingTasks.length} {t('tasksPending')}.
              {stats.nearestDeadlineCourse && (
                <> {t('nearestDeadlineCourse')} <span className="text-primary font-semibold">{stats.nearestDeadlineCourse}</span>.</>
              )}
            </>
          )}
        </p>
      </section>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6">

        {/* 1. Today's Tasks Progress Circle */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-8 flex flex-col justify-between min-h-[350px]">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1">{t('status')}</p>
            <h3 className="text-xl font-bold">{t('taskProgress')}</h3>
          </div>
          <div className="flex items-center justify-center py-6 relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle className="text-surface-container-highest" cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" strokeWidth="10" />
              <circle className="text-primary transition-all duration-1000" cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{stats.completionPercentage}%</span>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{t('complete')}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-on-surface">{stats.completedCount} {t('ofDone')} {stats.totalCount} {t('done')}</span>
            <Link className="text-primary hover:underline transition-all" to="/tasks">{t('viewList')}</Link>
          </div>
        </div>

        {/* 2. Urgent Deadline Countdown / Congratulations */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-8 flex flex-col justify-center relative overflow-hidden min-h-[220px]">
          {allCompleted ? (
            /* Congratulations State */
            <div className="flex flex-col items-center justify-center text-center py-8 relative z-10">
              <span className="text-6xl mb-4">🎉</span>
              <h3 className="text-3xl font-bold mb-2">{t('congratsTitle')}</h3>
              <p className="text-on-surface-variant text-lg mb-2">{t('congratsSubtitle')}</p>
              <p className="text-on-surface-variant text-sm mb-6 max-w-md">{t('congratsMessage')}</p>
              <Link
                to="/tasks"
                state={{ openNewTask: true }}
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t('createNewTask')}
              </Link>
            </div>
          ) : stats.nextDeadline ? (
            <>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-error-container/20 text-error mb-4">
                  <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>alarm</span>
                  <span className="text-[0.6875rem] font-bold uppercase tracking-wider">
                    {stats.nextDeadline.priority === 'High' ? t('urgentDeadline') : t('nextDeadline')}
                  </span>
                </div>
                <h3 className="text-3xl font-bold mb-2">{stats.nextDeadline.title}</h3>
                <p className="text-on-surface-variant mb-6">
                  {stats.nextDeadline.course?.name || t('noCourseAssigned')}
                  {stats.nextDeadline.description && ` — ${stats.nextDeadline.description.substring(0, 60)}...`}
                </p>
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{String(countdown.days).padStart(2, '0')}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{t('days')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{t('hours')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{t('minutes')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{t('seconds')}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/tasks"
                className="absolute right-8 bottom-8 bg-surface-container-highest border border-outline-variant/20 px-6 py-3 rounded-md font-semibold text-sm hover:bg-surface-bright transition-all z-10"
              >
                {t('startTask')}
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">celebration</span>
              <h3 className="text-xl font-bold mb-1">{t('allCaughtUp')}</h3>
              <p className="text-on-surface-variant text-sm">{t('noPendingDeadlines')}</p>
            </div>
          )}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        {/* 3. Course Overview */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-xl p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1">{t('distribution')}</p>
              <h3 className="text-xl font-bold">{t('courseOverview')}</h3>
            </div>
          </div>
          {courseOverview.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courseOverview.map((course) => (
                <div
                  key={course.id}
                  onClick={() => navigate('/tasks', { state: { filterCourse: course.name } })}
                  className="p-6 bg-surface-container-low rounded-lg border border-outline-variant/10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${course.colorHex}33`, color: course.colorHex }}
                    >
                      <span className="material-symbols-outlined">{course.icon}</span>
                    </div>
                    <span className="text-2xl font-black text-on-surface/10 group-hover:text-on-surface/20 transition-colors">{course.index}</span>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-bold text-lg">{course.name}</h4>
                    <p className="text-on-surface-variant text-sm">{course.totalTasks} {t('tasks')} • {course.pendingCount} {t('pending')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">school</span>
              <p className="text-on-surface-variant text-sm mb-4">{t('noCoursesYet')}</p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                {t('addCourses')}
              </Link>
            </div>
          )}
        </div>

        {/* 4. High Priority List */}
        <div className="col-span-12 lg:col-span-4 glass-panel rounded-xl p-8 flex flex-col">
          <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1">{t('attentionRequired')}</p>
          <h3 className="text-xl font-bold mb-6">{t('highPriority')}</h3>
          <div className="space-y-4 flex-1 no-scrollbar overflow-y-auto">
            {stats.highPriorityTasks.length > 0 ? (
              stats.highPriorityTasks.map((task) => (
                <div key={task.id} className="p-4 bg-surface-container-lowest border-l-4 border-error rounded-md flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{task.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {task.deadline ? `${t('due')} ${new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : t('noDeadline')}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-error">priority_high</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">check_circle</span>
                <p className="text-on-surface-variant text-sm">{t('noHighPriorityTasks')}</p>
              </div>
            )}
          </div>
          <Link
            to="/tasks"
            className="w-full mt-6 py-2 border border-outline-variant/30 rounded text-sm font-medium hover:bg-surface-container-highest transition-colors text-center block"
          >
            {t('viewAllPriority')}
          </Link>
        </div>
      </div>

      {/* 5. Productivity Chart */}
      <section className="mt-12 glass-panel rounded-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-1">{t('performance')}</p>
            <h3 className="text-xl font-bold">{t('weeklyProductivity')}</h3>
          </div>
          <div className="flex gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded bg-[#4F46E5]"></span> {t('tasksDone')}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="w-3 h-3 rounded bg-[#10B981]"></span> {t('tasksCreated')}
            </span>
          </div>
        </div>
        
        {/* Grafik Recharts */}
        <div className="h-56 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weekData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888' }} 
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="doneCount" name="Done" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="createdCount" name="Created" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}