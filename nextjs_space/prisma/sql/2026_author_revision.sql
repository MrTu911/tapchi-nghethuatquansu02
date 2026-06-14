-- Additive, idempotent schema changes cho luồng "gửi lại bản chỉnh sửa" (tác giả).
-- An toàn chạy lại nhiều lần. KHÔNG drop, KHÔNG reset.

-- Đếm số vòng chỉnh sửa của bài nộp
ALTER TABLE "Submission"
  ADD COLUMN IF NOT EXISTS "revisionRound" INTEGER NOT NULL DEFAULT 0;

-- Thư ngỏ + tham chiếu file "thư trả lời phản biện" trên từng version
ALTER TABLE "SubmissionVersion"
  ADD COLUMN IF NOT EXISTS "coverLetter" TEXT;

ALTER TABLE "SubmissionVersion"
  ADD COLUMN IF NOT EXISTS "responseFileId" TEXT;

CREATE INDEX IF NOT EXISTS "SubmissionVersion_responseFileId_idx"
  ON "SubmissionVersion" ("responseFileId");

-- FK responseFileId -> UploadedFile(id), chỉ thêm nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SubmissionVersion_responseFileId_fkey'
  ) THEN
    ALTER TABLE "SubmissionVersion"
      ADD CONSTRAINT "SubmissionVersion_responseFileId_fkey"
      FOREIGN KEY ("responseFileId") REFERENCES "UploadedFile" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
