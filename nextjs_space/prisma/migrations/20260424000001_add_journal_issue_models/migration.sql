-- Phase 1: Journal Digital Library — additive migration
-- Extends Volume and Issue; adds IssueSection, JournalArticle, JournalArticleAuthor.
-- Safe to re-run: uses IF NOT EXISTS and DO-EXCEPTION guards throughout.
-- No existing data is modified or dropped.

-- ── Volume: journal-level metadata ───────────────────────────────────────────
ALTER TABLE "Volume"
  ADD COLUMN IF NOT EXISTS "issn"              TEXT,
  ADD COLUMN IF NOT EXISTS "publicationPeriod" TEXT;

-- ── Issue: extended fields for digital display ────────────────────────────────
ALTER TABLE "Issue"
  ADD COLUMN IF NOT EXISTS "slug"                  TEXT,
  ADD COLUMN IF NOT EXISTS "issueCode"             INTEGER,
  ADD COLUMN IF NOT EXISTS "coverCaption"          TEXT,
  ADD COLUMN IF NOT EXISTS "coverPhotoCredit"      TEXT,
  ADD COLUMN IF NOT EXISTS "pageCount"             INTEGER,
  ADD COLUMN IF NOT EXISTS "digitizationWorkflow"  JSONB;

-- Unique index on slug (partial: only rows where slug IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "Issue_slug_key"
  ON "Issue"("slug")
  WHERE "slug" IS NOT NULL;

-- Regular index for lookups/routing
CREATE INDEX IF NOT EXISTS "Issue_slug_idx" ON "Issue"("slug");

-- ── JournalArticleStatus enum ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "JournalArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── IssueSection ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "IssueSection" (
  "id"        TEXT         NOT NULL,
  "issueId"   TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "order"     INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IssueSection_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IssueSection"
  ADD CONSTRAINT "IssueSection_issueId_fkey"
  FOREIGN KEY ("issueId") REFERENCES "Issue"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "IssueSection_issueId_name_key"
  ON "IssueSection"("issueId", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "IssueSection_issueId_order_key"
  ON "IssueSection"("issueId", "order");

CREATE INDEX IF NOT EXISTS "IssueSection_issueId_idx"
  ON "IssueSection"("issueId");

-- ── JournalArticle ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "JournalArticle" (
  "id"           TEXT                   NOT NULL,
  "issueId"      TEXT                   NOT NULL,
  "sectionId"    TEXT,
  "title"        TEXT                   NOT NULL,
  "slug"         TEXT                   NOT NULL,
  "authorsText"  TEXT                   NOT NULL,
  "pageStart"    INTEGER                NOT NULL,
  "pageEnd"      INTEGER,
  "abstract"     TEXT,
  "keywords"     TEXT[]                 NOT NULL DEFAULT '{}',
  "status"       "JournalArticleStatus" NOT NULL DEFAULT 'PUBLISHED',
  "submissionId" TEXT,
  "createdAt"    TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)           NOT NULL,
  CONSTRAINT "JournalArticle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JournalArticle"
  ADD CONSTRAINT "JournalArticle_issueId_fkey"
  FOREIGN KEY ("issueId") REFERENCES "Issue"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JournalArticle"
  ADD CONSTRAINT "JournalArticle_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "IssueSection"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "JournalArticle_issueId_slug_key"
  ON "JournalArticle"("issueId", "slug");

CREATE INDEX IF NOT EXISTS "JournalArticle_issueId_idx"   ON "JournalArticle"("issueId");
CREATE INDEX IF NOT EXISTS "JournalArticle_sectionId_idx" ON "JournalArticle"("sectionId");
CREATE INDEX IF NOT EXISTS "JournalArticle_status_idx"    ON "JournalArticle"("status");
CREATE INDEX IF NOT EXISTS "JournalArticle_pageStart_idx" ON "JournalArticle"("pageStart");

-- ── JournalArticleAuthor ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "JournalArticleAuthor" (
  "id"            TEXT         NOT NULL,
  "articleId"     TEXT         NOT NULL,
  "name"          TEXT         NOT NULL,
  "militaryRank"  TEXT,
  "academicTitle" TEXT,
  "degree"        TEXT,
  "organization"  TEXT,
  "order"         INTEGER      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JournalArticleAuthor_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JournalArticleAuthor"
  ADD CONSTRAINT "JournalArticleAuthor_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "JournalArticle"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "JournalArticleAuthor_articleId_idx"
  ON "JournalArticleAuthor"("articleId");
