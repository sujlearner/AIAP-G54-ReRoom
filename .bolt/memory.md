# Project memory

## Product intent & audience

- App centered on interior design / room makeovers: users upload room photos and receive AI-generated makeover results.
- Core features: authentication (email/password), photo upload, makeover generation, browsing styles and rooms.
- Audience: end-users seeking interior design inspiration/transformation.

## Brand personality & voice

- Conversational, reassuring, direct. Avoids jargon; explains status plainly.

## Visual design & UX direction

- Framework: Vite + React (JSX), Tailwind CSS, Lucide React icons, `@/` path alias to `src/`.
- (No additional visual specifics inferred yet.)

## Decisions, constraints & rationale

- Supabase is the backend: client configured in `src/lib/supabase.ts`, reading project URL + anon key from environment.
- Supabase credentials injected at runtime by Bolt — no `.env` file present by design.
- Database schema includes tables: `styles`, `rooms`, `makeovers`; private photo storage configured.
- Auth (sign-in/sign-up), photo uploads, and makeover generation all wired through the single Supabase client.
- Per `.bolt/prompt`: do not install additional UI/theme/icon packages; use only Tailwind + lucide-react unless explicitly requested.

## Open questions & assumptions

- Exact makeover generation mechanism (Supabase function, external API, edge function?) not yet confirmed.
- RLS policies and storage rules assumed in place but not verified.
- No explicit routing library mentioned yet; navigation structure unknown.