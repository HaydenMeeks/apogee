import { useState, useRef } from 'react';
import { SESSION_TYPES } from '../utils.js';
import WorkoutModal from './WorkoutModal.jsx';

const S = {
  bg:'#0A0A0A', card:'#1E1E1E', surface:'#161616',
  border:'rgba(255,255,255,0.1)', border2:'rgba(255,255,255,0.18)',
  text:'#F4F4F2', text2:'rgba(244,244,242,0.75)', muted:'rgba(244,244,242,0.4)',
  green:'#00C46A',
};

export default function SessionDetail({ session:s, wkIdx, plan, completion, gymLog, onBack, onTick, onUntick, onCompleteWorkout, onSaveGymLog }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [timeVal, setTimeVal] = useState('');
  const [distVal, setDistVal] = useState('');
  const [notesVal, setNotesVal] = useState(completion?.notes||'');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const tc = SESSION_TYPES[s.type]||SESSION_TYPES.easy;
  const isDone = completion?.done;
  const isGym = s.isGym;

  const handleTick = () => {
    const mins = parseInt(timeVal)||0;
    onTick(wkIdx, s.id, {
      time: mins>0?`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`:'',
      dist: distVal, notes: notesVal,
    });
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const handleGymComplete = (exercises) => {
    onCompleteWorkout(wkIdx, s.id, exercises);
    setWorkoutOpen(false);
    setJustDone(true); setTimeout(()=>setJustDone(false),1500);
  };

  const lines = (s.focus||'').split('\n').filter(Boolean);
  const preview = lines[0]?.slice(0,100)||'';
  const focusParts = {purpose:'',cue:'',rest:''};
  if(s.focus){
    const m1=s.focus.match(/PURPOSE:(.*?)(?=KEY CUE:|$)/s);
    const m2=s.focus.match(/KEY CUE:(.*?)(?=\n\n|$)/s);
    if(m1)focusParts.purpose=m1[1].trim();
    if(m2)focusParts.cue=m2[1].trim();
    if(!m1&&!m2)focusParts.rest=s.focus;
  }

  return (
    <>
      <style>{`
        .session-detail-wrap {
          position: fixed;
          top: 0; bottom: 0; right: 0; left: 0;
          background: #0A0A0A;
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .session-detail-wrap { left: 260px; }
        }
        .session-cta {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          padding: 12px 16px;
          /* Mobile: clear the 48px bottom nav + Safari home bar */
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
          background: rgba(10,10,10,0.97);
          border-top: 1px solid rgba(255,255,255,0.1);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
        }
        /* Desktop has no bottom nav */
        @media (min-width: 768px) {
          .session-cta {
            padding-bottom: calc(12px + env(safe-area-inset-bottom, 8px));
          }
        }
      `}</style>
      {/* Full screen layout — fixed, no scroll issues */}
      <div className="session-detail-wrap">

        {/* Hero */}
        <div style={{background:tc.bg,borderBottom:`1px solid ${tc.color}22`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px 16px'}}>
            <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,background:'rgba(0,0,0,0.3)',border:`1px solid ${S.border}`,borderRadius:20,padding:'6px 12px 6px 8px',color:S.text,fontSize:14,fontWeight:500,cursor:'pointer'}}>
              ← Week {wkIdx+1}
            </button>
            {isDone&&<div style={{background:S.green,color:'#0A0A0A',borderRadius:20,padding:'5px 12px',fontSize:11,fontFamily:'DM Mono,monospace',fontWeight:700,letterSpacing:1}}>DONE</div>}
          </div>
          <div style={{padding:'0 18px 20px'}}>
            <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:28,lineHeight:1.1,letterSpacing:'-.5px',marginBottom:8}}>{s.name}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {isGym
                ? <Pill color="#06B6D4" bg="rgba(6,182,212,.2)">GYM</Pill>
                : <>
                    <Pill color={tc.color} bg={`${tc.color}30`}>{tc.label}</Pill>
                    <Pill color={s.hard?'#EF4444':S.green} bg={s.hard?'rgba(239,68,68,.2)':'rgba(0,196,106,.2)'}>{s.hard?'HARD':'EASY'}</Pill>
                  </>
              }
            </div>
            <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none',paddingBottom:2}}>
              <StatChip label="DURATION" val={s.target.split('·')[0].trim()}/>
              {s.target.includes('HR')&&<StatChip label="HR CAP" val={(s.target.match(/(\d+)bpm/)||[])[1]?((s.target.match(/(\d+)bpm/)||[])[1]+'bpm'):'132bpm'}/>}
              <StatChip label="PHASE" val={(plan?.weeks[wkIdx]?.phase||'').split('·').pop().trim().slice(0,18)||'—'}/>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'14px 14px 0'}}>

          {/* Coach note */}
          <div style={{background:S.card,border:`1px solid ${S.border}`,borderLeft:`2px solid ${S.green}`,borderRadius:12,marginBottom:12,overflow:'hidden'}}>
            <button onClick={()=>setNoteOpen(!noteOpen)} style={{width:'100%',padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:10,background:'transparent',border:'none',cursor:'pointer',textAlign:'left'}}>
              <span style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.green,letterSpacing:3,fontWeight:700,flexShrink:0,marginTop:1}}>COACH</span>
              <div style={{flex:1,fontSize:13,color:S.text2,lineHeight:1.6}}>
                {noteOpen?(
                  <>
                    {focusParts.purpose&&<><div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.green,letterSpacing:2,marginBottom:3}}>PURPOSE</div><p style={{marginBottom:10}}>{focusParts.purpose}</p></>}
                    {focusParts.cue&&<><div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#F59E0B',letterSpacing:2,marginBottom:3}}>KEY CUE</div><p>{focusParts.cue}</p></>}
                    {focusParts.rest&&<p>{focusParts.rest}</p>}
                  </>
                ):(
                  <span>{preview}{(s.focus||'').length>100?'…':''}</span>
                )}
              </div>
              <span style={{color:S.muted,fontSize:12,marginTop:1,flexShrink:0,transform:noteOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>▾</span>
            </button>
          </div>

          {/* Gym exercise preview */}
          {isGym&&s.gymSession?.exercises&&(
            <div style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'#06B6D4',letterSpacing:3,marginBottom:10,fontWeight:700}}>PRESCRIBED</div>
              {s.gymSession.exercises.map((ex,i)=>(
                <div key={i} style={{padding:'8px 0',borderBottom:i<s.gymSession.exercises.length-1?`1px solid ${S.border}`:'none'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{ex.name}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:10,color:S.muted}}>
                    <span style={{color:S.green}}>{ex.sets}×{ex.reps}</span> @ {ex.load}{ex.rest?` · ${ex.rest}`:''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Run log */}
          {!isGym&&!isDone&&(
            <div style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.muted,letterSpacing:3,marginBottom:10}}>LOG THIS SESSION</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <LInput label="TIME (min)" type="number" placeholder="60" val={timeVal} set={setTimeVal}/>
                <LInput label="KM" type="number" placeholder="—" val={distVal} set={setDistVal} step="0.1"/>
              </div>
              <LInput label="NOTES" placeholder="How did it feel?" val={notesVal} set={setNotesVal} multi/>
            </div>
          )}

          {/* Done summary */}
          {isDone&&!isGym&&(completion?.time||completion?.dist)&&(
            <div style={{background:S.card,border:`1px solid ${S.green}`,borderRadius:12,padding:14,marginBottom:12}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:9,color:S.green,letterSpacing:3,marginBottom:8}}>LOGGED</div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:8}}>
                {completion.time&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22}}>{completion.time}</div><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:S.muted}}>TIME</div></div>}
                {completion.dist&&parseFloat(completion.dist)>0&&<div><div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22}}>{parseFloat(completion.dist).toFixed(1)}km</div><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:S.muted}}>DIST</div></div>}
              </div>
              {completion.notes&&<div style={{fontSize:12,color:S.muted,fontStyle:'italic'}}>"{completion.notes}"</div>}
            </div>
          )}
          {/* Spacer so content clears the sticky CTA */}
          <div style={{height:160}}/>
        </div>

        {/* Sticky CTA — above Safari bar */}
        <div className="session-cta">
          {isGym&&!isDone&&(
            <button onClick={()=>setWorkoutOpen(true)} style={{width:'100%',background:S.green,color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',letterSpacing:.3}}>
              Begin Workout
            </button>
          )}
          {isGym&&isDone&&(
            <button onClick={()=>onUntick(wkIdx,s.id)} style={{width:'100%',background:S.card,color:S.muted,border:`1px solid ${S.border}`,borderRadius:13,padding:16,fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Mark Incomplete
            </button>
          )}
          {!isGym&&!isDone&&(
            <button onClick={handleTick} style={{width:'100%',background:justDone?'#00A858':S.green,color:'#0A0A0A',border:'none',borderRadius:13,padding:17,fontSize:16,fontWeight:800,cursor:'pointer',transition:'background .3s',letterSpacing:.3}}>
              {justDone?'Done!':'Mark Complete'}
            </button>
          )}
          {!isGym&&isDone&&(
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>onUntick(wkIdx,s.id)} style={{background:S.card,color:S.muted,border:`1px solid ${S.border}`,borderRadius:13,padding:'14px 18px',fontSize:14,fontWeight:600,cursor:'pointer'}}>↺</button>
              <button onClick={()=>{handleTick();setTimeout(onBack,400);}} style={{flex:1,background:S.card,color:S.text,border:`1px solid ${S.green}`,borderRadius:13,padding:14,fontSize:14,fontWeight:700,cursor:'pointer'}}>Update Log</button>
            </div>
          )}
        </div>
      </div>

      {/* WorkoutModal — portalled to document.body via createPortal inside WorkoutModal itself */}
      {workoutOpen&&s.gymSession&&(
        <WorkoutModal
          session={s} wkIdx={wkIdx}
          gymLog={gymLog}
          onClose={()=>setWorkoutOpen(false)}
          onComplete={handleGymComplete}
          onSaveLog={onSaveGymLog}
        />
      )}
    </>
  );
}

function Pill({color,bg,children}){return<span style={{fontSize:10,fontFamily:'DM Mono,monospace',padding:'3px 8px',borderRadius:5,background:bg,color,fontWeight:700,letterSpacing:1}}>{children}</span>;}
function StatChip({label,val}){return<div style={{background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',flexShrink:0,minWidth:90}}><div style={{fontFamily:'DM Mono,monospace',fontSize:8,color:'rgba(244,244,242,0.4)',letterSpacing:2,marginBottom:3}}>{label}</div><div style={{fontSize:13,fontWeight:700}}>{val}</div></div>;}
function LInput({label,val,set,type='text',placeholder,step,multi}){
  return<div><label style={{fontFamily:'DM Mono,monospace',fontSize:9,color:'rgba(244,244,242,0.4)',letterSpacing:2,display:'block',marginBottom:4}}>{label}</label>
    {multi?<textarea value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} style={{width:'100%',background:'#111',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F4F4F2',fontSize:14,padding:'9px 10px',resize:'none',height:44,outline:'none',fontFamily:'DM Sans,sans-serif'}}/>
    :<input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} step={step} style={{width:'100%',background:'#111',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#F4F4F2',fontFamily:'DM Mono,monospace',fontSize:16,padding:'9px 10px',outline:'none'}}/>}
  </div>;
}
