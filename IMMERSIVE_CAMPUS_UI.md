# Immersive campus UI

Entering a building on the landing map should feel like walking into that hall — not dropping into a generic SaaS dashboard. This is the plan. **Do not redesign every dashboard page in one pass.**

Source of truth for building ↔ route mapping: `src/components/landing/campus/campus-data.ts`.

## Building → route map

| Landmark | Building id | Product surface | Route |
| --- | --- | --- | --- |
| Clock Tower | `quad` | Tasks & deadlines | `/dashboard/deadlines` |
| Counselor Hall | `counselor` | Onboarding / profile / situation | `/onboarding` |
| Library | `library` | Essays | `/dashboard/essay` |
| Classroom Building | `classroom` | Semester plan | `/dashboard/plan` |
| Registrar | `registrar` | Requirements | `/dashboard/requirements` |
| Dorms | `dorm` | Personal checklist | `/dashboard/checklist` |
| Rec Center | `gym` | Readiness / competitiveness | `/dashboard/competitiveness` |
| Student Union | `union` | Today overview | `/dashboard` |

Legacy redirects (`/dashboard/timeline`, `/dashboard/checklist`) keep working. Immersion chrome should follow the **canonical** building for the page the student actually sees.

## Shared immersion primitives

All of these live under `src/components/campus-ui/` and opt in per route. They do not replace `src/app/dashboard/layout.tsx`.

1. **Campus tokens** — cream, terracotta, navy, sky, plaza, hedge. Same hex family as the 3D world (`campus-kit.ts` `C` palette and landing chrome). CSS variables on `:root` + Tailwind theme colors `campus-*`.
2. **Entered-building shell** (`ImmersiveBuildingShell`) — cream hall frame around existing page content: back-to-campus, building name, feature line, short blurb.
3. **Building header / hero** — the hall you walked into (Clock Tower), not a breadcrumb of “Workspace”. Interior page title (Tasks & deadlines) stays with the data UI.
4. **Enter / exit** — `Link` to `/` (“Back to campus”). CSS `campus-enter` uses existing `--tp-ease` motion. Reduced-motion respected.
5. **You-are-here mini-map** (`CampusMiniMap`) — 8 dots from `CAMPUS_BUILDINGS` world x/z. Active building is terracotta; others navy. Not a second 3D viewport.

Dashboard sidebar, auth gate, and mobile nav stay. The shell is the hall interior; the app chrome is still how you switch tools.

## Phased rollout

1. **Foundation** — tokens, shell, mini-map, enter/exit motion, per-hall hero tints. No data-loader changes.
2. **Lighthouse** — Clock Tower / Tasks & Deadlines.
3. **Next halls (this PR)** — Union / Today, Library / Essays, Classrooms / Plan, Registrar / Requirements, Rec / Path readiness, Dorms / Checklist, Counselor / Onboarding.
4. **Landing enter** — Click selects a hall; **Enter {name}** on the dock (or double-click / keyboard Enter) routes to that hall’s immersive page. Logged-out dashboard enters resume via `/login?next=`.
5. **Optional later** — sidebar labels that use building names; a shared exit control in `DashboardChrome`.

## What NOT to break

- Auth gates (`createClient`, `getUser`, redirect to `/login` or `/onboarding`)
- Supabase queries, `buildTasksDeadlinesData`, `buildOverviewData`, readiness loaders, checklist derived status
- Route paths and redirects
- Landing 3D interaction (orbit/pan/zoom, click-to-select, directory ↔ dock, landmark mapping)

If a hall redesign would require changing a loader, stop and do the data work in a dedicated PR.
