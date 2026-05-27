import React, { useState } from 'react';
import { wkRange, getCurWk, SESSION_TYPES } from '../utils.js';
import SessionDetail from './SessionDetail.jsx';

export default function PlanTab({ plan, completions, gymLogs, curWk, setCurWk, tickSession, untickSession, completeWorkout, saveGymLog, setPlanModal, history, setHistory }) {
  const [detailSession, setDetailSession] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [extraLog, setExtraLog] = useState(false);
  const [extraType, setExtraType] = useState('easy');
  const [extraTime, setExtraTime] = useState('');
  const [extraDist, setExtraDist] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // Fire celebration when week goes from incomplete to complete
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
      <svg width="64" height="66" viewBox="0 0 120 124" fill="none" style={{marginBottom:16}}>
        <path d="M 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 L 8 26 Z" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="none"/>
        <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="var(--card)"/>
      </svg>
      <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,marginBottom:8}}>No Plan Loaded</div>
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
      />
    );
  }

  const w = plan.weeks[curWk];
  const isCurrent = curWk === getCurWk(plan);
  const runs = w.sessions.filter(s => !s.isGym);
  const gyms = w.sessions.filter(s => s.isGym);
  const nonRest = w.sessions.filter(s => s.type !== 'rest');
  const done = nonRest.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const pct = nonRest.length > 0 ? Math.round((done / nonRest.length) * 100) : 0;
  const tHrs = parseFloat(w.targets?.hrs || 0);
  let logHrs = 0, logKm = 0;
  w.sessions.forEach(s => {
    const c = completions[`${curWk}_${s.id}`];
    if (c?.time) { const p = c.time.split(':'); logHrs += p.length === 2 ? parseInt(p[0]) + parseInt(p[1]) / 60 : parseFloat(p[0]) || 0; }
    if (c?.dist) logKm += parseFloat(c.dist) || 0;
  });
  const hrsPct = tHrs > 0 ? Math.min(100, Math.round((logHrs / tHrs) * 100)) : 0;
  const runsDone = runs.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const gymsDone = gyms.filter(s => completions[`${curWk}_${s.id}`]?.done).length;

  // Run type options matching plan session types
  const RUN_TYPES = [
    { val: 'easy',  label: 'Easy Z2'   },
    { val: 'long',  label: 'Long Run'  },
    { val: 'b2b',   label: 'B2B'       },
    { val: 'speed', label: 'Speed'     },
    { val: 'vest',  label: 'Vest'      },
  ];

  const logExtra = () => {
    if (!extraTime) return;
    const mins = parseInt(extraTime);
    const tc = SESSION_TYPES[extraType] || SESSION_TYPES.easy;
    const entry = {
      id: Date.now(), type: 'run',
      workout: extraNotes || `Extra — ${tc.label}`,
      sessionType: extraType,
      date: new Date().toISOString(),
      time: `${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`,
      dist: extraDist || '',
      notes: extraNotes,
    };
    setHistory(prev => [entry, ...prev]);
    setExtraLog(false); setExtraTime(''); setExtraDist(''); setExtraNotes('');
  };

  return (
    <div style={{padding:'0 0 24px'}}>
      {/* Week completion celebration */}
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
              <div style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'rgba(244,244,242,0.6)',marginTop:8,letterSpacing:2}}>SUMMIT REACHED</div>
            </div>
          </div>
        </div>
      )}

      {/* Week header */}
      <div style={{padding:'16px 16px 14px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setCurWk(Math.max(0,curWk-1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>‹</button>
            <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--muted)'}}>{wkRange(plan.meta.startDate,curWk)}</span>
            <button onClick={()=>setCurWk(Math.min(plan.weeks.length-1,curWk+1))} style={{width:34,height:34,borderRadius:9,background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>›</button>
          </div>
          <div style={{background:isCurrent?'var(--gd)':'var(--card)',border:`1px solid ${isCurrent?'var(--green)':'var(--border)'}`,borderRadius:6,padding:'3px 10px',fontFamily:'DM Mono,monospace',fontSize:9,color:isCurrent?'var(--green)':'var(--muted)',fontWeight:600,letterSpacing:1}}>
            WK {w.week}{isCurrent?' · NOW':''}
          </div>
        </div>

        <div style={{fontSize:14,fontWeight:600,letterSpacing:'-.2px',marginBottom:12,color:'var(--text2)'}}>{w.phase}</div>

        {/* KPI row — Runs, Gym, Hrs, Km */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
          {[
            {val:`${runsDone}/${runs.length}`, lbl:'RUNS',    hit:runs.length>0&&runsDone===runs.length},
            {val:`${gymsDone}/${gyms.length}`, lbl:'GYM',     hit:gyms.length>0&&gymsDone===gyms.length},
            {val:logHrs>0?logHrs.toFixed(1):(w.targets?.hrs||'—'), lbl:logHrs>0?'HRS DONE':'HRS TARGET', hit:logHrs>0},
            {val:logKm>0?logKm.toFixed(0)+'km':'—',           lbl:'KM DONE',  hit:logKm>0},
          ].map((k,i)=>(
            <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 10px'}}>
              <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,lineHeight:1,color:k.hit?'var(--green)':'var(--text)'}}>{k.val}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'var(--muted)',letterSpacing:.5,marginTop:3}}>{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div style={{marginBottom:2}}>
          <div style={{display:'flex',justifyContent:'space-between',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',marginBottom:3}}>
            <span>{done}/{nonRest.length} sessions</span><span>{pct}%</span>
          </div>
          <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden',marginBottom:6}}>
            <div style={{width:`${pct}%`,height:'100%',background:'var(--green)',borderRadius:2,transition:'width .5s ease'}}/>
          </div>
          {tHrs>0&&<>
            <div style={{display:'flex',justifyContent:'space-between',fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',marginBottom:3}}>
              <span>Hours</span><span>{logHrs.toFixed(1)}/{tHrs}hrs</span>
            </div>
            <div style={{height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${hrsPct}%`,height:'100%',background:'var(--easy)',borderRadius:2,opacity:.8,transition:'width .5s ease'}}/>
            </div>
          </>}
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
        {gyms.length>0&&<>
          <SectionLabel>Gym ({gyms.length})</SectionLabel>
          {gyms.map(s=>(
            <SessionRow key={s.id} session={s} completion={completions[`${curWk}_${s.id}`]} onTap={()=>setDetailSession({session:s,wkIdx:curWk})}/>
          ))}
        </>}

        {/* Log extra run */}
        <div style={{marginTop:12}}>
          <button onClick={()=>setExtraLog(!extraLog)} style={{width:'100%',background:'transparent',border:'1px dashed rgba(255,255,255,0.12)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--muted)',cursor:'pointer',fontFamily:'DM Mono,monospace',letterSpacing:1,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,196,106,0.3)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'}>
            + LOG EXTRA RUN
          </button>
          {extraLog&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginTop:8}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:3,marginBottom:10}}>EXTRA RUN</div>

              {/* Type selector — styled pills */}
              <div style={{marginBottom:10}}>
                <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:6}}>TYPE</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {RUN_TYPES.map(t=>{
                    const tc = SESSION_TYPES[t.val] || SESSION_TYPES.easy;
                    const active = extraType === t.val;
                    return(
                      <button key={t.val} onClick={()=>setExtraType(t.val)} style={{
                        padding:'5px 10px',borderRadius:6,fontSize:10,fontFamily:'DM Mono,monospace',fontWeight:600,cursor:'pointer',
                        background:active?tc.bg:'transparent',
                        color:active?tc.color:'var(--muted)',
                        border:`1px solid ${active?tc.color:'rgba(255,255,255,0.1)'}`,
                        transition:'all .15s',
                      }}>{tc.label}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>DURATION (min)</label>
                  <input type="number" value={extraTime} onChange={e=>setExtraTime(e.target.value)} placeholder="60" style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:14,padding:'9px 10px',outline:'none'}}/>
                </div>
                <div>
                  <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>KM (optional)</label>
                  <input type="number" value={extraDist} onChange={e=>setExtraDist(e.target.value)} placeholder="—" step="0.1" style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:14,padding:'9px 10px',outline:'none'}}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>NOTES</label>
                <input type="text" value={extraNotes} onChange={e=>setExtraNotes(e.target.value)} placeholder="How did it go?" style={{width:'100%',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:14,padding:'9px 10px',outline:'none'}}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setExtraLog(false)} style={{flex:1,background:'transparent',border:'1px solid var(--border)',borderRadius:9,padding:11,fontSize:13,color:'var(--muted)',cursor:'pointer'}}>Cancel</button>
                <button onClick={logExtra} style={{flex:2,background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:9,padding:11,fontSize:14,fontWeight:700,cursor:'pointer'}}>Log Run</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoachNote({ note }) {
  const [open, setOpen] = useState(false);
  const preview = note.split('\n')[0].slice(0, 90);
  return (
    <div style={{margin:'0 12px 12px',background:'var(--card)',border:'1px solid var(--border)',borderLeft:'2px solid var(--green)',borderRadius:10,overflow:'hidden'}}>
      <button onClick={()=>setOpen(!open)} style={{width:'100%',padding:'11px 13px',display:'flex',alignItems:'flex-start',gap:8,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,fontWeight:700,flexShrink:0,marginTop:1}}>COACH</span>
        <span style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,flex:1}}>{open?note:preview+(note.length>90?'…':'')}</span>
        <span style={{color:'var(--muted)',fontSize:12,marginTop:1,flexShrink:0,transform:open?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
      </button>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'var(--green)',letterSpacing:3,fontWeight:700,margin:'12px 0 8px',paddingLeft:2}}>{children}</div>;
}

function SessionRow({ session: s, completion, onTap }) {
  const tc = SESSION_TYPES[s.type] || SESSION_TYPES.easy;
  const isDone = completion?.done;
  return (
    <button onClick={onTap} style={{width:'100%',background:'var(--card)',border:`1px solid ${isDone?'var(--green)':'var(--border)'}`,borderRadius:13,marginBottom:8,padding:'14px 15px',display:'flex',alignItems:'center',gap:11,cursor:'pointer',textAlign:'left',transition:'border-color .15s'}}>
      <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,background:isDone?'var(--green)':'transparent',border:`2px solid ${isDone?'var(--green)':'var(--border2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:isDone?'#0A0A0A':'transparent'}}>
        {isDone?'✓':''}
      </div>
      <div style={{width:7,height:7,borderRadius:'50%',background:tc.color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,letterSpacing:'-.2px',color:'var(--text)'}}>{s.name}</div>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--muted)',marginTop:2}}>{s.target.split('·')[0].trim()}</div>
        {isDone&&!s.isGym&&(completion?.time||completion?.dist)&&(
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--green)',marginTop:2}}>
            {completion.time||''}{completion.dist?' · '+parseFloat(completion.dist).toFixed(1)+'km':''}
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
        <span style={{fontSize:9,fontFamily:'DM Mono,monospace',background:tc.bg,color:tc.color,padding:'2px 7px',borderRadius:5,fontWeight:600}}>{tc.label}</span>
        <span style={{color:'var(--muted)',fontSize:14}}>›</span>
      </div>
    </button>
  );
}
