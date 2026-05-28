import { useState } from 'react';
import { SESSION_TYPES } from '../utils.js';
import WorkoutModal from './WorkoutModal.jsx';

export default function SessionDetail({ session:s, wkIdx, plan, completion, gymLog, onBack, onTick, onUntick, onCompleteWorkout, onSaveGymLog, user }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [timeVal, setTimeVal] = useState('');
  const [distVal, setDistVal] = useState('');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [vestWeight, setVestWeight] = useState('');
  const [vestVert, setVestVert] = useState('');
  const tc = SESSION_TYPES[s.type]||SESSION_TYPES.easy;
  const isDone = completion?.done;
  const isGym = s.isGym;
  const isVest = s.type === 'vest';

  const handleTick = () => {
    const mins = parseInt(timeVal)||0;
    onTick(wkIdx, s.id, {
      time: mins>0?`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`:'',
      dist: isVest ? '' : distVal,
      notes: isVest ? `${vestWeight?vestWeight+'kg pack':''} ${vestVert?vestVert+'m vert':''}`.trim() : '',
      vestWeight: isVest ? vestWeight : '',
      vestVert: isVest ? vestVert : '',
    });
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const handleGymComplete = (exercises) => {
    onCompleteWorkout(wkIdx, s.id, exercises);
    setWorkoutOpen(false);
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const focusParts = {purpose:'',cue:'',rest:''};
  if(s.focus){
    const m1=s.focus.match(/PURPOSE:(.*?)(?=KEY CUE:|$)/s);
    const m2=s.focus.match(/KEY CUE:(.*?)(?=\n\n|$)/s);
    if(m1) focusParts.purpose=m1[1].trim();
    if(m2) focusParts.cue=m2[1].trim();
    if(!m1&&!m2) {
      focusParts.rest=s.focus;
    } else if(!m1&&m2) {
      // Has KEY CUE but no PURPOSE label — text before KEY CUE is the main body
      focusParts.purpose=s.focus.split('KEY CUE:')[0].trim();
    }
  }
  const preview = (s.focus||'').split('\n')[0].slice(0,220);

  return (
    <>
      <style>{`
        .sd-wrap {
          position: fixed;
          /* Sit below the Shell topbar on mobile (approx 52px + safe area) */
          top: calc(52px + env(safe-area-inset-top, 0px));
          bottom: 0; left: 0; right: 0;
          background: var(--bg);
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .sd-wrap { top: 0; left: 260px; }
        }
        .sd-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        .sd-cta {
          flex-shrink: 0;
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 8px));
          background: var(--bg);
          border-top: 1px solid var(--border);
        }
        @media (min-width: 768px) {
          .sd-cta { padding-bottom: 16px; }
        }
      `}</style>

      <div className="sd-wrap">

        {/* ── HERO HEADER ── */}
        <div style={{flexShrink:0, position:'relative', overflow:'hidden',
          background: `linear-gradient(135deg, ${tc.color}20 0%, ${tc.color}08 60%, var(--bg) 100%)`,
          borderBottom:`1px solid ${tc.color}25`,
          minHeight: 160,
        }}>
          {/* Decorative background shape */}
          <div style={{
            position:'absolute', top:-40, right:-40,
            width:180, height:180, borderRadius:'50%',
            background:`${tc.color}12`, pointerEvents:'none',
          }}/>
          <div style={{
            position:'absolute', bottom:-20, left:-20,
            width:100, height:100, borderRadius:'50%',
            background:`${tc.color}08`, pointerEvents:'none',
          }}/>

          {/* Nav row */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 0',position:'relative',zIndex:1}}>
            <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'var(--card)',border:'1px solid var(--border)',borderRadius:20,padding:'6px 12px 6px 8px',color:'var(--text)',fontSize:13,fontWeight:500,cursor:'pointer'}}>
              ← Week {wkIdx+1}
            </button>
            {isDone&&<div style={{background:'var(--green)',color:'#0A0A0A',borderRadius:20,padding:'5px 12px',fontSize:11,fontFamily:'Exo 2, sans-serif',fontWeight:700,letterSpacing:1}}>✓ DONE</div>}
          </div>

          {/* Title + pills */}
          <div style={{padding:'10px 18px 0',position:'relative',zIndex:1}}>
            <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:26,lineHeight:1.1,letterSpacing:'-.5px',marginBottom:8,color:'var(--text)'}}>{s.name.replace(/^OPTIONAL\s*[—-]\s*/i,'')}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {isGym
                ? <Pill color="#06B6D4" bg="rgba(6,182,212,.25)">GYM</Pill>
                : <>
                    <Pill color={tc.color} bg={`${tc.color}35`}>{tc.label}</Pill>
                    {s.hard&&s.type!=='speed'&&s.type!=='vest'&&<Pill color="#EF4444" bg="rgba(239,68,68,.2)">HARD</Pill>}
                  </>
              }
            </div>
          </div>

          {/* Stat chips row */}
          {(()=>{
            // Clean duration: strip OPTIONAL prefix, strip trailing " easy"
            const rawDur = s.target.split('·')[0].trim()
              .replace(/^OPTIONAL\s*[—-]\s*/i,'')
              .replace(/\s*easy$/i,'')
              .trim();
            // HR cap from target
            const hrMatch = s.target.match(/(\d+)bpm/);
            const hrCap = hrMatch ? hrMatch[1]+'bpm' : null;
            // Secondary target: first non-duration, non-HR-cap segment
            const segments = s.target.split('·').slice(1).map(x=>x.trim()).filter(x=>x && !x.match(/^HR cap/i) && !x.match(/^\d+bpm/));
            const secondTarget = segments[0]?.slice(0,28) || null;
            return (
              <div style={{display:'flex',gap:8,padding:'0 16px 16px',overflowX:'auto',scrollbarWidth:'none',position:'relative',zIndex:1}}>
                <StatChip label="DURATION" val={rawDur} color={tc.color}/>
                {hrCap&&<StatChip label="HR CAP" val={hrCap} color={tc.color}/>}
                {secondTarget&&!secondTarget.match(/bpm/)&&<StatChip label="TARGET" val={secondTarget} color={tc.color}/>}
              </div>
            );
          })()}
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="sd-body" style={{padding:'14px 14px 24px'}}>

          {/* Coach note */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,marginBottom:12,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',background:'rgba(0,196,106,0.08)',borderBottom:'1px solid rgba(0,196,106,0.12)'}}>
              <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--green)',letterSpacing:3,fontWeight:700}}>COACH</span>
              <div style={{width:4,height:4,borderRadius:'50%',background:'var(--green)',opacity:0.4}}/>
              <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'rgba(0,196,106,0.5)',letterSpacing:2,fontWeight:600}}>SESSION NOTE</span>
            </div>
            <button onClick={()=>setNoteOpen(!noteOpen)} style={{width:'100%',padding:'10px 14px',display:'flex',alignItems:'flex-start',gap:10,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
              <span style={{display:'none'}}>COACH</span>
              <div style={{flex:1,fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
                {noteOpen?(
                  <>
                    {focusParts.purpose&&<><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--green)',letterSpacing:2,marginBottom:3}}>PURPOSE</div><p style={{marginBottom:10}}>{focusParts.purpose}</p></>}
                    {focusParts.cue&&<><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#F59E0B',letterSpacing:2,marginBottom:3}}>KEY CUE</div><p>{focusParts.cue}</p></>}
                    {focusParts.rest&&<p>{focusParts.rest}</p>}
                  </>
                ):(
                  <span>{preview}{(s.focus||'').length>100?'…':''}</span>
                )}
              </div>
              <span style={{color:'var(--muted)',fontSize:12,marginTop:1,flexShrink:0,transform:noteOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
            </button>
          </div>

          {/* Gym exercise preview */}
          {isGym&&s.gymSession?.exercises&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#06B6D4',letterSpacing:3,marginBottom:10,fontWeight:700}}>PRESCRIBED</div>
              {s.gymSession.exercises.map((ex,i)=>(
                <div key={i} style={{padding:'8px 0',borderBottom:i<s.gymSession.exercises.length-1?`1px solid var(--border)`:'none'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:2,color:'var(--text)'}}>{ex.name}</div>
                  <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)'}}>
                    <span style={{color:'var(--green)'}}>{ex.sets}×{ex.reps}</span> @ {ex.load}{ex.rest?` · ${ex.rest}`:''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Run / Vest log */}
          {!isGym&&!isDone&&(
            <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:3,marginBottom:10}}>
                {isVest ? 'LOG THIS SESSION' : 'LOG THIS SESSION'}
              </div>
              {isVest ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <LInput label="TIME (min)" type="number" placeholder="55" val={timeVal} set={setTimeVal}/>
                  <LInput label="PACK WEIGHT (kg)" type="number" placeholder="8" val={vestWeight} set={setVestWeight} step="0.5"/>
                  <LInput label="VERT (m)" type="number" placeholder="400" val={vestVert} set={setVestVert}/>
                  <div style={{display:'flex',alignItems:'flex-end'}}>
                    <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',lineHeight:1.4}}>Track vert in Coros. Log total elevation gain.</div>
                  </div>
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <LInput label="TIME (min)" type="number" placeholder="60" val={timeVal} set={setTimeVal}/>
                  <LInput label="KM" type="number" placeholder="—" val={distVal} set={setDistVal} step="0.1"/>
                </div>
              )}
            </div>
          )}

          {/* Done summary */}
          {isDone&&!isGym&&(completion?.time||completion?.dist||completion?.vestVert||completion?.vestWeight)&&(
            <div style={{background:'var(--card)',border:'1px solid var(--green)',borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--green)',letterSpacing:3,marginBottom:8}}>LOGGED</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                {completion.time&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{completion.time}</div><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)'}}>TIME</div></div>}
                {!isVest&&completion.dist&&parseFloat(completion.dist)>0&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{parseFloat(completion.dist).toFixed(1)}km</div><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)'}}>DIST</div></div>}
                {isVest&&completion.vestWeight&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{completion.vestWeight}kg</div><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)'}}>PACK</div></div>}
                {isVest&&completion.vestVert&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)'}}>{completion.vestVert}m</div><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)'}}>VERT</div></div>}
              </div>
            </div>
          )}
        </div>

        {/* ── CTA — anchored to bottom ── */}
        <div className="sd-cta">
          {isGym&&!isDone&&(
            <button onClick={()=>setWorkoutOpen(true)} style={{width:'100%',background:'var(--green)',color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',letterSpacing:.3}}>
              Begin Workout
            </button>
          )}
          {isGym&&isDone&&(
            <button onClick={()=>onUntick(wkIdx,s.id)} style={{width:'100%',background:'var(--card)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:13,padding:16,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Mark Incomplete
            </button>
          )}
          {!isGym&&!isDone&&(
            <button onClick={handleTick} style={{width:'100%',background:justDone?'#00A858':'var(--green)',color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',transition:'background .3s',letterSpacing:.3}}>
              {justDone?'Done!':'Mark Complete'}
            </button>
          )}
          {!isGym&&isDone&&(
            <button onClick={()=>onUntick(wkIdx,s.id)} style={{width:'100%',background:'var(--card)',color:'var(--muted)',border:'1px solid var(--border)',borderRadius:13,padding:16,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Mark Incomplete
            </button>
          )}
        </div>
      </div>

      {workoutOpen&&s.gymSession&&(
        <WorkoutModal session={s} wkIdx={wkIdx} gymLog={gymLog} onClose={()=>setWorkoutOpen(false)} onComplete={handleGymComplete} onSaveLog={onSaveGymLog} user={user}/>
      )}
    </>
  );
}

function Pill({color,bg,children}){return<span style={{fontSize:10,fontFamily:'Exo 2, sans-serif',padding:'3px 8px',borderRadius:5,background:bg,color,fontWeight:700,letterSpacing:1}}>{children}</span>;}
function StatChip({label,val,color}){return<div style={{background:'var(--card)',border:`1px solid var(--border)`,borderRadius:10,padding:'9px 12px',flexShrink:0,minWidth:80}}><div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:color||'var(--muted)',letterSpacing:2,marginBottom:4,fontWeight:600}}>{label}</div><div style={{fontSize:14,fontWeight:700,color:'var(--text)'}}>{val}</div></div>;}
function LInput({label,val,set,type='text',placeholder,step}){
  return<div><label style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:2,display:'block',marginBottom:4}}>{label}</label>
    <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} step={step} style={{width:'100%',background:'var(--surface)',border:'1.5px solid var(--border)',borderRadius:8,color:'var(--text)',fontFamily:'Exo 2, sans-serif',fontSize:16,padding:'9px 10px',outline:'none'}}/>
  </div>;
}
