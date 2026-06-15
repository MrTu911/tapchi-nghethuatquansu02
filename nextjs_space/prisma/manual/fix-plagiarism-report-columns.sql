-- Fix schema drift: bảng PlagiarismReport trong DB là bản cũ (chỉ articleId-based),
-- thiếu các cột mà schema.prisma + module plagiarism (submission-based) yêu cầu.
-- Triệu chứng: P2022 "column PlagiarismReport.submissionId does not exist" → trang
-- /dashboard/plagiarism không liệt kê và không tạo được báo cáo.
-- Idempotent: chạy lại nhiều lần an toàn. Theo quy ước repo (DB là db-push, vá bằng SQL).

ALTER TABLE "PlagiarismReport" ADD COLUMN IF NOT EXISTS "submissionId" TEXT;
ALTER TABLE "PlagiarismReport" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "PlagiarismReport" ADD COLUMN IF NOT EXISTS "totalCompared" INTEGER NOT NULL DEFAULT 0;

-- Schema khai báo articleId nullable (báo cáo nay theo submission). DB cũ để NOT NULL.
ALTER TABLE "PlagiarismReport" ALTER COLUMN "articleId" DROP NOT NULL;

-- Index cho submissionId (khớp @@index([submissionId])).
CREATE INDEX IF NOT EXISTS "PlagiarismReport_submissionId_idx" ON "PlagiarismReport"("submissionId");

-- FK submissionId -> Submission(id) ON DELETE CASCADE (khớp @relation onDelete: Cascade).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlagiarismReport_submissionId_fkey'
  ) THEN
    ALTER TABLE "PlagiarismReport"
      ADD CONSTRAINT "PlagiarismReport_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
