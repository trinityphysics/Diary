import React, { useState } from 'react';
import type { AnxietyLog, CheckingLog } from '../types';
import { storage } from '../utils/storage';

type OCDSection = 'anxiety' | 'checking' | 'erp' | 'coping';

const COPING_STRATEGIES = [
  {
    title: '🌬️ Slow Breathing',
    desc: 'Breathe in for 4 counts, hold for 2, out for 6. Repeat 5 times. This activates the parasympathetic nervous system.',
  },
  {
    title: '🖐️ 5-4-3-2-1 Grounding',
    desc: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Brings you back to the present.',
  },
  {
    title: '🍃 Cognitive Defusion',
    desc: 'Notice thoughts as just thoughts. Say "I notice I am having the thought that..." — you are not your thoughts.',
  },
  {
    title: '⛅ Cloud Watching',
    desc: 'Imagine thoughts as clouds passing through the sky. You can observe them without being swept away.',
  },
  {
    title: '💪 Urge Surfing',
    desc: 'When you feel an urge to check or seek reassurance, ride it like a wave. It will peak and pass. You are stronger than the urge.',
  },
  {
    title: '📝 Worry Time',
    desc: 'Set aside 15 minutes later to worry. When worries arise now, write them down and defer them. Your brain learns worries can wait.',
  },
];

