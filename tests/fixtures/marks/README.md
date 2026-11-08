These PNGs contain synthetic red numerals on a white background. They contain no
student data and were drawn with Pillow using DejaVu Sans. They check transport,
decimal handling, fractions, zero, and ambiguous multiple marks. They do not
measure handwriting accuracy on real scripts.

Run the explicit live check with `npm run test:reader:live`. It uses the configured
Supabase project, creates an anonymous test user/session, signs out afterwards,
and makes five cloud reading requests. No scores or student records are written.
The anonymous user record remains in Supabase Auth after session sign-out.
