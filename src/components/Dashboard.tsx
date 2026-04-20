import React, { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { getPeriods, getCurrentPeriod, getNextPeriod, formatTime, getMinutesUntil, DAY_NAMES } from '../utils/schedule';
import type { AppSettings, Task, Reminder } from '../types';

const TIPS = [
  "You don't have to do everything perfectly. Done is better than perfect. 💙",
  "One step at a time. You only need to focus on the next period. 🌱",
  "It's okay to feel overwhelmed. Take three slow breaths right now. 🌬️",
  "You've handled difficult days before. You can handle this one too. 💪",
  "Your best is enough. The students are lucky to have you. ⭐",
  "Uncertainty is uncomfortable but manageable. You are safe. 🔒",
  "A thought is just a thought — not a fact, not a command. 🍃",
  "Small wins count. What's one tiny thing you accomplished today? 🎉",
  "Rest is productive. Your brain needs breaks to work well. ☕",
  "You are not your anxiety. You are the observer of it. 👁️",
];

function calcSleepEfficiency(log: { bedtime: string; sleepOnset: string; wakeTime: string; interruptions: number }): number {
  const MINS = 1440;
  const PENALTY = 15;
  function timeToMinutes(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  const bed = timeToMinutes(log.bedtime), onset = timeToMinutes(log.sleepOnset), wake = timeToMinutes(log.wakeTime);
  const tib = wake >= bed ? wake - bed : (wake + MINS) - bed;
  let sleep = wake >= onset ? wake - onset : (wake + MINS) - onset;
  sleep = Math.max(0, sleep - log.interruptions * PENALTY);
  return tib > 0 ? Math.round((sleep / tib) * 100) : 0;
}

const Dashboard: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [reminders, setReminders] = useState<Reminder[]>(storage.getReminders());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setSettings(storage.getSettings());
      setTasks(storage.getTasks());
      setReminders(storage.getReminders());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const jsDay = now.getDay();
  const dayIndex = jsDay === 0 ? 4 : jsDay === 6 ? 4 : jsDay - 1;
  const dayName = DAY_NAMES[dayIndex];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const periods = getPeriods(dayIndex, settings.breakOptions[dayIndex]);
  const currentPeriod = getCurrentPeriod(dayIndex, settings.breakOptions[dayIndex]);
  const nextPeriod = getNextPeriod(dayIndex, settings.breakOptions[dayIndex]);

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Wellbeing metrics ──────────────────────────────────────────
  const sleepLogs = storage.getSleepLogs();
  const lastSleepLog = sleepLogs[0] ?? null;
  const ouraLatest = storage.getOuraLatest();
  const anxietyLogs = storage.getAnxietyLogs();

  // Sleep score: prefer Oura score (0-100), else manual quality (1-10 scaled to 0-100)
  const sleepScore: number | null = ouraLatest?.score ?? (lastSleepLog ? lastSleepLog.quality * 10 : null);
  const sleepScoreSource = ouraLatest?.score != null ? 'oura' : lastSleepLog ? 'manual' : null;
  const sleepEfficiency = lastSleepLog ? calcSleepEfficiency(lastSleepLog) : null;

  // HRV from Oura
  const hrv: number | null = ouraLatest?.average_hrv ?? null;

  // Anxiety: today's average, or last 7 days average
  const todayStr = now.toISOString().slice(0, 10);
  const todayAnxiety = anxietyLogs.filter(l => l.timestamp.startsWith(todayStr));
  const recent7Anxiety = anxietyLogs.slice(0, 14).filter(l => {
    const d = new Date(l.timestamp);
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });
  const anxietySource = todayAnxiety.length > 0 ? todayAnxiety : recent7Anxiety;
  const avgAnxiety: number | null = anxietySource.length > 0
    ? Math.round((anxietySource.reduce((s, l) => s + l.level, 0) / anxietySource.length) * 10) / 10
    : null;

  function sleepScoreColor(s: number): string {
    if (s >= 80) return 'var(--color-success)';
    if (s >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  function hrvColor(h: number): string {
    if (h >= 50) return 'var(--color-success)';
    if (h >= 30) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  function anxietyColor(a: number): string {
    if (a <= 3) return 'var(--color-success)';
    if (a <= 6) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  function anxietyLabel(): string {
    if (todayAnxiety.length > 0) return 'Anxiety today';
    if (avgAnxiety !== null) return 'Anxiety (7d avg)';
    return 'Anxiety /10';
  }

  // ── Today's overview ───────────────────────────────────────────
  const pendingTasks = tasks.filter(t => !t.completed);
  const highTasks = pendingTasks.filter(t => t.priority === 'high').slice(0, 3);
  const medTasks = pendingTasks.filter(t => t.priority === 'medium').slice(0, 2);
  const overviewTasks = highTasks.length > 0 ? highTasks : medTasks.slice(0, 3);
  const priorityReminders = reminders.filter(r => r.active && r.isPriorityEveryLesson);

  const tipIndex = Math.floor(now.getDate() + now.getMonth() * 31) % TIPS.length;
  const tip = TIPS[tipIndex];

  function getPeriodStatus(p: typeof periods[0]): 'past' | 'current' | 'upcoming' {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [eh, em] = p.endTime.split(':').map(Number);
    const endMins = eh * 60 + em;
    const [sh, sm] = p.startTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    if (currentMins >= endMins) return 'past';
    if (currentMins >= startMins) return 'current';
    return 'upcoming';
  }

  return (
    <div className="dashboard">
      {/* ── Hero ── */}
      <div className="card card--hero">
        <div className="hero-time">{timeStr}</div>
        <div className="hero-date">{dateStr}</div>
        <div className="hero-greeting">{greeting}, {settings.userName}! 👋</div>
      </div>

      {/* ── Wellbeing Metrics ── */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card__icon">🌙</div>
          <div
            className="metric-card__value"
            style={{ color: sleepScore !== null ? sleepScoreColor(sleepScore) : 'var(--text-light)' }}
          >
            {sleepScore !== null ? sleepScore : '—'}
          </div>
          <div className="metric-card__label">
            Sleep{sleepScoreSource === 'oura' ? ' (Oura)' : sleepScoreSource === 'manual' ? ' score' : ''}
          </div>
          {sleepEfficiency !== null && sleepScoreSource === 'manual' && (
            <div className="metric-card__sub">{sleepEfficiency}% eff.</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-card__icon">💓</div>
          <div
            className="metric-card__value"
            style={{ color: hrv !== null ? hrvColor(hrv) : 'var(--text-light)' }}
          >
            {hrv !== null ? hrv : '—'}
          </div>
          <div className="metric-card__label">HRV {hrv !== null ? 'ms' : '(Oura)'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__icon">🧘</div>
          <div
            className="metric-card__value"
            style={{ color: avgAnxiety !== null ? anxietyColor(avgAnxiety) : 'var(--text-light)' }}
          >
            {avgAnxiety !== null ? avgAnxiety : '—'}
          </div>
          <div className="metric-card__label">{anxietyLabel()}</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__icon">✅</div>
          <div
            className="metric-card__value"
            style={{ color: pendingTasks.length === 0 ? 'var(--color-success)' : pendingTasks.length <= 3 ? 'var(--color-warning)' : 'var(--color-danger)' }}
          >
            {pendingTasks.length}
          </div>
          <div className="metric-card__label">Tasks left</div>
        </div>
      </div>

      {/* ── Right Now ── */}
      <div className="card">
        <h2 className="card__title">📍 Right Now</h2>
        {currentPeriod ? (
          <div className="period-status period-status--current">
            <strong>{currentPeriod.label}</strong>
            <span>{formatTime(currentPeriod.startTime)} – {formatTime(currentPeriod.endTime)}</span>
            <span className="period-status__countdown">
              Ends in {getMinutesUntil(currentPeriod.endTime)} min
            </span>
          </div>
        ) : nextPeriod ? (
          <div className="period-status period-status--next">
            <span>Next: <strong>{nextPeriod.label}</strong> at {formatTime(nextPeriod.startTime)}</span>
            <span className="period-status__countdown">
              In {getMinutesUntil(nextPeriod.startTime)} min
            </span>
          </div>
        ) : (
          <div className="period-status">
            <span>School day complete! Well done. 🎉</span>
          </div>
        )}
      </div>

      {/* ── Today's Overview ── */}
      {(overviewTasks.length > 0 || priorityReminders.length > 0) && (
        <div className="card">
          <h2 className="card__title">📋 Today's Overview</h2>

          {overviewTasks.length > 0 && (
            <>
              <div className="overview-section-label">
                {highTasks.length > 0 ? '🔥 High priority' : '📌 Tasks to do'}
              </div>
              <ul className="task-list task-list--compact">
                {overviewTasks.map(task => (
                  <li key={task.id} className={`task-item task-item--${task.priority}`}>
                    <div className="task-item__main">
                      <div className="task-item__content">
                        <div className="task-item__title">{task.title}</div>
                        {task.dueDate && <div className="task-item__due">Due: {task.dueDate}</div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {pendingTasks.length > overviewTasks.length && (
                <div className="overview-more">+{pendingTasks.length - overviewTasks.length} more tasks</div>
              )}
            </>
          )}

          {priorityReminders.length > 0 && (
            <>
              <div className="overview-section-label" style={{ marginTop: overviewTasks.length > 0 ? '0.75rem' : 0 }}>
                ⚡ Every lesson checklist
              </div>
              <ul className="checklist">
                {priorityReminders.map(r => (
                  <li key={r.id} className="checklist__item">☐ {r.text}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ── Today's Timeline ── */}
      <div className="card">
        <h2 className="card__title">📆 Timeline — {dayName}</h2>
        <div className="timeline">
          {periods.map((p, i) => {
            const status = getPeriodStatus(p);
            return (
              <div key={i} className={`timeline-slot timeline-slot--${status} ${p.isBreak ? 'timeline-slot--break' : ''} ${p.isLunch ? 'timeline-slot--lunch' : ''}`}>
                <div className="timeline-slot__time">{formatTime(p.startTime)}</div>
                <div className="timeline-slot__label">{p.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tip ── */}
      <div className="card card--tip">
        <h2 className="card__title">💡 Tip of the Day</h2>
        <p className="tip-text">{tip}</p>
      </div>
    </div>
  );
};

export default Dashboard;
