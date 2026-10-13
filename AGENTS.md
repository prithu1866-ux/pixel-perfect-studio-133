<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# VETSENSE AI

- Signed-in pages live under `src/routes/_authenticated/` (client-only gate + AppShell); public pages are top-level.
- Triage is a transparent, documented rule engine in `src/lib/triage.ts`; results are stored on the report row so the vet sees exactly what the farmer saw.
- Roles live in `public.user_roles`, checked via `has_role()` in RLS; signup trigger only allows farmer/veterinarian/field_worker (never admin).
- Notifications and report status changes are written by DB triggers (security definer), not client code.
- Offline symptom reports queue in localStorage with a unique `client_id` for idempotent resend (`src/lib/offline.ts`).
- UI text is bilingual via `src/lib/i18n.tsx` (`t()` for UI keys, `pick()` for {en, hi} content).
