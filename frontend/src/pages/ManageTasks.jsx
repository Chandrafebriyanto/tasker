import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ManageTasks() {
  // const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('deadline');
  const [saving, setSaving] = useState(false);

  const [sidebarKey, setSidebarKey] = useState(0);

  const editingTaskRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    course: '',
    priority: 'Low',
    deadline: '',
    deadlineTime: '',
    description: '',
  });

  useEffect(() => {
    if (location.state?.openNewTask) {
      openNewTaskForm();
    }
    if (location.state?.filterCourse) {
      setFilterMode('byCourse');
    }
    // Clear navigation state
    if (location.state?.openNewTask || location.state?.filterCourse) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        api.get('/titles', {
          params: {
            'filters[status_task][$eq]': 'Pending',
            'populate': 'course',
            'pagination[pageSize]': 100,
            'status': 'published',
          },
        }),
        api.get('/courses', {
          params: {
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

  const openNewTaskForm = () => {
    setEditingTask(null);
    editingTaskRef.current = null;
    setForm({ title: '', course: '', priority: 'Low', deadline: '', deadlineTime: '', description: '' });
    // FIX ISSUE 2: increment key agar sidebar di-remount
    setSidebarKey((k) => k + 1);
    setShowSidebar(true);
  };

  const openEditTaskForm = (task) => {
    // FIX ISSUE 1 (edit): simpan task ke ref agar handleSave selalu
    // membaca nilai terbaru, bebas dari closure stale.
    setEditingTask(task);
    editingTaskRef.current = task;
    let dDate = '';
    let dTime = '';
    if (task.deadline) {
      const d = new Date(task.deadline);
      dDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      dTime = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    setForm({
      title: task.title || '',
      course: task.course?.documentId || task.course?.id?.toString() || '',
      priority: task.priority || 'Low',
      deadline: dDate,
      deadlineTime: dTime,
      description: task.description || '',
    });
    // FIX ISSUE 2: increment key agar sidebar di-remount
    setSidebarKey((k) => k + 1);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setEditingTask(null);
    editingTaskRef.current = null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const currentTask = editingTaskRef.current;

    let finalDeadline = null;
    if (form.deadline) {
      const time = form.deadlineTime || '00:00';
      // Mencegah masalah zona waktu dengan memastikan kita mengubah waktu lokal kita ke UTC untuk Strapi
      finalDeadline = new Date(`${form.deadline}T${time}:00`).toISOString();
    }

    const payload = {
      data: {
        title: form.title,
        description: form.description,
        priority: form.priority,
        deadline: finalDeadline,
        status_task: currentTask ? currentTask.status_task : 'Pending',
        course: form.course ? form.course : null,
        publishedAt: new Date().toISOString(),
      },
    };

    try {
      if (currentTask) {
        await api.put(`/titles/${currentTask.documentId || currentTask.id}`, payload);
      } else {
        await api.post('/titles', payload);
      }
      closeSidebar();
      await fetchData();
    } catch (err) {
      console.error('Failed to save task:', err.response?.data || err);
      alert('Gagal menyimpan task. Coba ulangi lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (task) => {
    try {
      await api.put(`/titles/${task.documentId || task.id}`, {
        data: {
          status_task: 'Completed',
          completedAt: new Date().toISOString(),
        },
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/titles/${task.documentId || task.id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortMode === 'deadline') {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  const groupedTasks = filterMode === 'byCourse'
    ? Object.entries(
        sortedTasks.reduce((acc, task) => {
          const courseName = task.course?.name || 'No Course';
          if (!acc[courseName]) acc[courseName] = [];
          acc[courseName].push(task);
          return acc;
        }, {})
      )
    : [['all', sortedTasks]];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High': return 'bg-error-container text-on-error-container';
      case 'Medium': return 'bg-tertiary-container text-on-tertiary';
      case 'Low': return 'bg-secondary-container text-secondary';
      default: return 'bg-secondary-container text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-slide-up">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">Manage Tasks</h2>
          <p className="text-on-surface-variant max-w-md">Organize your academic workflow with precision. Track deadlines and prioritize your learning objectives.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container rounded-lg p-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${
                filterMode === 'all'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilterMode('byCourse')}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${
                filterMode === 'byCourse'
                  ? 'bg-surface-container-highest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              By Course
            </button>
          </div>

          <button
            onClick={() => setSortMode(sortMode === 'deadline' ? 'priority' : 'deadline')}
            className="flex items-center gap-2 bg-surface-container-highest border border-outline-variant/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-bright transition-all"
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span>{sortMode === 'deadline' ? 'Closest Deadline' : 'Highest Priority'}</span>
          </button>

          <button
            onClick={openNewTaskForm}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Task</span>
          </button>
        </div>
      </header>

      {sortedTasks.length > 0 ? (
        groupedTasks.map(([groupName, groupTasks]) => (
          <div key={groupName} className="mb-8">
            {filterMode === 'byCourse' && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{groupName}</span>
                <div className="h-[1px] flex-1 bg-outline-variant/10"></div>
              </div>
            )}
            <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Task Name</th>
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Course</th>
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Status</th>
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Priority</th>
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold text-right">Deadline</th>
                    <th className="px-6 py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {groupTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-dim opacity-40 group-hover:opacity-100 transition-opacity cursor-grab">drag_indicator</span>
                          <span className="font-medium text-on-surface">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">
                        {task.course?.name || '—'}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-tertiary-container/20 text-tertiary-fixed-dim">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
                          Sedang Dikerjakan
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                          {task.priority === 'Medium' ? 'Med' : task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right text-sm font-mono text-on-surface-variant">
                        {task.deadline
                          ? (() => {
                              const dObj = new Date(task.deadline);
                              const dStr = dObj.toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric' });
                              const h = dObj.getHours();
                              const m = dObj.getMinutes();
                              const tStr = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                              return tStr === '00:00' ? dStr : `${dStr}, ${tStr}`;
                            })()
                          : '—'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMarkComplete(task)}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Mark as completed"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                          {/* Tombol edit selalu visible, tidak disembunyikan */}
                          <button
                            onClick={() => openEditTaskForm(task)}
                            className="p-1.5 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit task"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="p-1.5 hover:bg-error-container/20 rounded-lg text-error transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete task"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-surface-container rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4">assignment</span>
          <h3 className="text-xl font-bold text-on-surface-variant mb-2">No tasks yet</h3>
          <p className="text-on-surface-variant text-sm mb-6">Create your first task to get started with your academic workflow.</p>
          <button
            onClick={openNewTaskForm}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create First Task
          </button>
        </div>
      )}
      </div>

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
            <div className="shrink-0 p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/20 backdrop-blur-md">
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {editingTask ? 'Edit Task' : 'New Academic Task'}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium mt-1">
                  {editingTask ? 'Update your task details.' : 'Fill in the details for your next milestone.'}
                </p>
              </div>
              <button
                onClick={closeSidebar}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Task Name</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g. Linear Algebra Homework"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Associated Course</label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer"
                      value={form.course}
                      onChange={(e) => setForm({ ...form, course: e.target.value })}
                    >
                      <option value="">Select a course</option>
                      {courses.map((c) => (
                        <option key={c.documentId || c.id} value={c.documentId || c.id}>{c.name}</option>
                      ))}
                    </select>
                    {/* FIX ISSUE 1 (UX): tambah chevron icon agar jelas ini dropdown */}
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Deadline</label>
                    <div className="flex gap-2">
                      <input
                        className="w-[50%] bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      />
                      <input
                        className="w-[50%] bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        type="time"
                        value={form.deadlineTime}
                        onChange={(e) => setForm({ ...form, deadlineTime: e.target.value })}
                      />
                    </div> 
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold"></label>
                    
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Priority</label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                  
                </div>

                <div className="space-y-2">
                  <label className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold">Description</label>
                  <textarea
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                    placeholder="Briefly describe what needs to be done..."
                    rows="4"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="shrink-0 p-8 border-t border-outline-variant/10 bg-surface-container-highest/10">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="flex-1 px-6 py-3 rounded-lg border border-outline-variant text-sm font-bold hover:bg-surface-container-highest transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.title}
                    className="flex-1 px-6 py-3 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Saving...
                      </>
                    ) : (
                      editingTask ? 'Update Task' : 'Create Task'
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