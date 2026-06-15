-- Bật tính năng Podcast + Web-crawler: tạo các bảng schema có nhưng DB tapchi_ntqs còn thiếu.
-- DDL lấy từ `prisma migrate diff` (đúng kiểu cột/FK Prisma dự định), làm IDEMPOTENT.
-- CHỦ ĐÍCH: chỉ tạo Podcast, WebSource, CrawlJob, CrawledContent + enum/index/FK của chúng.
-- KHÔNG đụng các thay đổi phá hủy khác trong diff (drop FK UserSession, alter WorkflowStepConfig...).
-- Chạy: npx prisma db execute --file prisma/manual/enable-podcast-webcrawler.sql --schema prisma/schema.prisma

-- ── Enums (CREATE TYPE không có IF NOT EXISTS → dùng DO block) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrawlFrequency') THEN
    CREATE TYPE "CrawlFrequency" AS ENUM ('EVERY_HOUR', 'EVERY_6_HOURS', 'EVERY_12_HOURS', 'DAILY', 'WEEKLY', 'MANUAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrawlJobStatus') THEN
    CREATE TYPE "CrawlJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrawledContentStatus') THEN
    CREATE TYPE "CrawledContentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IMPORTED', 'DUPLICATE');
  END IF;
END $$;

-- ── Tables ──
CREATE TABLE IF NOT EXISTS "Podcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "audioPath" TEXT,
    "audioUrl" TEXT,
    "duration" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "coverImagePath" TEXT,
    "coverImageUrl" TEXT,
    "host" TEXT,
    "episodeNumber" INTEGER,
    "seasonNumber" INTEGER,
    "transcript" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "plays" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WebSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "selectorRules" JSONB NOT NULL,
    "defaultCategory" TEXT,
    "defaultTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "frequency" "CrawlFrequency" NOT NULL DEFAULT 'DAILY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "delayBetweenRequests" INTEGER NOT NULL DEFAULT 2000,
    "maxArticlesPerRun" INTEGER NOT NULL DEFAULT 20,
    "totalCrawled" INTEGER NOT NULL DEFAULT 0,
    "totalImported" INTEGER NOT NULL DEFAULT 0,
    "lastCrawledAt" TIMESTAMP(3),
    "nextCrawlAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CrawlJob" (
    "id" TEXT NOT NULL,
    "webSourceId" TEXT NOT NULL,
    "status" "CrawlJobStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "articlesFound" INTEGER NOT NULL DEFAULT 0,
    "articlesNew" INTEGER NOT NULL DEFAULT 0,
    "articlesDuplicate" INTEGER NOT NULL DEFAULT 0,
    "articlesFailed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CrawledContent" (
    "id" TEXT NOT NULL,
    "webSourceId" TEXT NOT NULL,
    "crawlJobId" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "titleHash" TEXT NOT NULL,
    "rawTitle" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "rawSummary" TEXT,
    "rawAuthor" TEXT,
    "rawDate" TIMESTAMP(3),
    "rawImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawVideoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "editedTitle" TEXT,
    "editedContent" TEXT,
    "editedSummary" TEXT,
    "coverImageS3" TEXT,
    "imagesS3" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "CrawledContentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "importedNewsId" TEXT,
    "importedAt" TIMESTAMP(3),
    "importedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CrawledContent_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS "Podcast_isActive_idx" ON "Podcast"("isActive");
CREATE INDEX IF NOT EXISTS "Podcast_isFeatured_idx" ON "Podcast"("isFeatured");
CREATE INDEX IF NOT EXISTS "Podcast_category_idx" ON "Podcast"("category");
CREATE INDEX IF NOT EXISTS "Podcast_displayOrder_idx" ON "Podcast"("displayOrder");
CREATE INDEX IF NOT EXISTS "Podcast_publishedAt_idx" ON "Podcast"("publishedAt");
CREATE INDEX IF NOT EXISTS "Podcast_createdBy_idx" ON "Podcast"("createdBy");

CREATE INDEX IF NOT EXISTS "WebSource_isActive_idx" ON "WebSource"("isActive");
CREATE INDEX IF NOT EXISTS "WebSource_frequency_idx" ON "WebSource"("frequency");
CREATE INDEX IF NOT EXISTS "WebSource_nextCrawlAt_idx" ON "WebSource"("nextCrawlAt");
CREATE INDEX IF NOT EXISTS "WebSource_createdBy_idx" ON "WebSource"("createdBy");

CREATE INDEX IF NOT EXISTS "CrawlJob_webSourceId_idx" ON "CrawlJob"("webSourceId");
CREATE INDEX IF NOT EXISTS "CrawlJob_status_idx" ON "CrawlJob"("status");
CREATE INDEX IF NOT EXISTS "CrawlJob_createdAt_idx" ON "CrawlJob"("createdAt");
CREATE INDEX IF NOT EXISTS "CrawlJob_triggeredBy_idx" ON "CrawlJob"("triggeredBy");

CREATE UNIQUE INDEX IF NOT EXISTS "CrawledContent_urlHash_key" ON "CrawledContent"("urlHash");
CREATE UNIQUE INDEX IF NOT EXISTS "CrawledContent_importedNewsId_key" ON "CrawledContent"("importedNewsId");
CREATE INDEX IF NOT EXISTS "CrawledContent_webSourceId_idx" ON "CrawledContent"("webSourceId");
CREATE INDEX IF NOT EXISTS "CrawledContent_crawlJobId_idx" ON "CrawledContent"("crawlJobId");
CREATE INDEX IF NOT EXISTS "CrawledContent_status_idx" ON "CrawledContent"("status");
CREATE INDEX IF NOT EXISTS "CrawledContent_urlHash_idx" ON "CrawledContent"("urlHash");
CREATE INDEX IF NOT EXISTS "CrawledContent_titleHash_idx" ON "CrawledContent"("titleHash");
CREATE INDEX IF NOT EXISTS "CrawledContent_createdAt_idx" ON "CrawledContent"("createdAt");
CREATE INDEX IF NOT EXISTS "CrawledContent_importedNewsId_idx" ON "CrawledContent"("importedNewsId");
CREATE INDEX IF NOT EXISTS "CrawledContent_reviewedBy_idx" ON "CrawledContent"("reviewedBy");

-- ── Foreign keys (ADD CONSTRAINT không có IF NOT EXISTS → dùng DO block) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebSource_createdBy_fkey') THEN
    ALTER TABLE "WebSource" ADD CONSTRAINT "WebSource_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebSource_updatedBy_fkey') THEN
    ALTER TABLE "WebSource" ADD CONSTRAINT "WebSource_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawlJob_webSourceId_fkey') THEN
    ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_webSourceId_fkey" FOREIGN KEY ("webSourceId") REFERENCES "WebSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawlJob_triggeredBy_fkey') THEN
    ALTER TABLE "CrawlJob" ADD CONSTRAINT "CrawlJob_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawledContent_webSourceId_fkey') THEN
    ALTER TABLE "CrawledContent" ADD CONSTRAINT "CrawledContent_webSourceId_fkey" FOREIGN KEY ("webSourceId") REFERENCES "WebSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawledContent_crawlJobId_fkey') THEN
    ALTER TABLE "CrawledContent" ADD CONSTRAINT "CrawledContent_crawlJobId_fkey" FOREIGN KEY ("crawlJobId") REFERENCES "CrawlJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawledContent_reviewedBy_fkey') THEN
    ALTER TABLE "CrawledContent" ADD CONSTRAINT "CrawledContent_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawledContent_importedNewsId_fkey') THEN
    ALTER TABLE "CrawledContent" ADD CONSTRAINT "CrawledContent_importedNewsId_fkey" FOREIGN KEY ("importedNewsId") REFERENCES "News"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CrawledContent_importedBy_fkey') THEN
    ALTER TABLE "CrawledContent" ADD CONSTRAINT "CrawledContent_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
