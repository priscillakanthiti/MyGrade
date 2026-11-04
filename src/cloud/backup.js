import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { isConfigured } from './config';
import { buildSnapshot } from './snapshot';

// Per-teacher cloud state is kept in SecureStore (small values only).
const key = (name, teacherId) => `cloud_${name}_${teacherId}`;

function friendly(error) {
  const m = String((error && error.message) || error || '');
  if (/network|fetch|timeout|offline/i.test(m)) {
    return 'No internet connection. Your data is safe on this phone and will back up when you are online.';
  }
  return m || 'Something went wrong.';
}

export async function getCloudState(teacherId) {
  const uid = await SecureStore.getItemAsync(key('uid', teacherId));
  return {
    configured: isConfigured(),
    linked: !!uid,
    email: (await SecureStore.getItemAsync(key('email', teacherId))) || '',
    lastBackup: (await SecureStore.getItemAsync(key('last', teacherId))) || '',
  };
}

// Remember that this local account is tied to a cloud account
export async function rememberLink(teacherId, user) {
  await SecureStore.setItemAsync(key('uid', teacherId), user.id);
  await SecureStore.setItemAsync(key('email', teacherId), user.email || '');
}

export async function unlinkCloud(teacherId) {
  for (const n of ['uid', 'email', 'last', 'hash']) {
    await SecureStore.deleteItemAsync(key(n, teacherId));
  }
  if (supabase) await supabase.auth.signOut();
}

let running = false;

// Uploads the teacher's data. Safe to call often: it does nothing if the
// account is not linked, nothing changed since the last upload, or there is no internet.
export async function backupNow(db, teacherId, { force = false } = {}) {
  if (!supabase) return { skipped: true };
  if (running) return { skipped: true };
  running = true;
  try {
    const uid = await SecureStore.getItemAsync(key('uid', teacherId));
    if (!uid) return { skipped: true };

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session || sess.session.user.id !== uid) {
      return { error: 'Please sign in to cloud backup again.', needsSignIn: true };
    }

    const snap = await buildSnapshot(db, teacherId);
    const json = JSON.stringify(snap);
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, json);
    if (!force && hash === (await SecureStore.getItemAsync(key('hash', teacherId)))) {
      return { skipped: true };
    }

    // Never overwrite a backup that belongs to a different teacher account
    const existing = await supabase.from('backups').select('teacher_username').maybeSingle();
    if (existing.error) return { error: friendly(existing.error) };
    if (existing.data && existing.data.teacher_username !== snap.teacher.username) {
      return {
        error: `This cloud account already holds a backup for "${existing.data.teacher_username}". It was not overwritten.`,
      };
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('backups').upsert(
      { user_id: uid, teacher_username: snap.teacher.username, data: snap, updated_at: now },
      { onConflict: 'user_id' }
    );
    if (error) return { error: friendly(error) };

    await SecureStore.setItemAsync(key('hash', teacherId), hash);
    await SecureStore.setItemAsync(key('last', teacherId), now);
    return { ok: true, time: now };
  } catch (e) {
    return { error: friendly(e) };
  } finally {
    running = false;
  }
}

// Sign in (or create) a cloud account and tie it to this teacher, then back up.
export async function linkCloud(db, teacherId, email, password, mode) {
  if (!supabase) return 'Cloud backup is not set up yet.';
  const e = email.trim().toLowerCase();
  if (!e || password.length < 6) return 'Enter your email and a password of at least 6 characters.';

  try {
    let res;
    if (mode === 'signup') {
      res = await supabase.auth.signUp({ email: e, password });
      if (res.error) return friendly(res.error);
      if (!res.data.session) {
        return 'Account created. Open the confirmation email we sent you, then come back here and tap Sign in.';
      }
    } else {
      res = await supabase.auth.signInWithPassword({ email: e, password });
      if (res.error) return friendly(res.error);
    }

    const user = res.data.user || res.data.session.user;

    // If this cloud account already holds a backup for another teacher, stop.
    const local = await db.getFirstAsync('SELECT username FROM teachers WHERE id = ?', teacherId);
    const existing = await supabase.from('backups').select('teacher_username').maybeSingle();
    if (existing.error) return friendly(existing.error);
    if (existing.data && local && existing.data.teacher_username !== local.username) {
      await supabase.auth.signOut();
      return `This cloud account already holds a backup for "${existing.data.teacher_username}". To get that data back, use "Restore from cloud backup" on the sign in screen.`;
    }

    await rememberLink(teacherId, user);
    const r = await backupNow(db, teacherId, { force: true });
    if (r.error) return r.error;
    return null;
  } catch (err) {
    return friendly(err);
  }
}

// Sign in and download the saved backup (used when restoring on a new phone).
export async function fetchCloudBackup(email, password) {
  if (!supabase) return { error: 'Cloud backup is not set up yet.' };
  try {
    const res = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (res.error) return { error: friendly(res.error) };
    const { data, error } = await supabase
      .from('backups').select('data, updated_at').maybeSingle();
    if (error) return { error: friendly(error) };
    if (!data) return { error: 'No backup was found for this cloud account.' };
    return { snapshot: data.data, updatedAt: data.updated_at, user: res.data.user };
  } catch (e) {
    return { error: friendly(e) };
  }
}
