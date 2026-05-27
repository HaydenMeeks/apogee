import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { saveExerciseHistoryToDB, loadExerciseHistoryFromDB } from '../supabase.js';

export default function WorkoutModal({ session, wkIdx, gymLog, onClose, onComplete, onSaveLog, user }) {
  const s = session.gymSession;
  const exercises = s.exercises || [];
  const isME = s.type === 'ME_JOHNSTON';

  // Per-exercise set logging: { exIdx: [{reps, kg, done}] }
  const [logs, setLogs] = useState(() =>
    Object.fromEntries(exercises.map((ex, i) => [
      i,
      Array.from({ length: ex.sets }, (_, si) => ({
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
  const [historyEx, setHistoryEx] = useState(null); // exercise name for history modal
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const timerRef = useRef(null);

  // ── REST TIMER ──────────────────────────────────────────────────────────────
  // Unlock audio on first tap — needed for autoplay policy
  function unlockAudio() {
    try { new Audio('/timer-end.mp3').load(); } catch(e) {}
  }

  const endAudioRef = useRef(null);

  useEffect(() => {
    if (restActive && restTimer > 0) {
      // Start the 6-second clip at exactly 6 seconds remaining
      if (restTimer === 6) {
        try {
          const audio = new Audio('/timer-end.mp3');
          audio.volume = 0.8;
          endAudioRef.current = audio;
          audio.play().catch(() => {});
        } catch(e) {}
      }
      timerRef.current = setTimeout(() => setRestTimer(t => t - 1), 1000);
    } else if (restActive && restTimer === 0) {
      setRestActive(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [restActive, restTimer]);

  function startRest(seconds) {
    const secs = parseInt(String(seconds).replace(/[^0-9]/g, '')) || 60;
    setRestTimer(secs);
    setRestTotal(secs);
    setRestActive(true);
  }

  function stopRest() { setRestActive(false); setRestTimer(null); setRestTotal(null); }

  // ── EXERCISE HISTORY ────────────────────────────────────────────────────────
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

  // ── COMPLETE WORKOUT ────────────────────────────────────────────────────────
  async function handleComplete() {
    // Save exercise history to DB for each exercise
    if (user) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const exLogs = logs[i];
        const doneSets = exLogs.filter(l => l.done);
        if (doneSets.length > 0) {
          const sets = doneSets.map((l, si) => ({
            set: si + 1,
            reps: l.reps,
            kg: l.kg || 'BW',
          }));
          await saveExerciseHistoryToDB(user.id, ex.name, sets, wkIdx, session.id);
        }
      }
    }
    onComplete(logs);
  }

  const ex = exercises[activeEx];
  const exLog = logs[activeEx] || [];
  const allDone = exercises.every((_, i) => logs[i]?.every(l => l.done));

  function updateSet(setIdx, field, val) {
    setLogs(prev => ({
      ...prev,
      [activeEx]: prev[activeEx].map((l, si) =>
        si === setIdx ? { ...l, [field]: val } : l
      )
    }));
  }

  function tickSet(setIdx) {
    setLogs(prev => ({
      ...prev,
      [activeEx]: prev[activeEx].map((l, si) =>
        si === setIdx ? { ...l, done: !l.done } : l
      )
    }));
    // Auto-start rest timer when ticking done
    if (!exLog[setIdx].done && ex?.rest) {
      startRest(ex.rest);
    }
  }

  const modal = (
    <div onClick={unlockAudio} style={{
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
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--green)', letterSpacing: 3 }}>
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

      {/* ── REST TIMER BANNER ── */}
      {restActive && restTotal > 0 && (
        <div style={{
          flexShrink: 0, background: 'var(--card2)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Progress bar — green, shrinks left to right */}
          <div style={{ height: 4, background: 'var(--border)', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              background: restTimer <= 5 ? '#EF4444' : '#00C46A',
              width: `${(restTimer / restTotal) * 100}%`,
              transition: 'width 1s linear, background 0.3s',
            }}/>
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>REST</span>
              <span style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 28, color: restTimer <= 5 ? '#EF4444' : 'var(--text)' }}>{restTimer}s</span>
            </div>
            <button onClick={stopRest} style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 14px', color: 'var(--muted)',
              fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer',
            }}>SKIP</button>
          </div>
        </div>
      )}

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
            <button key={i} onClick={() => setActiveEx(i)} style={{
              flexShrink: 0, padding: '5px 10px', borderRadius: 20,
              border: `1px solid ${i === activeEx ? 'var(--green)' : 'var(--border)'}`,
              background: done ? 'var(--green)' : i === activeEx ? 'rgba(0,196,106,0.15)' : 'var(--card)',
              color: done ? '#0A0A0A' : i === activeEx ? 'var(--green)' : 'var(--muted)',
              fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
              fontWeight: 700,
            }}>
              {partial ? '◑' : done ? '✓' : String(i + 1).padStart(2, '0')}
            </button>
          );
        })}
      </div>

      {/* ── ACTIVE EXERCISE ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>

        {/* Exercise header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, color: 'var(--text)', lineHeight: 1.2 }}>
              {ex?.name}
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--green)', marginTop: 3 }}>
              {isME
                ? `${ex?.sets} sets · ${ex?.reps} · ${ex?.rest} rest`
                : `${ex?.sets} × ${ex?.reps}${ex?.rpe ? ` · RPE ${ex.rpe}` : ''} · rest ${ex?.rest}`
              }
            </div>
          </div>
          {/* History button */}
          <button onClick={() => openHistory(ex?.name)} style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0, marginLeft: 8,
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Exercise history">📋</button>
        </div>

        {/* Video link */}
        {ex?.videoUrl && (
          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--muted)',
            letterSpacing: 1, textDecoration: 'none', marginBottom: 10,
            border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
            background: 'var(--card)',
          }}>
            ▶ WATCH DEMO
          </a>
        )}

        {/* Coaching cue */}
        {ex?.coaching && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderLeft: '2px solid var(--green)', borderRadius: 10,
            padding: '10px 12px', marginBottom: 14,
            fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
          }}>
            {ex.coaching}
          </div>
        )}

        {/* Sets — ME protocol: tap to complete + auto-rest timer */}
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
                    fontSize: 14, color: l.done ? '#0A0A0A' : 'var(--muted)',
                    flexShrink: 0,
                  }}>
                    {l.done ? '✓' : si + 1}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: l.done ? 'var(--green)' : 'var(--text)', fontWeight: 700 }}>
                      SET {si + 1}
                    </div>
                    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {ex?.reps} · rest {ex?.rest}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: l.done ? 'var(--green)' : 'var(--muted)', letterSpacing: 1 }}>
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
                borderRadius: 10, padding: '10px 12px',
                transition: 'background 0.2s',
              }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
                  S{si + 1}
                </div>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'var(--muted)', marginBottom: 3 }}>REPS</div>
                  <input
                    value={l.reps}
                    onChange={e => updateSet(si, 'reps', e.target.value)}
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)', fontSize: 15,
                      fontFamily: 'DM Mono, monospace', padding: '6px 8px', outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: 'var(--muted)', marginBottom: 3 }}>KG</div>
                  <input
                    value={l.kg}
                    onChange={e => updateSet(si, 'kg', e.target.value)}
                    placeholder="—"
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)', fontSize: 15,
                      fontFamily: 'DM Mono, monospace', padding: '6px 8px', outline: 'none',
                    }}
                  />
                </div>
                <button onClick={() => tickSet(si)} style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: l.done ? 'var(--green)' : 'var(--surface)',
                  border: `2px solid ${l.done ? 'var(--green)' : 'var(--border)'}`,
                  color: l.done ? '#0A0A0A' : 'var(--muted)',
                  fontSize: 16, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>✓</button>
              </div>
            ))}
          </div>
        )}

        {/* Manual rest button — strength only, ME auto-fires */}
        {!isME && !restActive && (
          <button onClick={() => startRest(ex?.rest || '90sec')} style={{
            marginTop: 14, width: '100%', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '10px', color: 'var(--muted)', fontFamily: 'DM Mono, monospace',
            fontSize: 10, letterSpacing: 1, cursor: 'pointer',
          }}>
            START REST TIMER · {ex?.rest}
          </button>
        )}
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{
        flexShrink: 0, padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 8px))',
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8,
      }}>
        {activeEx < exercises.length - 1 ? (
          <button onClick={() => setActiveEx(activeEx + 1)} style={{
            flex: 1, background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 13, padding: 16, color: 'var(--text)', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}>
            Next Exercise →
          </button>
        ) : null}
        <button onClick={handleComplete} disabled={!allDone} style={{
          flex: 2, background: allDone ? 'var(--green)' : 'var(--card)',
          border: 'none', borderRadius: 13, padding: 17,
          color: allDone ? '#0A0A0A' : 'var(--muted)',
          fontSize: 16, fontWeight: 800, cursor: allDone ? 'pointer' : 'default',
          transition: 'background 0.3s',
        }}>
          {allDone ? 'Complete Workout ✓' : `${exercises.filter((_, i) => logs[i]?.every(l => l.done)).length}/${exercises.length} Done`}
        </button>
      </div>

      {/* ── EXERCISE HISTORY MODAL ── */}
      {historyEx && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'flex-end', backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            width: '100%', background: 'var(--card)',
            borderRadius: '20px 20px 0 0', padding: '20px 16px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '70vh', overflowY: 'auto',
          }}>
            {/* History header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--green)', letterSpacing: 3 }}>EXERCISE HISTORY</div>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 18, color: 'var(--text)', marginTop: 2 }}>{historyEx}</div>
              </div>
              <button onClick={() => setHistoryEx(null)} style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>✕</button>
            </div>

            {historyLoading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: 11 }}>
                LOADING...
              </div>
            )}

            {!historyLoading && historyData.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '32px 16px',
                color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 1,
              }}>
                NO HISTORY YET — LOG YOUR FIRST SESSION
              </div>
            )}

            {!historyLoading && historyData.map((entry, ei) => (
              <div key={ei} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--green)' }}>
                    Week {(entry.weekIdx || 0) + 1}
                  </div>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--muted)' }}>
                    {new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(entry.sets || []).map((set, si) => (
                    <div key={si} style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '6px 10px',
                      fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text)',
                    }}>
                      <span style={{ color: 'var(--muted)', fontSize: 9 }}>S{set.set} </span>
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
