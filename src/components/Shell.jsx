import { useState } from 'react';
import { daysTo } from '../utils.js';
import PlanTab from './PlanTab.jsx';
import OverviewTab from './OverviewTab.jsx';
import { LogTab, StatsTab } from './Tabs.jsx';
import PlanModal from './PlanModal.jsx';
import CoachChat from './CoachChat.jsx';
import { signOut } from '../supabase.js';

const S = {
  bg: '#0A0A0A', surface: '#111', card: '#1C1C1C',
  border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
  text: '#F4F4F2', muted: 'rgba(244,244,242,0.4)', green: '#00C46A',
};

const NAV = [
  { id: 'plan',     label: 'Plan'     },
  { id: 'overview', label: 'Overview' },
  { id: 'log',      label: 'Log'      },
  { id: 'stats',    label: 'Stats'    },
];

export default function Shell(props) {
  const { plan, completions, curWk, setCurWk, weekRatings, rateWeek, loadPlan, resetPlan, user, syncing, deleteHistoryEntry } = props;
  const [tab, setTab]         = useState('plan');
  const [planModal, setPlanModal] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const races = plan?.meta?.races || [];

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex' }}>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="desk-sidebar" style={{ display: 'none', width: 260, flexShrink: 0, background: S.surface, borderRight: `1px solid ${S.border}`, flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '26px 20px 18px', borderBottom: `1px solid ${S.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ShieldIcon size={26}/>
            <span style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 17, letterSpacing: 4 }}>APOGEE</span>
          </div>
          {plan && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: S.muted, letterSpacing: 2 }}>{plan.meta.name.toUpperCase()}</div>}
          {syncing && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: S.green, letterSpacing: 2, marginTop: 4 }}>SYNCING…</div>}
        </div>

        {races.length >= 2 && (
          <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {races.map((r, i) => (
              <div key={i} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, padding: '9px 12px', borderLeft: `2px solid ${S.green}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,#00C46A,transparent)' }}/>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 22, color: S.green, lineHeight: 1 }}>{daysTo(r.date)}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: S.muted, letterSpacing: 1, marginTop: 2 }}>{r.name}</div>
                {r.goal && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: S.green, marginTop: 1 }}>{r.goal}</div>}
              </div>
            ))}
          </div>
        )}

        <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: tab === n.id ? S.green : 'transparent', color: tab === n.id ? '#0A0A0A' : 'rgba(244,244,242,0.85)', fontSize: 14, fontWeight: 500, textAlign: 'left', width: '100%', border: 'none', cursor: 'pointer', transition: 'all .15s' }}>
              {n.label}
            </button>
          ))}
          <button onClick={() => setCoachOpen(true)} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'transparent', color: S.green, fontSize: 14, fontWeight: 600, textAlign: 'left', width: '100%', border: `1px solid rgba(0,196,106,0.3)`, cursor: 'pointer', marginTop: 8, transition: 'all .15s' }}>
            Coach
          </button>
        </nav>

        <div style={{ padding: '12px 14px', borderTop: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setPlanModal(true)} style={{ width: '100%', background: S.card, border: `1px solid ${S.border2}`, color: 'rgba(244,244,242,0.6)', fontSize: 10, fontWeight: 600, padding: '9px 12px', borderRadius: 8, fontFamily: 'DM Mono, monospace', letterSpacing: 1, cursor: 'pointer' }}>
            LOAD / MANAGE PLAN
          </button>
          <button onClick={() => signOut()} style={{ width: '100%', background: 'transparent', border: 'none', color: S.muted, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Mono, monospace', letterSpacing: 1 }}>
            Sign out ({user?.email?.split('@')[0]})
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content" style={{ flex: 1 }}>
        <div className="desk-topbar" style={{ display: 'none', background: S.surface, borderBottom: `1px solid ${S.border}`, padding: '14px 28px', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{NAV.find(n => n.id === tab)?.label}</div>
          <button onClick={() => setCoachOpen(true)} style={{ background: 'rgba(0,196,106,0.12)', border: `1px solid rgba(0,196,106,0.3)`, color: S.green, borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, fontFamily: 'DM Mono, monospace', letterSpacing: 1, cursor: 'pointer' }}>
            COACH
          </button>
        </div>

        <div style={{ paddingBottom: 80 }} className="tab-content">
          {tab === 'plan'     && <PlanTab     {...props} setPlanModal={setPlanModal} weekRatings={weekRatings} rateWeek={rateWeek}/>}
          {tab === 'overview' && <OverviewTab {...props}/>}
          {tab === 'log'      && <LogTab      {...props} deleteHistoryEntry={deleteHistoryEntry}/>}
          {tab === 'stats'    && <StatsTab    {...props}/>}
        </div>

        {/* Mobile bottom nav */}
        <div className="mob-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(17,17,17,0.96)', borderTop: `1px solid ${S.border}`, backdropFilter: 'blur(12px)', display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', zIndex: 50 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, padding: '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: tab === n.id ? S.green : 'rgba(244,244,242,0.4)', transition: 'color .15s' }}>
              <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: 1, fontWeight: tab === n.id ? 700 : 400 }}>{n.label.toUpperCase()}</span>
            </button>
          ))}
          <button onClick={() => setCoachOpen(true)} style={{ flex: 1, padding: '10px 4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: S.green }}>
            <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: 1, fontWeight: 600 }}>COACH</span>
          </button>
        </div>
      </div>

      {planModal && <PlanModal plan={plan} completions={completions} onClose={() => setPlanModal(false)} loadPlan={loadPlan} resetPlan={resetPlan}/>}
      {coachOpen && <CoachChat plan={plan} completions={completions} weekRatings={weekRatings} onClose={() => setCoachOpen(false)}/>}

      <style>{`
        @media(min-width:768px){
          .desk-sidebar { display:flex !important; }
          .desk-topbar  { display:flex !important; }
          .main-content { margin-left:260px; }
          .mob-nav      { display:none !important; }
          .tab-content  { padding-bottom:0 !important; }
        }
      `}</style>
    </div>
  );
}

function ShieldIcon({ size = 24 }) {
  return (
    <svg width={size} height={Math.round(size * 1.03)} viewBox="0 0 120 124" fill="none">
      <path d="M 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 L 8 26 Z" stroke="#F4F4F2" strokeWidth="5" strokeLinejoin="miter" fill="none"/>
      <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="#00C46A"/>
      <path d="M 32 78 L 60 38 L 88 78" stroke="#0A0A0A" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" fill="none"/>
      <path d="M 60 38 L 88 78 L 60 78 Z" fill="#0A0A0A"/>
    </svg>
  );
}
