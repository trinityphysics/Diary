import React, { useState } from 'react';
import type { AppSettings, ClassInfo } from '../types';
import { storage } from '../utils/storage';
import { DAY_NAMES, PERIOD_LABELS } from '../utils/schedule';
import { requestNotificationPermission } from '../utils/notifications';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [classes, setClasses] = useState<ClassInfo[]>(storage.getClasses());
  const [showClassForm, setShowClassForm] = useState(false);
  const [classForm, setClassForm] = useState<Partial<ClassInfo>>({ dayIndex: 0, periodIndex: 0 });
  const [saved, setSaved] = useState(false);

  function saveSettings(updated: AppSettings) {
    storage.setSettings(updated);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function saveClasses(updated: ClassInfo[]) {
    storage.setClasses(updated);
    setClasses(updated);
  }

  function addClass() {
    if (!classForm.name?.trim()) return;
    const newClass: ClassInfo = {
      id: Date.now().toString(),
      name: classForm.name,
      room: classForm.room || '',
      dayIndex: classForm.dayIndex ?? 0,
      periodIndex: classForm.periodIndex ?? 0,
      notes: classForm.notes || '',
    };
    saveClasses([...classes, newClass]);
    setClassForm({ dayIndex: 0, periodIndex: 0 });
    setShowClassForm(false);
  }

  function deleteClass(id: string) {
    saveClasses(classes.filter(c => c.id !== id));
  }

  async function handleNotifToggle() {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      saveSettings({ ...settings, notificationsEnabled: granted });
    } else {
      saveSettings({ ...settings, notificationsEnabled: false });
    }
  }

  return (
    <div className="settings-page">
      <h1 className="page-title">⚙️ Settings</h1>

      <div className="card">
        <h2 className="card__title">👤 Profile</h2>
        <div className="form-group">
          <label>Your Name</label>
          <input
            className="input"
            value={settings.userName}
            onChange={e => saveSettings({ ...settings, userName: e.target.value })}
          />
        </div>
        {saved && <p style={{ color: 'var(--color-success)' }}>✅ Saved!</p>}
      </div>

      <div className="card">
        <h2 className="card__title">🕐 Break Time Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          Select when break happens each day:
        </p>
        <div className="break-options-grid">
          {DAY_NAMES.map((day, i) => (
            <div key={i} className="toggle-row" style={{ marginBottom: '0.5rem' }}>
              <span style={{ minWidth: '90px', fontWeight: 500, fontSize: '0.9rem' }}>{day}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className={`toggle-btn ${settings.breakOptions[i] === 'early' ? 'toggle-btn--on' : ''}`}
                  onClick={() => {
                    const updated = [...settings.breakOptions] as ('early' | 'late')[];
                    updated[i] = 'early';
                    saveSettings({ ...settings, breakOptions: updated });
                  }}
                >
                  10:25
                </button>
                <button
                  className={`toggle-btn ${settings.breakOptions[i] === 'late' ? 'toggle-btn--on' : ''}`}
                  onClick={() => {
                    const updated = [...settings.breakOptions] as ('early' | 'late')[];
                    updated[i] = 'late';
                    saveSettings({ ...settings, breakOptions: updated });
                  }}
                >
                  11:15
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">🔔 Notifications</h2>
        <div className="toggle-row">
          <span>Enable notifications</span>
          <button
            className={`toggle-btn ${settings.notificationsEnabled ? 'toggle-btn--on' : ''}`}
            onClick={handleNotifToggle}
          >
            {settings.notificationsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">📚 Classes</h2>
        <button className="btn btn--primary btn--full" onClick={() => setShowClassForm(!showClassForm)}>
          {showClassForm ? '✕ Cancel' : '+ Add Class'}
        </button>

        {showClassForm && (
          <div className="task-form">
            <div className="form-group">
              <label>Class Name *</label>
              <input className="input" value={classForm.name || ''} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Year 10 Maths" />
            </div>
            <div className="form-group">
              <label>Room</label>
              <input className="input" value={classForm.room || ''} onChange={e => setClassForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. B12" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <select className="input" value={classForm.dayIndex ?? 0} onChange={e => setClassForm(f => ({ ...f, dayIndex: Number(e.target.value) }))}>
                  {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <select className="input" value={classForm.periodIndex ?? 0} onChange={e => setClassForm(f => ({ ...f, periodIndex: Number(e.target.value) }))}>
                  {PERIOD_LABELS.map((p, i) => <option key={i} value={i}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea className="input textarea" value={classForm.notes || ''} onChange={e => setClassForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
            </div>
            <button className="btn btn--primary" onClick={addClass}>Add Class</button>
          </div>
        )}

        {classes.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No classes added yet.</p>
        ) : (
          <ul className="class-list">
            {classes.map(cls => (
              <li key={cls.id} className="class-item">
                <div>
                  <strong>{cls.name}</strong>
                  {cls.room && <span style={{ color: 'var(--text-secondary)' }}> — Rm {cls.room}</span>}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {DAY_NAMES[cls.dayIndex]} — {PERIOD_LABELS[cls.periodIndex]}
                  </div>
                </div>
                <button className="btn btn--small btn--danger" onClick={() => deleteClass(cls.id)}>🗑️</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Settings;
