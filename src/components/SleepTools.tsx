import React, { useState, useEffect, useRef } from 'react';
import type { SleepLog, SleepSettings } from '../types';
import { storage } from '../utils/storage';

type SleepSection = 'diary' | 'cbti' | 'onset' | 'oura';
type OnsetTechnique = 'breathing' | 'pmr' | 'shuffle' | 'paradox' | null;
type BreathPhase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'done';
type PmrPhase = 'ready' | 'tense' | 'release' | 'next' | 'done';

interface OuraSleep {
  day: string;
  score: number | null;
  total_sleep_duration: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  efficiency: number;
  average_hrv: number | null;
  lowest_heart_rate: number | null;
  bedtime_start: string;
  bedtime_end: string;
}

const PMR_STEPS = [
  { group: 'Feet & Calves', tense: 'Curl your toes tightly and flex your feet upward', release: 'Let your feet drop and feel the warmth spreading through your lower legs' },
  { group: 'Thighs & Buttocks', tense: 'Tighten your thigh muscles and squeeze your buttocks', release: 'Release and feel the heaviness as tension melts away' },
  { group: 'Stomach', tense: 'Pull your stomach in tight', release: 'Let your belly soften and your breathing slow and deepen' },
  { group: 'Hands & Forearms', tense: 'Make tight fists and tense your forearms', release: 'Open your hands and let your arms sink into the bed' },
  { group: 'Upper Arms & Shoulders', tense: 'Shrug your shoulders up to your ears', release: 'Drop your shoulders completely and feel the release across your back' },
  { group: 'Face & Neck', tense: 'Squeeze your eyes, scrunch your nose, tighten your jaw', release: 'Let your face soften completely — jaw unclenched, eyes gentle, forehead smooth' },
];

const CBTI_RULES = [
  { icon: '⏰', rule: 'Keep a consistent wake time', detail: 'Wake at the same time every day including weekends. This is the single most evidence-backed CBT-I strategy. It anchors your circadian rhythm and drives sleep pressure.' },
  { icon: '🛏️', rule: 'Use bed only for sleep', detail: 'Avoid reading, phones, or watching TV in bed. This strengthens the bed-sleep association in your brain via stimulus control (Bootzin, 1972).' },
  { icon: '😴', rule: 'Only go to bed when sleepy', detail: 'Wait for genuine drowsiness — heavy eyes, nodding. Going to bed too early creates sleep performance anxiety, making insomnia worse.' },
  { icon: '🚶', rule: 'Get up if awake >20 min', detail: 'Go to a dim room and do something quiet (read a physical book). Return only when sleepy. This prevents your brain associating bed with wakefulness.' },
  { icon: '☕', rule: 'No caffeine after 2pm', detail: 'Caffeine has a 5–7 hour half-life. Even afternoon coffee can reduce deep sleep by up to 20% (Drake et al., 2013).' },
  { icon: '📵', rule: 'Screen-free 60 min before bed', detail: 'Blue light suppresses melatonin by up to 85% and delays circadian phase. Dim all lights 1 hour before target bedtime.' },
  { icon: '🌡️', rule: 'Keep bedroom cool', detail: 'Core body temperature must drop ~1°C to initiate sleep. 16–19°C (60–67°F) is the evidence-based optimal range.' },
  { icon: '🚫', rule: 'Avoid clock-watching', detail: 'Checking the time during the night activates the stress response. Turn your clock away from view.' },
];

const MINUTES_IN_DAY = 1440;
const INTERRUPTION_PENALTY_MINUTES = 15;
const MIN_SLEEP_DURATION_SECONDS = 3600;

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHhMm(mins: number): string {
  const safeMins = Math.max(0, mins);
  const h = Math.floor(safeMins / 60);
  const m = safeMins % 60;
  return `${h}h ${m}m`;
}

function formatDuration(seconds: number): string {
  return minutesToHhMm(Math.round(seconds / 60));
}

