-- Run only after verifying the independent staging target and restored journal.
-- Keep every journal row and never move an already advanced sequence backwards.
SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq',
 GREATEST((SELECT coalesce(max(id),1) FROM drizzle.__drizzle_migrations),
          (SELECT last_value FROM drizzle.__drizzle_migrations_id_seq)), true);
