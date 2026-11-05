// Supabase Edge Function: read-mark
// Receives a photo (base64) from the app, asks Google Cloud Vision to read the
// handwriting, and sends back just the words. The Google key lives here as a
// secret and is never inside the app.
//
// Deploy:   supabase functions deploy read-mark --no-verify-jwt
// Secret:   supabase secrets set GOOGLE_VISION_API_KEY=your_key_here
// (--no-verify-jwt is fine: this function checks the teacher's sign-in itself below.)

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BASE64_CHARS = 8_000_000; // about 6 MB of image

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const visionKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  if (!visionKey) return json({ error: 'not_configured' }, 503);

  // Only signed-in teachers may use this, so nobody else can use up the Google quota.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth || !auth.user) return json({ error: 'unauthorized' }, 401);

  let body: { image?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const image = body && body.image;
  if (typeof image !== 'string' || image.length < 100) return json({ error: 'bad_request' }, 400);
  if (image.length > MAX_BASE64_CHARS) return json({ error: 'too_large' }, 413);

  let res: Response;
  try {
    res = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': visionKey },
      body: JSON.stringify({
        requests: [
          {
            image: { content: image },
            // DOCUMENT_TEXT_DETECTION is the better mode for handwriting
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: { languageHints: ['en'] },
          },
        ],
      }),
    });
  } catch {
    return json({ error: 'vision_unreachable' }, 502);
  }
  if (!res.ok) return json({ error: 'vision_failed', status: res.status }, 502);

  const out = await res.json();
  const r = out && out.responses && out.responses[0];
  if (!r || r.error) return json({ error: 'vision_failed' }, 502);

  // Flatten pages > blocks > paragraphs > words into a simple list
  const words: { text: string; confidence: number | null }[] = [];
  const pages = (r.fullTextAnnotation && r.fullTextAnnotation.pages) || [];
  for (const page of pages) {
    for (const block of page.blocks || []) {
      for (const para of block.paragraphs || []) {
        for (const w of para.words || []) {
          const text = (w.symbols || []).map((s: { text: string }) => s.text).join('');
          if (text) {
            words.push({ text, confidence: typeof w.confidence === 'number' ? w.confidence : null });
          }
        }
      }
    }
  }

  return json({ words, fullText: (r.fullTextAnnotation && r.fullTextAnnotation.text) || '' });
});
