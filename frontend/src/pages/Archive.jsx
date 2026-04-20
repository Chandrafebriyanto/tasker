import { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Archive() {
  // const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    try {
      const res = await api.get('/titles', {
        params: {
          // 'filters[user][id][$eq]': user?.id,
          'filters[status_task][$eq]': 'Completed',
          'populate': 'course',
          'pagination[pageSize]': 100,
          'sort': 'completedAt:desc',
          'status': 'published',
        },
      });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch archived tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (task) => {
    try {
      await api.put(`/titles/${task.documentId}`, {
        data: {
          status_task: 'Pending',
          completedAt: null,
        },
      });
      await fetchArchived();
    } catch (err) {
      console.error('Failed to restore task:', err);
    }
  };

  const handleDelete = async (task) => {
    if (!confirm('This will permanently delete this task. Are you sure?')) return;
    try {
      await api.delete(`/titles${task.documentId}`);
      await fetchArchived();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Group tasks by time period
  const grouped = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const recent = [];
    const lastMonth = [];
    const older = [];

    tasks.forEach((task) => {
      const completed = task.completedAt ? new Date(task.completedAt) : null;
      if (!completed || completed >= oneWeekAgo) {
        recent.push(task);
      } else if (completed >= oneMonthAgo) {
        lastMonth.push(task);
      } else {
        older.push(task);
      }
    });

    const groups = [];
    if (recent.length > 0) groups.push({ label: 'Recently Completed', tasks: recent });
    if (lastMonth.length > 0) groups.push({ label: 'Last Month', tasks: lastMonth });
    if (older.length > 0) groups.push({ label: 'Older', tasks: older, faded: true });
    return groups;
  }, [tasks]);

  // Stats
  const totalCompleted = tasks.length;
  const courseBreakdown = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const name = t.course?.name || 'Uncategorized';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [tasks, totalCompleted]);

  // Badge colors for course tags
  const getCourseBadgeStyle = (courseName) => {
    const hash = courseName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const styles = [
      'bg-secondary-container text-secondary',
      'bg-primary-container/30 text-primary-dim',
      'bg-tertiary-container/20 text-tertiary',
      'bg-error-container/30 text-error',
    ];
    return styles[hash % styles.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">Loading archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Header Section */}
      <div className="mb-12">
        <span className="text-[0.6875rem] uppercase tracking-[0.05em] text-primary-dim font-bold mb-2 block">
          History Management
        </span>
        <h2 className="text-[3.5rem] font-bold tracking-tighter leading-none mb-4">Archive</h2>
        <p className="text-on-surface-variant text-lg max-w-2xl">
          A complete record of your academic achievements and finished responsibilities.
        </p>
      </div>

      {/* Archive List */}
      {tasks.length > 0 ? (
        <div className="space-y-4">
          {grouped.map((group, gi) => (
            <div key={gi}>
              <div className={`flex items-center gap-4 ${gi > 0 ? 'mt-12' : ''} mb-6`}>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{group.label}</span>
                <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
              </div>

              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group relative grid grid-cols-[1fr_auto] items-center p-6 rounded-xl bg-surface-container border border-outline-variant/5 hover:border-outline-variant/20 transition-all duration-300 mb-4 ${
                    group.faded ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex gap-6 items-start">
                    <div className="mt-1 flex-shrink-0">
                      <span
                        className="material-symbols-outlined text-secondary/40 text-[28px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-lg font-semibold text-on-surface/50 line-through tracking-tight">
                          {task.title}
                        </h3>
                        {task.course && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${getCourseBadgeStyle(task.course.name)}`}>
                            {task.course.code || task.course.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-on-surface-variant flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          Completed {task.completedAt
                            ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Unknown'}
                        </span>
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Original due: {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.priority === 'High' && (
                          <span className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[14px]">priority_high</span>
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons on Hover */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRestore(task)}
                      className="p-2 hover:bg-surface-container-highest rounded-lg text-primary-dim transition-colors"
                      title="Restore Task"
                    >
                      <span className="material-symbols-outlined">settings_backup_restore</span>
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="p-2 hover:bg-error-container/20 rounded-lg text-error transition-colors"
                      title="Delete Permanently"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-surface-container-highest text-8xl mb-6">inventory_2</span>
          <h3 className="text-2xl font-bold text-on-surface-variant">Archive is empty</h3>
          <p className="text-on-surface-variant max-w-xs mx-auto mt-2">
            Tasks you finish will appear here for your records.
          </p>
        </div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant/10 flex flex-col justify-between">
          <span className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-4">Total Completed</span>
          <div>
            <span className="text-4xl font-black text-primary">{totalCompleted}</span>
            <p className="text-on-surface-variant text-sm mt-1">Tasks archived total</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-4">Course Breakdown</span>
          <div className="space-y-3 relative z-10">
            {courseBreakdown.length > 0 ? (
              courseBreakdown.slice(0, 3).map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface truncate">{item.name}</span>
                    <span className="text-primary-dim">{item.percentage}%</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant text-sm">No data yet</p>
            )}
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant/10 flex flex-col justify-between">
          <span className="text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-4">Storage Policy</span>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Archived tasks are kept indefinitely. Permanent deletion cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}