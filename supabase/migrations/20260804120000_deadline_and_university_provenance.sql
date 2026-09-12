-- Provenance metadata for the Sources page.
--
-- Nothing in the schema currently records whether a deadline was ever checked
-- against an official page, when, or by what means. That makes it impossible to
-- tell a verified date from one seeded as an illustration, both in the product
-- and on the public Sources page, which has to state coverage honestly.
--
-- All four columns are nullable and additive. Null is meaningful and correct:
-- it means "never checked", which is the truthful state for every existing row
-- until someone reviews it by hand. Nothing is backfilled with a guess.

alter table public.deadlines
  add column if not exists source_checked_at timestamptz,
  add column if not exists source_kind text;

comment on column public.deadlines.source_checked_at is
  'When a human last confirmed this row against the official source. Null means never checked; never populate with an assumed date.';

comment on column public.deadlines.source_kind is
  'Where the date came from: official (confirmed against a published page), manual (hand-entered, unconfirmed), or illustrative (seed/demo data).';

alter table public.deadlines
  drop constraint if exists deadlines_source_kind_check;

alter table public.deadlines
  add constraint deadlines_source_kind_check
  check (source_kind is null or source_kind in ('official', 'manual', 'illustrative'));

-- Institution-level coverage, so the Sources page can be honest about the 31
-- schools we hold no dates for. A school with no deadlines still deserves a
-- link to where its dates are actually published.
alter table public.universities
  add column if not exists deadline_source_url text,
  add column if not exists coverage_checked_at timestamptz;

comment on column public.universities.deadline_source_url is
  'The institution''s own transfer-dates page. Lets an uncovered school still point a student somewhere useful.';

comment on column public.universities.coverage_checked_at is
  'When this institution was last reviewed for deadline coverage, whether or not any dates were found.';
