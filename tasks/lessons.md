# Lessons Learned
<!-- Claude appends here after every correction from the user -->
<!-- Format:
[YYYY-MM-DD] MISTAKE: what went wrong
RULE: the rule that prevents this in future
-->

## Lessons

[2026-03-12] MISTAKE: Named the profile picture field `avatar` instead of `image` on the User model, and omitted `emailVerified`. The NextAuth PrismaAdapter requires EXACT field names: `image` (not `avatar`) and `emailVerified DateTime?`. This caused `adapter_error_createUser` on every Google sign-in attempt.
RULE: When using NextAuth PrismaAdapter, the User model MUST have: `id`, `name`, `email`, `emailVerified DateTime?`, `image String?`. Never rename these fields — the adapter hardcodes them.

[2026-03-12] MISTAKE: Running `npm run build` during a session while `npm run dev` is also running causes "Cannot find module './vendor-chunks/next-auth.js'" errors. The build writes a `.next` cache that conflicts with the dev server's hot-reload state.
RULE: After running `npm run build` for verification, ALWAYS run `rm -rf .next` and restart the dev server before handing back to the user. Alternatively, only use `npm run build` as a final check and immediately clean up.

