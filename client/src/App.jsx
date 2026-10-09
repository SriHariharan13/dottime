import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings, logSession, getStats } from './api';
import { playTone, TONES } from './sound';
import { DotDigits, DotRing } from './Dots';

const DEFAULTS = { studyMin: 25, breakMin: 5, ringtone: 'bell', volume: 70 };
const pad = (n) => String(n).padStart(2, '0');

export default function App() {
  const [tab, setTab] = useState('timer');
  const [settings, setSettings] = useState(DEFAULTS);
  const [draft, setDraft] = useState(DEFAULTS);
  const [mode, setMode] = useState('study');
  const [remaining, setRemaining] = useState(DEFAULTS.studyMin * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ todaySessions: 0, todayMinutes: 0 });
  const [note, setNote] = useState('');
  const endAt = useRef(0);

  const total = (mode === 'study' ? settings.studyMin : settings.breakMin) * 60;
  const refreshStats = () => getStats().then(setStats).catch(() => {});

  useEffect(() => {
    getSettings().then((s) => { setSettings(s); setDraft(s); }).catch(() => setNote('Offline: using default settings'));
    refreshStats();
  }, []);

  useEffect(() => { if (!running) setRemaining(total); }, [total, running]);

  const finish = useCallback(() => {
    setRunning(false);
    playTone(settings.ringtone, settings.volume);
    logSession({ type: mode, minutes: mode === 'study' ? settings.studyMin : settings.breakMin })
      .then(refreshStats).catch(() => {});
    setMode((m) => (m === 'study' ? 'break' : 'study'));
  }, [mode, settings]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const left = Math.ceil((endAt.current - Date.now()) / 1000);
      if (left <= 0) { setRemaining(0); finish(); } else setRemaining(left);
    }, 250);
    return () => clearInterval(t);
  }, [running, finish]);

  useEffect(() => { document.title = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)} · .dotTime`; }, [remaining]);

  const toggle = () => {
    if (!running) endAt.current = Date.now() + remaining * 1000;
    setRunning(!running);
  };
  const reset = () => { setRunning(false); setRemaining(total); };
  const pick = (m) => { setRunning(false); setMode(m); };

  const save = async () => {
    try { setSettings(await saveSettings(draft)); setNote('Saved'); }
    catch { setSettings(draft); setNote('Could not reach server; applied locally'); }
    setTimeout(() => setNote(''), 2500);
  };
  const setNum = (k, d) => setDraft((s) => ({ ...s, [k]: Math.min(99, Math.max(1, s[k] + d)) }));
  const upload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1.5e6) return setNote('Sound must be under 1.5 MB');
    const r = new FileReader();
    r.onload = () => { localStorage.setItem('dottime-custom', r.result); setDraft((s) => ({ ...s, ringtone: 'custom' })); setNote('Sound loaded'); };
    r.readAsDataURL(f);
  };

  return (
    <div className="app">
      <header>
        <div className="logo"><svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" className="ring-on" /><circle cx="14" cy="14" r="5" fill="#0A0A0A" /></svg>.dotTime</div>
        <nav>
          <button className={tab === 'timer' ? 'pill active' : 'pill'} onClick={() => setTab('timer')}>Timer</button>
          <button className={tab === 'settings' ? 'pill active' : 'pill'} onClick={() => setTab('settings')}>Settings</button>
        </nav>
      </header>

      {tab === 'timer' ? (
        <main className="timer">
          <div className="toggle">
            <button className={mode === 'study' ? 'pill active' : 'pill'} onClick={() => pick('study')}>Study</button>
            <button className={mode === 'break' ? 'pill active' : 'pill'} onClick={() => pick('break')}>Break</button>
          </div>
          <div className="face">
            <DotRing progress={total ? 1 - remaining / total : 0} />
            <div className="digits">
              <DotDigits text={`${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`} />
              <p>{mode === 'study' ? 'Focus time' : 'Break time'}</p>
            </div>
          </div>
          <div className="row">
            <button className="primary" onClick={toggle}>{running ? 'Pause' : 'Start'}</button>
            <button className="pill" onClick={reset}>Reset</button>
          </div>
          <div className="chips">
            <span>Study {settings.studyMin} min</span>
            <span>Break {settings.breakMin} min</span>
            <span>Today: {stats.todaySessions} sessions · {stats.todayMinutes} min</span>
          </div>
        </main>
      ) : (
        <main className="settings">
          <section className="card">
            {[['studyMin', 'Study length'], ['breakMin', 'Break length']].map(([k, label]) => (
              <div key={k} className="stepper-block">
                <h2>{label}</h2>
                <div className="stepper">
                  <button className="round" aria-label={`Decrease ${label}`} onClick={() => setNum(k, -1)}>−</button>
                  <span><b>{draft[k]}</b> min</span>
                  <button className="round" aria-label={`Increase ${label}`} onClick={() => setNum(k, 1)}>+</button>
                </div>
              </div>
            ))}
          </section>
          <section className="card">
            <h2>Alarm ringtone</h2>
            <p className="muted">Plays when a study or break session ends.</p>
            {TONES.map((t) => (
              <label key={t.id} className={draft.ringtone === t.id ? 'tone sel' : 'tone'}>
                <input type="radio" name="tone" checked={draft.ringtone === t.id} onChange={() => setDraft({ ...draft, ringtone: t.id })} />
                <span>{t.name}</span>
                <button type="button" className="play" aria-label={`Preview ${t.name}`} onClick={() => playTone(t.id, draft.volume)}>▶</button>
              </label>
            ))}
            <label className="upload">Upload your own sound
              <input type="file" accept="audio/*" onChange={upload} />
            </label>
            <div className="vol">
              <label htmlFor="vol">Volume</label>
              <input id="vol" type="range" min="0" max="100" value={draft.volume} onChange={(e) => setDraft({ ...draft, volume: +e.target.value })} />
            </div>
            <button className="primary" onClick={save}>Save settings</button>
          </section>
        </main>
      )}
      {note && <div className="toast" role="status">{note}</div>}
    </div>
  );
}
