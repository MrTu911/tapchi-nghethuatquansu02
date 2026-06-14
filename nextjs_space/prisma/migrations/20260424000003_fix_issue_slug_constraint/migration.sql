-- Replace partial unique index on Issue.slug with a full unique constraint.
-- Prisma upsert uses ON CONFLICT which requires a real unique constraint,
-- not a partial index (WHERE slug IS NOT NULL).

DROP INDEX IF EXISTS "Issue_slug_key";

ALTER TABLE "Issue"
  ADD CONSTRAINT "Issue_slug_key" UNIQUE ("slug");
