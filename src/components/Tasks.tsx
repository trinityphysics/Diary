import React, { useState } from 'react';
import type { Task } from '../types';
import { storage } from '../utils/storage';
import { DAY_NAMES, PERIOD_LABELS } from '../utils/schedule';

type FilterType = 'all' | 'today' | 'high' | 'completed';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({
    priority: 'medium',
    completed: false,
  });

  const todayIndex = (() => {
    const d = new Date().getDay();
    return d === 0 ? 4 : d === 6 ? 4 : d - 1;
  })();

  function saveTasks(updated: Task[]) {
    storage.setTasks(updated);
    setTasks(updated);
  }

  function addTask() {
    if (!form.title?.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: form.title,
      description: form.description || '',
      priority: form.priority as Task['priority'] || 'medium',
      completed: false,
      dueDate: form.dueDate || '',
      periodTag: form.periodTag,
      dayTag: form.dayTag,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
    setForm({ priority: 'medium', completed: false });
    setShowForm(false);
  }

  function toggleComplete(id: string) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTask(id: string) {
    saveTasks(tasks.filter(t => t.id !== id));
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = tasks
    .filter(t => {
      if (filter === 'today') return !t.completed && (t.dueDate === todayStr || t.dayTag === todayIndex);
      if (filter === 'high') return !t.completed && t.priority === 'high';
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });

  const topTask = tasks.find(t => !t.completed && t.priority === 'high')
    || tasks.find(t => !t.completed && t.priority === 'medium')
    || tasks.find(t => !t.completed);

  return (
    <div className="tasks-page">
      <h1 className="page-title">✅ Tasks</h1>

      {topTask && (
        <div className="card card--focus">
          <h2 className="card__title">🎯 Focus Right Now</h2>
          <p className="focus-task">{topTask.title}</p>
          {topTask.description && <p className="focus-task__desc">{topTask.description}</p>}
        </div>
      )}

      <div className="card">
        <div className="filter-bar">
          {(['all', 'today', 'high', 'completed'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'high' ? '🔥 High' : '✓ Done'}
            </button>
          ))}
        </div>

        <button className="btn btn--primary btn--full" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Task'}
        </button>

        {showForm && (
          <div className="task-form">
            <div className="form-group">
              <label>Title *</label>
              <input className="input" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="input textarea" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟠 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input className="input" type="date" value={form.dueDate || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day Tag</label>
                <select className="input" value={form.dayTag ?? ''} onChange={e => setForm(f => ({ ...f, dayTag: e.target.value ? Number(e.target.value) : undefined }))}>
                  <option value="">Any</option>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Period Tag</label>
                <select className="input" value={form.periodTag ?? ''} onChange={e => setForm(f => ({ ...f, periodTag: e.target.value ? Number(e.target.value) : undefined }))}>
                  <option value="">Any</option>
                  {PERIOD_LABELS.map((p, i) => <option key={i} value={i}>{p}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn--primary" onClick={addTask}>Add Task</button>
          </div>
        )}

        <ul className="task-list">
          {filtered.length === 0 && <li className="task-list__empty">No tasks here. 🎉</li>}
          {filtered.map(task => (
            <li key={task.id} className={`task-item task-item--${task.priority} ${task.completed ? 'task-item--done' : ''}`}>
              <div className="task-item__main">
                <button className="task-check" onClick={() => toggleComplete(task.id)}>
                  {task.completed ? '✅' : '⬜'}
                </button>
                <div className="task-item__content">
                  <div className="task-item__title">{task.title}</div>
                  {task.description && <div className="task-item__desc">{task.description}</div>}
                  <div className="task-item__meta">
                    <span className={`priority-badge priority-badge--${task.priority}`}>{task.priority}</span>
                    {task.dueDate && <span>📅 {task.dueDate}</span>}
                    {task.dayTag !== undefined && <span>📆 {DAY_NAMES[task.dayTag]}</span>}
                    {task.periodTag !== undefined && <span>🕐 {PERIOD_LABELS[task.periodTag]}</span>}
                  </div>
                </div>
                <button className="task-delete" onClick={() => deleteTask(task.id)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tasks;
