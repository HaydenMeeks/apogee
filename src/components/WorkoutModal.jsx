import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { saveExerciseHistoryToDB, loadExerciseHistoryFromDB } from '../supabase.js';

export default function WorkoutModal({ session, wkIdx, gymLog, onClose, onComplete, onSaveLog, user }) {
  const s = session.gymSession;
  const exercises = s.exercises || [];
  const isME = s.type === 'ME_JOHNSTON';

  const [logs, setLogs] = useState(() =>
    Object.fromEntries(exercises.map((ex, i) => [
      i,
      Array.from({ length: ex.sets }, () => ({
        reps: typeof ex.reps === 'string' ? ex.reps.split(' ')[0] : String(ex.reps),
        kg: '',
        done: false,
      }))
    ]))
  );

  const [activeEx, setActiveEx] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  const [restTotal, setRestTotal] = useState(null);
  const [restActive, setRestActive] = useState(false);
  const restEndTime = useRef(null);
  const [historyEx, setHistoryEx] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showIncompletePrompt, setShowIncompletePrompt] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const timerRef = useRef(null);
  const [activeField, setActiveField] = useState(null); // { setIdx, field: 'reps'|'kg' }

  // ── WAKE LOCK ────────────────────────────────────────────────────────────
  const wakeLockRef = useRef(null);
  useEffect(() => {
    async function acquire() {
      try {
        if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch(e) {}
    }
    acquire();
    function onVisible() { if (document.visibilityState === 'visible') acquire(); }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // ── REST TIMER — wall clock based ────────────────────────────────────────
  useEffect(() => {
    if (!restActive || restTimer === null) return;
    if (restTimer <= 0) { setRestActive(false); return; }
    const nextTick = Math.max(0, ((restEndTime.current - Date.now()) % 1000) || 1000);
    timerRef.current = setTimeout(() => {
      setRestTimer(Math.max(0, Math.round((restEndTime.current - Date.now()) / 1000)));
    }, nextTick);
    return () => clearTimeout(timerRef.current);
  }, [restActive, restTimer]);

  function startRest(seconds) {
    const secs = parseInt(String(seconds).replace(/[^0-9]/g, '')) || 60;
    restEndTime.current = Date.now() + secs * 1000;
    setRestTimer(secs);
    setRestTotal(secs);
    setRestActive(true);
  }

  function stopRest() {
    setRestActive(false); setRestTimer(null);
    setRestTotal(null); restEndTime.current = null;
  }

  // ── EXERCISE HISTORY ─────────────────────────────────────────────────────
  async function openHistory(exName) {
    setHistoryEx(exName);
    setHistoryData([]);
    setHistoryLoading(true);
    if (user) {
      const data = await loadExerciseHistoryFromDB(user.id, exName, 3);
      setHistoryData(data);
    }
    setHistoryLoading(false);
  }

  // ── COMPLETE WORKOUT ─────────────────────────────────────────────────────
  async function handleComplete() {
    if (user) {
      for (let i = 0; i < exercises.length; i++) {
        const doneSets = logs[i].filter(l => l.done);
        if (doneSets.length > 0) {
          await saveExerciseHistoryToDB(
            user.id, exercises[i].name,
            doneSets.map((l, si) => ({ set: si+1, reps: l.reps, kg: l.kg || 'BW' })),
            wkIdx, session.id
          );
        }
      }
    }
    setShowSummary(true);
  }

  function finishWorkout() { setShowSummary(false); onComplete(logs); }

  const ex = exercises[activeEx];
  const exLog = logs[activeEx] || [];
  function goToEx(i) { setActiveEx(i); setShowVideo(false); setActiveField(null); }

  // ── KEYPAD HELPERS ───────────────────────────────────────────────────────
  const activeValue = activeField ? (logs[activeEx]?.[activeField.setIdx]?.[activeField.field] ?? '') : '';

  function handleKeypadChange(val) {
    if (!activeField) return;
    updateSet(activeField.setIdx, activeField.field, val);
  }

  function handleKeypadPress(key) {
    const current = String(activeValue);
    const allowDecimal = activeField?.field === 'kg';
    if (key === '⌫') { handleKeypadChange(current.slice(0, -1) || ''); }
    else if (key === '.') { if (allowDecimal && !current.includes('.')) handleKeypadChange(current + '.'); }
    else if (key === '+') {
      const n = parseFloat(current) || 0;
      handleKeypadChange(String(Math.round((n + (allowDecimal ? 2.5 : 1)) * 10) / 10));
    } else if (key === '−') {
      const n = parseFloat(current) || 0;
      handleKeypadChange(String(Math.max(0, Math.round((n - (allowDecimal ? 2.5 : 1)) * 10) / 10)));
    } else {
      handleKeypadChange(current === '' || current === '0' ? key : current + key);
    }
  }

  function handleKeypadNext() {
    if (!activeField) return;
    const fields = [];
    (logs[activeEx] || []).forEach((_, si) => {
      fields.push({ setIdx: si, field: 'reps' });
      fields.push({ setIdx: si, field: 'kg' });
    });
    const idx = fields.findIndex(f => f.setIdx === activeField.setIdx && f.field === activeField.field);
    if (idx < fields.length - 1) setActiveField(fields[idx + 1]);
    else setActiveField(null);
  }

  function isLastField() {
    if (!activeField) return false;
    const fields = [];
    (logs[activeEx] || []).forEach((_, si) => {
      fields.push({ setIdx: si, field: 'reps' });
      fields.push({ setIdx: si, field: 'kg' });
    });
    const idx = fields.findIndex(f => f.setIdx === activeField.setIdx && f.field === activeField.field);
    return idx === fields.length - 1;
  }
  const allDone = exercises.every((_, i) => logs[i]?.every(l => l.done));

  function updateSet(setIdx, field, val) {
    setLogs(prev => {
      const exLogs = prev[activeEx];
      return {
        ...prev,
        [activeEx]: exLogs.map((l, si) => {
          if (si === setIdx) return { ...l, [field]: val };
          if (si === setIdx + 1) {
            const prevVal = exLogs[setIdx][field];
            if (l[field] === prevVal || l[field] === '') return { ...l, [field]: val };
          }
          return l;
        })
      };
    });
  }

  function tickSet(setIdx) {
    setLogs(prev => ({
      ...prev,
      [activeEx]: prev[activeEx].map((l, si) => si === setIdx ? { ...l, done: !l.done } : l)
    }));
    if (!exLog[setIdx].done && ex?.rest) startRest(ex.rest);
  }

  // ── REST TIMER FULL SCREEN ───────────────────────────────────────────────
  const progress = restTotal > 0 ? restTimer / restTotal : 0;
  const isAlmostDone = restTimer !== null && restTimer <= 5;
  const timerBg = isAlmostDone ? '#EF4444' : '#00C46A';

  const RestScreen = restActive && restTotal > 0 && (
    <div
      onClick={stopRest}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        overflow: 'hidden', cursor: 'pointer',
      }}
    >
      {/* Draining green/red fill — full screen, shrinks top to bottom */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${progress * 100}%`,
        background: timerBg,
        transition: 'height 1s linear, background 0.4s',
      }}/>
      {/* Dark backdrop below the fill */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,10,10,0.92)',
        zIndex: -1,
      }}/>

      {/* Content — centered */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}>
        <div style={{
          fontFamily: 'Exo 2, sans-serif', fontSize: 11,
          color: 'rgba(255,255,255,0.5)', letterSpacing: 4,
        }}>
          REST
        </div>
        <div style={{
          fontFamily: 'Archivo Black, sans-serif',
          fontSize: 96, lineHeight: 1,
          color: '#fff',
          textShadow: '0 2px 24px rgba(0,0,0,0.4)',
          transition: 'color 0.3s',
        }}>
          {restTimer}
        </div>
        <div style={{
          fontFamily: 'Exo 2, sans-serif', fontSize: 11,
          color: 'rgba(255,255,255,0.4)', letterSpacing: 2,
        }}>
          TAP ANYWHERE TO SKIP
        </div>
        <button
          onClick={e => { e.stopPropagation(); stopRest(); }}
          style={{
            marginTop: 8,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, padding: '10px 28px',
            color: '#fff', fontFamily: 'Exo 2, sans-serif',
            fontSize: 11, letterSpacing: 2, cursor: 'pointer',
          }}
        >
          SKIP
        </button>
      </div>
    </div>
  );

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0, padding: '14px 16px',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 3 }}>
            {isME ? `ME · WO${s.meWorkoutNumber} · ${s.vest}` : 'STRENGTH SESSION B'}
          </div>
          <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--text)', marginTop: 2 }}>
            {session.name}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 44, height: 44, borderRadius: '50%', background: 'var(--card)',
          border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>✕</button>
      </div>

      {/* ── EXERCISE NAV PILLS ── */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 6, padding: '10px 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        {exercises.map((e, i) => {
          const done = logs[i]?.every(l => l.done);
          const partial = logs[i]?.some(l => l.done) && !done;
          return (
            <button key={i} onClick={() => goToEx(i)} style={{
              flexShrink: 0, padding: '5px 10px', borderRadius: 20,
              border: `1px solid ${i === activeEx ? 'var(--green)' : 'var(--border)'}`,
              background: done ? 'var(--green)' : i === activeEx ? 'rgba(0,196,106,0.15)' : 'var(--card)',
              color: done ? '#0A0A0A' : i === activeEx ? 'var(--green)' : 'var(--muted)',
              fontFamily: 'Exo 2, sans-serif', fontSize: 10, letterSpacing: 1,
              cursor: 'pointer', fontWeight: 700,
            }}>
              {done ? '✓' : partial ? '…' : String(i+1).padStart(2,'0')}
            </button>
          );
        })}
      </div>

      {/* ── ACTIVE EXERCISE ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px', paddingBottom: activeField ? '320px' : '24px' }}>

        {/* Exercise header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, color: 'var(--text)', lineHeight: 1.2 }}>
              {ex?.name}
            </div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', marginTop: 3 }}>
              {isME
                ? `${ex?.sets} sets · ${ex?.reps} · ${ex?.rest} rest`
                : `${ex?.sets} × ${ex?.reps}${ex?.rpe ? ` · RPE ${ex.rpe}` : ''} · rest ${ex?.rest}`
              }
            </div>
          </div>
          <button onClick={() => openHistory(ex?.name)} style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0, marginLeft: 8,
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>📋</button>
        </div>

        {/* Video toggle */}
        {ex?.videoUrl && (()=>{
          const videoId = ex.videoUrl.match(/[?&]v=([^&]+)|youtu\.be\/([^?&]+)/)?.slice(1).find(Boolean);
          if (!videoId) return null;
          return (
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => setShowVideo(v => !v)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: showVideo ? 'rgba(0,196,106,0.15)' : 'var(--card)',
                border: `1px solid ${showVideo ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 12px',
                color: showVideo ? 'var(--green)' : 'var(--muted)',
                fontFamily: 'Exo 2, sans-serif', fontSize: 10, letterSpacing: 1, cursor: 'pointer',
              }}>
                {showVideo ? '▼ HIDE VIDEO' : '▶ WATCH DEMO'}
              </button>
              {showVideo && (
                <div style={{
                  position: 'relative', width: '100%', paddingBottom: '56.25%',
                  borderRadius: 10, overflow: 'hidden', marginTop: 8, background: '#000',
                }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&autoplay=1`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={ex.name}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Coaching cue */}
        {ex?.coaching && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, marginBottom: 14, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: 'rgba(0,196,106,0.08)', borderBottom: '1px solid rgba(0,196,106,0.12)',
            }}>
              <span style={{ fontFamily: 'Exo 2, sans-serif', fontWeight: 700, fontSize: 10, color: 'var(--green)', letterSpacing: 3 }}>COACH</span>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)', opacity: 0.4 }}/>
              <span style={{ fontFamily: 'Exo 2, sans-serif', fontWeight: 600, fontSize: 10, color: 'rgba(0,196,106,0.5)', letterSpacing: 2 }}>CUE</span>
            </div>
            <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {ex.coaching}
            </div>
          </div>
        )}

        {/* Sets */}
        {isME ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exLog.map((l, si) => (
              <button key={si} onClick={() => tickSet(si)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: l.done ? 'rgba(0,196,106,0.12)' : 'var(--card)',
                border: `2px solid ${l.done ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.2s', width: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: l.done ? 'var(--green)' : 'var(--surface)',
                    border: `2px solid ${l.done ? 'var(--green)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: l.done ? '#0A0A0A' : 'var(--muted)', flexShrink: 0,
                  }}>
                    {l.done ? '✓' : si+1}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 13, color: l.done ? 'var(--green)' : 'var(--text)', fontWeight: 700 }}>
                      SET {si+1}
                    </div>
                    <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {ex?.reps} · rest {ex?.rest}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: l.done ? 'var(--green)' : 'var(--muted)', letterSpacing: 1 }}>
                  {l.done ? 'DONE' : 'TAP WHEN COMPLETE'}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exLog.map((l, si) => (
              <div key={si} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px',
                gap: 8, alignItems: 'center',
                background: l.done ? 'rgba(0,196,106,0.08)' : 'var(--card)',
                border: `1px solid ${l.done ? 'rgba(0,196,106,0.3)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 12px', transition: 'background 0.2s',
              }}>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>
                  Set<br/>{si+1}
                </div>
                <div>
                  <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>REPS</div>
                  <button onClick={() => setActiveField({ setIdx: si, field: 'reps' })} style={{
                    width: '100%', minHeight: 40,
                    background: activeField?.setIdx === si && activeField?.field === 'reps' ? 'rgba(0,196,106,0.12)' : 'var(--surface)',
                    border: `1px solid ${activeField?.setIdx === si && activeField?.field === 'reps' ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 6, color: l.reps ? 'var(--text)' : 'var(--muted)',
                    fontSize: 15, fontFamily: 'Exo 2, sans-serif', padding: '6px 8px', textAlign: 'center', cursor: 'pointer',
                  }}>{l.reps || '—'}</button>
                </div>
                <div>
                  <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>KG</div>
                  <button onClick={() => setActiveField({ setIdx: si, field: 'kg' })} style={{
                    width: '100%', minHeight: 40,
                    background: activeField?.setIdx === si && activeField?.field === 'kg' ? 'rgba(0,196,106,0.12)' : 'var(--surface)',
                    border: `1px solid ${activeField?.setIdx === si && activeField?.field === 'kg' ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: 6, color: l.kg ? 'var(--text)' : 'var(--muted)',
                    fontSize: 15, fontFamily: 'Exo 2, sans-serif', padding: '6px 8px', textAlign: 'center', cursor: 'pointer',
                  }}>{l.kg || '—'}</button>
                </div>
                <button onClick={() => tickSet(si)} style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: l.done ? 'var(--green)' : 'var(--surface)',
                  border: `2px solid ${l.done ? 'var(--green)' : 'var(--border)'}`,
                  color: l.done ? '#0A0A0A' : 'var(--muted)',
                  fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</button>
              </div>
            ))}
          </div>
        )}

        {/* Manual rest button */}
        {!isME && !restActive && (
          <button onClick={() => startRest(ex?.rest || '90sec')} style={{
            marginTop: 14, width: '100%', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 10, padding: '10px',
            color: 'var(--muted)', fontFamily: 'Exo 2, sans-serif', fontSize: 10,
            letterSpacing: 1, cursor: 'pointer',
          }}>
            START REST TIMER · {ex?.rest}
          </button>
        )}
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{
        flexShrink: 0, padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
        background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8,
      }}>
        {activeEx < exercises.length - 1 && (
          <button onClick={() => goToEx(activeEx+1)} style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 13, padding: 16, color: 'var(--text)', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}>Next →</button>
        )}
        <button onClick={() => allDone ? handleComplete() : setShowIncompletePrompt(true)} style={{
          flex: 2, background: allDone ? 'var(--green)' : 'var(--card)',
          border: allDone ? 'none' : '1px solid var(--border)',
          borderRadius: 13, padding: 17, color: allDone ? '#0A0A0A' : 'var(--text)',
          fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'background 0.3s',
        }}>
          {allDone ? 'Complete ✓' : `Finish (${exercises.filter((_,i) => logs[i]?.every(l => l.done)).length}/${exercises.length})`}
        </button>
      </div>

      {/* ── CUSTOM NUMERIC KEYPAD ── */}
      {activeField && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          padding: '10px 12px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        }}>
          {/* Label + current value */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 11, color: 'var(--green)', letterSpacing: 2 }}>
              SET {activeField.setIdx + 1} · {activeField.field.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 28, color: activeValue ? 'var(--text)' : 'var(--muted)' }}>
              {activeValue || '—'}
            </div>
          </div>
          {/* Row 1: 1 2 3 ⌫ */}
          {[['1','2','3','⌫'],['4','5','6','−'],['7','8','9','+']].map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 6 }}>
              {row.map(k => (
                <button key={k} onClick={() => handleKeypadPress(k)} style={{
                  height: 50, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: k === '⌫' ? 'var(--card2)' : (k === '+' || k === '−') ? 'var(--card)' : 'var(--card)',
                  color: 'var(--text)',
                  fontSize: k === '⌫' || k === '+' || k === '−' ? 18 : 20,
                  fontFamily: 'Archivo Black, sans-serif',
                  WebkitTapHighlightColor: 'transparent',
                }}>{k}</button>
              ))}
            </div>
          ))}
          {/* Row 4: . 0 Next/Done */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 6 }}>
            <button onClick={() => handleKeypadPress('.')} style={{
              height: 50, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--card)', color: activeField?.field === 'kg' ? 'var(--text)' : 'var(--muted)',
              fontSize: 20, fontFamily: 'Archivo Black, sans-serif',
              opacity: activeField?.field === 'kg' ? 1 : 0.3,
              WebkitTapHighlightColor: 'transparent',
            }}>.</button>
            <button onClick={() => handleKeypadPress('0')} style={{
              height: 50, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--card)', color: 'var(--text)',
              fontSize: 20, fontFamily: 'Archivo Black, sans-serif',
              WebkitTapHighlightColor: 'transparent',
            }}>0</button>
            <button onClick={isLastField() ? () => setActiveField(null) : handleKeypadNext} style={{
              height: 50, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--green)', color: '#0A0A0A',
              fontSize: 13, fontFamily: 'Exo 2, sans-serif', fontWeight: 800, letterSpacing: 1,
              WebkitTapHighlightColor: 'transparent',
            }}>{isLastField() ? 'DONE ✓' : 'NEXT →'}</button>
          </div>
        </div>
      )}

      {/* ── FULL SCREEN REST TIMER ── */}
      {RestScreen}

      {/* ── COMPLETION SUMMARY ── */}
      {showSummary && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            flexShrink: 0, padding: '20px 16px',
            paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏋️</div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, color: 'var(--green)' }}>Workout Complete</div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: 4, letterSpacing: 2 }}>
              {session.name.toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
            {exercises.map((ex, i) => {
              const doneSets = (logs[i]||[]).filter(l => l.done);
              if (!doneSets.length) return null;
              const bestKg = doneSets.map(l => parseFloat(l.kg)||0).filter(Boolean);
              const bestSet = bestKg.length ? doneSets[bestKg.indexOf(Math.max(...bestKg))] : doneSets[doneSets.length-1];
              return (
                <div key={i} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 15, color: 'var(--text)', flex: 1 }}>{ex.name}</div>
                    <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginLeft: 8 }}>{doneSets.length} sets</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: isME ? 0 : 6 }}>
                    {doneSets.map((l, si) => (
                      <div key={si} style={{
                        background: 'var(--surface)', borderRadius: 6, padding: '4px 8px',
                        fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--text)',
                      }}>
                        <span style={{ color: 'var(--muted)', fontSize: 10 }}>S{si+1} </span>
                        {isME
                          ? <span style={{ color: 'var(--green)' }}>{l.reps}</span>
                          : <><span style={{ color: 'var(--green)', fontWeight: 700 }}>{l.reps}</span><span style={{ color: 'var(--muted)' }}> × </span><span style={{ fontWeight: 700 }}>{l.kg||'BW'}</span></>
                        }
                      </div>
                    ))}
                  </div>
                  {!isME && bestSet && parseFloat(bestSet.kg) > 0 && (
                    <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 1 }}>
                      BEST: {bestSet.reps} reps × {bestSet.kg}kg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{
            flexShrink: 0, padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
            background: 'var(--bg)', borderTop: '1px solid var(--border)',
          }}>
            <button onClick={finishWorkout} style={{
              width: '100%', background: 'var(--green)', color: '#0A0A0A',
              border: 'none', borderRadius: 13, padding: 17, fontSize: 16, fontWeight: 800, cursor: 'pointer',
            }}>Done ✓</button>
          </div>
        </div>
      )}

      {/* ── INCOMPLETE PROMPT ── */}
      {showIncompletePrompt && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'flex-end', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0',
            padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          }}>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>Finish early?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14 }}>The following exercises are incomplete:</div>
            <div style={{ marginBottom: 16 }}>
              {exercises.map((ex, i) => {
                const done = logs[i]?.every(l => l.done);
                const partial = logs[i]?.some(l => l.done) && !done;
                if (done) return null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: partial ? '#F59E0B' : 'var(--border)' }}/>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{ex.name}</span>
                    {partial && <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 9, color: '#F59E0B', letterSpacing: 1, marginLeft: 'auto' }}>PARTIAL</span>}
                    {!partial && <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginLeft: 'auto' }}>SKIPPED</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowIncompletePrompt(false)} style={{
                flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 14, fontSize: 14, color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
              }}>Keep Going</button>
              <button onClick={() => { setShowIncompletePrompt(false); handleComplete(); }} style={{
                flex: 1, background: 'var(--green)', border: 'none',
                borderRadius: 12, padding: 14, fontSize: 14, color: '#0A0A0A', fontWeight: 800, cursor: 'pointer',
              }}>Finish Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXERCISE HISTORY ── */}
      {historyEx && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'flex-end', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%', background: 'var(--card)', borderRadius: '20px 20px 0 0',
            padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 3 }}>EXERCISE HISTORY</div>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--text)', marginTop: 2 }}>{historyEx}</div>
              </div>
              <button onClick={() => setHistoryEx(null)} style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>✕</button>
            </div>
            {historyLoading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontFamily: 'Exo 2, sans-serif', fontSize: 11 }}>LOADING...</div>}
            {!historyLoading && historyData.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontFamily: 'Exo 2, sans-serif', fontSize: 11, letterSpacing: 1 }}>
                NO HISTORY YET — LOG YOUR FIRST SESSION
              </div>
            )}
            {!historyLoading && historyData.map((entry, ei) => (
              <div key={ei} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)' }}>Week {(entry.weekIdx||0)+1}</div>
                  <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)' }}>
                    {new Date(entry.date).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(entry.sets||[]).map((set, si) => (
                    <div key={si} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontFamily: 'Exo 2, sans-serif', fontSize: 11, color: 'var(--text)' }}>
                      <span style={{ color: 'var(--muted)', fontSize: 10 }}>S{set.set} </span>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>{set.reps}</span>
                      <span style={{ color: 'var(--muted)' }}> × </span>
                      <span style={{ fontWeight: 700 }}>{set.kg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
