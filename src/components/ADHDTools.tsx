import React, { useState, useRef } from 'react';
import type { BrainDump, Task } from '../types';
import { storage } from '../utils/storage';

type ADHDSection = 'pomodoro' | 'breakdown' | 'whatwasidoing' | 'braindump';

interface Step {
  id: string;
  text: string;
  done: boolean;
}

const ADHDTools: React.FC = () => {
  const [section, setSection] = useState<ADHDSection>('pomodoro');

  // Pomodoro
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const pomRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Task Breakdown
  const [bigTask, setBigTask] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStep, setNewStep] = useState('');

  // Brain Dump
  const [dumpText, setDumpText] = useState('');
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>(storage.getBrainDumps());

  // Top task - computed inline so no effect needed
  const allTasks = storage.getTasks();
  const topTask: Task | null = allTasks.find(t => !t.completed && t.priority === 'high')
    || allTasks.find(t => !t.completed && t.priority === 'medium')
    || allTasks.find(t => !t.completed) || null;

  function startPomodoro() {
    setPomodoroRunning(true);
    pomRef.current = setInterval(() => {
      setPomodoroSeconds(prev => {
        if (prev <= 1) {
          clearInterval(pomRef.current!);
          setPomodoroRunning(false);
          if (pomodoroMode === 'work') {
            setSessions(s => s + 1);
            setPomodoroMode('break');
            setPomodoroSeconds(5 * 60);
          } else {
            setPomodoroMode('work');
            setPomodoroSeconds(25 * 60);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pausePomodoro() {
    if (pomRef.current) clearInterval(pomRef.current);
    setPomodoroRunning(false);
  }

  function resetPomodoro() {
    if (pomRef.current) clearInterval(pomRef.current);
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroSeconds(25 * 60);
  }

  const pomMins = Math.floor(pomodoroSeconds / 60);
  const pomSecs = pomodoroSeconds % 60;
  const pomTotal = pomodoroMode === 'work' ? 25 * 60 : 5 * 60;
  const pomProgress = ((pomTotal - pomodoroSeconds) / pomTotal) * 100;

  function addStep() {
    if (!newStep.trim()) return;
    setSteps(s => [...s, { id: Date.now().toString(), text: newStep, done: false }]);
    setNewStep('');
  }

  function toggleStep(id: string) {
    setSteps(s => s.map(step => step.id === id ? { ...step, done: !step.done } : step));
  }

  function removeStep(id: string) {
    setSteps(s => s.filter(step => step.id !== id));
  }

  function saveDump() {
    if (!dumpText.trim()) return;
    const dump: BrainDump = {
      id: Date.now().toString(),
      text: dumpText,
      timestamp: new Date().toISOString(),
    };
    const updated = [dump, ...brainDumps];
    storage.setBrainDumps(updated);
    setBrainDumps(updated);
    setDumpText('');
  }

  function deleteDump(id: string) {
    const updated = brainDumps.filter(d => d.id !== id);
    storage.setBrainDumps(updated);
    setBrainDumps(updated);
  }

  return (
    <div className="adhd-page">
      <h1 className="page-title">⚡ ADHD Tools</h1>
      <p className="page-subtitle">No shame here. Your brain works differently — and that's okay. 💙</p>

      <div className="section-tabs">
        {(['pomodoro', 'breakdown', 'whatwasidoing', 'braindump'] as ADHDSection[]).map(s => (
          <button key={s} className={`section-tab ${section === s ? 'section-tab--active' : ''}`} onClick={() => setSection(s)}>
            {s === 'pomodoro' ? '🍅 Focus' : s === 'breakdown' ? '🔨 Break It Down' : s === 'whatwasidoing' ? '🤔 What Was I Doing?' : '🧠 Brain Dump'}
          </button>
        ))}
      </div>

      {section === 'pomodoro' && (
        <div className="card">
          <h2 className="card__title">🍅 Pomodoro Timer</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Work for 25 minutes, break for 5. Your focus is a muscle — train it gently. 💪
          </p>
          <div className={`pomodoro-mode ${pomodoroMode === 'work' ? 'pomodoro-mode--work' : 'pomodoro-mode--break'}`}>
            {pomodoroMode === 'work' ? '🎯 Focus Time' : '☕ Break Time'}
          </div>
          <div className="pomodoro-progress-bar">
            <div className="pomodoro-progress-fill" style={{ width: `${pomProgress}%` }} />
          </div>
          <div className="pomodoro-display">
            {pomMins}:{pomSecs.toString().padStart(2, '0')}
          </div>
          <div className="pomodoro-sessions">Sessions completed: {sessions} 🎉</div>
          <div className="pomodoro-buttons">
            {!pomodoroRunning ? (
              <button className="btn btn--primary" onClick={startPomodoro}>
                {pomodoroSeconds < pomTotal ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button className="btn btn--secondary" onClick={pausePomodoro}>Pause</button>
            )}
            <button className="btn btn--danger" onClick={resetPomodoro}>Reset</button>
          </div>
        </div>
      )}

      {section === 'breakdown' && (
        <div className="card">
          <h2 className="card__title">🔨 Task Breakdown</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Big tasks feel smaller when you break them into tiny steps. You've got this! 🌟</p>
          <div className="form-group">
            <label>The big task</label>
            <input className="input" value={bigTask} onChange={e => setBigTask(e.target.value)} placeholder="e.g. Mark Year 9 essays" />
          </div>
          <div className="form-group form-row">
            <input className="input" value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..." onKeyDown={e => e.key === 'Enter' && addStep()} style={{ flex: 1 }} />
            <button className="btn btn--primary" onClick={addStep}>Add</button>
          </div>
          {bigTask && (
            <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              {bigTask}
            </div>
          )}
          <ul className="step-list">
            {steps.length === 0 && <li style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Add steps above 👆</li>}
            {steps.map((step, i) => (
              <li key={step.id} className={`step-item ${step.done ? 'step-item--done' : ''}`}>
                <button className="task-check" onClick={() => toggleStep(step.id)}>{step.done ? '✅' : '⬜'}</button>
                <span className="step-item__num">{i + 1}.</span>
                <span className="step-item__text">{step.text}</span>
                <button className="task-delete" onClick={() => removeStep(step.id)}>🗑️</button>
              </li>
            ))}
          </ul>
          {steps.length > 0 && (
            <div className="step-progress">
              {steps.filter(s => s.done).length}/{steps.length} steps done
              {steps.every(s => s.done) && ' 🎉 All done!'}
            </div>
          )}
        </div>
      )}

      {section === 'whatwasidoing' && (
        <div>
          <div className="card card--focus" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 className="card__title">🤔 What Was I Doing?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              It's completely normal to lose track. Here's your highest priority task:
            </p>
            {topTask ? (
              <div className="focus-task" style={{ fontSize: '1.4rem' }}>
                📌 {topTask.title}
                {topTask.description && (
                  <p className="focus-task__desc" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{topTask.description}</p>
                )}
                <span className={`priority-badge priority-badge--${topTask.priority}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                  {topTask.priority} priority
                </span>
              </div>
            ) : (
              <p style={{ color: 'var(--color-success)', fontSize: '1.2rem' }}>🎉 No tasks right now — you're caught up!</p>
            )}
          </div>
          <div className="card">
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              💡 Tip: Getting distracted is not a character flaw — it's how ADHD works. You came back, and that's what matters.
            </p>
          </div>
        </div>
      )}

      {section === 'braindump' && (
        <div>
          <div className="card">
            <h2 className="card__title">🧠 Brain Dump</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Get it out of your head and onto the screen. No structure needed — just write. 📝
            </p>
            <textarea
              className="input textarea"
              style={{ minHeight: '120px' }}
              value={dumpText}
              onChange={e => setDumpText(e.target.value)}
              placeholder="Everything that's in your head right now..."
            />
            <button className="btn btn--primary" onClick={saveDump}>Save Thought 💾</button>
          </div>

          {brainDumps.length > 0 && (
            <div className="card">
              <h2 className="card__title">Saved Thoughts</h2>
              <ul className="dump-list">
                {brainDumps.map(dump => (
                  <li key={dump.id} className="dump-item">
                    <div className="dump-item__text">{dump.text}</div>
                    <div className="dump-item__footer">
                      <span className="log-time">{new Date(dump.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <button className="btn btn--small btn--danger" onClick={() => deleteDump(dump.id)}>🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ADHDTools;
