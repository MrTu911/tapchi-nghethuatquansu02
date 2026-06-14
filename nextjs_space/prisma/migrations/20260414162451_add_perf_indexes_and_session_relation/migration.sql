-- Performance: Add missing indexes for frequently filtered/sorted columns
-- and declare the UserSession → User FK for Prisma relation support.
-- Additive only: no data is modified or dropped.
-- All index creations use IF NOT EXISTS to be safe on re-run.

-- ── Article model ─────────────────────────────────────────────────────────────
-- issueId FK used in joins when filtering articles by issue year.
CREATE INDEX IF NOT EXISTS "Article_issueId_idx" ON "Article"("issueId");

-- publishedAt is the default sort column on all public article listings.
CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt");

-- ── Submission model ──────────────────────────────────────────────────────────
-- categoryId FK — filtered on every article listing and advanced search.
CREATE INDEX IF NOT EXISTS "Submission_categoryId_idx" ON "Submission"("categoryId");

-- createdBy FK — author dashboard shows only the user's own submissions.
CREATE INDEX IF NOT EXISTS "Submission_createdBy_idx" ON "Submission"("createdBy");

-- createdAt — sorted in author and editor dashboards.
CREATE INDEX IF NOT EXISTS "Submission_createdAt_idx" ON "Submission"("createdAt");

-- ── Issue model ───────────────────────────────────────────────────────────────
-- year — filtered in article listing (?year=) and advanced search yearFrom/yearTo.
CREATE INDEX IF NOT EXISTS "Issue_year_idx" ON "Issue"("year");

-- status — filtered when listing published issues on the public site.
CREATE INDEX IF NOT EXISTS "Issue_status_idx" ON "Issue"("status");

-- ── UserSession: FK constraint for Prisma @relation ──────────────────────────
-- The userId column already exists as a bare String field (no FK in init migration).
-- Adding the FK now improves referential integrity and enables Prisma `include: { user }`.
-- The DO block makes this idempotent across re-runs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_schema = current_schema()
       AND constraint_name   = 'UserSession_userId_fkey'
       AND table_name        = 'UserSession'
  ) THEN
    ALTER TABLE "UserSession"
      ADD CONSTRAINT "UserSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
