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

  const jsDay = now.getDay(); // 0=Sun
  const dayIndex = jsDay === 0 ? 4 : jsDay === 6 ? 4 : jsDay - 1; // Map to Mon=0..Fri=4
  const dayName = DAY_NAMES[dayIndex];
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const periods = getPeriods(dayIndex, settings.breakTimeOption);
  const currentPeriod = getCurrentPeriod(dayIndex, settings.breakTimeOption);
  const nextPeriod = getNextPeriod(dayIndex, settings.breakTimeOption);

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const topTasks = tasks
    .filter(t => !t.completed && t.priority === 'high')
    .slice(0, 3);

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
      <div className="card card--hero">
        <div className="hero-time">{timeStr}</div>
        <div className="hero-date">{dateStr}</div>
        <div className="hero-greeting">{greeting}, {settings.userName}! 👋</div>
      </div>

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

      <div className="card">
        <h2 className="card__title">📆 Today's Timeline — {dayName}</h2>
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

      {topTasks.length > 0 && (
        <div className="card">
          <h2 className="card__title">🔥 High Priority Tasks</h2>
          <ul className="task-list task-list--compact">
            {topTasks.map(task => (
              <li key={task.id} className="task-item task-item--high">
                <span>{task.title}</span>
                {task.dueDate && <span className="task-item__due">Due: {task.dueDate}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {priorityReminders.length > 0 && (
        <div className="card">
          <h2 className="card__title">⚡ Every Lesson Checklist</h2>
          <ul className="checklist">
            {priorityReminders.map(r => (
              <li key={r.id} className="checklist__item">
                <span>☐ {r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card--tip">
        <h2 className="card__title">💡 Tip of the Day</h2>
        <p className="tip-text">{tip}</p>
      </div>
    </div>
  );
};

export default Dashboard;
