-- Add PDF processing fields to JournalArticle
-- These fields track per-article split PDFs, thumbnails, extracted text, and processing status.

ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "articlePdfUrl" TEXT;
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "contentText" TEXT;
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "contentHtml" TEXT;
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "contentSource" TEXT;
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "extractionStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "splitStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "JournalArticle" ADD COLUMN IF NOT EXISTS "thumbnailStatus" TEXT NOT NULL DEFAULT 'PENDING';
