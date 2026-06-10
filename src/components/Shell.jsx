import { useState } from 'react';
import { daysTo } from '../utils.js';
import PlanTab from './PlanTab.jsx';
import OverviewTab from './OverviewTab.jsx';
import { StatsTab } from './Tabs.jsx';
import PlanModal from './PlanModal.jsx';
import CoachChat from './CoachChat.jsx';
import { signOut } from '../supabase.js';

const NAV = [
  { id: 'plan',     label: 'Plan'     },
  { id: 'overview', label: 'Overview' },
  { id: 'stats',    label: 'Stats'    },
];

export default function Shell(props) {
  const { plan, completions, curWk, setCurWk, weekRatings, rateWeek, loadPlan, resetPlan, user, syncing, deleteHistoryEntry, theme, toggleTheme } = props;
  const [tab, setTab]         = useState('plan');
  const [planModal, setPlanModal] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const races = plan?.meta?.races || [];

  const closeDrawer = () => setDrawerOpen(false);
  const navTo = (id) => { setTab(id); closeDrawer(); };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', minHeight: '100dvh' }}>

      {/* ── MOBILE TOP BAR ── */}
      <div className="mob-topbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        background: 'var(--surface)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        position: 'fixed',
      }}>
        {/* Shield — opens drawer */}
        <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <ShieldIcon size={32}/>
        </button>
        {/* Tab label — absolutely centred */}
        <span style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Archivo Black, sans-serif', fontSize: 13, letterSpacing: 3, color: 'var(--text)',
          pointerEvents: 'none',
        }}>
          {NAV.find(n => n.id === tab)?.label.toUpperCase() || 'PLAN'}
        </span>
        {/* Coach button */}
        <button onClick={() => setCoachOpen(true)} style={{
          background: 'rgba(0,196,106,0.15)', border: '1px solid rgba(0,196,106,0.4)',
          color: 'var(--green)', borderRadius: 20, padding: '6px 14px',
          fontSize: 11, fontWeight: 700, fontFamily: 'Exo 2, sans-serif', letterSpacing: 1, cursor: 'pointer',
          flexShrink: 0, marginLeft: 'auto',
        }}>
          COACH
        </button>
      </div>

      {/* ── DRAWER OVERLAY ── */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── DRAWER ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
        width: 280,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Drawer header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ShieldIcon size={36}/>
          <button onClick={closeDrawer} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card2)', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Race countdowns */}
        {races.length >= 1 && (
          <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {races.map((r, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 24, color: 'var(--green)', lineHeight: 1 }}>{daysTo(r.date)}</div>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 1 }}>DAYS TO GO</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{r.name.split('·')[0].trim()}</div>
                {r.goal && <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', marginTop: 2 }}>{r.goal}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Nav items — top */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => navTo(n.id)} style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px',
              borderRadius: 10,
              background: tab === n.id ? 'var(--green)' : 'transparent',
              color: tab === n.id ? '#0A0A0A' : 'var(--text)',
              fontSize: 15, fontWeight: tab === n.id ? 700 : 500,
              textAlign: 'left', width: '100%', border: 'none', cursor: 'pointer',
              transition: 'all .15s',
              opacity: tab === n.id ? 1 : 0.8,
            }}>
              {n.label}
            </button>
          ))}
          <button onClick={() => { setCoachOpen(true); closeDrawer(); }} style={{
            display: 'flex', alignItems: 'center', padding: '12px 14px',
            borderRadius: 10, background: 'transparent',
            color: 'var(--green)', fontSize: 15, fontWeight: 600,
            textAlign: 'left', width: '100%',
            border: '1px solid rgba(0,196,106,0.25)', cursor: 'pointer', marginTop: 6,
          }}>
            Coach
          </button>
        </nav>

        {/* Bottom — settings */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {syncing && <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 2, padding: '4px 14px' }}>SYNCING…</div>}
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
              {theme === 'dark' ? '🌙  DARK' : '☀️  LIGHT'}
            </span>
            <button onClick={toggleTheme} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'var(--green)',
              position: 'relative', transition: 'background .25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                background: theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#fff',
                left: theme === 'dark' ? 3 : 25,
                transition: 'left .25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}/>
            </button>
          </div>
          <button onClick={() => { setPlanModal(true); closeDrawer(); }} style={{
            padding: '10px 14px', borderRadius: 9,
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--muted)', fontSize: 11, fontWeight: 600,
            fontFamily: 'Exo 2, sans-serif', letterSpacing: 1, cursor: 'pointer', width: '100%', textAlign: 'left',
          }}>
            MANAGE PLAN
          </button>
          <button onClick={() => signOut()} style={{
            padding: '10px 14px', borderRadius: 9,
            background: 'transparent', border: 'none',
            color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
            fontFamily: 'Exo 2, sans-serif', letterSpacing: 1, textAlign: 'left',
          }}>
            Sign out · {user?.email?.split('@')[0]}
          </button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="desk-sidebar" style={{ display: 'none', width: 260, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '26px 20px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldIcon size={32}/>
          {syncing && <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginLeft: 'auto' }}>SYNCING…</div>}
        </div>
        {races.length >= 1 && (
          <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {races.map((r, i) => (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ fontFamily: 'Archivo Black, sans-serif', fontSize: 24, color: 'var(--green)', lineHeight: 1 }}>{daysTo(r.date)}</div>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginTop: 1 }}>DAYS TO GO</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>{r.name.split('·')[0].trim()}</div>
                {r.goal && <div style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--green)', marginTop: 2 }}>{r.goal}</div>}
              </div>
            ))}
          </div>
        )}
        <nav style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: tab === n.id ? 'var(--green)' : 'transparent', color: tab === n.id ? '#0A0A0A' : 'rgba(244,244,242,0.85)', fontSize: 14, fontWeight: 500, textAlign: 'left', width: '100%', border: 'none', cursor: 'pointer', transition: 'all .15s' }}>
              {n.label}
            </button>
          ))}
          <button onClick={() => setCoachOpen(true)} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'transparent', color: 'var(--green)', fontSize: 14, fontWeight: 600, textAlign: 'left', width: '100%', border: '1px solid rgba(0,196,106,0.3)', cursor: 'pointer', marginTop: 8 }}>
            Coach
          </button>
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px' }}>
            <span style={{ fontFamily: 'Exo 2, sans-serif', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
              {theme === 'dark' ? '🌙  DARK' : '☀️  LIGHT'}
            </span>
            <button onClick={toggleTheme} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'var(--green)',
              position: 'relative', transition: 'background .25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                background: theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#fff',
                left: theme === 'dark' ? 3 : 25,
                transition: 'left .25s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}/>
            </button>
          </div>
          <button onClick={() => setPlanModal(true)} style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 10, fontWeight: 600, padding: '9px 12px', borderRadius: 8, fontFamily: 'Exo 2, sans-serif', letterSpacing: 1, cursor: 'pointer' }}>
            MANAGE PLAN
          </button>
          <button onClick={() => signOut()} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'Exo 2, sans-serif', letterSpacing: 1 }}>
            Sign out ({user?.email?.split('@')[0]})
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{ flex: 1 }}>
        <div style={{ paddingBottom: 24, paddingTop: 'calc(52px + env(safe-area-inset-top, 0px))' }} className="tab-content">
          {tab === 'plan'     && <PlanTab     {...props} setPlanModal={setPlanModal} weekRatings={weekRatings} rateWeek={rateWeek}/>}
          {tab === 'overview' && <OverviewTab {...props}/>}
          {tab === 'stats'    && <StatsTab    {...props}/>}
        </div>
      </div>

      {planModal && <PlanModal plan={plan} completions={completions} onClose={() => setPlanModal(false)} loadPlan={loadPlan} resetPlan={resetPlan}/>}
      {coachOpen && <CoachChat plan={plan} completions={completions} weekRatings={weekRatings} onClose={() => setCoachOpen(false)}/>}

      <style>{`
        .mob-topbar { display: flex; }
        @media(min-width:768px){
          .mob-topbar   { display: none !important; }
          .desk-sidebar { display: flex !important; }
          .main-content { margin-left: 260px; }
          .tab-content  { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function ShieldIcon({ size = 24 }) {
  return (
    <svg width={size} height={Math.round(size * 1.03)} viewBox="0 0 120 124" fill="none">
      <path d="M 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 L 8 26 Z" stroke="var(--text)" strokeWidth="5" strokeLinejoin="miter" fill="none" opacity="0.4"/>
      <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="var(--green)"/>
      <path d="M 32 78 L 60 38 L 88 78" stroke="var(--bg)" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" fill="none"/>
      <path d="M 60 38 L 88 78 L 60 78 Z" fill="var(--bg)"/>
    </svg>
  );
}
