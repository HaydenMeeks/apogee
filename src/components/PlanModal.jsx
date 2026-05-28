import { useState } from 'react';
import { PLAN as BAKED_PLAN } from '../plan.js';
import { getCurWk } from '../utils.js';

export default function PlanModal({ plan, completions, onClose, loadPlan, resetPlan }) {
  const [view, setView] = useState(plan ? 'loaded' : 'empty'); // loaded | empty | confirm-reset

  const totalS = plan?.weeks.reduce((a, w) => a + w.sessions.length, 0) || 0;
  const doneS = Object.values(completions).filter(c => c?.done).length;
  const pct = totalS > 0 ? Math.round((doneS / totalS) * 100) : 0;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, padding:'22px 20px 40px', borderTop:'1px solid var(--border)', boxShadow:'0 -8px 32px rgba(0,0,0,.4)' }}>

        {view === 'loaded' && (
          <>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-.4px', marginBottom:14 }}>Training Plan</div>
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:14, marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:800, marginBottom:3 }}>{plan?.meta?.name || 'Training Plan'}</div>
              <div style={{ fontFamily:'Exo 2, sans-serif', fontSize:10, color:'var(--muted)', marginBottom:10 }}>
                Week {getCurWk(plan) + 1} of {plan?.weeks.length} · Started {plan?.meta?.startDate ? new Date(plan.meta.startDate).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }) : '—'}
              </div>
              <div style={{ height:4, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                <div style={{ width:`${pct}%`, height:'100%', background:'var(--green)', borderRadius:2 }}/>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'Exo 2, sans-serif', fontSize:10, color:'var(--muted)' }}>
                <span>{doneS}/{totalS} sessions done</span><span>{pct}%</span>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              <ActionBtn icon="🔄" title="Reset to Default Plan" sub="Reload GPT100 Build 2026 — progress preserved where IDs match" onClick={() => setView('confirm-reset')} accent/>
              <ActionBtn icon="🗑" title="Clear Plan" sub="Remove plan data · session history kept" onClick={() => setView('confirm-clear')} danger/>
            </div>
            <button onClick={onClose} style={{ width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:12, fontSize:14, fontWeight:600, color:'var(--text)', cursor:'pointer' }}>Close</button>
          </>
        )}

        {view === 'empty' && (
          <>
            <div style={{ textAlign:'center', padding:'16px 0 20px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:22, marginBottom:8 }}>No Plan Loaded</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:20 }}>Load the GPT100 Build 2026 plan to get started.</div>
              <button onClick={() => { resetPlan(); onClose(); }} style={{ width:'100%', background:'var(--green)', color:'#0A0A0A', border:'none', borderRadius:10, padding:14, fontSize:15, fontWeight:800, cursor:'pointer', letterSpacing:.3 }}>
                ⚡ Load Training Plan
              </button>
            </div>
            <button onClick={onClose} style={{ width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:12, fontSize:14, fontWeight:600, color:'var(--text)', cursor:'pointer', marginTop:8 }}>Cancel</button>
          </>
        )}

        {view === 'confirm-reset' && (
          <>
            <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🔄</div>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Reset to default plan?</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>Reloads GPT100 Build 2026. Completed sessions are preserved where IDs match.</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setView('loaded')} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:13, fontSize:14, fontWeight:600, color:'var(--text)', cursor:'pointer' }}>Cancel</button>
              <button onClick={() => { resetPlan(); onClose(); }} style={{ flex:1, background:'var(--green)', color:'#0A0A0A', border:'none', borderRadius:10, padding:13, fontSize:14, fontWeight:800, cursor:'pointer' }}>Reset</button>
            </div>
          </>
        )}

        {view === 'confirm-clear' && (
          <>
            <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🗑</div>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Clear plan?</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>Removes plan and completions. <strong style={{ color:'var(--text)' }}>Session history is kept.</strong></div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setView('loaded')} style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:13, fontSize:14, fontWeight:600, color:'var(--text)', cursor:'pointer' }}>Cancel</button>
              <button onClick={() => { loadPlan(null); onClose(); }} style={{ flex:1, background:'rgba(239,68,68,0.15)', color:'var(--race)', border:'1px solid var(--race)', borderRadius:10, padding:13, fontSize:14, fontWeight:800, cursor:'pointer' }}>Clear</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, sub, onClick, danger, accent }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:12, background:'var(--card)',
      border:`1px solid ${danger ? 'var(--border)' : accent ? 'var(--border)' : 'var(--border)'}`,
      borderRadius:12, padding:'12px 14px', cursor:'pointer', textAlign:'left', width:'100%',
      transition:'border-color .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = danger ? 'var(--race)' : 'var(--green)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <span style={{ fontSize:20, width:28, textAlign:'center', flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.4 }}>{sub}</div>
      </div>
    </button>
  );
}
