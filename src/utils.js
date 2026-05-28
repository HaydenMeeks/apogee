export const DB = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export const SESSION_TYPES = {
  easy:  { label: 'EASY Z2',   color: '#3B82F6', bg: 'rgba(59,130,246,.15)'  },
  vest:  { label: 'VEST',      color: '#EC4899', bg: 'rgba(236,72,153,.15)'  },
  speed: { label: 'SPEED',     color: '#F59E0B', bg: 'rgba(245,158,11,.15)'  },
  long:  { label: 'LONG RUN',  color: '#10B981', bg: 'rgba(16,185,129,.15)'  },
  b2b:   { label: 'B2B',       color: '#8B5CF6', bg: 'rgba(139,92,246,.15)'  },
  race:  { label: 'RACE',      color: '#EF4444', bg: 'rgba(239,68,68,.15)'   },
  gym:   { label: 'GYM',       color: '#06B6D4', bg: 'rgba(6,182,212,.15)'   },
  rest:  { label: 'REST',      color: '#6B7280', bg: 'rgba(107,114,128,.15)' },
};

export function wkRange(startDate, wkIdx) {
  const s = new Date(startDate);
  s.setDate(s.getDate() + wkIdx * 7);
  const e = new Date(s); e.setDate(s.getDate() + 6);
  const f = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  return `${f(s)} – ${f(e)}`;
}

export function getCurWk(plan) {
  if (!plan) return 0;
  const d = Math.floor((new Date() - new Date(plan.meta.startDate)) / (7 * 86400000));
  return Math.max(0, Math.min(d, plan.weeks.length - 1));
}

export function daysTo(dateStr) {
  return Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000));
}

export function minsToHMM(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s.includes(':')) return s;
  const m = parseInt(s);
  if (isNaN(m)) return s;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function hmmToMins(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (!s.includes(':')) return s;
  const [h, m] = s.split(':');
  return String(parseInt(h) * 60 + (parseInt(m) || 0));
}

// Training load heatmap data
export function buildHeatmapData(plan, completions) {
  if (!plan) return [];
  const start = new Date(plan.meta.startDate);
  const cells = [];
  plan.weeks.forEach((w, wi) => {
    w.sessions.forEach(s => {
      const c = completions[`${wi}_${s.id}`];
      const tc = SESSION_TYPES[s.type] || SESSION_TYPES.easy;
      cells.push({
        wk: wi, session: s.id, type: s.type,
        done: !!c?.done, color: tc.color,
        hard: s.hard,
      });
    });
  });
  return cells;
}
