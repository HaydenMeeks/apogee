import { SESSION_TYPES } from '../utils.js';

export function LogTab({ history, deleteHistoryEntry }) {
  if (!history?.length) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:32, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>No sessions logged yet.<br/>Complete a session to see it here.</div>
      </div>
    );
  }

  return (
    <div style={{ padding:'16px 14px 24px' }}>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, marginBottom:10, fontWeight:700 }}>
        SESSION HISTORY
      </div>
      {(history || []).map(e => {
        const tc = SESSION_TYPES[e.sessionType] || SESSION_TYPES.easy;
        const d = new Date(e.date);
        const ds = d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' });
        const ts = d.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });
        return (
          <HistoryEntry key={e.id} entry={e} tc={tc} ds={ds} ts={ts} onDelete={() => deleteHistoryEntry(e.id)}/>
        );
      })}
    </div>
  );
}

function HistoryEntry({ entry: e, tc, ds, ts, onDelete }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
      <div style={{ padding:'12px 13px', borderLeft:`2px solid ${tc.color}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <div>
            <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color: tc.color, marginBottom:2, letterSpacing:1 }}>
              {ds} · {ts}
            </div>
            <div style={{ fontSize:14, fontWeight:700 }}>{e.workout}</div>
          </div>
          <span style={{ fontSize:9, fontFamily:'DM Mono,monospace', background: tc.bg, color: tc.color, padding:'2px 7px', borderRadius:5, fontWeight:700, flexShrink:0, marginLeft:8 }}>
            {tc.label}
          </span>
        </div>

        {e.type === 'gym' && e.exercises && (
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {e.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} style={{ fontSize:11, color:'var(--text2)', fontFamily:'DM Mono,monospace' }}>
                {ex.name} · <span style={{ color:'var(--green)' }}>{ex.sets}×{ex.reps}</span>{ex.weight > 0 ? ` @ ${ex.weight}kg` : ''}
              </div>
            ))}
            {e.exercises.length > 3 && <div style={{ fontSize:10, color:'var(--muted)', fontFamily:'DM Mono,monospace' }}>+{e.exercises.length - 3} more</div>}
          </div>
        )}

        {e.type === 'run' && (
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {e.time && <Stat val={e.time} lbl="TIME"/>}
            {e.dist && parseFloat(e.dist) > 0 && <Stat val={parseFloat(e.dist).toFixed(1) + 'km'} lbl="DIST"/>}
          </div>
        )}

        {e.notes && <div style={{ fontSize:11, color:'var(--muted)', fontStyle:'italic', marginTop:6 }}>"{e.notes}"</div>}

        <button onClick={onDelete} style={{ marginTop:8, background:'none', border:'none', color:'var(--race)', fontSize:10, fontFamily:'DM Mono,monospace', cursor:'pointer', opacity:.5, padding:0 }}>
          ✕ Delete
        </button>
      </div>
    </div>
  );
}

function Stat({ val, lbl }) {
  return (
    <div style={{ background:'var(--surface)', borderRadius:7, padding:'6px 9px' }}>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:700, color:'var(--text)' }}>{val}</div>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:'var(--muted)', letterSpacing:1 }}>{lbl}</div>
    </div>
  );
}

// ── STATS TAB ─────────────────────────────────────────────
export function StatsTab({ plan, completions, history }) {
  const now = new Date(), wkAgo = new Date(now - 7 * 86400000);
  const total = history?.length || 0;
  const thisWk = (history || []).filter(e => new Date(e.date) > wkAgo).length;
  const gymCount = (history || []).filter(e => e.type === 'gym').length;
  const runCount = (history || []).filter(e => e.type === 'run').length;

  const totalS = plan?.weeks.reduce((a, w) => a + w.sessions.length, 0) || 0;
  const doneS = Object.values(completions).filter(c => c?.done).length;
  const curWk = plan ? Math.floor((new Date() - new Date(plan.meta.startDate)) / (7 * 86400000)) : 0;
  const curWkSessions = plan?.weeks[curWk]?.sessions || [];
  const curWkDone = curWkSessions.filter(s => completions[`${curWk}_${s.id}`]?.done).length;
  const curWkPct = curWkSessions.length > 0 ? Math.round((curWkDone / curWkSessions.length) * 100) : 0;
  const ovPct = totalS > 0 ? Math.min(100, Math.round((doneS / totalS) * 100)) : 0;

  return (
    <div style={{ padding:'16px 14px 24px' }}>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--green)', letterSpacing:3, marginBottom:10, fontWeight:700 }}>OVERVIEW</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        {[
          { val: total, lbl: 'Total Sessions' },
          { val: thisWk, lbl: 'This Week' },
          { val: gymCount, lbl: 'Gym Sessions' },
          { val: runCount, lbl: 'Runs Logged' },
        ].map((k, i) => (
          <StatCard key={i} {...k}/>
        ))}
      </div>

      {plan && <>
        <ProgressCard label="This Week" done={curWkDone} total={curWkSessions.length} pct={curWkPct}/>
        <ProgressCard label="Overall Block" done={doneS} total={totalS} pct={ovPct}/>
      </>}
    </div>
  );
}

function StatCard({ val, lbl }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'13px 14px' }}>
      <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:36, color:'var(--green)', lineHeight:1 }}>{val}</div>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:1, marginTop:4 }}>{lbl}</div>
    </div>
  );
}

function ProgressCard({ label, done, total, pct }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'13px 14px', marginBottom:8 }}>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'var(--muted)', letterSpacing:2, marginBottom:6 }}>{label.toUpperCase()}</div>
      <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden', marginBottom:5 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'var(--green)', borderRadius:3, transition:'width .6s ease' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)' }}>
        <span>{done}/{total} sessions</span><span>{pct}%</span>
      </div>
    </div>
  );
}
