import React, { useState } from 'react';
import type { AnxietyLog, CheckingLog, DepartureItem, DepartureLog } from '../types';
import { storage } from '../utils/storage';

type OCDSection = 'anxiety' | 'checking' | 'departure' | 'erp' | 'coping' | 'progress';

const COPING_STRATEGIES = [
  {
    title: '🌬️ Slow Breathing',
    desc: 'Breathe in for 4 counts, hold for 2, out for 6. Repeat 5 times. This activates the parasympathetic nervous system, reducing physiological arousal within 60–90 seconds.',
  },
  {
    title: '🖐️ 5-4-3-2-1 Grounding',
    desc: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Grounds you in the present moment and interrupts the catastrophising loop.',
  },
  {
    title: '🍃 Cognitive Defusion',
    desc: 'Notice thoughts as just thoughts. Say "I notice I am having the thought that..." — you are not your thoughts. Creating distance from thoughts reduces their power over your actions.',
  },
  {
    title: '⛅ Cloud Watching',
    desc: 'Imagine thoughts as clouds passing through the sky. You can observe them without being swept away. This is a core ACT (Acceptance and Commitment Therapy) technique.',
  },
  {
    title: '💪 Urge Surfing',
    desc: 'When you feel an urge to check or seek reassurance, ride it like a wave. Research shows urges peak in 20–30 min and then pass. You are stronger than the urge.',
  },
  {
    title: '📝 Worry Time',
    desc: 'Set aside 15 minutes later to worry. When worries arise now, write them down and defer them. Your brain learns worries can wait — validated in multiple RCTs.',
  },
  {
    title: '🔍 Decatastrophising',
    desc: "When spiralling, ask: \"What's the realistic probability this goes wrong? What would I tell a friend in this situation? What's the worst realistic outcome — and could I cope with it?\"",
  },
  {
    title: '🎯 Values Compass',
    desc: "Ask: \"Is this checking behaviour moving me toward the life I want, or away from it?\" ACT research shows values-based action reduces OCD symptom severity.",
  },
];