// ─── Breathing Guide ───────────────────────────────────────────────────────
function BreathingGuide({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<BreathPhase>('ready');
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PHASES: { phase: BreathPhase; duration: number; label: string; color: string }[] = [
    { phase: 'inhale', duration: 4, label: 'Breathe IN', color: 'var(--color-primary)' },
    { phase: 'hold', duration: 7, label: 'HOLD', color: 'var(--color-warning)' },
    { phase: 'exhale', duration: 8, label: 'Breathe OUT', color: 'var(--color-success)' },
  ];

  function startBreathing() {
    setPhase('inhale');
    setCycle(1);
    setCount(4);
    runPhase('inhale', 4, 1);
  }

  function runPhase(ph: BreathPhase, duration: number, cyc: number) {
    let remaining = duration;
    setCount(remaining);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        nextPhase(ph, cyc);
      }
    }, 1000);
  }

  function nextPhase(currentPhase: BreathPhase, cyc: number) {
    if (currentPhase === 'inhale') {
      setPhase('hold');
      runPhase('hold', 7, cyc);
    } else if (currentPhase === 'hold') {
      setPhase('exhale');
      runPhase('exhale', 8, cyc);
    } else if (currentPhase === 'exhale') {
      if (cyc >= 4) {
        setPhase('done');
      } else {
        const nextCyc = cyc + 1;
        setCycle(nextCyc);
        setPhase('inhale');
        runPhase('inhale', 4, nextCyc);
      }
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const currentConfig = PHASES.find(p => p.phase === phase);
  const circleSize = phase === 'inhale' ? '140px' : phase === 'exhale' ? '80px' : '110px';

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2 className="card__title">🌬️ 4-7-8 Breathing</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Inhale 4s → Hold 7s → Exhale 8s. 4 cycles. Activates parasympathetic nervous system (Jerath et al., 2015).
      </p>

      {phase === 'ready' && (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Find a comfortable position. Close your eyes when ready.</p>
          <button className="btn btn--primary" onClick={startBreathing}>Begin</button>
        </>
      )}

      {phase !== 'ready' && phase !== 'done' && (
        <div className="breathing-circle-container">
          <div
            className="breathing-circle"
            style={{ width: circleSize, height: circleSize, background: currentConfig?.color, transition: `all ${currentConfig?.duration ?? 1}s ease` }}
          />
          <div className="breathing-phase-label" style={{ color: currentConfig?.color }}>{currentConfig?.label}</div>
          <div className="breathing-count">{count}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Cycle {cycle} of 4</div>
        </div>
      )}

      {phase === 'done' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌙</div>
          <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '1rem' }}>All 4 cycles complete. Well done.</p>
          <button className="btn btn--secondary" onClick={startBreathing} style={{ marginRight: '0.5rem' }}>Repeat</button>
          <button className="btn btn--secondary" onClick={onClose}>Done</button>
        </div>
      )}
      {phase !== 'done' && phase !== 'ready' && (
        <button className="btn btn--secondary" style={{ marginTop: '1rem' }} onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('ready'); }}>Stop</button>
      )}
      {phase === 'ready' && <button className="btn btn--secondary btn--small" style={{ marginTop: '1rem' }} onClick={onClose}>← Back</button>}
    </div>
  );
}

// ─── PMR Guide ─────────────────────────────────────────────────────────────
function PmrGuide({ onClose }: { onClose: () => void }) {
  const [phase, setPmrPhase] = useState<PmrPhase>('ready');
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startPmr() {
    setStep(0);
    beginTense(0);
  }

  function beginTense(s: number) {
    setPmrPhase('tense');
    setStep(s);
    setCount(5);
    let remaining = 5;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        beginRelease(s);
      }
    }, 1000);
  }

  function beginRelease(s: number) {
    setPmrPhase('release');
    setCount(15);
    let remaining = 15;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCount(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        if (s + 1 >= PMR_STEPS.length) {
          setPmrPhase('done');
        } else {
          setPmrPhase('next');
          setTimeout(() => beginTense(s + 1), 2000);
        }
      }
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const currentStep = PMR_STEPS[step];

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2 className="card__title">💆 Progressive Muscle Relaxation</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Tense each muscle group for 5s, then release for 15s. (Jacobson, 1938; extensively validated in CBT-I.)
      </p>

      {phase === 'ready' && (
        <>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Lie down comfortably. We will work through 6 muscle groups.</p>
          <button className="btn btn--primary" onClick={startPmr}>Begin PMR</button>
          <br />
          <button className="btn btn--secondary btn--small" style={{ marginTop: '1rem' }} onClick={onClose}>← Back</button>
        </>
      )}

      {(phase === 'tense' || phase === 'release' || phase === 'next') && currentStep && (
        <div>
          <div className="pmr-step-label">{currentStep.group}</div>
          <div className={`pmr-phase-badge pmr-phase-badge--${phase}`}>
            {phase === 'tense' ? '💪 TENSE' : phase === 'release' ? '✨ RELEASE' : '⏳ Prepare...'}
          </div>
          <div className="pmr-instruction">{phase === 'tense' ? currentStep.tense : currentStep.release}</div>
          {phase !== 'next' && <div className="pmr-count">{count}</div>}
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Step {step + 1} of {PMR_STEPS.length}</div>
        </div>
      )}

      {phase === 'done' && (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌙</div>
          <p style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '1rem' }}>All muscle groups complete. Your body is now deeply relaxed.</p>
          <button className="btn btn--secondary" onClick={startPmr} style={{ marginRight: '0.5rem' }}>Repeat</button>
          <button className="btn btn--secondary" onClick={onClose}>Done</button>
        </div>
      )}
    </div>
  );
}

