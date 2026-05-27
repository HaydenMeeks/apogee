import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth ──────────────────────────────────────────────────
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password });

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

// ── Plan ──────────────────────────────────────────────────
export async function loadPlanFromDB(userId) {
  const { data, error } = await supabase
    .from('plans')
    .select('plan_data')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data?.plan_data || null;
}

export async function savePlanToDB(userId, planData) {
  const { error } = await supabase
    .from('plans')
    .upsert({ user_id: userId, plan_data: planData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' });
  return !error;
}

// ── Completions ───────────────────────────────────────────
export async function loadCompletionsFromDB(userId) {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return {};
  const result = {};
  data.forEach(row => {
    result[`${row.week_idx}_${row.session_id}`] = {
      done: row.done,
      time: row.time_logged || '',
      dist: row.dist_logged || '',
      notes: row.notes || '',
    };
  });
  return result;
}

export async function saveCompletionToDB(userId, weekIdx, sessionId, data) {
  const { error } = await supabase
    .from('completions')
    .upsert({
      user_id: userId,
      week_idx: weekIdx,
      session_id: sessionId,
      done: data.done,
      time_logged: data.time || null,
      dist_logged: data.dist || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_idx,session_id' });
  return !error;
}

export async function deleteCompletionFromDB(userId, weekIdx, sessionId) {
  const { error } = await supabase
    .from('completions')
    .delete()
    .eq('user_id', userId)
    .eq('week_idx', weekIdx)
    .eq('session_id', sessionId);
  return !error;
}

// ── Gym Logs ──────────────────────────────────────────────
export async function loadGymLogsFromDB(userId) {
  const { data, error } = await supabase
    .from('gym_logs')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return {};
  const result = {};
  data.forEach(row => {
    result[`${row.week_idx}_${row.session_id}`] = row.log_data;
  });
  return result;
}

export async function saveGymLogToDB(userId, weekIdx, sessionId, logData) {
  const { error } = await supabase
    .from('gym_logs')
    .upsert({
      user_id: userId,
      week_idx: weekIdx,
      session_id: sessionId,
      log_data: logData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_idx,session_id' });
  return !error;
}

// ── History ───────────────────────────────────────────────
export async function loadHistoryFromDB(userId) {
  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    type: row.exercises ? 'gym' : 'run',
    workout: row.workout_name,
    sessionType: row.session_type,
    date: row.logged_at,
    time: row.time_logged,
    dist: row.dist_logged,
    notes: row.notes,
    exercises: row.exercises,
  }));
}

export async function saveHistoryEntryToDB(userId, entry) {
  const { data, error } = await supabase
    .from('session_history')
    .insert({
      user_id: userId,
      workout_name: entry.workout,
      session_type: entry.sessionType,
      logged_at: entry.date,
      time_logged: entry.time || null,
      dist_logged: entry.dist || null,
      notes: entry.notes || null,
      exercises: entry.exercises || null,
    })
    .select('id')
    .single();
  if (error) return null;
  return data?.id || null;
}

export async function deleteHistoryEntryFromDB(userId, entryId) {
  const { error } = await supabase
    .from('session_history')
    .delete()
    .eq('user_id', userId)
    .eq('id', entryId);
  return !error;
}