const OCDTools: React.FC = () => {
  const [section, setSection] = useState<OCDSection>('anxiety');

  // Anxiety
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [anxietyTrigger, setAnxietyTrigger] = useState('');
  const [anxietyNotes, setAnxietyNotes] = useState('');
  const [anxietyLogs, setAnxietyLogs] = useState<AnxietyLog[]>(storage.getAnxietyLogs());

  // Checking
  const [checkItem, setCheckItem] = useState('');
  const [checkCount, setCheckCount] = useState(1);
  const [checkNotes, setCheckNotes] = useState('');
  const [checkingLogs, setCheckingLogs] = useState<CheckingLog[]>(storage.getCheckingLogs());

  // ERP Timer
  const [erpMinutes, setErpMinutes] = useState(10);
  const [erpSecondsLeft, setErpSecondsLeft] = useState(0);
  const [erpRunning, setErpRunning] = useState(false);
  const [erpComplete, setErpComplete] = useState(false);
  const erpRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  function logAnxiety() {
    const log: AnxietyLog = {
      id: Date.now().toString(),
      level: anxietyLevel,
      trigger: anxietyTrigger,
      notes: anxietyNotes,
      timestamp: new Date().toISOString(),
    };
    const updated = [log, ...anxietyLogs].slice(0, 20);
    storage.setAnxietyLogs(updated);
    setAnxietyLogs(updated);
    setAnxietyTrigger('');
    setAnxietyNotes('');
  }

  function logChecking() {
    if (!checkItem.trim()) return;
    const log: CheckingLog = {
      id: Date.now().toString(),
      item: checkItem,
      count: checkCount,
      notes: checkNotes,
      timestamp: new Date().toISOString(),
    };
    const updated = [log, ...checkingLogs].slice(0, 20);
    storage.setCheckingLogs(updated);
    setCheckingLogs(updated);
    setCheckItem('');
    setCheckCount(1);
    setCheckNotes('');
  }

  function startErp() {
    setErpSecondsLeft(erpMinutes * 60);
    setErpRunning(true);
    setErpComplete(false);
    erpRef.current = setInterval(() => {
      setErpSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(erpRef.current!);
          setErpRunning(false);
          setErpComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pauseErp() {
    if (erpRef.current) clearInterval(erpRef.current);
    setErpRunning(false);
  }

  function resetErp() {
    if (erpRef.current) clearInterval(erpRef.current);
    setErpRunning(false);
    setErpSecondsLeft(0);
    setErpComplete(false);
  }

  const erpMins = Math.floor(erpSecondsLeft / 60);
  const erpSecs = erpSecondsLeft % 60;

  function getAnxietyColor(level: number): string {
    if (level <= 3) return 'var(--color-success)';
    if (level <= 6) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  return (
    <div className="ocd-page">
      <h1 className="page-title">🧘 OCD Tools</h1>
      <p className="page-subtitle">Compassionate tools to help manage OCD. You are doing so well. 💙</p>

      <div className="section-tabs">
        {(['anxiety', 'checking', 'erp', 'coping'] as OCDSection[]).map(s => (
          <button key={s} className={`section-tab ${section === s ? 'section-tab--active' : ''}`} onClick={() => setSection(s)}>
            {s === 'anxiety' ? '📊 Anxiety' : s === 'checking' ? '🔍 Checking' : s === 'erp' ? '⏱️ ERP' : '💡 Coping'}
          </button>
        ))}
      </div>

      {section === 'anxiety' && (
        <div>
          <div className="card">
            <h2 className="card__title">📊 Log Anxiety Level</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No judgment — just awareness. How are you feeling right now?</p>
            <div className="anxiety-slider">
              <input type="range" min="1" max="10" value={anxietyLevel} onChange={e => setAnxietyLevel(Number(e.target.value))} className="slider" />
              <div className="anxiety-display" style={{ color: getAnxietyColor(anxietyLevel) }}>
                {anxietyLevel}/10
              </div>
            </div>
            <div className="form-group">
              <label>What triggered this? (optional)</label>
              <input className="input" value={anxietyTrigger} onChange={e => setAnxietyTrigger(e.target.value)} placeholder="e.g. lesson observation, parent email..." />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea className="input textarea" value={anxietyNotes} onChange={e => setAnxietyNotes(e.target.value)} placeholder="Anything else you want to note..." />
            </div>
            <button className="btn btn--primary" onClick={logAnxiety}>Log</button>
          </div>

          {anxietyLogs.length > 0 && (
            <div className="card">
              <h2 className="card__title">Recent Logs</h2>
              <ul className="log-list">
                {anxietyLogs.slice(0, 5).map(log => (
                  <li key={log.id} className="log-item">
                    <span className="log-level" style={{ color: getAnxietyColor(log.level) }}>{log.level}/10</span>
                    <span>{log.trigger || 'No trigger noted'}</span>
                    <span className="log-time">{new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {section === 'checking' && (
        <div>
          <div className="card">
            <h2 className="card__title">🔍 Checking Log</h2>
            <div className="alert alert--info">
              💙 Remember: You've already checked. Checking again will not reduce anxiety long-term — it feeds it.
            </div>
            <div className="form-group">
              <label>What did you check?</label>
              <input className="input" value={checkItem} onChange={e => setCheckItem(e.target.value)} placeholder="e.g. locked the classroom, turned off lights..." />
            </div>
            <div className="form-group">
              <label>How many times?</label>
              <input className="input" type="number" min="1" value={checkCount} onChange={e => setCheckCount(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea className="input textarea" value={checkNotes} onChange={e => setCheckNotes(e.target.value)} placeholder="How did you feel?" />
            </div>
            <button className="btn btn--primary" onClick={logChecking}>Log Check</button>
          </div>

          {checkingLogs.length > 0 && (
            <div className="card">
              <h2 className="card__title">Recent Checks</h2>
              <ul className="log-list">
                {checkingLogs.slice(0, 5).map(log => (
                  <li key={log.id} className="log-item">
                    <span>{log.item}</span>
                    <span className="log-count">×{log.count}</span>
                    <span className="log-time">{new Date(log.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {section === 'erp' && (
        <div className="card">
          <h2 className="card__title">⏱️ ERP Delay Timer</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Exposure and Response Prevention: Set a delay before you respond to an urge. Sit with the discomfort — it will pass. You are stronger than you think. 💙
          </p>

          {!erpRunning && erpSecondsLeft === 0 && (
            <div className="form-group">
              <label>Delay duration (minutes): {erpMinutes}</label>
              <input type="range" min="5" max="30" value={erpMinutes} onChange={e => setErpMinutes(Number(e.target.value))} className="slider" />
            </div>
          )}

          <div className="erp-timer">
            <div className="erp-display">
              {erpSecondsLeft > 0 ? `${erpMins}:${erpSecs.toString().padStart(2, '0')}` : `${erpMinutes}:00`}
            </div>
            {erpComplete && (
              <div className="alert alert--success">
                🎉 Incredible work! You sat with the discomfort and survived it. That is ERP in action. Be proud of yourself!
              </div>
            )}
            <div className="erp-buttons">
              {!erpRunning && erpSecondsLeft === 0 && (
                <button className="btn btn--primary" onClick={startErp}>Start Timer</button>
              )}
              {erpRunning && (
                <button className="btn btn--secondary" onClick={pauseErp}>Pause</button>
              )}
              {!erpRunning && erpSecondsLeft > 0 && !erpComplete && (
                <>
                  <button className="btn btn--primary" onClick={startErp}>Resume</button>
                  <button className="btn btn--danger" onClick={resetErp}>Reset</button>
                </>
              )}
              {erpComplete && (
                <button className="btn btn--secondary" onClick={resetErp}>New Timer</button>
              )}
            </div>
          </div>
        </div>
      )}

      {section === 'coping' && (
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Evidence-based strategies to help you through difficult moments. 💙</p>
          {COPING_STRATEGIES.map((s, i) => (
            <div key={i} className="card coping-card">
              <h3 className="coping-card__title">{s.title}</h3>
              <p className="coping-card__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OCDTools;
