# Gemini picture reader

When on-device reading is unavailable or ambiguous, the app sends one resized,
cropped photo to the `read-mark` Supabase Edge Function.
The function verifies the Supabase user, calls Gemini with a JSON response schema,
and validates the transcription and score before returning a suggestion. The
teacher must confirm the suggestion before saving. This fallback requires internet. The
picture-reading path works in Expo Go without ML Kit or a Cloud Backup account.

On first scan, the app automatically creates an anonymous Supabase session for
the device. No email, password, or backup registration is requested. This session
uses its own storage key, so it cannot sign the teacher into or out of Cloud
Backup. The local teacher PIN continues to control access to the capture screen.

## Configure and deploy

Create a Gemini API key in Google AI Studio. Store it as a **Supabase Edge Function
secret** named `GEMINI_API_KEY` in the Supabase dashboard. Do not put it in app
source, `app.json`, or an `EXPO_PUBLIC_` variable.

In Supabase **Authentication → Sign In / Providers**, enable **Allow anonymous
sign-ins**. This is a project setting, not a sign-in step for teachers. See
[Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous).

From the project root, with the Supabase CLI signed in:

```sh
supabase functions deploy read-mark --project-ref eetvfgpbvczsqztabocp --no-verify-jwt
```

The function verifies bearer tokens itself with `auth.getUser`; the public app
key alone cannot authorize a picture-reading request. The default model is
`gemini-3.5-flash-lite`, using low thinking for short numeric transcriptions.
Set the optional `GEMINI_MODEL` server secret to change it. Temporary upstream
server errors receive one retry after a short backoff, within a 45-second total
deadline. Bad credentials, invalid requests and exhausted quota are not retried.

The new app expects the new `{ mark: { status, value, raw } }` response. Deploy the
function before testing the updated app. Older app versions expect `words` and
will fall back to manual entry after the function is replaced.

## Verify

```sh
node tests/mark-reader.test.mjs
node tests/capture-marks.test.mjs
```

For an explicit end-to-end check against the configured production project:

```sh
npm run test:reader:live
```

This creates an anonymous test session and makes five Gemini calls with synthetic
images: `7.5`, `0`, `.5`, `8/10`, and two separate marks. It checks the numeric
results, a combined total of 16, and refusal to choose between multiple marks.
It signs out after testing; the anonymous Auth user remains. No student data is
sent and no scores are written. This is not a handwriting accuracy benchmark.

Then sign in with a local teacher PIN (leave Cloud Backup unlinked) and capture a clear single mark. Check
zero, `.5`, `7.5`, `100`, `8/10`, unclear handwriting, and several awarded marks.
Check offline behavior too: the photo should remain available for manual entry.
Saving a confirmed total replaces the student's current subject score.
Also check that scanning still works after Cloud Backup is linked or unlinked;
its session and the picture reader's session must remain separate.

Mock tests verify the request contract and failure paths; they do not measure
Gemini's handwriting accuracy. Test representative real scripts before use.

API reference: https://ai.google.dev/api/generate-content
Model: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
