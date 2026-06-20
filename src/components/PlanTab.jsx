import React, { useState } from 'react';
import { wkRange, getCurWk, SESSION_TYPES } from '../utils.js';
import SessionDetail from './SessionDetail.jsx';

// ── EASY MINUTES LOG MODAL ─────────────────────────────────────────────────
function EasyMinutesModal({ week, weekIdx, easyTarget, easyLogs, prescribedMins, onLog, onDelete, onClose }) {
  const [mins, setMins] = useState('');
  const [km, setKm] = useState('');

  const modalTotal = easyLogs.reduce((a, l) => a + (parseInt(l.mins) || 0), 0);
  const totalLogged = modalTotal + (prescribedMins || 0);
  const pct = easyTarget > 0 ? Math.min(100, Math.round((totalLogged / easyTarget) * 100)) : 0;
  const hit = totalLogged >= easyTarget;

  function handleLog() {
    if (!mins || parseInt(mins) <= 0) return;
    onLog({ mins: parseInt(mins), km: parseFloat(km) || 0, date: new Date().toISOString() });
    setMins(''); setKm('');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'flex-end', backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', background: 'var(--card)',
        borderRadius: '20px 20px 0 0', padding: '20px 16px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 3 }}>WEEK {week}</div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, color: 'var(--text)', marginTop: 2 }}>Easy Minutes</div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
            border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{
          background: 'var(--surface)', border: `1px solid ${hit ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 32, color: hit ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>
              {totalLogged}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>min</span>
            </div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 11, color: 'var(--muted)' }}>
              {hit ? '✓ TARGET HIT' : `${easyTarget - totalLogged}min to go`}
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: hit ? 'var(--green)' : '#00C46A',
              borderRadius: 3, transition: 'width 0.5s ease',
            }}/>
          </div>
          {/* Breakdown */}
          {prescribedMins > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)' }}>
                <span style={{ color: 'var(--green)' }}>{prescribedMins}min</span> from sessions
              </div>
              <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)' }}>
                <span style={{ color: 'var(--green)' }}>{modalTotal}min</span> logged here
              </div>
            </div>
          )}
          <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: prescribedMins > 0 ? 4 : 6, textAlign: 'right' }}>
            TARGET: {easyTarget}min
          </div>
        </div>

        {/* Log form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 3, marginBottom: 12 }}>LOG EASY RUN</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>MINUTES</div>
              <input
                type="number" value={mins} onChange={e => setMins(e.target.value)}
                placeholder="60" inputMode="numeric"
                style={{
                  width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 18,
                  fontFamily: 'Archivo Black, sans-serif', padding: '10px 12px', outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 4 }}>KM (optional)</div>
              <input
                type="number" value={km} onChange={e => setKm(e.target.value)}
                placeholder="—" inputMode="decimal" step="0.1"
                style={{
                  width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 18,
                  fontFamily: 'Archivo Black, sans-serif', padding: '10px 12px', outline: 'none',
                }}
              />
            </div>
          </div>
          <button onClick={handleLog} style={{
            width: '100%', background: mins ? 'var(--green)' : 'var(--border)',
            color: mins ? '#0A0A0A' : 'var(--muted)', border: 'none',
            borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 800, cursor: mins ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}>
            + Log Run
          </button>
        </div>

        {/* History */}
        {easyLogs.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 3, marginBottom: 10 }}>THIS WEEK</div>
            {[...easyLogs].reverse().map((log, i) => (
              <div key={log.id || i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
                  <div>
                    <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 16, color: 'var(--text)', lineHeight: 1 }}>
                      {log.mins}min
                      {log.km > 0 && <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 11, color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>{log.km.toFixed(1)}km</span>}
                    </div>
                    <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(log.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <button onClick={() => onDelete(log.id)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'transparent',
                  border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {easyLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontFamily: 'Exo 2, sans-serif', fontSize: 11, letterSpacing: 1 }}>
            NO RUNS LOGGED YET THIS WEEK
          </div>
        )}
      </div>
    </div>
  );
}

// ── KM BREAKDOWN MODAL ─────────────────────────────────────────────────────
function KmBreakdownModal({ week, totalKm, breakdown, onClose }) {
  const sorted = [...breakdown].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'flex-end', backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', background: 'var(--card)',
        borderRadius: '20px 20px 0 0', padding: '20px 16px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 3 }}>WEEK {week}</div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 20, color: 'var(--text)', marginTop: 2 }}>Kilometres</div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
            border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Total */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--green)',
          borderRadius: 12, padding: '14px 16px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 32, color: 'var(--green)', lineHeight: 1 }}>
            {totalKm.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>km</span>
          </div>
          <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            FROM {breakdown.length} {breakdown.length === 1 ? 'ACTIVITY' : 'ACTIVITIES'} THIS WEEK
          </div>
        </div>

        {/* List */}
        <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 3, marginBottom: 10 }}>BREAKDOWN</div>
        {sorted.map((item, i) => (
          <div key={item.id || i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: item.source === 'log' ? '#3B82F6' : 'var(--green)',
              }}/>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {item.date ? new Date(item.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                  {item.time ? ` · ${item.time}` : ''}
                  {item.mins ? ` · ${item.mins}min` : ''}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 16, color: 'var(--text)', flexShrink: 0, marginLeft: 8 }}>
              {item.km.toFixed(1)}<span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>km</span>
            </div>
          </div>
        ))}

        {breakdown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontFamily: 'Exo 2, sans-serif', fontSize: 11, letterSpacing: 1 }}>
            NO DISTANCE LOGGED YET THIS WEEK
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }}/>
            <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)' }}>Prescribed session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6' }}/>
            <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)' }}>Logged run</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function PlanTab({ plan, completions, gymLogs, curWk, setCurWk, tickSession, untickSession, completeWorkout, saveGymLog, setPlanModal, history, setHistory, user, easyLogs, logEasyRun, deleteEasyLog }) {
  const [detailSession, setDetailSession] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [showEasyModal, setShowEasyModal] = useState(false);
  const [showKmModal, setShowKmModal] = useState(false);
  const [extraLog, setExtraLog] = useState(false);
  const [extraType, setExtraType] = useState('easy');
  const [extraTime, setExtraTime] = useState('');
  const [extraDist, setExtraDist] = useState('');

  const prevDone = React.useRef(0);
  React.useEffect(() => {
    if (!plan) return;
    const w = plan.weeks[curWk];
    const nonRest = w.sessions.filter(s => s.type !== 'rest');
    const done = nonRest.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
    if (done === nonRest.length && nonRest.length > 0 && prevDone.current < nonRest.length) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3500);
    }
    prevDone.current = done;
  }, [completions, curWk, plan]);

  if (!plan) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',padding:32,textAlign:'center'}}>
      <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,marginBottom:8,color:'var(--text)'}}>No Plan Loaded</div>
      <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.6,marginBottom:24,maxWidth:280}}>Load your training plan to get started.</div>
      <button onClick={()=>setPlanModal(true)} style={{background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:10,padding:'13px 28px',fontSize:15,fontWeight:800,cursor:'pointer'}}>
        Load Training Plan
      </button>
    </div>
  );

  if (detailSession) {
    return (
      <SessionDetail
        session={detailSession.session}
        wkIdx={detailSession.wkIdx}
        plan={plan}
        completion={completions[`${detailSession.wkIdx}_${detailSession.session.id}`]}
        gymLog={gymLogs[`${detailSession.wkIdx}_${detailSession.session.id}`] || {}}
        onBack={() => setDetailSession(null)}
        onTick={tickSession}
        onUntick={untickSession}
        onCompleteWorkout={completeWorkout}
        onSaveGymLog={saveGymLog}
        user={user}
      />
    );
  }

  const w = plan.weeks[curWk];
  const isCurrent = curWk === getCurWk(plan);
  const isAccumulated = plan.meta?.volumeTracking === 'accumulated_minutes';
  const easyTarget = w.easyMinutesTarget || 0;

  // Easy logs for this week (from modal)
  const weekEasyLogs = (easyLogs || []).filter(l => l.weekIdx === curWk);
  const modalEasyMins = weekEasyLogs.reduce((a, l) => a + (parseInt(l.mins) || 0), 0);

  // Also count completed easy/long/b2b sessions toward easy minutes
  const EASY_TYPES = ['easy', 'long', 'b2b'];
  let prescribedEasyMins = 0;
  if (isAccumulated) {
    w.sessions.filter(s => EASY_TYPES.includes(s.type)).forEach(s => {
      const c = completions[`${curWk}_${s.id}`];
      if (!c?.done) return;
      if (c?.time) {
        const p = c.time.split(':');
        prescribedEasyMins += p.length === 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : parseFloat(p[0]) || 0;
      } else {
        const m = (s.target||'').match(/^(\d+)min/);
        if (m) prescribedEasyMins += parseInt(m[1]);
      }
    });
  }

  const totalEasyMins = modalEasyMins + prescribedEasyMins;
  const easyPct = easyTarget > 0 ? Math.min(100, Math.round((totalEasyMins / easyTarget) * 100)) : 0;
  const easyHit = easyTarget > 0 && totalEasyMins >= easyTarget;

  const runs = w.sessions.filter(s => !s.isGym && s.type !== 'vest');
  const vests = w.sessions.filter(s => s.type === 'vest');
  const gyms = w.sessions.filter(s => s.isGym);
  const nonRest = w.sessions.filter(s => s.type !== 'rest');
  const done = nonRest.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const pct = nonRest.length > 0 ? Math.round((done / nonRest.length) * 100) : 0;
  const tHrs = parseFloat(w.targets?.hrs || 0);

  let logHrs = 0, logKm = 0;
  const kmBreakdown = [];
  w.sessions.forEach(s => {
    const c = completions[`${curWk}_${s.id}`];
    if (!c?.done) return;
    if (s.isGym) {
      const m = (s.target||'').match(/~?(\d+)min/);
      if (m) logHrs += parseInt(m[1]) / 60;
    } else if (s.type === 'vest') {
      if (c?.time) { const p = c.time.split(':'); logHrs += p.length === 2 ? parseInt(p[0]) + parseInt(p[1])/60 : parseFloat(p[0])/60||0; }
      else { const m = (s.target||'').match(/^(\d+)min/); if (m) logHrs += parseInt(m[1])/60; }
    } else {
      if (c?.time) { const p = c.time.split(':'); logHrs += p.length === 2 ? parseInt(p[0]) + parseInt(p[1])/60 : parseFloat(p[0])||0; }
      else { const m = (s.target||'').match(/^(\d+)min/); if (m) logHrs += parseInt(m[1])/60; }
      if (c?.dist) {
        const d = parseFloat(c.dist) || 0;
        logKm += d;
        if (d > 0) kmBreakdown.push({ id: s.id, name: s.name, km: d, time: c.time || null, date: c.date || null, source: 'session' });
      }
    }
  });
  // For accumulated plans, also count easy logs toward hrs and km
  if (isAccumulated) {
    logHrs += totalEasyMins / 60;
    weekEasyLogs.forEach(l => {
      const d = parseFloat(l.km) || 0;
      logKm += d;
      if (d > 0) kmBreakdown.push({ id: l.id, name: 'Logged Easy Run', km: d, mins: l.mins, date: l.date, source: 'log' });
    });
  }

  const hrsPct = tHrs > 0 ? Math.min(100, Math.round((logHrs/tHrs)*100)) : 0;
  const runsDone = runs.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const gymsDone = gyms.filter(s => completions[`${curWk}_${s.id}`]?.done).length;

  const RUN_TYPES = [
    { val:'easy', label:'Easy Z2' },
    { val:'long', label:'Long Run' },
    { val:'b2b',  label:'B2B' },
    { val:'speed',label:'Speed' },
    { val:'vest', label:'Vest' },
  ];

  const logExtra = () => {
    if (!extraTime) return;
    const mins = parseInt(extraTime);
    const tc = SESSION_TYPES[extraType] || SESSION_TYPES.easy;
    const entry = {
      id: Date.now(), type: 'run',
      workout: `Extra — ${tc.label}`,
      sessionType: extraType,
      date: new Date().toISOString(),
      time: `${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`,
      dist: extraDist || '', notes: '',
    };
    setHistory(prev => [entry, ...prev]);
    setExtraLog(false); setExtraTime(''); setExtraDist('');
  };

  // ── KPI CARDS ──────────────────────────────────────────────────────────
  // Third card: accumulated plan = easy minutes tappable | other = hrs
  const kpiCards = [
    { val:`${runsDone}/${runs.length}`, lbl:'RUNS', hit:runs.length>0&&runsDone===runs.length, tap:null },
    { val:`${gymsDone}/${gyms.length}`, lbl:'GYM',  hit:gyms.length>0&&gymsDone===gyms.length, tap:null },
    isAccumulated
      ? { val: easyTarget > 0 ? `${easyTarget}` : '—',
          lbl: 'MIN TARGET',
          hit: easyHit, tap: () => setShowEasyModal(true), isEasy: true }
      : { val: logHrs>0 ? logHrs.toFixed(1) : (w.targets?.hrs||'—'),
          lbl: logHrs>0 ? 'HRS DONE' : 'HRS TARGET',
          hit: logHrs>0, tap: null },
    { val: logKm>0 ? logKm.toFixed(0)+'km' : '—', lbl:'KM DONE', hit:logKm>0, tap: logKm > 0 ? () => setShowKmModal(true) : null },
  ];

  return (
    <div style={{padding:'0 0 24px'}}>
      {/* Celebration */}
      {celebrating&&(
        <div style={{position:'fixed',inset:0,zIndex:999,pointerEvents:'none'}}>
          <style>{`
            @keyframes celebPop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
            @keyframes celebFade{0%{opacity:1}70%{opacity:1}100%{opacity:0}}
            @keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
            .celeb-wrap{animation:celebFade 3.5s forwards}
            .celeb-badge{animation:celebPop 0.5s cubic-bezier(.34,1.56,.64,1) forwards}
          `}</style>
          <div className="celeb-wrap" style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {Array.from({length:30},(_,i)=>(
              <div key={i} style={{position:'absolute',top:'-20px',left:`${Math.random()*100}%`,width:8,height:8,borderRadius:Math.random()>0.5?'50%':2,background:['#00C46A','#F59E0B','#3B82F6','#EF4444','#8B5CF6'][i%5],animation:`confettiFall ${1.5+Math.random()*2}s ${Math.random()*0.5}s ease-in forwards`}}/>
            ))}
            <div className="celeb-badge" style={{textAlign:'center'}}>
              <div style={{fontSize:64,marginBottom:8}}>🏔️</div>
              <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:28,color:'#00C46A',letterSpacing:2,textShadow:'0 0 30px rgba(0,196,106,0.8)'}}>WEEK DONE</div>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:12,color:'rgba(244,244,242,0.6)',marginTop:8,letterSpacing:2}}>SUMMIT REACHED</div>
            </div>
          </div>
        </div>
      )}

      {/* Week header */}
      <div style={{padding:'16px 16px 14px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setCurWk(Math.max(0,curWk-1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>‹</button>
            <span style={{fontFamily:'Exo 2, sans-serif',fontSize:11,color:'var(--muted)',display:'inline-block',width:130,textAlign:'center'}}>{wkRange(plan.meta.startDate,curWk)}</span>
            <button onClick={()=>setCurWk(Math.min(plan.weeks.length-1,curWk+1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>›</button>
            {!isCurrent&&<button onClick={()=>setCurWk(getCurWk(plan))} style={{height:34,padding:'0 12px',borderRadius:9,background:'var(--gd)',border:'1px solid var(--green)',color:'var(--green)',fontSize:10,fontFamily:'Exo 2, sans-serif',fontWeight:700,letterSpacing:1,cursor:'pointer'}}>NOW</button>}
          </div>
          <div style={{height:34,display:'flex',alignItems:'center',padding:'0 12px',background:isCurrent?'var(--gd)':'var(--card)',border:`1px solid ${isCurrent?'var(--green)':'var(--border)'}`,borderRadius:9,fontFamily:'Exo 2, sans-serif',fontSize:10,color:isCurrent?'var(--green)':'var(--muted)',fontWeight:700,letterSpacing:1}}>
            WK {w.week}{isCurrent?' · NOW':''}
          </div>
        </div>

        <div style={{fontSize:14,fontWeight:600,letterSpacing:'-.2px',marginBottom:12,color:'var(--text2)'}}>{w.phase}</div>

        {/* KPI Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
          {kpiCards.map((k,i)=>{
            const card = (
              <div style={{
                background:'var(--card)',
                border:`1px solid ${k.hit?'var(--green)':'var(--border)'}`,
                borderRadius:10, padding:'10px 8px',
                cursor: k.tap ? 'pointer' : 'default',
                position: 'relative',
                transition: 'border-color 0.2s',
              }}>
                <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:20,lineHeight:1,color:k.hit?'var(--green)':'var(--text)'}}>{k.val}</div>
                <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:.5,marginTop:3}}>{k.lbl}</div>
                {k.tap && (
                  <div style={{position:'absolute',top:4,right:6,fontFamily:'Exo 2, sans-serif',fontSize:8,color:'var(--green)',opacity:0.7}}>+</div>
                )}
              </div>
            );
            return k.tap
              ? <button key={i} onClick={k.tap} style={{all:'unset',display:'block'}}>{card}</button>
              : <div key={i}>{card}</div>;
          })}
        </div>

        {/* Progress bars */}
        <div style={{marginBottom:2}}>
          {isAccumulated ? (
            /* Accumulated plan — easy minutes bar only, prominent */
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',fontFamily:'Exo 2, sans-serif',fontSize:11,marginBottom:5}}>
                <span style={{color:'var(--muted)'}}>Easy mins this week</span>
                <span style={{color:easyHit?'var(--green)':'var(--text)',fontWeight:700}}>
                  {totalEasyMins}<span style={{color:'var(--muted)',fontWeight:400}}>/{easyTarget}min</span>
                  {easyHit && <span style={{color:'var(--green)',marginLeft:6}}>✓</span>}
                </span>
              </div>
              <div style={{height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${easyPct}%`,height:'100%',background:'var(--green)',borderRadius:3,transition:'width .5s ease'}}/>
              </div>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',marginTop:5,textAlign:'right'}}>
                {easyPct}% · tap card to log
              </div>
            </>
          ) : (
            /* Checklist plan — session progress + hrs */
            <>
              <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',marginBottom:3}}>
                <span>{done}/{nonRest.length} sessions</span><span>{pct}%</span>
              </div>
              <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
                <div style={{width:`${pct}%`,height:'100%',background:'var(--green)',borderRadius:2,transition:'width .5s ease'}}/>
              </div>
              {tHrs>0&&<>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',marginBottom:3}}>
                  <span>Hours</span><span>{logHrs.toFixed(1)}/{tHrs}hrs</span>
                </div>
                <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${hrsPct}%`,height:'100%',background:'var(--easy)',borderRadius:2,opacity:.8,transition:'width .5s ease'}}/>
                </div>
              </>}
            </>
          )}
        </div>
      </div>

      {/* Coach note */}
      {w.coachNote&&<CoachNote note={w.coachNote}/>}

      {/* Sessions */}
      <div style={{padding:'0 12px'}}>
        {runs.length>0&&<>
          <SectionLabel>Runs ({runs.length})</SectionLabel>
          {runs.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}
        {vests.length>0&&<>
          <SectionLabel>Vest ({vests.length})</SectionLabel>
          {vests.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}
        {gyms.length>0&&<>
          <SectionLabel>Gym ({gyms.length})</SectionLabel>
          {gyms.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}

        {/* Log extra run — non-accumulated plans only */}
        {!isAccumulated && (
          <div style={{marginTop:12}}>
            <button onClick={()=>setExtraLog(!extraLog)} style={{width:'100%',background:'transparent',border:'1px dashed var(--border)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--muted)',cursor:'pointer',fontFamily:'Exo 2, sans-serif',letterSpacing:1}}>
              + LOG EXTRA RUN
            </button>
            {extraLog&&(
              <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginTop:8}}>
                <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:3,marginBottom:10}}>EXTRA RUN</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                  {RUN_TYPES.map(t=>{
                    const tc = SESSION_TYPES[t.val]||SESSION_TYPES.easy;
                    const active = extraType===t.val;
                    return(
                      <button key={t.val} onClick={()=>setExtraType(t.val)} style={{padding:'5px 10px',borderRadius:6,fontSize:10,fontFamily:'Exo 2, sans-serif',fontWeight:600,cursor:'pointer',background:active?tc.bg:'transparent',color:active?tc.color:'var(--muted)',border:`1px solid ${active?tc.color:'var(--border)'}`}}>{tc.label}</button>
                    );
                  })}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                  <div>
                    <label style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>TIME (min)</label>
                    <input type="number" value={extraTime} onChange={e=>setExtraTime(e.target.value)} placeholder="60" style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'Exo 2, sans-serif',fontSize:16,padding:'9px 10px',outline:'none'}}/>
                  </div>
                  <div>
                    <label style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>KM</label>
                    <input type="number" value={extraDist} onChange={e=>setExtraDist(e.target.value)} placeholder="—" step="0.1" style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'Exo 2, sans-serif',fontSize:16,padding:'9px 10px',outline:'none'}}/>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setExtraLog(false)} style={{flex:1,background:'transparent',border:'1px solid var(--border)',borderRadius:9,padding:11,fontSize:13,color:'var(--muted)',cursor:'pointer'}}>Cancel</button>
                  <button onClick={logExtra} style={{flex:2,background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:9,padding:11,fontSize:14,fontWeight:700,cursor:'pointer'}}>Log Run</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Easy Minutes Modal */}
      {showEasyModal && (
        <EasyMinutesModal
          week={w.week}
          weekIdx={curWk}
          easyTarget={easyTarget}
          easyLogs={weekEasyLogs}
          prescribedMins={prescribedEasyMins}
          onLog={entry => logEasyRun && logEasyRun({ ...entry, weekIdx: curWk, id: Date.now() })}
          onDelete={id => deleteEasyLog && deleteEasyLog(id)}
          onClose={() => setShowEasyModal(false)}
        />
      )}
      {showKmModal && (
        <KmBreakdownModal
          week={w.week}
          totalKm={logKm}
          breakdown={kmBreakdown}
          onClose={() => setShowKmModal(false)}
        />
      )}
    </div>
  );
}

function CoachNote({ note }) {
  const [open, setOpen] = useState(false);
  const preview = note.split('\n')[0].slice(0, 90);
  return (
    <div style={{margin:'0 12px 12px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 13px',background:'rgba(0,196,106,0.08)',borderBottom:'1px solid rgba(0,196,106,0.12)'}}>
        <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--green)',letterSpacing:3,fontWeight:700}}>COACH</span>
        <div style={{width:4,height:4,borderRadius:'50%',background:'var(--green)',opacity:0.4}}/>
        <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'rgba(0,196,106,0.5)',letterSpacing:2,fontWeight:600}}>WEEK NOTE</span>
      </div>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'10px 13px',display:'flex',alignItems:'flex-start',gap:8,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
        <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,flex:1}}>{open?note:preview+(note.length>90?'…':'')}</span>
        <span style={{color:'var(--muted)',fontSize:12,marginTop:1,flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--green)',letterSpacing:3,fontWeight:700,margin:'12px 0 8px',paddingLeft:2}}>{children}</div>;
}

function SessionRow({ session: s, completion, onTap }) {
  const tc = SESSION_TYPES[s.type] || SESSION_TYPES.easy;
  const isDone = completion?.done;
  const displayName = s.name.replace(/^OPTIONAL\s*[—-]\s*/i, '');
  return (
    <button onClick={onTap} style={{width:'100%',background:'var(--card)',border:`1px solid ${isDone?'var(--green)':'var(--border)'}`,borderRadius:13,marginBottom:8,padding:'14px 15px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',textAlign:'left',transition:'border-color .15s'}}>
      <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:isDone?'var(--green)':'transparent',border:`2px solid ${isDone?'var(--green)':'var(--border2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:isDone?'#0A0A0A':'transparent'}}>
        {isDone?'✓':''}
      </div>
      <div style={{width:7,height:7,borderRadius:'50%',background:tc.color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,letterSpacing:'-.2px',color:'var(--text)'}}>{displayName}</div>
        <div style={{fontFamily:'DM Sans, sans-serif',fontWeight:400,fontSize:12,color:'var(--muted)',marginTop:2}}>{s.target.replace(/^OPTIONAL\s*[—-]\s*/i,'').split('·')[0].trim()}</div>
        {isDone&&!s.isGym&&(completion?.time||completion?.dist)&&(
          <div style={{fontFamily:'Exo 2, sans-serif',fontSize:11,color:'var(--green)',marginTop:2}}>
            {completion.time||''}{completion.dist?' · '+parseFloat(completion.dist).toFixed(1)+'km':''}
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
        <span style={{fontSize:10,fontFamily:'Exo 2, sans-serif',background:tc.bg,color:tc.color,padding:'2px 7px',borderRadius:5,fontWeight:600}}>{tc.label}</span>
        <span style={{color:'var(--muted)',fontSize:14}}>›</span>
      </div>
    </button>
  );
}
