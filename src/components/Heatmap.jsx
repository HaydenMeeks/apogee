import { getCurWk, SESSION_TYPES } from '../utils.js';

export default function Heatmap({ plan, completions }) {
  if (!plan) return null;
  const curWk = getCurWk(plan);

  return (
    <div style={{ background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'rgba(244,244,242,0.35)', letterSpacing: 3, marginBottom: 10 }}>TRAINING LOAD · 25 WEEKS</div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {plan.weeks.map((w, wi) => {
          const nonRest = w.sessions.filter(s => s.type !== 'rest');
          const done = nonRest.filter(s => completions[`${wi}_${s.id}`]?.done).length;
          const total = nonRest.length;
          const pct = total > 0 ? done / total : 0;
          const isCur = wi === curWk;
          const isPast = wi < curWk;
          const hasRace = w.sessions.some(s => s.type === 'race');

          // Color logic
          let bg;
          if (hasRace) bg = '#EF4444';
          else if (pct === 1) bg = '#00C46A';
          else if (pct > 0) bg = `rgba(0,196,106,${0.3 + pct * 0.5})`;
          else if (isPast) bg = 'rgba(244,244,242,0.06)';
          else bg = 'rgba(244,244,242,0.04)';

          return (
            <div key={wi} title={`Week ${w.week}: ${done}/${total} done`} style={{
              width: 14, height: 14, borderRadius: 3,
              background: bg,
              outline: isCur ? `2px solid #00C46A` : 'none',
              outlineOffset: 1,
              flexShrink: 0,
              transition: 'background .2s',
            }}/>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          ['#00C46A', 'Complete'],
          ['rgba(0,196,106,0.4)', 'Partial'],
          ['rgba(244,244,242,0.06)', 'Missed'],
          ['rgba(244,244,242,0.04)', 'Upcoming'],
          ['#EF4444', 'Race'],
        ].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }}/>
            <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'rgba(244,244,242,0.3)', letterSpacing: 1 }}>{label.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