function DepartureProtocol() {
  const [items, setItems] = useState<DepartureItem[]>(storage.getDepartureItems());
  const [logs, setLogs] = useState<DepartureLog[]>(storage.getDepartureLogs());
  const [mode, setMode] = useState<'idle' | 'checking' | 'confirmed' | 'manage'>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const lastLog = logs[0] ?? null;

  function startProtocol() {
    setCurrentIndex(0);
    setConfirmedItems([]);
    setMode('checking');
  }

  function confirmItem() {
    const label = items[currentIndex].label;
    const updated = [...confirmedItems, label];
    setConfirmedItems(updated);
    if (currentIndex + 1 >= items.length) {
      const log: DepartureLog = {
        id: Date.now().toString(),
        completedAt: new Date().toISOString(),
        confirmedItems: updated,
      };
      const updatedLogs = [log, ...logs].slice(0, 20);
      storage.setDepartureLogs(updatedLogs);
      setLogs(updatedLogs);
      setMode('confirmed');
    } else {
      setCurrentIndex(i => i + 1);
    }
  }

  function addItem() {
    if (!newLabel.trim()) return;
    const item: DepartureItem = { id: Date.now().toString(), label: newLabel.trim() };
    const updated = [...items, item];
    storage.setDepartureItems(updated);
    setItems(updated);
    setNewLabel('');
  }

  function removeItem(id: string) {
    const updated = items.filter(i => i.id !== id);
    storage.setDepartureItems(updated);
    setItems(updated);
  }

  const shownLog = logs[0] ?? null;

  if (mode === 'checking' && items.length > 0) {
    const item = items[currentIndex];
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 className="card__title">🚪 Leaving Home Protocol</h2>
        <div className="departure-progress">{currentIndex + 1} / {items.length}</div>
        <div className="departure-item-display">
          <div className="departure-item-label">{item.label}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.75rem 0 1.5rem' }}>
            Take a moment. Look at it. Consciously confirm it is safe. Then press confirm.
          </p>
          <button className="btn btn--primary btn--full" onClick={confirmItem}>
            ✅ Confirmed — {item.label}
          </button>
        </div>
        <div className="departure-confirmed-tags">
          {confirmedItems.map(c => <span key={c} className="departure-confirmed-tag">✓ {c}</span>)}
        </div>
        <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => setMode('idle')}>Cancel</button>
      </div>
    );
  }

  if (mode === 'confirmed' && shownLog) {
    const time = new Date(shownLog.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const date = new Date(shownLog.completedAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="departure-confirmed-hero">✅</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.5rem' }}>Departure Confirmed</h2>
        <div className="departure-timestamp">{time}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{date}</div>
        <ul className="departure-confirmed-list-full">
          {shownLog.confirmedItems.map(c => <li key={c}>✓ {c}</li>)}
        </ul>
        <div className="alert alert--info" style={{ marginTop: '1rem', textAlign: 'left' }}>
          💙 If you feel the urge to re-check: open this screen and read the timestamp. You already checked. Your record is your proof. The urge will pass — you do not need to act on it.
        </div>
        <button className="btn btn--secondary btn--full" style={{ marginTop: '0.75rem' }} onClick={() => setMode('idle')}>Done</button>
      </div>
    );
  }

  if (mode === 'manage') {
    return (
      <div>
        <button className="btn btn--secondary" style={{ marginBottom: '1rem' }} onClick={() => setMode('idle')}>← Back</button>
        <div className="card">
          <h2 className="card__title">✏️ Manage Checklist Items</h2>
          <div className="form-row" style={{ marginBottom: '0.75rem' }}>
            <input className="input" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Windows closed" style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addItem()} />
            <button className="btn btn--primary" onClick={addItem}>Add</button>
          </div>
          <ul className="departure-manage-list">
            {items.map(item => (
              <li key={item.id} className="departure-manage-item">
                <span>{item.label}</span>
                <button className="btn btn--small btn--danger" onClick={() => removeItem(item.id)}>🗑️</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2 className="card__title">🚪 Leaving Home Protocol</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Based on ERP: make <strong>one deliberate, conscious check</strong> of each item, documented with a timestamp. When the urge to re-check arises, come back here and view your confirmation instead of physically re-checking.
        </p>
        <div className="departure-items-preview">
          {items.map(i => <span key={i.id} className="departure-item-chip">{i.label}</span>)}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={startProtocol} disabled={items.length === 0}>
            🚪 Start Protocol
          </button>
          {lastLog && (
            <button className="btn btn--secondary" onClick={() => setMode('confirmed')}>
              📋 Last Confirmation
            </button>
          )}
          <button className="btn btn--secondary" onClick={() => setMode('manage')}>
            ✏️ Edit Items
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="card">
          <h2 className="card__title">Recent Departures</h2>
          <ul className="log-list">
            {logs.slice(0, 5).map(log => (
              <li key={log.id} className="log-item">
                <span style={{ color: 'var(--color-success)' }}>✅</span>
                <span style={{ flex: 1 }}>{log.confirmedItems.length} items confirmed</span>
                <span className="log-time">{new Date(log.completedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card--tip">
        <h2 className="card__title">💡 Why This Works</h2>
        <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>
          Re-checking provides temporary relief but increases anxiety long-term by teaching your brain the original check was insufficient. A single mindful, documented check trains your brain to trust your own perception — the foundation of OCD recovery (NICE CG31 guidelines; ERP meta-analysis by Olatunji et al., 2013).
        </p>
      </div>
    </div>
  );
}

function ProgressSection() {
  const logs = storage.getCheckingLogs();
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const thisWeekLogs = logs.filter(l => new Date(l.timestamp) >= startOfThisWeek);
  const lastWeekLogs = logs.filter(l => new Date(l.timestamp) >= startOfLastWeek && new Date(l.timestamp) < startOfThisWeek);

  const thisWeekChecks = thisWeekLogs.reduce((s, l) => s + l.count, 0);
  const lastWeekChecks = lastWeekLogs.reduce((s, l) => s + l.count, 0);

  const daysThisWeek = Math.max(1, ((now.getDay() + 6) % 7) + 1);
  const avgThisWeek = (thisWeekChecks / daysThisWeek).toFixed(1);
  const avgLastWeek = lastWeekLogs.length ? (lastWeekChecks / 7).toFixed(1) : null;

  const trend =
    avgLastWeek === null ? 'nodata'
    : thisWeekChecks / daysThisWeek < lastWeekChecks / 7 ? 'improving'
    : thisWeekChecks / daysThisWeek === lastWeekChecks / 7 ? 'stable'
    : 'more';

  const itemCounts: Record<string, number> = {};
  logs.forEach(l => { itemCounts[l.item] = (itemCounts[l.item] ?? 0) + l.count; });
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = topItems[0]?.[1] ?? 1;

  return (
    <div>
      <div className="card">
        <h2 className="card__title">📈 Checking Behaviour Trends</h2>
        <div className="progress-stats-grid">
          <div className="progress-stat">
            <div className="progress-stat__value">{thisWeekChecks}</div>
            <div className="progress-stat__label">Checks this week</div>
          </div>
          <div className="progress-stat">
            <div className="progress-stat__value">{avgThisWeek}</div>
            <div className="progress-stat__label">Avg checks/day</div>
          </div>
          {avgLastWeek && (
            <div className="progress-stat">
              <div className="progress-stat__value">{lastWeekChecks}</div>
              <div className="progress-stat__label">Checks last week</div>
            </div>
          )}
        </div>
        {trend === 'improving' && <div className="alert alert--success">🎉 You are checking less than last week. That is real progress — celebrate it!</div>}
        {trend === 'stable' && <div className="alert alert--info">📊 Your checking is consistent. Keep logging to track change over time.</div>}
        {trend === 'more' && <div className="alert alert--warning">💙 You have checked more this week. It might be a stressful period. Use the ERP timer and Leaving Protocol to start reducing.</div>}
        {trend === 'nodata' && logs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Start logging your checking behaviour in the Checking tab to see trends here.</p>
        )}
      </div>

      {topItems.length > 0 && (
        <div className="card">
          <h2 className="card__title">🔍 Most Checked Items</h2>
          <ul className="log-list" style={{ listStyle: 'none' }}>
            {topItems.map(([item, count]) => (
              <li key={item} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{item}</span>
                  <span className="log-count">×{count}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px' }}>
                  <div style={{ width: `${Math.min(100, (count / maxCount) * 100)}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '999px' }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card--tip">
        <h2 className="card__title">💡 Research Insight</h2>
        <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>
          Studies show that ERP combined with behaviour tracking reduces OCD symptom severity by 50–70% (Foa et al., 2005; Rosa-Alcázar meta-analysis, 2008). The act of logging and noticing patterns is itself therapeutic — it activates the observational mind rather than the reactive mind.
        </p>
      </div>
    </div>
  );
}

const OCDTools: React.FC = () => {
  const [section, setSection] = useState<OCDSection>('anxiety');

  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [anxietyTrigger, setAnxietyTrigger] = useState('');
  const [anxietyNotes, setAnxietyNotes] = useState('');
  const [anxietyLogs, setAnxietyLogs] = useState<AnxietyLog[]>(storage.getAnxietyLogs());

  const [checkItem, setCheckItem] = useState('');
  const [checkCount, setCheckCount] = useState(1);
  const [checkNotes, setCheckNotes] = useState('');
  const [checkingLogs, setCheckingLogs] = useState<CheckingLog[]>(storage.getCheckingLogs());

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

  const sectionLabels: { id: OCDSection; label: string }[] = [
    { id: 'anxiety', label: '📊 Anxiety' },
    { id: 'checking', label: '🔍 Checking' },
    { id: 'departure', label: '🚪 Leaving' },
    { id: 'erp', label: '⏱️ ERP' },
    { id: 'coping', label: '💡 Coping' },
    { id: 'progress', label: '📈 Progress' },
  ];

  return (
    <div className="ocd-page">
      <h1 className="page-title">🧘 OCD Tools</h1>
      <p className="page-subtitle">Compassionate tools to manage OCD. You are doing so well. 💙</p>

      <div className="section-tabs">
        {sectionLabels.map(s => (
          <button key={s.id} className={`section-tab ${section === s.id ? 'section-tab--active' : ''}`} onClick={() => setSection(s.id)}>
            {s.label}
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
              <div className="anxiety-display" style={{ color: getAnxietyColor(anxietyLevel) }}>{anxietyLevel}/10</div>
            </div>
            <div className="form-group">
              <label>What triggered this? (optional)</label>
              <input className="input" value={anxietyTrigger} onChange={e => setAnxietyTrigger(e.target.value)} placeholder="e.g. leaving the house, driving, work stress..." />
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
              💙 Remember: Checking again will not reduce anxiety long-term — it feeds it. Log the urge instead of acting on it. Use the Leaving Protocol to replace habitual checks.
            </div>
            <div className="form-group">
              <label>What did you check?</label>
              <input className="input" value={checkItem} onChange={e => setCheckItem(e.target.value)} placeholder="e.g. car handbrake, front door, hob..." />
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

      {section === 'departure' && <DepartureProtocol />}

      {section === 'erp' && (
        <div className="card">
          <h2 className="card__title">⏱️ ERP Delay Timer</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Exposure and Response Prevention: Set a delay before you respond to an urge. Sit with the discomfort — it will pass. Each time you resist, the neural pathway for that compulsion weakens. 💙
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
                🎉 Incredible work! You sat with the discomfort and survived it. That is ERP in action. Every time you do this, you retrain your brain.
              </div>
            )}
            <div className="erp-buttons">
              {!erpRunning && erpSecondsLeft === 0 && <button className="btn btn--primary" onClick={startErp}>Start Timer</button>}
              {erpRunning && <button className="btn btn--secondary" onClick={pauseErp}>Pause</button>}
              {!erpRunning && erpSecondsLeft > 0 && !erpComplete && (
                <>
                  <button className="btn btn--primary" onClick={startErp}>Resume</button>
                  <button className="btn btn--danger" onClick={resetErp}>Reset</button>
                </>
              )}
              {erpComplete && <button className="btn btn--secondary" onClick={resetErp}>New Timer</button>}
            </div>
          </div>
        </div>
      )}

      {section === 'coping' && (
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Evidence-based strategies from CBT, ACT, and mindfulness research. 💙</p>
          {COPING_STRATEGIES.map((s, i) => (
            <div key={i} className="card coping-card">
              <h3 className="coping-card__title">{s.title}</h3>
              <p className="coping-card__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      )}

      {section === 'progress' && <ProgressSection />}
    </div>
  );
};

export default OCDTools;
