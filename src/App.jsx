import { useState, useEffect, useCallback } from 'react';
import { PLAN as BAKED_PLAN } from './plan.js';
import { DB, getCurWk } from './utils.js';
import { supabase, loadPlanFromDB, savePlanToDB, loadCompletionsFromDB, saveCompletionToDB, deleteCompletionFromDB, loadGymLogsFromDB, saveGymLogToDB, loadHistoryFromDB, saveHistoryEntryToDB, deleteHistoryEntryFromDB } from './supabase.js';
import AuthScreen from './components/AuthScreen.jsx';
import Splash from './components/Splash.jsx';
import Shell from './components/Shell.jsx';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [plan, setPlan]         = useState(() => DB.get('apogee_plan', BAKED_PLAN));
  const [completions, setComp]  = useState(() => DB.get('apogee_comp', {}));
  const [gymLogs, setGymLogs]   = useState(() => DB.get('apogee_gym', {}));
  const [history, setHistory]   = useState(() => DB.get('apogee_hist', []));
  const [weekRatings, setRatings] = useState(() => DB.get('apogee_ratings', {}));
  const [curWk, setCurWk]       = useState(() => getCurWk(DB.get('apogee_plan', BAKED_PLAN)));
  const [theme, setTheme] = useState(() => localStorage.getItem('apogee_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apogee_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  // Persist locally
  useEffect(() => { DB.set('apogee_plan', plan); }, [plan]);
  useEffect(() => { DB.set('apogee_comp', completions); }, [completions]);
  useEffect(() => { DB.set('apogee_gym', gymLogs); }, [gymLogs]);
  useEffect(() => { DB.set('apogee_hist', history); }, [history]);
  useEffect(() => { DB.set('apogee_ratings', weekRatings); }, [weekRatings]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthChecked(true);
      if (session?.user) syncFromDB(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) syncFromDB(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncFromDB = async (userId) => {
    setSyncing(true);
    try {
      const [dbPlan, dbComp, dbGym, dbHist] = await Promise.all([
        loadPlanFromDB(userId),
        loadCompletionsFromDB(userId),
        loadGymLogsFromDB(userId),
        loadHistoryFromDB(userId),
      ]);
      if (dbPlan) { setPlan(dbPlan); setCurWk(getCurWk(dbPlan)); }
      else { await savePlanToDB(userId, BAKED_PLAN); }
      if (Object.keys(dbComp).length > 0) setComp(dbComp);
      if (Object.keys(dbGym).length > 0) setGymLogs(dbGym);
      // Always replace from DB — never merge — to prevent duplicates
      setHistory(dbHist);
    } finally {
      setSyncing(false);
    }
  };

  const tickSession = useCallback(async (wkIdx, sessId, data) => {
    const key = `${wkIdx}_${sessId}`;
    const entry = { done: true, ...data };
    setComp(prev => ({ ...prev, [key]: entry }));
    if (user) await saveCompletionToDB(user.id, wkIdx, sessId, entry);
    const s = plan?.weeks[wkIdx]?.sessions.find(x => x.id === sessId);
    if (s && !s.isGym) {
      const histEntry = { workout: s.name, sessionType: s.type, date: new Date().toISOString(), ...data };
      const tempId = Date.now();
      setHistory(prev => [{ id: tempId, type: 'run', ...histEntry }, ...prev]);
      if (user) {
        const dbId = await saveHistoryEntryToDB(user.id, { type: 'run', ...histEntry });
        // Replace temp id with real DB id so deletes work correctly
        if (dbId) setHistory(prev => prev.map(h => h.id === tempId ? { ...h, id: dbId } : h));
      }
    }
  }, [plan, user]);

  const untickSession = useCallback(async (wkIdx, sessId) => {
    setComp(prev => { const n = {...prev}; delete n[`${wkIdx}_${sessId}`]; return n; });
    if (user) await deleteCompletionFromDB(user.id, wkIdx, sessId);
  }, [user]);

  const completeWorkout = useCallback(async (wkIdx, sessId, exercises) => {
    const key = `${wkIdx}_${sessId}`;
    const entry = { done: true, time: '', dist: '', notes: 'Gym session completed' };
    setComp(prev => ({ ...prev, [key]: entry }));
    if (user) await saveCompletionToDB(user.id, wkIdx, sessId, entry);
    const s = plan?.weeks[wkIdx]?.sessions.find(x => x.id === sessId);
    const histEntry = { workout: s?.name || 'Gym', sessionType: 'gym', date: new Date().toISOString(), exercises };
    const tempId = Date.now();
    setHistory(prev => [{ id: tempId, type: 'gym', ...histEntry }, ...prev]);
    if (user) {
      const dbId = await saveHistoryEntryToDB(user.id, { type: 'gym', ...histEntry });
      if (dbId) setHistory(prev => prev.map(h => h.id === tempId ? { ...h, id: dbId } : h));
    }
  }, [plan, user]);

  const saveGymLog = useCallback(async (wkIdx, sessId, field, value) => {
    const key = `${wkIdx}_${sessId}`;
    setGymLogs(prev => {
      const updated = { ...prev, [key]: { ...(prev[key] || {}), [field]: value } };
      if (user) saveGymLogToDB(user.id, wkIdx, sessId, updated[key]);
      return updated;
    });
  }, [user]);

  const loadPlan = useCallback(async (newPlan) => {
    const newC = {}, newG = {};
    newPlan?.weeks?.forEach((w, wi) => {
      w.sessions.forEach(s => {
        const k = `${wi}_${s.id}`;
        if (completions[k]) newC[k] = completions[k];
        if (gymLogs[k]) newG[k] = gymLogs[k];
      });
    });
    setPlan(newPlan); setComp(newC); setGymLogs(newG);
    setCurWk(getCurWk(newPlan));
    if (user && newPlan) await savePlanToDB(user.id, newPlan);
  }, [completions, gymLogs, user]);

  const rateWeek = useCallback((wkIdx, rating) => {
    setRatings(prev => ({ ...prev, [wkIdx]: rating }));
  }, []);

  const deleteHistoryEntry = useCallback(async (entryId) => {
    setHistory(prev => prev.filter(h => h.id !== entryId));
    if (user) await deleteHistoryEntryFromDB(user.id, entryId);
  }, [user]);

  if (!authChecked) return <div style={{ background: '#0A0A0A', minHeight: '100vh' }}/>;
  if (!splashDone) return <Splash plan={plan} onEnter={() => setSplashDone(true)} />;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <Shell
      plan={plan} completions={completions} gymLogs={gymLogs}
      history={history} setHistory={setHistory}
      deleteHistoryEntry={deleteHistoryEntry}
      curWk={curWk} setCurWk={setCurWk}
      weekRatings={weekRatings} rateWeek={rateWeek}
      tickSession={tickSession} untickSession={untickSession}
      completeWorkout={completeWorkout} saveGymLog={saveGymLog}
      loadPlan={loadPlan} resetPlan={() => loadPlan(BAKED_PLAN)}
      user={user} syncing={syncing}
      theme={theme} toggleTheme={toggleTheme}
    />
  );
}
