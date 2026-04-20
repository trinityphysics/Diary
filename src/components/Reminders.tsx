import React, { useState } from 'react';
import type { Reminder } from '../types';
import { storage } from '../utils/storage';
import { requestNotificationPermission } from '../utils/notifications';

type ReminderType = Reminder['type'];

const TYPE_LABELS: Record<ReminderType, string> = {
  'before-school': '🌅 Before School',
  'start-period': '▶️ Start of Period',
  'end-period': '⏹️ End of Period',
  'break': '☕ Break',
  'lunch': '🥗 Lunch',
  'after-school': '🌆 After School',
};

const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>(storage.getReminders());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Reminder>>({ type: 'start-period', active: true, isPriorityEveryLesson: false });
  const [notifStatus, setNotifStatus] = useState<string>('');

  function saveReminders(updated: Reminder[]) {
    storage.setReminders(updated);
    setReminders(updated);
  }

  function toggleActive(id: string) {
    saveReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  function togglePriority(id: string) {
    saveReminders(reminders.map(r => r.id === id ? { ...r, isPriorityEveryLesson: !r.isPriorityEveryLesson } : r));
  }

  function deleteReminder(id: string) {
    saveReminders(reminders.filter(r => r.id !== id));
  }

  function addReminder() {
    if (!form.text?.trim()) return;
    const newReminder: Reminder = {
      id: Date.now().toString(),
      text: form.text,
      type: form.type as ReminderType || 'start-period',
      active: true,
      isPriorityEveryLesson: form.isPriorityEveryLesson || false,
    };
    saveReminders([...reminders, newReminder]);
    setForm({ type: 'start-period', active: true, isPriorityEveryLesson: false });
    setShowForm(false);
  }

  async function handleNotifRequest() {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? '✅ Notifications enabled!' : '❌ Permission denied');
  }

  const types: ReminderType[] = ['before-school', 'start-period', 'end-period', 'break', 'lunch', 'after-school'];

  return (
    <div className="reminders-page">
      <h1 className="page-title">🔔 Reminders</h1>

      <div className="card">
        <h2 className="card__title">🔕 Notifications</h2>
        <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Enable browser notifications to get alerted at key times.</p>
        <button className="btn btn--secondary" onClick={handleNotifRequest}>Request Notification Permission</button>
        {notifStatus && <p style={{ marginTop: '0.5rem', color: 'var(--color-success)' }}>{notifStatus}</p>}
      </div>

      <div className="card">
        <button className="btn btn--primary btn--full" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Reminder'}
        </button>

        {showForm && (
          <div className="task-form">
            <div className="form-group">
              <label>Reminder Text *</label>
              <input className="input" value={form.text || ''} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="What to remember..." />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ReminderType }))}>
                {types.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={form.isPriorityEveryLesson || false} onChange={e => setForm(f => ({ ...f, isPriorityEveryLesson: e.target.checked }))} />
                Show on dashboard every lesson
              </label>
            </div>
            <button className="btn btn--primary" onClick={addReminder}>Add Reminder</button>
          </div>
        )}
      </div>

      {types.map(type => {
        const group = reminders.filter(r => r.type === type);
        if (group.length === 0) return null;
        return (
          <div key={type} className="card">
            <h2 className="card__title">{TYPE_LABELS[type]}</h2>
            <ul className="reminder-list">
              {group.map(r => (
                <li key={r.id} className={`reminder-item ${r.active ? '' : 'reminder-item--inactive'}`}>
                  <div className="reminder-item__text">
                    <span>{r.text}</span>
                    {r.isPriorityEveryLesson && <span className="priority-badge priority-badge--high">Every Lesson</span>}
                  </div>
                  <div className="reminder-item__actions">
                    <button className="btn btn--small btn--secondary" onClick={() => togglePriority(r.id)}>
                      {r.isPriorityEveryLesson ? '⭐' : '☆'}
                    </button>
                    <button className={`btn btn--small ${r.active ? 'btn--primary' : 'btn--secondary'}`} onClick={() => toggleActive(r.id)}>
                      {r.active ? 'ON' : 'OFF'}
                    </button>
                    <button className="btn btn--small btn--danger" onClick={() => deleteReminder(r.id)}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default Reminders;
