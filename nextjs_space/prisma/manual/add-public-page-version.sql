-- Thêm bảng lịch sử phiên bản trang public (PublicPageVersion).
-- Lý do: tính năng "Lịch sử phiên bản + khôi phục" trong CMS cần lưu snapshot
-- trạng thái trang trước mỗi lần lưu tay/publish/restore.
-- Quy ước repo: DB là db-push và DÙNG CHUNG với checkout 01 -> KHÔNG migrate/db push,
-- chỉ vá bằng SQL idempotent qua `prisma db execute`. Chạy lại nhiều lần an toàn.
-- Rollback: DROP TABLE IF EXISTS "PublicPageVersion";

CREATE TABLE IF NOT EXISTS "PublicPageVersion" (
  "id"            TEXT NOT NULL,
  "pageId"        TEXT NOT NULL,
  "versionNo"     INTEGER NOT NULL,
  "title"         TEXT NOT NULL,
  "titleEn"       TEXT,
  "content"       TEXT NOT NULL,
  "contentEn"     TEXT,
  "metaTitle"     TEXT,
  "metaTitleEn"   TEXT,
  "metaDesc"      TEXT,
  "metaDescEn"    TEXT,
  "ogImage"       TEXT,
  "template"      TEXT NOT NULL DEFAULT 'default',
  "changeNote"    TEXT,
  "createdById"   TEXT,
  "createdByName" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicPageVersion_pkey" PRIMARY KEY ("id")
);

-- Unique nghiệp vụ: mỗi trang đánh số phiên bản tăng dần.
CREATE UNIQUE INDEX IF NOT EXISTS "PublicPageVersion_pageId_versionNo_key"
  ON "PublicPageVersion"("pageId", "versionNo");

-- Index cho lookup theo trang và theo thời gian.
CREATE INDEX IF NOT EXISTS "PublicPageVersion_pageId_idx"
  ON "PublicPageVersion"("pageId");
CREATE INDEX IF NOT EXISTS "PublicPageVersion_createdAt_idx"
  ON "PublicPageVersion"("createdAt");

-- FK pageId -> PublicPage(id) ON DELETE CASCADE (khớp @relation onDelete: Cascade).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PublicPageVersion_pageId_fkey'
  ) THEN
    ALTER TABLE "PublicPageVersion"
      ADD CONSTRAINT "PublicPageVersion_pageId_fkey"
      FOREIGN KEY ("pageId") REFERENCES "PublicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
