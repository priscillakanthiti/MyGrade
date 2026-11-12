// Deploy with --no-verify-jwt: authentication is verified below using getUser.
// The app automatically creates a separate anonymous session for picture reading.
// Set GEMINI_API_KEY as a Supabase secret, never in the mobile app.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { readGeminiMark } from './gemini.js';

const MAX_BASE64_CHARS = 8_000_000;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return json({ error: 'unauthorized' }, 401);
  } catch {
    return json({ error: 'authentication_unavailable' }, 503);
  }
  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!apiKey) return json({ error: 'not_configured' }, 503);
  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'bad_request' }, 400); }
  const { image, mimeType, maxScore } = body || {};
  if (typeof image !== 'string' || image.length < 100) return json({ error: 'bad_request' }, 400);
  if (image.length > MAX_BASE64_CHARS) return json({ error: 'too_large' }, 413);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image)) return json({ error: 'bad_request' }, 400);
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) {
    return json({ error: 'unsupported_image' }, 400);
  }
  if (typeof maxScore !== 'number' || !Number.isFinite(maxScore) || maxScore <= 0) {
    return json({ error: 'bad_request' }, 400);
  }
  const result = await readGeminiMark({
    apiKey, model: Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-3.5-flash',
    fallbackModel: Deno.env.get('GEMINI_HANDWRITING_MODEL')?.trim() || 'gemini-3.5-flash',
    image, mimeType, maxScore,
  });
  if (result.error) return json({ error: result.error,
    ...('providerStatus' in result ? { providerStatus: result.providerStatus } : {}),
    ...('providerReason' in result ? { providerReason: result.providerReason } : {}),
    ...('rateLimitWindow' in result ? { rateLimitWindow: result.rateLimitWindow } : {}),
    ...('retryAfterSeconds' in result ? { retryAfterSeconds: result.retryAfterSeconds } : {}),
  }, result.status);
  return json({ mark: result.mark });
});
