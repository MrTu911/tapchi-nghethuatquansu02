-- Manual, surgical, ADDITIVE schema change for the publication-report feature.
--
-- LƯU Ý: DB tapchi_ntqs được quản lý bằng `prisma db push` (không dùng migrate folder).
-- Vì vậy thay đổi này được áp trực tiếp bằng `prisma db execute` thay vì migrate,
-- để CHỈ áp đúng các thay đổi của tính năng báo cáo, không kéo theo drift khác
-- (Podcast/WebSource/WorkflowStepConfig...). SQL idempotent để chạy lại an toàn.
--
-- Nội dung:
--   1. Enum JournalClassification (phân loại tạp chí cho báo cáo công bố)
--   2. JournalArticle.journalType + journalNameOverride
--   3. JournalArticleAuthor.userId (liên kết tài khoản User) + FK + index
--   4. Backfill userId theo họ tên trùng KHỚP DUY NHẤT (không gán nếu trùng tên)

-- 1. Enum
DO $$ BEGIN
  CREATE TYPE "JournalClassification" AS ENUM
    ('SCI', 'SCIE', 'SCOPUS', 'ESCI', 'DOMESTIC_PEER_REVIEWED', 'CONFERENCE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. JournalArticle: phân loại + tên tạp chí/hội nghị override
ALTER TABLE "JournalArticle"
  ADD COLUMN IF NOT EXISTS "journalType" "JournalClassification" NOT NULL DEFAULT 'DOMESTIC_PEER_REVIEWED';
ALTER TABLE "JournalArticle"
  ADD COLUMN IF NOT EXISTS "journalNameOverride" TEXT;

-- 3. JournalArticleAuthor: liên kết User
ALTER TABLE "JournalArticleAuthor"
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "JournalArticle_journalType_idx"
  ON "JournalArticle"("journalType");
CREATE INDEX IF NOT EXISTS "JournalArticleAuthor_userId_idx"
  ON "JournalArticleAuthor"("userId");

DO $$ BEGIN
  ALTER TABLE "JournalArticleAuthor"
    ADD CONSTRAINT "JournalArticleAuthor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Backfill: chỉ gán khi tên khớp DUY NHẤT một User (tránh gán nhầm khi trùng tên)
UPDATE "JournalArticleAuthor" ja
SET "userId" = u.id
FROM "User" u
WHERE ja."userId" IS NULL
  AND lower(btrim(ja."name")) = lower(btrim(u."fullName"))
  AND (
    SELECT count(*) FROM "User" u2
    WHERE lower(btrim(u2."fullName")) = lower(btrim(ja."name"))
  ) = 1;
