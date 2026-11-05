import { supabase } from '../cloud/supabase';

const TIMEOUT_MS = 12000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Asks Google Cloud Vision (through the Supabase function) to read the photo.
//
// This NEVER throws and NEVER produces a message for the teacher. If anything is
// missing (no internet, not signed in to cloud backup, slow connection, server
// problem) it just returns { unavailable: true } and the caller carries on with
// the reader on the phone. That is what keeps the app working offline.
export async function readWithCloud(base64) {
  try {
    if (!supabase || !base64) return { unavailable: true };

    // Only teachers signed in to cloud backup can use the cloud reader
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return { unavailable: true };

    const { data: reply, error } = await withTimeout(
      supabase.functions.invoke('read-mark', { body: { image: base64 } }),
      TIMEOUT_MS
    );
    if (error || !reply || !Array.isArray(reply.words)) return { unavailable: true };

    return { words: reply.words };
  } catch (e) {
    return { unavailable: true };
  }
}