// ─── Sleep Diary ────────────────────────────────────────────────────────────
function SleepDiary() {
  const today = new Date().toISOString().slice(0, 10);
  const [logs, setLogs] = useState<SleepLog[]>(storage.getSleepLogs());
  const [date, setDate] = useState(today);
  const [bedtime, setBedtime] = useState('22:30');
  const [sleepOnset, setSleepOnset] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(6);
  const [interruptions, setInterruptions] = useState(0);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  function calcEfficiency(log: SleepLog): number {
    const bed = toMinutes(log.bedtime);
    const onset = toMinutes(log.sleepOnset);
    const wake = toMinutes(log.wakeTime);
    const timeInBed = wake >= bed ? wake - bed : (wake + MINUTES_IN_DAY) - bed;
    let sleepTime = wake >= onset ? wake - onset : (wake + MINUTES_IN_DAY) - onset;
    sleepTime = Math.max(0, sleepTime - log.interruptions * INTERRUPTION_PENALTY_MINUTES);
    return timeInBed > 0 ? Math.round((sleepTime / timeInBed) * 100) : 0;
  }

  function calcSleepDuration(log: SleepLog): number {
    const onset = toMinutes(log.sleepOnset);
    const wake = toMinutes(log.wakeTime);
    const dur = wake >= onset ? wake - onset : (wake + MINUTES_IN_DAY) - onset;
    return Math.max(0, dur - log.interruptions * INTERRUPTION_PENALTY_MINUTES);
  }

  function saveLog() {
    const log: SleepLog = {
      id: Date.now().toString(),
      date,
      bedtime,
      sleepOnset,
      wakeTime,
      quality,
      interruptions,
      notes,
      timestamp: new Date().toISOString(),
    };
    const updated = [log, ...logs.filter(l => l.date !== date)].slice(0, 60);
    storage.setSleepLogs(updated);
    setLogs(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function getQualityColor(q: number) {
    if (q >= 7) return 'var(--color-success)';
    if (q >= 4) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  const recentLogs = logs.slice(0, 7);
  const avgQuality = recentLogs.length ? (recentLogs.reduce((s, l) => s + l.quality, 0) / recentLogs.length).toFixed(1) : null;
  const avgDuration = recentLogs.length ? minutesToHhMm(Math.round(recentLogs.reduce((s, l) => s + calcSleepDuration(l), 0) / recentLogs.length)) : null;

  return (
    <div>
      <div className="card">
        <h2 className="card__title">📓 Log Last Night</h2>
        <div className="form-group">
          <label>Date</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Bedtime</label>
            <input type="time" className="input" value={bedtime} onChange={e => setBedtime(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Fell asleep ~</label>
            <input type="time" className="input" value={sleepOnset} onChange={e => setSleepOnset(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Wake time</label>
            <input type="time" className="input" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Sleep quality: {quality}/10</label>
          <input type="range" min="1" max="10" value={quality} onChange={e => setQuality(Number(e.target.value))} className="slider" />
        </div>
        <div className="form-group">
          <label>Night-time wake-ups: {interruptions}</label>
          <input type="range" min="0" max="10" value={interruptions} onChange={e => setInterruptions(Number(e.target.value))} className="slider" />
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea className="input textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything affecting sleep? Stress, caffeine, exercise..." />
        </div>
        <button className="btn btn--primary" onClick={saveLog}>Save</button>
        {saved && <span style={{ color: 'var(--color-success)', marginLeft: '0.75rem', fontSize: '0.9rem' }}>✅ Saved!</span>}
      </div>

      {recentLogs.length > 0 && (
        <>
          {(avgQuality || avgDuration) && (
            <div className="card">
              <h2 className="card__title">📊 7-Night Summary</h2>
              <div className="sleep-summary-grid">
                {avgQuality && (
                  <div className="sleep-summary-stat">
                    <div className="sleep-summary-value" style={{ color: getQualityColor(Number(avgQuality)) }}>{avgQuality}/10</div>
                    <div className="sleep-summary-label">Avg quality</div>
                  </div>
                )}
                {avgDuration && (
                  <div className="sleep-summary-stat">
                    <div className="sleep-summary-value">{avgDuration}</div>
                    <div className="sleep-summary-label">Avg sleep</div>
                  </div>
                )}
                <div className="sleep-summary-stat">
                  {(() => {
                    const avgEff = Math.round(recentLogs.reduce((s, l) => s + calcEfficiency(l), 0) / recentLogs.length);
                    const effColor = avgEff >= 85 ? 'var(--color-success)' : avgEff >= 75 ? 'var(--color-warning)' : 'var(--color-danger)';
                    return <div className="sleep-summary-value" style={{ color: effColor }}>{avgEff}%</div>;
                  })()}
                  <div className="sleep-summary-label">Avg efficiency</div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="card__title">Recent Nights</h2>
            <ul className="log-list">
              {recentLogs.map(log => {
                const eff = calcEfficiency(log);
                const dur = calcSleepDuration(log);
                return (
                  <li key={log.id} className="log-item" style={{ flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ minWidth: '80px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{new Date(log.date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    <span style={{ color: getQualityColor(log.quality), fontWeight: 700 }}>{log.quality}/10</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{minutesToHhMm(dur)}</span>
                    <span style={{ fontSize: '0.78rem', color: eff >= 85 ? 'var(--color-success)' : 'var(--color-warning)' }}>{eff}% eff</span>
                    <span className="log-time">{log.bedtime} → {log.wakeTime}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CBT-I Tools ────────────────────────────────────────────────────────────
function CbtiTools() {
  const [worryText, setWorryText] = useState('');
  const [worrySaved, setWorrySaved] = useState(false);
  const [savedWorries, setSavedWorries] = useState<{ id: string; text: string; time: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('diary_sleep_worries') ?? '[]'); } catch { return []; }
  });

  const settings = storage.getSleepSettings();
  const logs = storage.getSleepLogs().slice(0, 7);

  function calcEfficiency(log: SleepLog): number {
    const bed = toMinutes(log.bedtime);
    const onset = toMinutes(log.sleepOnset);
    const wake = toMinutes(log.wakeTime);
    const timeInBed = wake >= bed ? wake - bed : (wake + MINUTES_IN_DAY) - bed;
    let sleepTime = wake >= onset ? wake - onset : (wake + MINUTES_IN_DAY) - onset;
    sleepTime = Math.max(0, sleepTime - log.interruptions * INTERRUPTION_PENALTY_MINUTES);
    return timeInBed > 0 ? Math.round((sleepTime / timeInBed) * 100) : 0;
  }

  const avgEff = logs.length ? Math.round(logs.reduce((s, l) => s + calcEfficiency(l), 0) / logs.length) : null;

  function saveWorry() {
    if (!worryText.trim()) return;
    const entry = { id: Date.now().toString(), text: worryText, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) };
    const updated = [entry, ...savedWorries].slice(0, 10);
    localStorage.setItem('diary_sleep_worries', JSON.stringify(updated));
    setSavedWorries(updated);
    setWorryText('');
    setWorrySaved(true);
    setTimeout(() => setWorrySaved(false), 2000);
  }

  function clearWorries() {
    localStorage.removeItem('diary_sleep_worries');
    setSavedWorries([]);
  }

  return (
    <div>
      {avgEff !== null && (
        <div className={`card ${avgEff >= 85 ? 'card--focus' : ''}`} style={avgEff < 85 ? { borderColor: 'var(--color-warning)', background: '#fffbeb' } : {}}>
          <h2 className="card__title">📊 Your Sleep Efficiency</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: avgEff >= 85 ? 'var(--color-success)' : 'var(--color-warning)' }}>{avgEff}%</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{avgEff >= 85 ? 'Good efficiency' : avgEff >= 75 ? 'Moderate — aim for 85%+' : 'Below target — CBT-I can help'}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>7-night average. Target: ≥85%</div>
            </div>
          </div>
          {avgEff < 85 && settings.targetWakeTime && (
            <div className="alert alert--info" style={{ marginTop: '0.75rem' }}>
              💡 <strong>CBT-I Sleep Restriction tip:</strong> Your target wake time is {settings.targetWakeTime}. For now, don't go to bed until you feel genuinely sleepy — even if that means going to bed later. This builds sleep pressure and improves efficiency.
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="card__title">📝 Pre-Sleep Worry Dump</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
          Write down worries to "park" them until morning. Research shows externalising worries before bed reduces sleep-onset latency (Harvey, 2001; Borkovec CBT-I research).
        </p>
        <textarea
          className="input textarea"
          value={worryText}
          onChange={e => setWorryText(e.target.value)}
          placeholder="Write anything on your mind... It will be here in the morning."
          style={{ minHeight: '100px' }}
        />
        <button className="btn btn--primary" onClick={saveWorry}>Park It 🌙</button>
        {worrySaved && <span style={{ color: 'var(--color-success)', marginLeft: '0.75rem', fontSize: '0.9rem' }}>✅ Parked!</span>}
        {savedWorries.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Parked for morning:</div>
            {savedWorries.map(w => (
              <div key={w.id} style={{ fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginRight: '0.5rem' }}>{w.time}</span>{w.text}
              </div>
            ))}
            <button className="btn btn--small btn--secondary" style={{ marginTop: '0.5rem' }} onClick={clearWorries}>Clear all</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card__title">📋 CBT-I Rules</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          CBT-I (Cognitive Behavioural Therapy for Insomnia) is the gold-standard treatment for chronic insomnia — more effective long-term than sleep medication (Trauer et al., 2015 meta-analysis).
        </p>
        {CBTI_RULES.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < CBTI_RULES.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
            <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{r.rule}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sleep Onset Techniques ─────────────────────────────────────────────────
function SleepOnset() {
  const [technique, setTechnique] = useState<OnsetTechnique>(null);

  if (technique === 'breathing') return <BreathingGuide onClose={() => setTechnique(null)} />;
  if (technique === 'pmr') return <PmrGuide onClose={() => setTechnique(null)} />;

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
        Evidence-based techniques to help you fall asleep faster. Only the most rigorously tested methods are included.
      </p>

      <div className="card sleep-onset-card" onClick={() => setTechnique('breathing')} style={{ cursor: 'pointer' }}>
        <div className="sleep-onset-card__header">
          <span className="sleep-onset-card__icon">🌬️</span>
          <h3 className="sleep-onset-card__title">4-7-8 Breathing</h3>
          <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: '0.85rem' }}>Start →</span>
        </div>
        <p className="sleep-onset-card__desc">Inhale 4s, hold 7s, exhale 8s. Activates the parasympathetic nervous system, slowing heart rate and reducing cortisol. Validated in multiple RCTs for anxiety and arousal reduction.</p>
      </div>

      <div className="card sleep-onset-card" onClick={() => setTechnique('pmr')} style={{ cursor: 'pointer' }}>
        <div className="sleep-onset-card__header">
          <span className="sleep-onset-card__icon">💆</span>
          <h3 className="sleep-onset-card__title">Progressive Muscle Relaxation</h3>
          <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: '0.85rem' }}>Start →</span>
        </div>
        <p className="sleep-onset-card__desc">Systematically tense and release each muscle group. Reduces somatic (physical) arousal — one of the most evidence-based sleep-onset techniques (Jacobson, 1938; standard component of CBT-I). Approx 10 minutes.</p>
      </div>

      <div className="card sleep-onset-card">
        <div className="sleep-onset-card__header">
          <span className="sleep-onset-card__icon">🎲</span>
          <h3 className="sleep-onset-card__title">Cognitive Shuffle</h3>
        </div>
        <p className="sleep-onset-card__desc" style={{ marginBottom: '0.75rem' }}>Imagine a sequence of vivid, unrelated images — a banana, a lighthouse, a purple sock, a dog. Random, disconnected images. This mimics hypnagogic (pre-sleep) cognition and interrupts anxious thought chains (Beaulieu-Prévost et al., 2023 study in Journal of Sleep Research).</p>
        <div className="alert alert--info" style={{ fontSize: '0.82rem' }}>
          <strong>How:</strong> Think of a word (e.g. "cloud"). Visualise a cloud in detail. Then jump to something completely unrelated (e.g. "spoon" → a giant silver spoon). Keep jumping every 5–10 seconds.
        </div>
      </div>

      <div className="card sleep-onset-card">
        <div className="sleep-onset-card__header">
          <span className="sleep-onset-card__icon">👁️</span>
          <h3 className="sleep-onset-card__title">Paradoxical Intention</h3>
        </div>
        <p className="sleep-onset-card__desc" style={{ marginBottom: '0.75rem' }}>Instead of trying to fall asleep, try to stay awake with your eyes open. This removes sleep performance anxiety — the "trying to sleep" problem. Validated in Ascher & Efran (1978) and multiple subsequent meta-analyses.</p>
        <div className="alert alert--info" style={{ fontSize: '0.82rem' }}>
          <strong>How:</strong> Lie in bed and gently try to keep your eyes open. Don't fight sleep, don't force it. Just try to stay awake passively. Most people fall asleep faster because the pressure is removed.
        </div>
      </div>

      <div className="card card--tip">
        <h2 className="card__title">💡 What the Research Says</h2>
        <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>
          CBT-I is recommended by NICE, the American College of Physicians, and the Sleep Foundation as first-line treatment for insomnia — above sleep medication. PMR and relaxation techniques reduce sleep-onset latency by an average of 12 minutes (Morin meta-analysis, 2006). Consistent wake times are the single most powerful circadian anchor.
        </p>
      </div>
    </div>
  );
}

// ─── Oura Integration ───────────────────────────────────────────────────────
function OuraIntegration() {
  const [settings, setSettings] = useState<SleepSettings>(storage.getSleepSettings());
  const [token, setToken] = useState(settings.ouraToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OuraSleep[]>([]);
  const [tokenSaved, setTokenSaved] = useState(false);

  function saveToken() {
    const updated = { ...settings, ouraToken: token };
    storage.setSleepSettings(updated);
    setSettings(updated);
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  }

  async function fetchOuraData() {
    if (!token.trim()) { setError('Please enter your Oura Personal Access Token first.'); return; }
    setLoading(true);
    setError(null);
    const end = new Date();
    const start = new Date();
    // Use -8 days to ensure 7 full nights are captured (Oura reports sleep by the day it ends)
    start.setDate(end.getDate() - 8);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    try {
      const res = await fetch(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${startStr}&end_date=${endStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid token — check your Oura Personal Access Token.');
        throw new Error(`API error ${res.status}`);
      }
      const json = await res.json() as { data: OuraSleep[] };
      // Filter to primary sleep sessions (>1 hour) and show most recent first
      const longSleeps = json.data.filter((s: OuraSleep) => s.total_sleep_duration > MIN_SLEEP_DURATION_SECONDS).reverse();
      setData(longSleeps.slice(0, 7));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg.includes('fetch') ? 'Could not reach Oura API. Check your internet connection.' : msg);
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score: number | null): string {
    if (!score) return 'var(--text-secondary)';
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  return (
    <div>
      <div className="card">
        <h2 className="card__title">💍 Oura Ring 3 Integration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Connect your Oura Ring to see your sleep data here. Your token is stored only on this device.
        </p>
        <div className="form-group">
          <label>Personal Access Token</label>
          <input
            className="input"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your Oura PAT here..."
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>
            Get yours at: cloud.ouraring.com → Account → Personal Access Tokens
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--secondary" onClick={saveToken}>Save Token</button>
          <button className="btn btn--primary" onClick={fetchOuraData} disabled={loading}>
            {loading ? 'Fetching...' : '🔄 Fetch Last 7 Nights'}
          </button>
        </div>
        {tokenSaved && <span style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>✅ Token saved!</span>}
        {error && <div className="alert alert--warning" style={{ marginTop: '0.75rem' }}>⚠️ {error}</div>}
      </div>

      {data.length > 0 && data.map(night => (
        <div key={night.day} className="card">
          <h2 className="card__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{new Date(night.day + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            {night.score !== null && (
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: scoreColor(night.score) }}>{night.score}</span>
            )}
          </h2>
          <div className="oura-stats-grid">
            <div className="oura-stat">
              <div className="oura-stat__value">{formatDuration(night.total_sleep_duration)}</div>
              <div className="oura-stat__label">Total sleep</div>
            </div>
            <div className="oura-stat">
              <div className="oura-stat__value" style={{ color: 'var(--color-primary)' }}>{formatDuration(night.deep_sleep_duration)}</div>
              <div className="oura-stat__label">Deep sleep</div>
            </div>
            <div className="oura-stat">
              <div className="oura-stat__value" style={{ color: 'var(--color-secondary)' }}>{formatDuration(night.rem_sleep_duration)}</div>
              <div className="oura-stat__label">REM</div>
            </div>
            <div className="oura-stat">
              <div className="oura-stat__value">{night.efficiency}%</div>
              <div className="oura-stat__label">Efficiency</div>
            </div>
            {night.average_hrv !== null && (
              <div className="oura-stat">
                <div className="oura-stat__value">{night.average_hrv} ms</div>
                <div className="oura-stat__label">Avg HRV</div>
              </div>
            )}
            {night.lowest_heart_rate !== null && (
              <div className="oura-stat">
                <div className="oura-stat__value">{night.lowest_heart_rate} bpm</div>
                <div className="oura-stat__label">Lowest HR</div>
              </div>
            )}
          </div>
          {night.bedtime_start && night.bedtime_end && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {new Date(night.bedtime_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} → {new Date(night.bedtime_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      ))}

      <div className="card card--tip">
        <h2 className="card__title">💡 Understanding Your Sleep Scores</h2>
        <p style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6 }}>
          <strong>HRV</strong> (Heart Rate Variability) reflects recovery. Higher = more resilient nervous system. Poor sleep and stress suppress HRV. <strong>Deep sleep</strong> is essential for physical repair and memory consolidation. <strong>REM sleep</strong> is critical for emotional regulation — low REM is associated with anxiety and mood issues.
        </p>
      </div>
    </div>
  );
}

// ─── Sleep Settings Banner ─────────────────────────────────────────────────
function SleepScheduleBanner() {
  const [settings, setSettings] = useState<SleepSettings>(storage.getSleepSettings());
  const [editing, setEditing] = useState(false);

  function save(updated: SleepSettings) {
    storage.setSleepSettings(updated);
    setSettings(updated);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="card">
        <h2 className="card__title">⏰ Sleep Schedule</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Target bedtime</label>
            <input type="time" className="input" value={settings.targetBedtime} onChange={e => setSettings(s => ({ ...s, targetBedtime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Target wake time</label>
            <input type="time" className="input" value={settings.targetWakeTime} onChange={e => setSettings(s => ({ ...s, targetWakeTime: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--primary" onClick={() => save(settings)}>Save</button>
          <button className="btn btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card sleep-schedule-banner">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h2 className="card__title" style={{ marginBottom: 0 }}>⏰ Sleep Schedule</h2>
        <button className="btn btn--small btn--secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary)' }}>{settings.targetBedtime}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Target bedtime</div>
        </div>
        <div style={{ color: 'var(--text-light)', alignSelf: 'center', fontSize: '1.2rem' }}>→</div>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-success)' }}>{settings.targetWakeTime}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Target wake time</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main SleepTools ────────────────────────────────────────────────────────
const SleepTools: React.FC = () => {
  const [section, setSection] = useState<SleepSection>('diary');

  const sectionLabels: { id: SleepSection; label: string }[] = [
    { id: 'diary', label: '📓 Diary' },
    { id: 'cbti', label: '🧠 CBT-I' },
    { id: 'onset', label: '🌙 Fall Asleep' },
    { id: 'oura', label: '💍 Oura' },
  ];

  return (
    <div className="sleep-page">
      <h1 className="page-title">🌙 Sleep Tools</h1>
      <p className="page-subtitle">Evidence-based tools for better sleep. 💙</p>

      <SleepScheduleBanner />

      <div className="section-tabs">
        {sectionLabels.map(s => (
          <button key={s.id} className={`section-tab ${section === s.id ? 'section-tab--active' : ''}`} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'diary' && <SleepDiary />}
      {section === 'cbti' && <CbtiTools />}
      {section === 'onset' && <SleepOnset />}
      {section === 'oura' && <OuraIntegration />}
    </div>
  );
};

export default SleepTools;
