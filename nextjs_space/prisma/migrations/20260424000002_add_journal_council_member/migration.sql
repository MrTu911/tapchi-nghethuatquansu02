-- Add JournalCouncilMember — Hội đồng chỉ đạo / biên tập của từng số báo
-- Safe to re-run: uses IF NOT EXISTS throughout. No existing data is modified.

CREATE TABLE IF NOT EXISTS "JournalCouncilMember" (
  "id"            TEXT         NOT NULL,
  "issueId"       TEXT         NOT NULL,
  "role"          TEXT         NOT NULL,
  "fullName"      TEXT         NOT NULL,
  "militaryRank"  TEXT,
  "academicTitle" TEXT,
  "degree"        TEXT,
  "order"         INTEGER      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JournalCouncilMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JournalCouncilMember"
  ADD CONSTRAINT "JournalCouncilMember_issueId_fkey"
  FOREIGN KEY ("issueId") REFERENCES "Issue"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "JournalCouncilMember_issueId_order_key"
  ON "JournalCouncilMember"("issueId", "order");

CREATE INDEX IF NOT EXISTS "JournalCouncilMember_issueId_idx"  ON "JournalCouncilMember"("issueId");
CREATE INDEX IF NOT EXISTS "JournalCouncilMember_fullName_idx" ON "JournalCouncilMember"("fullName");
