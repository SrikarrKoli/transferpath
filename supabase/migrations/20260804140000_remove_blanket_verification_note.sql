-- Remove the catch-all "Always verify on official sources" planning note.
--
-- Requirements rows now carry their own provenance (see ui/provenance.tsx), so a
-- page-level note telling students to re-check everything no longer adds
-- information — it just competes with the specific caveats attached to the
-- individual claims it is sitting above.
--
-- Its body also states that the planner "uses illustrative milestones only",
-- which stopped being true once verified deadlines and school-specific
-- requirement notes began rendering on the same page. Under-claiming is its own
-- kind of inaccuracy.
--
-- Scoped to the global row by exact title. School-specific notes never carried
-- this title, and no other note is affected. Safe on a fresh bootstrap too: the
-- seeding migration inserts the row first, and this removes it afterwards.
--
delete from public.university_requirement_notes
where university_id is null
  and title = 'Always verify on official sources';
