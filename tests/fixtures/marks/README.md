These PNGs contain synthetic red numerals on a white background. They contain no
student data and were drawn with Pillow using DejaVu Sans. They check transport,
decimal handling, fractions, zero, and ambiguous multiple marks. They do not
measure handwriting accuracy on real scripts.

Run the explicit live check with `npm run test:reader:live`. It uses the configured
Supabase project, creates an anonymous test user/session, signs out afterwards,
and makes five cloud reading requests. No scores or student records are written.
The anonymous user record remains in Supabase Auth after session sign-out.

The `circled-*-lined` fixtures use generated pen strokes on ruled paper, including
lines crossing digits, an enclosing circle, zero, a decimal, and a rotated eight.
`lined-no-mark` and `circled-multiple-lined` check that paper ruling is not scored
and multiple awarded marks are not silently combined. Regenerate these fixtures
with `python3 scripts/generate-paper-mark-fixtures.py` (requires Pillow).

Run `npm run test:reader:paper` for six live paper/notation checks. These generated
examples are regression checks, not evidence of accuracy on every teacher's
handwriting. Real script photos should also be checked against known marks.
